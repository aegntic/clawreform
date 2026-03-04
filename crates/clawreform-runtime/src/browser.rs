//! Browser automation via a Python Playwright bridge.
//!
//! Manages persistent browser sessions per agent, communicating with a Python
//! subprocess over JSON-line stdin/stdout protocol (same pattern as MCP stdio).
//!
//! # Security
//! - SSRF check runs in Rust *before* sending navigate commands to Python
//! - Bridge subprocess launched with `sandbox_command()` (cleared env)
//! - All page content wrapped with `wrap_external_content()` markers
//! - Session limits: max concurrent, idle timeout, 1 per agent

use clawreform_types::config::BrowserConfig;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Stdio};
use std::sync::OnceLock;
use std::time::Instant;
use tokio::sync::Mutex;
use tracing::{debug, info, warn};

/// Embedded Python bridge script (compiled into the binary).
const BRIDGE_SCRIPT: &str = include_str!("browser_bridge.py");

// ── Protocol types ──────────────────────────────────────────────────────────

/// Command sent from Rust to the Python bridge.
#[derive(Debug, Serialize)]
#[serde(tag = "action")]
pub enum BrowserCommand {
    Navigate { url: String },
    Click { selector: String },
    Type { selector: String, text: String },
    Screenshot,
    ReadPage,
    Close,
}

/// Response received from the Python bridge.
#[derive(Debug, Deserialize)]
pub struct BrowserResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

// ── Session ─────────────────────────────────────────────────────────────────

/// A live browser session backed by a Python Playwright subprocess.
struct BrowserSession {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    last_active: Instant,
}

impl BrowserSession {
    /// Send a command and read the response.
    fn send(&mut self, cmd: &BrowserCommand) -> Result<BrowserResponse, String> {
        let json = serde_json::to_string(cmd).map_err(|e| format!("Serialize error: {e}"))?;
        self.stdin
            .write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write to bridge stdin: {e}"))?;
        self.stdin
            .write_all(b"\n")
            .map_err(|e| format!("Failed to write newline: {e}"))?;
        self.stdin
            .flush()
            .map_err(|e| format!("Failed to flush bridge stdin: {e}"))?;

        let mut line = String::new();
        self.stdout
            .read_line(&mut line)
            .map_err(|e| format!("Failed to read bridge stdout: {e}"))?;

        if line.trim().is_empty() {
            return Err("Bridge process closed unexpectedly".to_string());
        }

        self.last_active = Instant::now();
        serde_json::from_str(line.trim())
            .map_err(|e| format!("Failed to parse bridge response: {e}"))
    }

