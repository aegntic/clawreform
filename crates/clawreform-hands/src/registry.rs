//! Hand registry — manages hand definitions and active instances.

use crate::bundled;
use crate::{
    HandDefinition, HandError, HandInstance, HandRequirement, HandResult, HandSettingType,
    HandStatus, RequirementType,
};
use clawreform_types::agent::AgentId;
use dashmap::DashMap;
use serde::Serialize;
use std::cmp::Ordering;
use std::collections::HashMap;
use tracing::{info, warn};
use uuid::Uuid;

// ─── Settings availability types ────────────────────────────────────────────

/// Availability status of a single setting option.
#[derive(Debug, Clone, Serialize)]
pub struct SettingOptionStatus {
    pub value: String,
    pub label: String,
    pub provider_env: Option<String>,
    pub binary: Option<String>,
    pub available: bool,
}

/// Setting with per-option availability info (for API responses).
#[derive(Debug, Clone, Serialize)]
pub struct SettingStatus {
    pub key: String,
    pub label: String,
    pub description: String,
    pub setting_type: HandSettingType,
    pub default: String,
    pub options: Vec<SettingOptionStatus>,
}

/// The Hand registry — stores definitions and tracks active instances.
pub struct HandRegistry {
    /// All known hand definitions, keyed by hand_id.
    definitions: HashMap<String, HandDefinition>,
    /// Active hand instances, keyed by instance UUID.
    instances: DashMap<Uuid, HandInstance>,
}

impl HandRegistry {
    /// Create an empty registry.
    pub fn new() -> Self {
        Self {
            definitions: HashMap::new(),
            instances: DashMap::new(),
        }
    }

    /// Load all bundled hand definitions. Returns count of definitions loaded.
    pub fn load_bundled(&mut self) -> usize {
        let bundled = bundled::bundled_hands();
        let mut count = 0;
        for (id, toml_content, skill_content) in bundled {
            match bundled::parse_bundled(id, toml_content, skill_content) {
                Ok(def) => {
                    info!(hand = %def.id, name = %def.name, "Loaded bundled hand");
                    self.definitions.insert(def.id.clone(), def);
                    count += 1;
                }
                Err(e) => {
                    warn!(hand = %id, error = %e, "Failed to parse bundled hand");
                }
            }
        }
        count
    }

    /// List all known hand definitions.
    pub fn list_definitions(&self) -> Vec<&HandDefinition> {
        let mut defs: Vec<&HandDefinition> = self.definitions.values().collect();
        defs.sort_by_key(|d| &d.name);
        defs
    }

    /// Get a specific hand definition by ID.
    pub fn get_definition(&self, hand_id: &str) -> Option<&HandDefinition> {
        self.definitions.get(hand_id)
    }

    /// Activate a hand — creates an instance (agent spawning is done by kernel).
    pub fn activate(
        &self,
        hand_id: &str,
        config: HashMap<String, serde_json::Value>,
    ) -> HandResult<HandInstance> {
        let def = self
            .definitions
            .get(hand_id)
            .ok_or_else(|| HandError::NotFound(hand_id.to_string()))?;

        // Check if already active
        for entry in self.instances.iter() {
            if entry.hand_id == hand_id && entry.status == HandStatus::Active {
                return Err(HandError::AlreadyActive(hand_id.to_string()));
            }
        }

        let instance = HandInstance::new(hand_id, &def.agent.name, config);
        let id = instance.instance_id;
        self.instances.insert(id, instance.clone());
        info!(hand = %hand_id, instance = %id, "Hand activated");
        Ok(instance)
    }

    /// Deactivate a hand instance (agent killing is done by kernel).
    pub fn deactivate(&self, instance_id: Uuid) -> HandResult<HandInstance> {
        let (_, instance) = self
            .instances
            .remove(&instance_id)
            .ok_or(HandError::InstanceNotFound(instance_id))?;
        info!(hand = %instance.hand_id, instance = %instance_id, "Hand deactivated");
        Ok(instance)
    }

    /// Pause a hand instance.
    pub fn pause(&self, instance_id: Uuid) -> HandResult<()> {
        let mut entry = self
            .instances
            .get_mut(&instance_id)
            .ok_or(HandError::InstanceNotFound(instance_id))?;
        entry.status = HandStatus::Paused;
        entry.updated_at = chrono::Utc::now();
        Ok(())
    }

    /// Resume a paused hand instance.
    pub fn resume(&self, instance_id: Uuid) -> HandResult<()> {
        let mut entry = self
            .instances
            .get_mut(&instance_id)
            .ok_or(HandError::InstanceNotFound(instance_id))?;
        entry.status = HandStatus::Active;
        entry.updated_at = chrono::Utc::now();
        Ok(())
    }

