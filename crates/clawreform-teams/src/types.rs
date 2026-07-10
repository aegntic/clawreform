//! Core types for the agent team framework.
//!
//! Maps the TypeScript Zod schemas to Rust structs with serde.

use crate::error::TeamResult;
use chrono::{DateTime, Utc};
pub use clawreform_types::agent::AgentId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;

// ============================================================================
// Agent Identity & Role
// ============================================================================

/// Role within the team hierarchy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TeamRole {
    /// Top-level goal decomposer.
    Orchestrator,
    /// Domain specialist that manages workers.
    TeamLead,
    /// Task executor.
    Worker,
}

/// Agent status within a team.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum TeamAgentStatus {
    #[default]
    Idle,
    Working,
    Waiting,
    Done,
    Error,
    Cancelled,
}

/// Identity of a team agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamAgentIdentity {
    /// Unique agent ID.
    pub id: AgentId,
    /// Human-readable name.
    pub name: String,
    /// Role in the team hierarchy.
    pub role: TeamRole,
    /// Areas of expertise.
    #[serde(default)]
    pub expertise: Vec<String>,
    /// Parent agent ID (e.g., worker → lead, lead → orchestrator).
    pub parent_id: Option<AgentId>,
    /// Optional model override.
    pub model: Option<String>,
}

impl TeamAgentIdentity {
    /// Create a new identity with a random ID.
    pub fn new(name: &str, role: TeamRole) -> Self {
        Self {
            id: AgentId::new(),
            name: name.to_string(),
            role,
            expertise: Vec::new(),
            parent_id: None,
            model: None,
        }
    }
}

// ============================================================================
// Task System
// ============================================================================

/// Task priority.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    #[default]
    Medium,
    High,
    Critical,
}

/// Task status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    #[default]
    Pending,
    Assigned,
    InProgress,
    Review,
    Done,
    Failed,
    Blocked,
}

/// Unique task identifier.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(pub Uuid);

impl TaskId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for TaskId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for TaskId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// File access scope for a task.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct TaskScope {
    /// Files the agent can access.
    pub files: Vec<String>,
    /// Directories the agent can access.
    pub directories: Vec<String>,
    /// Files that are read-only.
    pub read_only: Vec<String>,
}

/// A unit of work in the team system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamTask {
    /// Unique task ID.
    pub id: TaskId,
    /// What this task aims to accomplish.
    pub goal: String,
    /// Detailed description.
    #[serde(default)]
    pub description: String,
    /// Current status.
    #[serde(default)]
    pub status: TaskStatus,
    /// Priority level.
    #[serde(default)]
    pub priority: TaskPriority,
    /// Who this is assigned to.
    pub assignee_id: Option<AgentId>,
    /// Role of the assignee.
    pub assignee_role: Option<TeamRole>,
    /// Parent task (for sub-task decomposition).
    pub parent_task_id: Option<TaskId>,
    /// Sub-task IDs.
    #[serde(default)]
    pub child_task_ids: Vec<TaskId>,
    /// Task IDs that must complete first.
    #[serde(default)]
    pub dependencies: Vec<TaskId>,
    /// File access scope.
    #[serde(default)]
    pub scope: TaskScope,
    /// Result text (once complete).
    pub result: Option<String>,
    /// Artifact paths produced.
    #[serde(default)]
    pub artifacts: Vec<String>,
    /// Arbitrary metadata.
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
    /// When the task was created.
    pub created_at: DateTime<Utc>,
    /// When the task was last updated.
    pub updated_at: DateTime<Utc>,
    /// When the task was completed.
    pub completed_at: Option<DateTime<Utc>>,
    /// Maximum iterations (till-done loops).
    #[serde(default = "default_max_iterations")]
    pub max_iterations: u32,
    /// Current iteration count.
    #[serde(default)]
    pub current_iteration: u32,
}

fn default_max_iterations() -> u32 {
    5
}

impl TeamTask {
    /// Create a new task with defaults.
    pub fn new(goal: &str) -> Self {
        let now = Utc::now();
        Self {
            id: TaskId::new(),
            goal: goal.to_string(),
            description: String::new(),
            status: TaskStatus::default(),
            priority: TaskPriority::default(),
            assignee_id: None,
            assignee_role: None,
            parent_task_id: None,
            child_task_ids: Vec::new(),
            dependencies: Vec::new(),
            scope: TaskScope::default(),
            result: None,
            artifacts: Vec::new(),
            metadata: HashMap::new(),
            created_at: now,
            updated_at: now,
            completed_at: None,
            max_iterations: default_max_iterations(),
            current_iteration: 0,
        }
    }
}

