//! Error types for the agent team framework.

use crate::{AgentId, TaskId};
use thiserror::Error;

/// Top-level error for the agent team framework.
#[derive(Error, Debug)]
pub enum TeamError {
    /// Configuration error.
    #[error("Team config error: {0}")]
    Config(String),

    /// A task failed.
    #[error("Task '{task_id}' failed: {reason}")]
    TaskFailed {
        task_id: TaskId,
        reason: String,
    },

    /// An agent encountered an error.
    #[error("Agent '{agent_id}' error: {reason}")]
    AgentError {
        agent_id: AgentId,
        reason: String,
    },

    /// Context bus error.
    #[error("Context bus error: {0}")]
    ContextBus(String),

    /// Delegation/routing error.
    #[error("Delegation from '{from_id}' to '{to_id}' failed: {reason}")]
    Delegation {
        from_id: AgentId,
        to_id: AgentId,
        reason: String,
    },

    /// Template error.
    #[error("Template '{template_id}' error: {reason}")]
    Template {
        template_id: String,
        reason: String,
    },

    /// File scope violation.
    #[error("File scope violation: {0}")]
    FileScope(String),

    /// Timeout exceeded.
    #[error("Timeout after {timeout_ms}ms: {reason}")]
    Timeout {
        timeout_ms: u64,
        reason: String,
    },

    /// The orchestrator is not running.
    #[error("Orchestrator is not running")]
    NotRunning,

    /// Goal processing failed.
    #[error("Goal processing failed: {0}")]
    GoalFailed(String),

    /// Deserialization error.
    #[error("Parse error: {0}")]
    Parse(#[from] serde_json::Error),

    /// I/O error.
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// YAML parse error.
    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),

    /// Internal error.
    #[error("Internal team error: {0}")]
    Internal(String),
}

/// Result alias for TeamError.
pub type TeamResult<T> = Result<T, TeamError>;