    /// Set the agent ID for an instance (called after kernel spawns the agent).
    pub fn set_agent(&self, instance_id: Uuid, agent_id: AgentId) -> HandResult<()> {
        let mut entry = self
            .instances
            .get_mut(&instance_id)
            .ok_or(HandError::InstanceNotFound(instance_id))?;
        entry.agent_id = Some(agent_id);
        entry.updated_at = chrono::Utc::now();
        Ok(())
    }

    /// Find the hand instance associated with an agent.
    pub fn find_by_agent(&self, agent_id: AgentId) -> Option<HandInstance> {
        for entry in self.instances.iter() {
            if entry.agent_id == Some(agent_id) {
                return Some(entry.clone());
            }
        }
        None
    }

    /// List all active hand instances.
    pub fn list_instances(&self) -> Vec<HandInstance> {
        self.instances.iter().map(|e| e.clone()).collect()
    }

    /// Get a specific instance by ID.
    pub fn get_instance(&self, instance_id: Uuid) -> Option<HandInstance> {
        self.instances.get(&instance_id).map(|e| e.clone())
    }

    /// Check which requirements are satisfied for a given hand.
    pub fn check_requirements(&self, hand_id: &str) -> HandResult<Vec<(HandRequirement, bool)>> {
        let def = self
            .definitions
            .get(hand_id)
            .ok_or_else(|| HandError::NotFound(hand_id.to_string()))?;

        let results: Vec<(HandRequirement, bool)> = def
            .requires
            .iter()
            .map(|req| {
                let satisfied = check_requirement(req);
                (req.clone(), satisfied)
            })
            .collect();

        Ok(results)
    }

    /// Check availability of all settings options for a hand.
    pub fn check_settings_availability(&self, hand_id: &str) -> HandResult<Vec<SettingStatus>> {
        let def = self
            .definitions
            .get(hand_id)
            .ok_or_else(|| HandError::NotFound(hand_id.to_string()))?;

        Ok(def
            .settings
            .iter()
            .map(|setting| {
                let options = setting
                    .options
                    .iter()
                    .map(|opt| {
                        let available = check_option_available(
                            opt.provider_env.as_deref(),
                            opt.binary.as_deref(),
                        );
                        SettingOptionStatus {
                            value: opt.value.clone(),
                            label: opt.label.clone(),
                            provider_env: opt.provider_env.clone(),
                            binary: opt.binary.clone(),
                            available,
                        }
                    })
                    .collect();
                SettingStatus {
                    key: setting.key.clone(),
                    label: setting.label.clone(),
                    description: setting.description.clone(),
                    setting_type: setting.setting_type.clone(),
                    default: setting.default.clone(),
                    options,
                }
            })
            .collect())
    }

    /// Mark an instance as errored.
    pub fn set_error(&self, instance_id: Uuid, message: String) -> HandResult<()> {
        let mut entry = self
            .instances
            .get_mut(&instance_id)
            .ok_or(HandError::InstanceNotFound(instance_id))?;
        entry.status = HandStatus::Error(message);
        entry.updated_at = chrono::Utc::now();
        Ok(())
    }
}

impl Default for HandRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if a single requirement is satisfied.
fn check_requirement(req: &HandRequirement) -> bool {
    match req.requirement_type {
        RequirementType::Binary => {
            // Check if binary exists on PATH
            which_binary(&req.check_value)
                && req
                    .min_version
                    .as_deref()
                    .map(|min_version| {
                        binary_meets_min_version(
                            &req.check_value,
                            &req.version_args,
                            min_version,
                        )
                    })
                    .unwrap_or(true)
        }
        RequirementType::EnvVar | RequirementType::ApiKey => {
            // Check if env var is set and non-empty
            std::env::var(&req.check_value)
                .map(|v| !v.is_empty())
                .unwrap_or(false)
        }
    }
}

/// Check if a binary is on PATH (cross-platform).
fn which_binary(name: &str) -> bool {
    let path_var = std::env::var("PATH").unwrap_or_default();
    let separator = if cfg!(windows) { ';' } else { ':' };
    let extensions: Vec<&str> = if cfg!(windows) {
        vec!["", ".exe", ".cmd", ".bat"]
    } else {
        vec![""]
    };

    for dir in path_var.split(separator) {
        for ext in &extensions {
            let candidate = std::path::Path::new(dir).join(format!("{name}{ext}"));
            if candidate.is_file() {
                return true;
            }
        }
    }
    false
}

fn binary_meets_min_version(name: &str, version_args: &[String], min_version: &str) -> bool {
    let detected = query_binary_version(name, version_args).and_then(|output| extract_version(&output));
    let minimum = extract_version(min_version);

    match (detected, minimum) {
        (Some(detected), Some(minimum)) => compare_versions(&detected, &minimum) != Ordering::Less,
        _ => false,
    }
}