// ============================================================================
// Delegation Messages
// ============================================================================

/// Message direction in the hierarchy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageDirection {
    /// Orchestrator → Lead → Worker
    Down,
    /// Worker → Lead → Orchestrator
    Up,
    /// Peer-to-peer
    Lateral,
}

/// Types of delegation messages.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MessageType {
    TaskAssign,
    TaskUpdate,
    TaskResult,
    TaskFailed,
    TaskBlocked,
    ContextRequest,
    ContextProvide,
    StatusReport,
    Error,
    Shutdown,
    Ping,
    Pong,
}

/// A message between agents in the team hierarchy.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationMessage {
    /// Unique message ID.
    pub id: Uuid,
    /// Message type.
    pub msg_type: MessageType,
    /// Direction in hierarchy.
    pub direction: MessageDirection,
    /// Sender agent ID.
    pub from_id: AgentId,
    /// Recipient agent ID.
    pub to_id: AgentId,
    /// Associated task (if any).
    pub task_id: Option<TaskId>,
    /// Payload.
    #[serde(default)]
    pub payload: HashMap<String, serde_json::Value>,
    /// When sent.
    pub timestamp: DateTime<Utc>,
}

impl DelegationMessage {
    /// Create a new delegation message.
    pub fn new(
        msg_type: MessageType,
        from_id: AgentId,
        to_id: AgentId,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            msg_type,
            direction: if from_id == to_id {
                MessageDirection::Lateral
            } else {
                MessageDirection::Down
            },
            from_id,
            to_id,
            task_id: None,
            payload: HashMap::new(),
            timestamp: Utc::now(),
        }
    }

    /// Set the task association.
    pub fn with_task(mut self, task_id: TaskId) -> Self {
        self.task_id = Some(task_id);
        self
    }

    /// Set the direction.
    pub fn with_direction(mut self, direction: MessageDirection) -> Self {
        self.direction = direction;
        self
    }

    /// Set the payload.
    pub fn with_payload(mut self, payload: HashMap<String, serde_json::Value>) -> Self {
        self.payload = payload;
        self
    }
}

// ============================================================================
// Context Bus Entry
// ============================================================================

/// Type of data stored in the context bus.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum ContextType {
    #[default]
    Json,
    String,
    Document,
    FileRef,
}

/// An entry in the shared context bus.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextEntry {
    /// Unique key.
    pub key: String,
    /// The value.
    pub value: serde_json::Value,
    /// Value type hint.
    #[serde(default)]
    pub context_type: ContextType,
    /// Who wrote this.
    pub author_id: AgentId,
    /// When written.
    pub timestamp: DateTime<Utc>,
    /// TTL in milliseconds (None = forever).
    pub ttl: Option<u64>,
    /// Tags for querying.
    #[serde(default)]
    pub tags: Vec<String>,
    /// Agent IDs that can read this (empty = all).
    #[serde(default)]
    pub scope: Vec<AgentId>,
}

impl ContextEntry {
    /// Create a new context entry.
    pub fn new(key: &str, value: serde_json::Value, author_id: AgentId) -> Self {
        Self {
            key: key.to_string(),
            value,
            context_type: ContextType::default(),
            author_id,
            timestamp: Utc::now(),
            ttl: None,
            tags: Vec::new(),
            scope: Vec::new(),
        }
    }

    /// Check if this entry is expired.
    pub fn is_expired(&self) -> bool {
        match self.ttl {
            Some(ttl_ms) => {
                let elapsed = Utc::now()
                    .signed_duration_since(self.timestamp)
                    .num_milliseconds();
                elapsed > ttl_ms as i64
            }
            None => false,
        }
    }
}

// ============================================================================
// Mental Model
// ============================================================================

/// A learned pattern with confidence.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearnedPattern {
    /// What triggers this pattern.
    pub trigger: String,
    /// The response behavior.
    pub response: String,
    /// Confidence score (0.0 – 1.0).
    pub confidence: f32,
}

/// An agent's mental model — accumulated knowledge and preferences.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct MentalModel {
    /// Which agent this belongs to.
    pub agent_id: AgentId,
    /// Areas of expertise.
    pub expertise: Vec<String>,
    /// Key-value knowledge store.
    pub knowledge: HashMap<String, String>,
    /// Preference settings.
    pub preferences: HashMap<String, serde_json::Value>,
    /// Learned behavioral patterns.
    pub learned_patterns: Vec<LearnedPattern>,
    /// When last updated.
    pub last_updated: DateTime<Utc>,
}

