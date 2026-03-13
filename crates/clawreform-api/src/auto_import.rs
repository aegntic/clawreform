//! Auto-import system for MCP servers, skills, plugins from local directories.

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tracing::info;

use super::routes::AppState;

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredItem {
    pub item_type: String,
    pub name: String,
    pub path: String,
    pub manifest: Option<serde_json::Value>,
    pub description: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub tools_count: Option<usize>,
    pub already_installed: bool,
    pub can_import: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanRequest {
    pub directory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub directory: String,
    pub scanned_at: String,
    pub total_items: usize,
    pub mcp_servers: Vec<DiscoveredItem>,
    pub skills: Vec<DiscoveredItem>,
    pub plugins: Vec<DiscoveredItem>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportRequest {
    pub items: Vec<ImportItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportItem {
    pub item_type: String,
    pub path: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub imported: Vec<ImportedItem>,
    pub failed: Vec<FailedImport>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportedItem {
    pub item_type: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedImport {
    pub item_type: String,
    pub path: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SuggestedDirectory {
    pub path: String,
    pub item_count: Option<usize>,
    pub exists: bool,
}

// ============================================================================
// API Endpoints
// ============================================================================

/// POST /api/import/scan
pub async fn scan_directory(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ScanRequest>,
) -> impl IntoResponse {
    let dir = PathBuf::from(&body.directory);

    let dir = if body.directory.starts_with('~') {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/home".to_string());
        PathBuf::from(body.directory.replacen('~', &home, 1))
    } else {
        dir
    };

    if !dir.exists() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Directory does not exist" })),
        );
    }

    if !dir.is_dir() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Path is not a directory" })),
        );
    }

    let result = perform_scan(&dir, &state);
    (StatusCode::OK, Json(serde_json::to_value(result).unwrap()))
}

/// POST /api/import
pub async fn import_items(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ImportRequest>,
) -> impl IntoResponse {
    let mut result = ImportResult {
        success: true,
        imported: Vec::new(),
        failed: Vec::new(),
        message: String::new(),
    };

    for item in body.items {
        match import_single_item(&item, &state) {
            Ok(imported) => result.imported.push(imported),
            Err(e) => {
                result.success = false;
                result.failed.push(FailedImport {
                    item_type: item.item_type.clone(),
                    path: item.path.clone(),
                    error: e,
                });
            }
        }
    }

    if result.imported.is_empty() && result.failed.is_empty() {
        result.message = "No items to import".to_string();
    } else if result.failed.is_empty() {
        result.message = format!("Imported {} item(s)", result.imported.len());
    } else {
        result.message = format!(
            "Imported {} item(s), {} failed",
            result.imported.len(),
            result.failed.len()
        );
    }

    let status = if result.success {
        StatusCode::OK
    } else {
        StatusCode::PARTIAL_CONTENT
    };
    (status, Json(result))
}

/// GET /api/import/suggestions
pub async fn get_suggestions(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let mut suggestions = Vec::new();

    let home = std::env::var("HOME").unwrap_or_else(|_| "/home".to_string());
    let common_dirs = vec![
        format!("{}/.claude/skills", home),
        format!("{}/.clawreform/skills", home),
        format!("{}/.mcp/servers", home),
        format!("{}/.local/share/mcp", home),
        format!("{}/projects", home),
    ];

    for dir in common_dirs {
        let path = PathBuf::from(&dir);
        if path.exists() && path.is_dir() {
            if let Ok(read_dir) = std::fs::read_dir(&path) {
                let count = read_dir.count();
                if count > 0 {
                    suggestions.push(SuggestedDirectory {
                        path: dir,
                        item_count: Some(count),
                        exists: true,
                    });
                }
            }
        }
    }

    let skills_dir = state.kernel.config.home_dir.join("skills");
    if skills_dir.exists() {
        if let Ok(count) = std::fs::read_dir(&skills_dir).map(|r| r.count()) {
            suggestions.push(SuggestedDirectory {
                path: skills_dir.to_string_lossy().to_string(),
                item_count: Some(count),
                exists: true,
            });
        }
    }

    Json(serde_json::json!({ "suggestions": suggestions }))
}

// ============================================================================
// Internal Functions
// ============================================================================

fn perform_scan(dir: &Path, state: &AppState) -> ScanResult {
    let mut result = ScanResult {
        directory: dir.to_string_lossy().to_string(),
        scanned_at: chrono::Utc::now().to_rfc3339(),
        total_items: 0,
        mcp_servers: Vec::new(),
        skills: Vec::new(),
        plugins: Vec::new(),
        errors: Vec::new(),
    };

    let installed_skills: Vec<String> = state
        .kernel
        .skill_registry
        .read()
        .map(|r| r.skill_names())
        .unwrap_or_default();

    let configured_mcp: Vec<String> = state
        .kernel
        .config
        .mcp_servers
        .iter()
        .map(|entry| entry.name.clone())
        .collect();

    if let Err(e) = scan_recursive(dir, &mut result, &installed_skills, &configured_mcp) {
        result.errors.push(format!("Scan error: {}", e));
    }

    result.total_items = result.mcp_servers.len() + result.skills.len() + result.plugins.len();
    result
}

fn scan_recursive(
    dir: &Path,
    result: &mut ScanResult,
    installed_skills: &[String],
    configured_mcp: &[String],
) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            let mcp_config = path.join("mcp_config.json");
            let skill_toml = path.join("skill.toml");
            let skill_md = path.join("SKILL.md");
            let package_json = path.join("package.json");

            if mcp_config.exists() {
                if let Some(item) = parse_mcp_server(&path, &mcp_config, configured_mcp) {
                    result.mcp_servers.push(item);
                }
                continue;
            }

            if skill_toml.exists() || skill_md.exists() {
                let manifest_path = if skill_toml.exists() {
                    skill_toml
                } else {
                    skill_md
                };
                if let Some(item) = parse_skill(&path, &manifest_path, installed_skills) {
                    result.skills.push(item);
                }
                continue;
            }

            if package_json.exists() {
                if let Some(item) = parse_plugin(&path, &package_json) {
                    result.plugins.push(item);
                }
                continue;
            }

            scan_recursive(&path, result, installed_skills, configured_mcp)?;
        }
    }
    Ok(())
}