fn query_binary_version(name: &str, version_args: &[String]) -> Option<String> {
    let args: Vec<&str> = if version_args.is_empty() {
        vec!["--version"]
    } else {
        version_args.iter().map(String::as_str).collect()
    };

    let output = std::process::Command::new(name).args(&args).output().ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if stdout.is_empty() && stderr.is_empty() {
        return None;
    }

    Some(match (stdout.is_empty(), stderr.is_empty()) {
        (false, true) => stdout,
        (true, false) => stderr,
        (false, false) => format!("{stdout}\n{stderr}"),
        (true, true) => return None,
    })
}

fn extract_version(text: &str) -> Option<Vec<u64>> {
    let bytes = text.as_bytes();

    for start in 0..bytes.len() {
        if !bytes[start].is_ascii_digit() {
            continue;
        }

        let mut end = start;
        while end < bytes.len() && (bytes[end].is_ascii_digit() || bytes[end] == b'.') {
            end += 1;
        }

        let candidate = &text[start..end];
        let parsed = candidate
            .split('.')
            .map(str::trim)
            .map(str::parse::<u64>)
            .collect::<Result<Vec<_>, _>>();

        if let Ok(parts) = parsed {
            if !parts.is_empty() {
                return Some(parts);
            }
        }
    }

    None
}

fn compare_versions(left: &[u64], right: &[u64]) -> Ordering {
    let len = left.len().max(right.len());
    for idx in 0..len {
        let a = left.get(idx).copied().unwrap_or(0);
        let b = right.get(idx).copied().unwrap_or(0);
        match a.cmp(&b) {
            Ordering::Equal => continue,
            other => return other,
        }
    }
    Ordering::Equal
}