impl Default for MentalModel {
    fn default() -> Self {
        Self {
            agent_id: AgentId::new(),
            expertise: Vec::new(),
            knowledge: HashMap::new(),
            preferences: HashMap::new(),
            learned_patterns: Vec::new(),
            last_updated: Utc::now(),
        }
    }
}

// ============================================================================
// Prompt Template
// ============================================================================

/// A reusable prompt template with variable substitution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptTemplate {
    /// Unique template ID.
    pub id: String,
    /// Human-readable name.
    pub name: String,
    /// The template string with `{{variable}}` placeholders.
    pub template: String,
    /// Expected variable names.
    #[serde(default)]
    pub variables: Vec<String>,
    /// Description of what this template does.
    #[serde(default)]
    pub description: String,
    /// Optional role restriction.
    pub role: Option<TeamRole>,
}

// ============================================================================
// File Scope
// ============================================================================

/// File system access scope for an agent.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct FileScope {
    /// Base directory (default: current dir).
    pub base_dir: PathBuf,
    /// Glob patterns for allowed paths.
    pub allowed: Vec<String>,
    /// Glob patterns for denied paths.
    pub denied: Vec<String>,
}

// ============================================================================
// Team Configuration
// ============================================================================

/// Worker configuration in a team.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkerConfig {
    /// Worker name.
    pub name: String,
    /// Areas of expertise.
    #[serde(default)]
    pub expertise: Vec<String>,
    /// Model override.
    pub model: Option<String>,
    /// Path to mental model file.
    pub mental_model: Option<String>,
}

/// Team lead configuration.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TeamLeadConfig {
    /// Lead name.
    pub name: String,
    /// Domain specialty.
    pub domain: String,
    /// Areas of expertise.
    #[serde(default)]
    pub expertise: Vec<String>,
    /// Model override.
    pub model: Option<String>,
    /// Path to mental model file.
    pub mental_model: Option<String>,
    /// Workers under this lead.
    pub workers: Vec<WorkerConfig>,
    /// Max concurrent tasks this lead can manage.
    #[serde(default = "default_max_concurrent")]
    pub max_concurrent_tasks: u32,
}

fn default_max_concurrent() -> u32 {
    3
}

/// Orchestrator configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct OrchestratorTeamConfig {
    /// Orchestrator name.
    pub name: String,
    /// Model override.
    pub model: Option<String>,
    /// Path to mental model file.
    pub mental_model: Option<String>,
    /// Max concurrent goals.
    pub max_concurrent_goals: u32,
}

impl Default for OrchestratorTeamConfig {
    fn default() -> Self {
        Self {
            name: "Orchestrator".to_string(),
            model: None,
            mental_model: None,
            max_concurrent_goals: 3,
        }
    }
}

/// Team-level settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct TeamSettings {
    /// Max task iterations.
    pub max_task_iterations: u32,
    /// Task timeout in milliseconds.
    pub task_timeout_ms: u64,
    /// Heartbeat interval in milliseconds.
    pub heartbeat_interval_ms: u64,
    /// Verbose logging.
    pub verbose: bool,
}

impl Default for TeamSettings {
    fn default() -> Self {
        Self {
            max_task_iterations: 5,
            task_timeout_ms: 300_000, // 5 minutes
            heartbeat_interval_ms: 10_000,
            verbose: false,
        }
    }
}

/// Complete team configuration (loaded from YAML/JSON).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct TeamConfig {
    /// Team name.
    pub name: String,
    /// Description.
    pub description: String,
    /// Orchestrator settings.
    pub orchestrator: OrchestratorTeamConfig,
    /// Team leads and their workers.
    pub team_leads: Vec<TeamLeadConfig>,
    /// File access scope.
    pub file_scope: FileScope,
    /// Paths to custom template files.
    pub templates: Vec<String>,
    /// Initial context values.
    pub context: HashMap<String, serde_json::Value>,
    /// Team settings.
    pub settings: TeamSettings,
}

impl Default for TeamConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            description: String::new(),
            orchestrator: OrchestratorTeamConfig::default(),
            team_leads: Vec::new(),
            file_scope: FileScope::default(),
            templates: Vec::new(),
            context: HashMap::new(),
            settings: TeamSettings::default(),
        }
    }
}