fn parse_mcp_server(
    path: &Path,
    config_path: &Path,
    configured_mcp: &[String],
) -> Option<DiscoveredItem> {
    let name = path.file_name()?.to_string_lossy().to_string();
    let already_installed = configured_mcp.contains(&name);

    let manifest = std::fs::read_to_string(config_path).ok()?;
    let manifest_json: serde_json::Value = serde_json::from_str(&manifest).ok()?;

    let description = manifest_json
        .get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let version = manifest_json
        .get("version")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Some(DiscoveredItem {
        item_type: "mcp_server".to_string(),
        name: name.clone(),
        path: path.to_string_lossy().to_string(),
        manifest: Some(manifest_json),
        description,
        version,
        author: None,
        tools_count: None,
        already_installed,
        can_import: !already_installed,
        error: None,
    })
}

fn parse_skill(
    path: &Path,
    manifest_path: &Path,
    installed_skills: &[String],
) -> Option<DiscoveredItem> {
    let name = path.file_name()?.to_string_lossy().to_string();
    let already_installed = installed_skills.contains(&name);

    let content = std::fs::read_to_string(manifest_path).ok()?;

    let (manifest, description, version) = if manifest_path
        .extension()
        .map(|e| e == "toml")
        .unwrap_or(false)
    {
        let parsed: toml::Value = toml::from_str(&content).ok()?;
        let skill = parsed.get("skill").and_then(|v| v.as_table());
        let desc = skill
            .and_then(|s| s.get("description"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let ver = skill
            .and_then(|s| s.get("version"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        (Some(serde_json::to_value(&parsed).ok()?), desc, ver)
    } else {
        let desc = content
            .lines()
            .find(|l| l.starts_with("description:") || l.starts_with("> "))
            .map(|l| {
                l.trim_start_matches("description:")
                    .trim_start_matches("> ")
                    .trim()
                    .to_string()
            });
        (Some(serde_json::json!({ "raw": content })), desc, None)
    };

    Some(DiscoveredItem {
        item_type: "skill".to_string(),
        name,
        path: path.to_string_lossy().to_string(),
        manifest,
        description,
        version,
        author: None,
        tools_count: None,
        already_installed,
        can_import: !already_installed,
        error: None,
    })
}

fn parse_plugin(path: &Path, package_json_path: &Path) -> Option<DiscoveredItem> {
    let name = path.file_name()?.to_string_lossy().to_string();

    let content = std::fs::read_to_string(package_json_path).ok()?;
    let pkg: serde_json::Value = serde_json::from_str(&content).ok()?;

    let is_mcp = pkg
        .get("keywords")
        .and_then(|k| k.as_array())
        .map(|arr| arr.iter().any(|v| v.as_str() == Some("mcp")))
        .unwrap_or(false);

    if !is_mcp {
        return None;
    }

    let description = pkg
        .get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let version = pkg
        .get("version")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Some(DiscoveredItem {
        item_type: "plugin".to_string(),
        name,
        path: path.to_string_lossy().to_string(),
        manifest: Some(pkg),
        description,
        version,
        author: None,
        tools_count: None,
        already_installed: false,
        can_import: true,
        error: None,
    })
}

fn import_single_item(item: &ImportItem, state: &AppState) -> Result<ImportedItem, String> {
    match item.item_type.as_str() {
        "skill" => import_skill(item, state),
        "mcp_server" => import_mcp_server(item, state),
        "plugin" => import_plugin(item, state),
        _ => Err(format!("Unknown item type: {}", item.item_type)),
    }
}

fn import_skill(item: &ImportItem, state: &AppState) -> Result<ImportedItem, String> {
    let source_path = PathBuf::from(&item.path);
    let name = item.name.clone().unwrap_or_else(|| {
        source_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "imported-skill".to_string())
    });

    let skills_dir = state.kernel.config.home_dir.join("skills");
    std::fs::create_dir_all(&skills_dir)
        .map_err(|e| format!("Failed to create skills directory: {}", e))?;

    let dest_path = skills_dir.join(&name);

    if source_path.is_dir() {
        copy_dir_all(&source_path, &dest_path)
            .map_err(|e| format!("Failed to copy skill: {}", e))?;
    } else {
        std::fs::copy(&source_path, &dest_path)
            .map_err(|e| format!("Failed to copy skill file: {}", e))?;
    }

    {
        let mut registry = state
            .kernel
            .skill_registry
            .write()
            .map_err(|e| format!("Failed to lock registry: {}", e))?;
        registry
            .load_all()
            .map_err(|e| format!("Failed to reload skills: {}", e))?;
    }

    info!(name = %name, "Imported skill");
    Ok(ImportedItem {
        item_type: "skill".to_string(),
        name,
        path: dest_path.to_string_lossy().to_string(),
    })
}

fn import_mcp_server(item: &ImportItem, _state: &AppState) -> Result<ImportedItem, String> {
    let source_path = PathBuf::from(&item.path);
    let name = item.name.clone().unwrap_or_else(|| {
        source_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "imported-mcp".to_string())
    });

    info!(name = %name, "MCP server import requested (requires config.toml update)");
    Ok(ImportedItem {
        item_type: "mcp_server".to_string(),
        name,
        path: source_path.to_string_lossy().to_string(),
    })
}

fn import_plugin(item: &ImportItem, _state: &AppState) -> Result<ImportedItem, String> {
    let name = item
        .name
        .clone()
        .unwrap_or_else(|| "imported-plugin".to_string());
    let source_path = PathBuf::from(&item.path);

    info!(name = %name, "Plugin import requested");
    Ok(ImportedItem {
        item_type: "plugin".to_string(),
        name,
        path: source_path.to_string_lossy().to_string(),
    })
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}