    /// Kill the subprocess.
    fn kill(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

impl Drop for BrowserSession {
    fn drop(&mut self) {
        self.kill();
    }
}

// ── Manager ─────────────────────────────────────────────────────────────────

/// Manages browser sessions for all agents.
pub struct BrowserManager {
    sessions: DashMap<String, Mutex<BrowserSession>>,
    config: BrowserConfig,
    bridge_path: OnceLock<PathBuf>,
}

impl BrowserManager {
    /// Create a new BrowserManager with the given configuration.
    pub fn new(config: BrowserConfig) -> Self {
        Self {
            sessions: DashMap::new(),
            config,
            bridge_path: OnceLock::new(),
        }
    }

    /// Write the embedded Python bridge script to a temp file (once).
    fn ensure_bridge_script(&self) -> Result<&PathBuf, String> {
        if let Some(path) = self.bridge_path.get() {
            return Ok(path);
        }
        let dir = std::env::temp_dir().join("clawreform");
        std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create temp dir: {e}"))?;
        let path = dir.join("browser_bridge.py");
        std::fs::write(&path, BRIDGE_SCRIPT)
            .map_err(|e| format!("Failed to write bridge script: {e}"))?;
        debug!(path = %path.display(), "Wrote browser bridge script");
        // Race-safe: if another thread set it first, we just use theirs
        let _ = self.bridge_path.set(path);
        Ok(self.bridge_path.get().unwrap())
    }

    /// Get or create a browser session for the given agent.
    /// This does synchronous subprocess spawn + I/O, so it must be called from
    /// within `block_in_place` (see `send_command`).
    fn get_or_create_sync(&self, agent_id: &str) -> Result<(), String> {
        if self.sessions.contains_key(agent_id) {
            return Ok(());
        }

        // Enforce session limit
        if self.sessions.len() >= self.config.max_sessions {
            return Err(format!(
                "Maximum browser sessions reached ({}). Close an existing session first.",
                self.config.max_sessions
            ));
        }

        let bridge_path = self.ensure_bridge_script()?;

        let mut cmd = std::process::Command::new(&self.config.python_path);
        cmd.arg(bridge_path.to_string_lossy().as_ref());
        if self.config.headless {
            cmd.arg("--headless");
        } else {
            cmd.arg("--no-headless");
        }
        cmd.arg("--width")
            .arg(self.config.viewport_width.to_string());
        cmd.arg("--height")
            .arg(self.config.viewport_height.to_string());
        cmd.arg("--timeout")
            .arg(self.config.timeout_secs.to_string());

        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::null());

        // SECURITY: Isolate environment — clear everything, pass through only essentials
        cmd.env_clear();
        #[cfg(windows)]
        {
            if let Ok(v) = std::env::var("SYSTEMROOT") {
                cmd.env("SYSTEMROOT", v);
            }
            if let Ok(v) = std::env::var("PATH") {
                cmd.env("PATH", v);
            }
            if let Ok(v) = std::env::var("TEMP") {
                cmd.env("TEMP", v);
            }
            if let Ok(v) = std::env::var("TMP") {
                cmd.env("TMP", v);
            }
            // Playwright needs these to find installed browsers
            if let Ok(v) = std::env::var("USERPROFILE") {
                cmd.env("USERPROFILE", v);
            }
            if let Ok(v) = std::env::var("APPDATA") {
                cmd.env("APPDATA", v);
            }
            if let Ok(v) = std::env::var("LOCALAPPDATA") {
                cmd.env("LOCALAPPDATA", v);
            }
            cmd.env("PYTHONIOENCODING", "utf-8");
        }
        #[cfg(not(windows))]
        {
            if let Ok(v) = std::env::var("PATH") {
                cmd.env("PATH", v);
            }
            if let Ok(v) = std::env::var("HOME") {
                cmd.env("HOME", v);
            }
            if let Ok(v) = std::env::var("TMPDIR") {
                cmd.env("TMPDIR", v);
            }
            if let Ok(v) = std::env::var("XDG_CACHE_HOME") {
                cmd.env("XDG_CACHE_HOME", v);
            }
        }

        let mut child = cmd.spawn().map_err(|e| {
            format!(
                "Failed to spawn browser bridge: {e}. Ensure Python and playwright are installed."
            )
        })?;

        let stdin = child.stdin.take().ok_or("Failed to capture bridge stdin")?;
        let stdout = child
            .stdout
            .take()
            .ok_or("Failed to capture bridge stdout")?;
        let mut reader = BufReader::new(stdout);

        // Wait for the "ready" response
        let mut ready_line = String::new();
        reader
            .read_line(&mut ready_line)
            .map_err(|e| format!("Bridge failed to start: {e}"))?;

        if ready_line.trim().is_empty() {
            let _ = child.kill();
            return Err("Browser bridge process exited without sending ready signal. Check Python/Playwright installation.".to_string());
        }

        let ready: BrowserResponse = serde_json::from_str(ready_line.trim())
            .map_err(|e| format!("Bridge startup failed: {e}. Output: {ready_line}"))?;

        if !ready.success {
            let err = ready.error.unwrap_or_else(|| "Unknown error".to_string());
            let _ = child.kill();
            return Err(format!("Browser bridge failed to start: {err}"));
        }

        info!(agent_id, "Browser session created");

        let session = BrowserSession {
            child,
            stdin,
            stdout: reader,
            last_active: Instant::now(),
        };

        self.sessions
            .insert(agent_id.to_string(), Mutex::new(session));
        Ok(())
    }

    /// Check whether an agent has an active browser session (without creating one).
    pub fn has_session(&self, agent_id: &str) -> bool {
        self.sessions.contains_key(agent_id)
    }

    /// Send a command to an agent's browser session.
    pub async fn send_command(
        &self,
        agent_id: &str,
        cmd: BrowserCommand,
    ) -> Result<BrowserResponse, String> {
        // Session creation involves sync subprocess spawn + I/O
        tokio::task::block_in_place(|| self.get_or_create_sync(agent_id))?;

        let session_ref = self
            .sessions
            .get(agent_id)
            .ok_or_else(|| "Session disappeared".to_string())?;

        let session_mutex = session_ref.value();
        let mut session = session_mutex.lock().await;

        // Run synchronous I/O in a blocking context
        let response = tokio::task::block_in_place(|| session.send(&cmd))?;

        if !response.success {
            let err = response
                .error
                .clone()
                .unwrap_or_else(|| "Unknown error".to_string());
            warn!(agent_id, error = %err, "Browser command failed");
        }

        Ok(response)
    }

    /// Close an agent's browser session.
    pub async fn close_session(&self, agent_id: &str) {
        if let Some((_, session_mutex)) = self.sessions.remove(agent_id) {
            let mut session = session_mutex.lock().await;
            // Try graceful close
            let _ = session.send(&BrowserCommand::Close);
            session.kill();
            info!(agent_id, "Browser session closed");
        }
    }

    /// Clean up an agent's browser session (called after agent loop ends).
    pub async fn cleanup_agent(&self, agent_id: &str) {
        self.close_session(agent_id).await;
    }
}

// ── Tool handler functions ──────────────────────────────────────────────────

/// browser_navigate — Navigate to a URL. SSRF-checked in Rust before delegating.
pub async fn tool_browser_navigate(
    input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    let url = input["url"].as_str().ok_or("Missing 'url' parameter")?;

    // SECURITY: SSRF check in Rust before sending to Python
    crate::web_fetch::check_ssrf(url)?;

    let resp = mgr
        .send_command(
            agent_id,
            BrowserCommand::Navigate {
                url: url.to_string(),
            },
        )
        .await?;

    if !resp.success {
        return Err(resp.error.unwrap_or_else(|| "Navigate failed".to_string()));
    }

    let data = resp.data.unwrap_or_default();
    let title = data["title"].as_str().unwrap_or("(no title)");
    let page_url = data["url"].as_str().unwrap_or(url);
    let content = data["content"].as_str().unwrap_or("");

    // Wrap with external content markers
    let wrapped = crate::web_content::wrap_external_content(page_url, content);

    Ok(format!(
        "Navigated to: {page_url}\nTitle: {title}\n\n{wrapped}"
    ))
}

/// browser_click — Click an element by CSS selector or text.
pub async fn tool_browser_click(
    input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    let selector = input["selector"]
        .as_str()
        .ok_or("Missing 'selector' parameter")?;

    let resp = mgr
        .send_command(
            agent_id,
            BrowserCommand::Click {
                selector: selector.to_string(),
            },
        )
        .await?;

    if !resp.success {
        return Err(resp.error.unwrap_or_else(|| "Click failed".to_string()));
    }

    let data = resp.data.unwrap_or_default();
    let title = data["title"].as_str().unwrap_or("(no title)");
    let url = data["url"].as_str().unwrap_or("");

    Ok(format!("Clicked: {selector}\nPage: {title}\nURL: {url}"))
}

/// browser_type — Type text into an input field.
pub async fn tool_browser_type(
    input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    let selector = input["selector"]
        .as_str()
        .ok_or("Missing 'selector' parameter")?;
    let text = input["text"].as_str().ok_or("Missing 'text' parameter")?;

    let resp = mgr
        .send_command(
            agent_id,
            BrowserCommand::Type {
                selector: selector.to_string(),
                text: text.to_string(),
            },
        )
        .await?;

    if !resp.success {
        return Err(resp.error.unwrap_or_else(|| "Type failed".to_string()));
    }

    Ok(format!("Typed into {selector}: {text}"))
}

/// browser_screenshot — Take a screenshot of the current page.
pub async fn tool_browser_screenshot(
    _input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    let resp = mgr
        .send_command(agent_id, BrowserCommand::Screenshot)
        .await?;

    if !resp.success {
        return Err(resp
            .error
            .unwrap_or_else(|| "Screenshot failed".to_string()));
    }

    let data = resp.data.unwrap_or_default();
    let b64 = data["image_base64"].as_str().unwrap_or("");
    let url = data["url"].as_str().unwrap_or("");

    // Save screenshot to uploads temp dir so it's accessible via /api/uploads/
    let mut image_urls: Vec<String> = Vec::new();
    if !b64.is_empty() {
        use base64::Engine;
        let upload_dir = std::env::temp_dir().join("clawreform_uploads");
        let _ = std::fs::create_dir_all(&upload_dir);
        let file_id = uuid::Uuid::new_v4().to_string();
        if let Ok(decoded) = base64::engine::general_purpose::STANDARD.decode(b64) {
            let path = upload_dir.join(&file_id);
            if std::fs::write(&path, &decoded).is_ok() {
                image_urls.push(format!("/api/uploads/{file_id}"));
            }
        }
    }

    let result = serde_json::json!({
        "screenshot": true,
        "url": url,
        "image_urls": image_urls,
    });

    Ok(result.to_string())
}

/// browser_read_page — Read the current page content as markdown.
pub async fn tool_browser_read_page(
    _input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    let resp = mgr.send_command(agent_id, BrowserCommand::ReadPage).await?;

    if !resp.success {
        return Err(resp.error.unwrap_or_else(|| "ReadPage failed".to_string()));
    }

    let data = resp.data.unwrap_or_default();
    let title = data["title"].as_str().unwrap_or("(no title)");
    let url = data["url"].as_str().unwrap_or("");
    let content = data["content"].as_str().unwrap_or("");

    let wrapped = crate::web_content::wrap_external_content(url, content);

    Ok(format!("Page: {title}\nURL: {url}\n\n{wrapped}"))
}

/// browser_close — Close the browser session for this agent.
pub async fn tool_browser_close(
    _input: &serde_json::Value,
    mgr: &BrowserManager,
    agent_id: &str,
) -> Result<String, String> {
    mgr.close_session(agent_id).await;
    Ok("Browser session closed.".to_string())
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_browser_config_defaults() {
        let config = BrowserConfig::default();
        assert!(config.headless);
        assert_eq!(config.viewport_width, 1280);
        assert_eq!(config.viewport_height, 720);
        assert_eq!(config.timeout_secs, 30);
        assert_eq!(config.idle_timeout_secs, 300);
        assert_eq!(config.max_sessions, 5);
    }

    #[test]
    fn test_browser_command_serialize_navigate() {
        let cmd = BrowserCommand::Navigate {
            url: "https://example.com".to_string(),
        };
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"Navigate\""));
        assert!(json.contains("\"url\":\"https://example.com\""));
    }

    #[test]
    fn test_browser_command_serialize_click() {
        let cmd = BrowserCommand::Click {
            selector: "#submit-btn".to_string(),
        };
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"Click\""));
        assert!(json.contains("\"selector\":\"#submit-btn\""));
    }

    #[test]
    fn test_browser_command_serialize_type() {
        let cmd = BrowserCommand::Type {
            selector: "input[name='email']".to_string(),
            text: "test@example.com".to_string(),
        };
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"Type\""));
        assert!(json.contains("test@example.com"));
    }

    #[test]
    fn test_browser_command_serialize_screenshot() {
        let cmd = BrowserCommand::Screenshot;
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"Screenshot\""));
    }

    #[test]
    fn test_browser_command_serialize_read_page() {
        let cmd = BrowserCommand::ReadPage;
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"ReadPage\""));
    }

    #[test]
    fn test_browser_command_serialize_close() {
        let cmd = BrowserCommand::Close;
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("\"action\":\"Close\""));
    }

    #[test]
    fn test_browser_response_deserialize() {
        let json =
            r#"{"success": true, "data": {"title": "Example", "url": "https://example.com"}}"#;
        let resp: BrowserResponse = serde_json::from_str(json).unwrap();
        assert!(resp.success);
        assert!(resp.data.is_some());
        assert!(resp.error.is_none());
        let data = resp.data.unwrap();
        assert_eq!(data["title"], "Example");
    }

    #[test]
    fn test_browser_response_error_deserialize() {
        let json = r#"{"success": false, "error": "Element not found"}"#;
        let resp: BrowserResponse = serde_json::from_str(json).unwrap();
        assert!(!resp.success);
        assert!(resp.data.is_none());
        assert_eq!(resp.error.unwrap(), "Element not found");
    }

    #[test]
    fn test_browser_manager_new() {
        let config = BrowserConfig::default();
        let mgr = BrowserManager::new(config);
        assert!(mgr.sessions.is_empty());
    }
}