impl TeamConfig {
    /// Load a team config from a YAML or JSON file.
    pub fn load_from_file(path: &PathBuf) -> TeamResult<Self> {
        let content = std::fs::read_to_string(path)?;
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let config: TeamConfig = match ext.as_str() {
            "json" => serde_json::from_str(&content)?,
            "yaml" | "yml" => serde_yaml::from_str(&content)?,
            other => return Err(crate::error::TeamError::Config(format!(
                "Unsupported config format: {other}"
            ))),
        };

        Ok(config)
    }

    /// Validate the team config.
    pub fn validate(&self) -> TeamResult<()> {
        if self.name.is_empty() {
            return Err(crate::error::TeamError::Config(
                "Team name is required".into(),
            ));
        }
        if self.team_leads.is_empty() {
            return Err(crate::error::TeamError::Config(
                "At least one team lead is required".into(),
            ));
        }
        if self.team_leads.len() > 3 {
            return Err(crate::error::TeamError::Config(
                "Maximum 3 team leads allowed".into(),
            ));
        }
        for lead in &self.team_leads {
            if lead.name.is_empty() {
                return Err(crate::error::TeamError::Config(
                    "Team lead name is required".into(),
                ));
            }
            if lead.domain.is_empty() {
                return Err(crate::error::TeamError::Config(
                    "Team lead domain is required".into(),
                ));
            }
            if lead.workers.is_empty() {
                return Err(crate::error::TeamError::Config(format!(
                    "Team lead '{}' must have at least one worker",
                    lead.name
                )));
            }
            if lead.workers.len() > 6 {
                return Err(crate::error::TeamError::Config(format!(
                    "Team lead '{}' exceeds max 6 workers",
                    lead.name
                )));
            }
        }
        Ok(())
    }
}

// ============================================================================
// Health & Monitoring
// ============================================================================

/// Health snapshot for a single team agent.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct TeamAgentHealth {
    /// Agent ID.
    pub agent_id: AgentId,
    /// Current status.
    pub status: TeamAgentStatus,
    /// Tasks completed.
    pub tasks_completed: u64,
    /// Tasks failed.
    pub tasks_failed: u64,
    /// Tasks currently in progress.
    pub tasks_in_progress: u64,
    /// Tokens consumed.
    pub tokens_used: u64,
    /// Token limit (if set).
    pub tokens_limit: Option<u64>,
    /// Last heartbeat.
    pub last_heartbeat: DateTime<Utc>,
    /// Uptime in milliseconds.
    pub uptime_ms: u64,
    /// Error count.
    pub error_count: u64,
    /// Last error message.
    pub last_error: Option<String>,
}

/// Health snapshot for the entire team.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamHealth {
    /// Team name.
    pub team_name: String,
    /// When this snapshot was taken.
    pub timestamp: DateTime<Utc>,
    /// All agent healths.
    pub agents: Vec<TeamAgentHealth>,
    /// Total tasks.
    pub total_tasks: u64,
    /// Completed tasks.
    pub completed_tasks: u64,
    /// Failed tasks.
    pub failed_tasks: u64,
    /// Pending/in-progress tasks.
    pub pending_tasks: u64,
    /// Total tokens consumed.
    pub total_tokens: u64,
}

// ============================================================================
// Result Types
// ============================================================================

/// Result of a single task execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    /// Task ID.
    pub task_id: TaskId,
    /// Agent that executed it.
    pub agent_id: AgentId,
    /// Whether it succeeded.
    pub success: bool,
    /// The result text.
    pub result: String,
    /// Artifact paths produced.
    pub artifacts: Vec<String>,
    /// Iterations used.
    pub iterations_used: u32,
    /// Tokens consumed.
    pub tokens_used: u64,
    /// Duration in milliseconds.
    pub duration_ms: u64,
}

/// Result of an entire goal execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalResult {
    /// The original goal string.
    pub goal: String,
    /// Whether the goal was fully achieved.
    pub success: bool,
    /// Individual task results.
    pub results: Vec<TaskResult>,
    /// Synthesized summary.
    pub summary: String,
    /// Total tokens consumed.
    pub total_tokens: u64,
    /// Total duration in milliseconds.
    pub total_duration_ms: u64,
    /// All artifact paths.
    pub artifacts: Vec<String>,
}

// ============================================================================
// Executor Function Type
// ============================================================================

/// Function signature for the LLM executor hook.
/// The team framework calls this to execute prompts against an LLM.
pub type ExecutorFn = Box<
    dyn Fn(String, HashMap<String, serde_json::Value>) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = crate::error::TeamResult<String>> + Send>,
    > + Send
    + Sync,
