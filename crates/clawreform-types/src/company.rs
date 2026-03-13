//! Company & Business Goal structures (Paperclip concepts).

use serde::{Deserialize, Serialize};

/// Represents a business goal assigned to an agent or team of agents.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    /// Unique identifier for the goal.
    pub id: String,
    /// High-level title of the goal (e.g., "Build the #1 AI app to $1M MRR").
    pub title: String,
    /// Description of the goal context.
    #[serde(default)]
    pub description: String,
    /// Financial budget allocated to this goal.
    #[serde(default)]
    pub budget: f64,
    /// Amount of budget spent so far.
    #[serde(default)]
    pub spent: f64,
    /// Current status of the goal (e.g., "active", "pending", "completed").
    #[serde(default)]
    pub status: GoalStatus,
}

/// Status of a business goal.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GoalStatus {
    #[default]
    Pending,
    Active,
    Completed,
    Failed,
}

/// Overarching budget configuration for a company/workspace.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CompanyBudget {
    /// Total budget allocated to the workspace.
    pub total_allocated: f64,
    /// Total budget spent by all agents.
    pub total_spent: f64,
}

// ---------------------------------------------------------------------------
// Issue Tracker (Paperclip-inspired work decomposition)
// ---------------------------------------------------------------------------

/// A trackable work item decomposed from a Goal.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub id: String,
    /// Goal this issue belongs to.
    #[serde(default)]
    pub goal_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub status: IssueStatus,
    /// Agent assigned to this issue.
    #[serde(default)]
    pub assigned_to: Option<String>,
    /// Priority (0 = lowest).
    #[serde(default)]
    pub priority: u8,
    #[serde(default)]
    pub labels: Vec<String>,
    #[serde(default)]
    pub comments: Vec<IssueComment>,
    #[serde(default)]
    pub created_at: String,
}

/// Status of an issue.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueStatus {
    #[default]
    Open,
    InProgress,
    Review,
    Done,
    Cancelled,
}

/// A comment on an issue.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueComment {
    pub id: String,
    pub author: String,
    pub body: String,
    pub created_at: String,
}

// ---------------------------------------------------------------------------
// Cost Event Tracking
// ---------------------------------------------------------------------------

/// A discrete cost event emitted after an LLM call.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEvent {
    pub id: String,
    pub agent_id: String,
    #[serde(default)]
    pub goal_id: Option<String>,
    pub provider: String,
    pub model: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    /// Estimated cost in USD.
    pub cost_usd: f64,
    pub timestamp: String,
}

// ---------------------------------------------------------------------------
// Clipmart Templates
// ---------------------------------------------------------------------------

/// A Clipmart company template manifest.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipTemplate {
    pub name: String,
    pub title: String,
    pub description: String,
    pub version: String,
    pub author: String,
    #[serde(default)]
    pub tags: Vec<String>,
}