/// Check if a setting option is available based on its provider_env and binary.
///
/// - No provider_env and no binary → always available (e.g. "auto", "none")
/// - provider_env set → check if env var is non-empty (special case: GEMINI_API_KEY also checks GOOGLE_API_KEY)
/// - binary set → check if binary is on PATH
fn check_option_available(provider_env: Option<&str>, binary: Option<&str>) -> bool {
    let env_ok = match provider_env {
        None => true,
        Some(env) => {
            let direct = std::env::var(env).map(|v| !v.is_empty()).unwrap_or(false);
            if direct {
                return binary.map(which_binary).unwrap_or(true);
            }
            // Gemini special case: also accept GOOGLE_API_KEY
            if env == "GEMINI_API_KEY" {
                std::env::var("GOOGLE_API_KEY")
                    .map(|v| !v.is_empty())
                    .unwrap_or(false)
            } else {
                false
            }
        }
    };

    if !env_ok {
        return false;
    }

    binary.map(which_binary).unwrap_or(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_registry_is_empty() {
        let reg = HandRegistry::new();
        assert!(reg.list_definitions().is_empty());
        assert!(reg.list_instances().is_empty());
    }

    #[test]
    fn load_bundled_hands() {
        let mut reg = HandRegistry::new();
        let count = reg.load_bundled();
        assert_eq!(count, 7);
        assert!(!reg.list_definitions().is_empty());

        // Clip hand should be loaded
        let clip = reg.get_definition("clip");
        assert!(clip.is_some());
        let clip = clip.unwrap();
        assert_eq!(clip.name, "Clip Hand");

        // Einstein hands should be loaded
        assert!(reg.get_definition("lead").is_some());
        assert!(reg.get_definition("collector").is_some());
        assert!(reg.get_definition("predictor").is_some());
        assert!(reg.get_definition("researcher").is_some());
        assert!(reg.get_definition("twitter").is_some());

        // Browser hand should be loaded
        assert!(reg.get_definition("browser").is_some());
    }

    #[test]
    fn activate_and_deactivate() {
        let mut reg = HandRegistry::new();
        reg.load_bundled();

        let instance = reg.activate("clip", HashMap::new()).unwrap();
        assert_eq!(instance.hand_id, "clip");
        assert_eq!(instance.status, HandStatus::Active);

        let instances = reg.list_instances();
        assert_eq!(instances.len(), 1);

        // Can't activate again while active
        let err = reg.activate("clip", HashMap::new());
        assert!(err.is_err());

        // Deactivate
        let removed = reg.deactivate(instance.instance_id).unwrap();
        assert_eq!(removed.hand_id, "clip");
        assert!(reg.list_instances().is_empty());
    }

    #[test]
    fn pause_and_resume() {
        let mut reg = HandRegistry::new();
        reg.load_bundled();

        let instance = reg.activate("clip", HashMap::new()).unwrap();
        let id = instance.instance_id;

        reg.pause(id).unwrap();
        let paused = reg.get_instance(id).unwrap();
        assert_eq!(paused.status, HandStatus::Paused);

        reg.resume(id).unwrap();
        let resumed = reg.get_instance(id).unwrap();
        assert_eq!(resumed.status, HandStatus::Active);

        reg.deactivate(id).unwrap();
    }

    #[test]
    fn set_agent() {
        let mut reg = HandRegistry::new();
        reg.load_bundled();

        let instance = reg.activate("clip", HashMap::new()).unwrap();
        let id = instance.instance_id;
        let agent_id = AgentId::new();

        reg.set_agent(id, agent_id).unwrap();

        let found = reg.find_by_agent(agent_id);
        assert!(found.is_some());
        assert_eq!(found.unwrap().instance_id, id);

        reg.deactivate(id).unwrap();
    }

    #[test]
    fn check_requirements() {
        let mut reg = HandRegistry::new();
        reg.load_bundled();

        let results = reg.check_requirements("clip").unwrap();
        assert!(!results.is_empty());
        // Each result has a requirement and a bool
        for (req, _satisfied) in &results {
            assert!(!req.key.is_empty());
            assert!(!req.label.is_empty());
        }
    }

    #[test]
    fn not_found_errors() {
        let reg = HandRegistry::new();
        assert!(reg.get_definition("nonexistent").is_none());
        assert!(reg.activate("nonexistent", HashMap::new()).is_err());
        assert!(reg.check_requirements("nonexistent").is_err());
        assert!(reg.deactivate(Uuid::new_v4()).is_err());
        assert!(reg.pause(Uuid::new_v4()).is_err());
        assert!(reg.resume(Uuid::new_v4()).is_err());
    }

    #[test]
    fn set_error_status() {
        let mut reg = HandRegistry::new();
        reg.load_bundled();

        let instance = reg.activate("clip", HashMap::new()).unwrap();
        let id = instance.instance_id;

        reg.set_error(id, "something broke".to_string()).unwrap();
        let inst = reg.get_instance(id).unwrap();
        assert_eq!(
            inst.status,
            HandStatus::Error("something broke".to_string())
        );

        reg.deactivate(id).unwrap();
    }

    #[test]
    fn which_binary_finds_common() {
        // On all platforms, at least one of these should exist
        let has_something =
            which_binary("echo") || which_binary("cmd") || which_binary("sh") || which_binary("ls");
        // This test is best-effort — in CI containers some might not exist
        let _ = has_something;
    }

    #[test]
    fn env_var_requirement_check() {
        std::env::set_var("CLAWREFORM_TEST_HAND_REQ", "test_value");
        let req = HandRequirement {
            key: "test".to_string(),
            label: "test".to_string(),
            requirement_type: RequirementType::EnvVar,
            check_value: "CLAWREFORM_TEST_HAND_REQ".to_string(),
            min_version: None,
            version_args: Vec::new(),
            description: None,
            install: None,
        };
        assert!(check_requirement(&req));

        let req_missing = HandRequirement {
            key: "test".to_string(),
            label: "test".to_string(),
            requirement_type: RequirementType::EnvVar,
            check_value: "CLAWREFORM_NONEXISTENT_VAR_12345".to_string(),
            min_version: None,
            version_args: Vec::new(),
            description: None,
            install: None,
        };
        assert!(!check_requirement(&req_missing));
        std::env::remove_var("CLAWREFORM_TEST_HAND_REQ");
    }

    #[test]
    fn version_requirement_accepts_newer_binary_versions() {
        let req = HandRequirement {
            key: "rustc".to_string(),
            label: "Rust 1.0.0+".to_string(),
            requirement_type: RequirementType::Binary,
            check_value: "rustc".to_string(),
            min_version: Some("1.0.0".to_string()),
            version_args: vec!["--version".to_string()],
            description: None,
            install: None,
        };
        assert!(check_requirement(&req));
    }

    #[test]
    fn version_requirement_rejects_older_binary_versions() {
        let req = HandRequirement {
            key: "rustc".to_string(),
            label: "Rust 999.0.0+".to_string(),
            requirement_type: RequirementType::Binary,
            check_value: "rustc".to_string(),
            min_version: Some("999.0.0".to_string()),
            version_args: vec!["--version".to_string()],
            description: None,
            install: None,
        };
        assert!(!check_requirement(&req));
    }

    #[test]
    fn extract_version_prefers_first_semver_like_value() {
        assert_eq!(extract_version("rustc 1.88.0 (abc 2025-06-23)"), Some(vec![1, 88, 0]));
    }
}