>;

/// A clonable executor wrapper using Arc.
pub struct SharedExecutor {
    inner: std::sync::Arc<ExecutorFn>,
}

impl SharedExecutor {
    /// Create a new shared executor.
    pub fn new(f: ExecutorFn) -> Self {
        Self {
            inner: std::sync::Arc::new(f),
        }
    }

    /// Execute a prompt.
    pub async fn execute(
        &self,
        prompt: String,
        context: HashMap<String, serde_json::Value>,
    ) -> crate::error::TeamResult<String> {
        (self.inner)(prompt, context).await
    }
}

impl Clone for SharedExecutor {
    fn clone(&self) -> Self {
        Self {
            inner: std::sync::Arc::clone(&self.inner),
        }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_team_role_serde() {
        let role = TeamRole::TeamLead;
        let json = serde_json::to_string(&role).unwrap();
        assert_eq!(json, "\"team-lead\"");
        let back: TeamRole = serde_json::from_str(&json).unwrap();
        assert_eq!(back, TeamRole::TeamLead);
    }

    #[test]
    fn test_task_id_display() {
        let id = TaskId::new();
        let s = format!("{}", id);
        assert_eq!(s.len(), 36);
    }

    #[test]
    fn test_team_task_new() {
        let task = TeamTask::new("Build a feature");
        assert_eq!(task.status, TaskStatus::Pending);
        assert_eq!(task.goal, "Build a feature");
        assert_eq!(task.max_iterations, 5);
    }

    #[test]
    fn test_delegation_message() {
        let msg = DelegationMessage::new(MessageType::TaskAssign, AgentId::new(), AgentId::new())
            .with_direction(MessageDirection::Down);
        assert_eq!(msg.direction, MessageDirection::Down);
    }

    #[test]
    fn test_context_entry_expiration() {
        let entry = ContextEntry::new("key", serde_json::Value::Null, AgentId::new());
        assert!(!entry.is_expired());

        let mut expired = entry.clone();
        expired.ttl = Some(1);
        expired.timestamp = Utc::now() - chrono::Duration::milliseconds(10);
        assert!(expired.is_expired());
    }

    #[test]
    fn test_team_config_validation() {
        let config = TeamConfig::default();
        assert!(config.validate().is_err());

        let mut config = TeamConfig::default();
        config.name = "Test Team".to_string();
        assert!(config.validate().is_err()); // no leads

        config.team_leads.push(TeamLeadConfig {
            name: "Lead".to_string(),
            domain: "code".to_string(),
            workers: vec![WorkerConfig {
                name: "W1".to_string(),
                expertise: vec![],
                model: None,
                mental_model: None,
            }],
            ..Default::default()
        });
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_message_type_serde() {
        for mt in [
            MessageType::TaskAssign,
            MessageType::TaskResult,
            MessageType::Shutdown,
        ] {
            let json = serde_json::to_string(&mt).unwrap();
            let back: MessageType = serde_json::from_str(&json).unwrap();
            assert_eq!(mt, back);
        }
    }

    #[test]
    fn test_goal_result_serde() {
        let result = GoalResult {
            goal: "test".to_string(),
            success: true,
            results: vec![],
            summary: "done".to_string(),
            total_tokens: 100,
            total_duration_ms: 5000,
            artifacts: vec![],
        };
        let json = serde_json::to_string(&result).unwrap();
        let back: GoalResult = serde_json::from_str(&json).unwrap();
        assert!(back.success);
        assert_eq!(back.total_tokens, 100);
    }

    #[test]
    fn test_team_settings_defaults() {
        let settings = TeamSettings::default();
        assert_eq!(settings.max_task_iterations, 5);
        assert_eq!(settings.task_timeout_ms, 300_000);
        assert_eq!(settings.heartbeat_interval_ms, 10_000);
    }

    #[test]
    fn test_mental_model_default() {
        let model = MentalModel::default();
        assert!(model.learned_patterns.is_empty());
        assert!(model.knowledge.is_empty());
    }

    #[test]
    fn test_file_scope_default() {
        let scope = FileScope::default();
        assert!(scope.base_dir.as_os_str().is_empty());
        assert!(scope.allowed.is_empty());
    }

    #[test]
    fn test_shared_executor_clone() {
        let executor = SharedExecutor::new(Box::new(|prompt, _| {
            Box::pin(async move { Ok(format!("echo: {}", prompt)) })
        }));
        let _clone = executor.clone();
    }
}
