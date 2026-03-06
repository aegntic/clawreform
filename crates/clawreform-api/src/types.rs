//! Request/response types for the ClawReform API.

use serde::{Deserialize, Serialize};

/// Request to spawn an agent from a TOML manifest string.
#[derive(Debug, Deserialize)]
pub struct SpawnRequest {
    /// Agent manifest as TOML string.
    pub manifest_toml: String,
    /// Optional Ed25519 signed manifest envelope (JSON).
    /// When present, the signature is verified before spawning.
    #[serde(default)]
    pub signed_manifest: Option<String>,
}

/// Response after spawning an agent.
#[derive(Debug, Serialize)]
pub struct SpawnResponse {
    pub agent_id: String,
    pub name: String,
}

/// A file attachment reference (from a prior upload).
#[derive(Debug, Clone, Deserialize)]
pub struct AttachmentRef {
    pub file_id: String,
    #[serde(default)]
    pub filename: String,
    #[serde(default)]
    pub content_type: String,
}

/// Request to send a message to an agent.
#[derive(Debug, Deserialize)]
pub struct MessageRequest {
    pub message: String,
    /// Optional file attachments (uploaded via /upload endpoint).
    #[serde(default)]
    pub attachments: Vec<AttachmentRef>,
}

/// Response from sending a message.
#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub response: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub iterations: u32,
}

/// Request to install a skill from the marketplace.
#[derive(Debug, Deserialize)]
pub struct SkillInstallRequest {
    pub name: String,
}

/// Request to uninstall a skill.
#[derive(Debug, Deserialize)]
pub struct SkillUninstallRequest {
    pub name: String,
}

/// Request to update an agent's manifest.
#[derive(Debug, Deserialize)]
pub struct AgentUpdateRequest {
    pub manifest_toml: String,
}

/// Request to change an agent's operational mode.
#[derive(Debug, Deserialize)]
pub struct SetModeRequest {
    pub mode: clawreform_types::agent::AgentMode,
}

/// Request to run a migration.
#[derive(Debug, Deserialize)]
pub struct MigrateRequest {
    pub source: String,
    pub source_dir: String,
    pub target_dir: String,
    #[serde(default)]
    pub dry_run: bool,
}

/// Request to scan a directory for migration.
#[derive(Debug, Deserialize)]
pub struct MigrateScanRequest {
    pub path: String,
}

/// Request to install a skill from ClawHub.
#[derive(Debug, Deserialize)]
pub struct ClawHubInstallRequest {
    /// ClawHub skill slug (e.g., "github-helper").
    pub slug: String,
}

/// Request to create a company goal.
#[derive(Debug, Deserialize)]
pub struct CreateCompanyGoalRequest {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub budget: f64,
    #[serde(default)]
    pub status: clawreform_types::company::GoalStatus,
}

/// Request to update a company goal.
#[derive(Debug, Default, Deserialize)]
pub struct UpdateCompanyGoalRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub budget: Option<f64>,
    pub spent: Option<f64>,
    pub status: Option<clawreform_types::company::GoalStatus>,
}

/// Request to create a company issue.
#[derive(Debug, Deserialize)]
pub struct CreateCompanyIssueRequest {
    #[serde(default)]
    pub goal_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub status: clawreform_types::company::IssueStatus,
    #[serde(default)]
    pub assigned_to: Option<String>,
    #[serde(default)]
    pub priority: u8,
    #[serde(default)]
    pub labels: Vec<String>,
}

/// Request to update a company issue.
#[derive(Debug, Default, Deserialize)]
pub struct UpdateCompanyIssueRequest {
    pub goal_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<clawreform_types::company::IssueStatus>,
    pub assigned_to: Option<String>,
    pub priority: Option<u8>,
    pub labels: Option<Vec<String>>,
}

/// Request to add a comment to a company issue.
#[derive(Debug, Deserialize)]
pub struct CreateCompanyIssueCommentRequest {
    pub author: String,
    pub body: String,
}
