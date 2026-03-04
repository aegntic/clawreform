//! Type definitions for self-modification

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Configuration for self-modification
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SelfModifyConfig {
    /// Enable self-modification
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    /// Maximum files per modification
    #[serde(default = "default_max_files")]
    pub max_files_per_mod: usize,
    /// Require approval for changes > N lines
    #[serde(default = "default_approval_threshold")]
    pub approval_threshold_lines: usize,
    /// Auto-rollback on failure
    #[serde(default = "default_auto_rollback")]
    pub auto_rollback: bool,
    /// Backup retention in days
    #[serde(default = "default_retention")]
    pub backup_retention_days: u32,
}

fn default_enabled() -> bool {
    true
}
fn default_max_files() -> usize {
    5
}
fn default_approval_threshold() -> usize {
    100
}
fn default_auto_rollback() -> bool {
    true
}
fn default_retention() -> u32 {
    7
}

impl Default for SelfModifyConfig {
    fn default() -> Self {
        Self {
            enabled: default_enabled(),
            max_files_per_mod: default_max_files(),
            approval_threshold_lines: default_approval_threshold(),
            auto_rollback: default_auto_rollback(),
            backup_retention_days: default_retention(),
        }
    }
}

/// A modification plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModifyPlan {
    /// Unique plan ID
    pub id: String,
    /// Human-readable description
    pub description: String,
    /// Files to be modified
    pub files: Vec<FileChange>,
    /// Estimated complexity (1-10)
    pub complexity: u8,
    /// Requires approval
    pub requires_approval: bool,
    /// Risk level
    pub risk_level: RiskLevel,
}

/// A file change
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileChange {
    /// File path relative to source root
    pub path: PathBuf,
    /// Type of change
    pub change_type: ChangeType,
    /// Diff preview
    pub diff_preview: String,
    /// Lines added
    pub lines_added: usize,
    /// Lines removed
    pub lines_removed: usize,
}

/// Type of file change
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ChangeType {
    Create,
    Modify,
    Delete,
}

/// Risk level - ordered from Low (0) to Critical (3)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Result of a modification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModifyResult {
    pub success: bool,
    pub backup_id: String,
    pub files_modified: usize,
    pub validation: ValidationResult,
}

/// Result of validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub success: bool,
    pub build_passed: bool,
    pub tests_passed: bool,
    pub clippy_passed: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Result of rollback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackResult {
    pub success: bool,
    pub backup_id: String,
}

/// Current modification status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModifyStatus {
    pub enabled: bool,
    pub current_plan: Option<ModifyPlan>,
    pub current_backup: Option<String>,
    pub last_request: Option<String>,
}

/// Internal state
#[derive(Debug, Default)]
pub struct ModifyState {
    pub current_plan: Option<ModifyPlan>,
    pub current_backup: Option<String>,
    pub last_request: Option<String>,
}

/// Error type
#[derive(Debug, thiserror::Error)]
pub enum ModifyError {
    #[error("No plan available")]
    NoPlan,
    #[error("Plan ID mismatch")]
    PlanMismatch,
    #[error("No backup available")]
    NoBackup,
    #[error("Too many files: {0} > {1}")]
    TooManyFiles(usize, usize),
    #[error("Validation failed: {0:?}")]
    ValidationFailed(ValidationResult),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Analysis error: {0}")]
    Analysis(String),
    #[error("Modification error: {0}")]
    Modification(String),
}
