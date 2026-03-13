//! OpenClaw Ecosystem Types - Canonical schemas for multi-agent orchestration.
//!
//! This module implements the canonical schemas from the OpenClaw Implementation Pack:
//! - TASK_PACKET: Unit of work routed by Dispatcher
//! - ARTIFACT_RECORD: Durable outputs produced by agents
//! - REGISTRY_RECORD: Agent registration and capabilities
//! - LIFECYCLE_EVENT: State transition audit trail
//! - DISPATCH_RECORD: Routing rationale log
//!
//! Reference: openclaw/IMPLEMENTATION_PACK.md

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

// ============================================================================
// Schema Version
// ============================================================================

/// Current schema version for all OpenClaw types.
pub const SCHEMA_VERSION: &str = "1.0";

// ============================================================================
// Agent Kind & Lifecycle
// ============================================================================

/// Agent kind/type in the ecosystem.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentKind {
    /// Standard worker agent.
    #[default]
    Worker,
    /// Dormant until scheduled tick wakes it.
    ScheduledSpecialist,
    /// Evaluates artifacts for trust.
    Evaluator,
    /// Classifies failures and routes recovery.
    Repair,
    /// Human-facing coordinator.
    Operator,
    /// Creates new agents.
    Genesis,
    /// Project-scoped coordinator.
    ProjectAgent,
}

/// Lifecycle state of an agent.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LifecycleState {
    /// Agent defined but not yet validated.
    #[default]
    Draft,
    /// Agent validated but not yet routable.
    Validated,
    /// Agent is active and routable.
    Active,
    /// Agent is dormant (scheduled specialists).
    Dormant,
    /// Agent health is degraded.
    Degraded,
    /// Agent is quarantined (not routable).
    Quarantined,
    /// Agent is permanently retired.
    Retired,
}

/// Agent health metrics.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentHealth {
    /// Consecutive failure count.
    pub failure_streak: u32,
    /// Timestamp of last successful execution.
    pub last_success: Option<DateTime<Utc>>,
    /// Timestamp of last failure.
    pub last_failure: Option<DateTime<Utc>>,
    /// Total successful executions.
    pub success_count: u64,
    /// Total failed executions.
    pub failure_count: u64,
}

// ============================================================================
// Task Packet
// ============================================================================

/// Unique identifier for a task.
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
        write!(f, "task_{}", self.0)
    }
}

/// Unique identifier for tracing a request through the ecosystem.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TraceId(pub Uuid);

impl TraceId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for TraceId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for TraceId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "trace_{}", self.0)
    }
}

/// Task priority levels.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority {
    Low = 0,
    #[default]
    Normal = 1,
    High = 2,
    Critical = 3,
}

/// Canonical unit of work routed by the Dispatcher.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TaskPacket {
    /// Schema version.
    pub schema_version: String,
    /// Unique task identifier.
    pub task_id: TaskId,
    /// Trace ID for observability.
    pub trace_id: TraceId,
    /// Project scope.
    pub project: String,
    /// Task type (e.g., "scheduled_tick", "repo_event_batch").
    #[serde(rename = "type")]
    pub task_type: String,
    /// Task priority.
    pub priority: TaskPriority,
    /// When the task was requested.
    pub requested_at: DateTime<Utc>,
    /// Task-specific payload.
    pub payload: serde_json::Value,
}

impl Default for TaskPacket {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            task_id: TaskId::new(),
            trace_id: TraceId::new(),
            project: String::new(),
            task_type: String::new(),
            priority: TaskPriority::default(),
            requested_at: Utc::now(),
            payload: serde_json::Value::Null,
        }
    }
}

// ============================================================================
// Artifact Record
// ============================================================================

/// Unique identifier for an artifact.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ArtifactId(pub Uuid);

impl ArtifactId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for ArtifactId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for ArtifactId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "art_{}", self.0)
    }
}

/// Artifact retention class.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RetentionClass {
    /// Short-lived, can be cleaned up quickly.
    Temporary,
    /// Standard retention.
    #[default]
    Standard,
    /// Long-lived, important artifacts.
    Permanent,
    /// Regulatory/compliance required retention.
    Compliance,
}

/// Durable output produced by an agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ArtifactRecord {
    /// Schema version.
    pub schema_version: String,
    /// Unique artifact identifier.
    pub artifact_id: ArtifactId,
    /// Type of artifact (e.g., "repo_change_summary").
    pub artifact_type: String,
    /// Agent that produced this artifact.
    pub owner_agent: String,
    /// Project scope.
    pub project: String,
    /// Trace ID for lineage.
    pub trace_id: TraceId,
    /// Source task that produced this.
    pub source_task_id: TaskId,
    /// Version number.
    pub version: u32,
    /// When the artifact was created.
    pub created_at: DateTime<Utc>,
    /// Storage path.
    pub path: String,
    /// Retention class.
    pub retention_class: RetentionClass,
    /// Optional metadata.
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Default for ArtifactRecord {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            artifact_id: ArtifactId::new(),
            artifact_type: String::new(),
            owner_agent: String::new(),
            project: String::new(),
            trace_id: TraceId::new(),
            source_task_id: TaskId::new(),
            version: 1,
            created_at: Utc::now(),
            path: String::new(),
            retention_class: RetentionClass::default(),
            metadata: HashMap::new(),
        }
    }
}

// ============================================================================
// Registry Record
// ============================================================================

/// Agent activation mode.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivationMode {
    /// Always running.
    #[default]
    Always,
    /// Woken by scheduled ticks.
    Scheduled,
    /// Woken by events.
    Event,
    /// Manual activation only.
    Manual,
}

/// Agent communication addressing.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentAddressing {
    /// Mailbox name for direct messaging.
    pub mailbox: String,
    /// Topics the agent subscribes to.
    pub topics: Vec<String>,
}

/// Agent contract definition.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentContract {
    /// Input types accepted.
    pub input_types: Vec<String>,
    /// Output types produced.
    pub output_types: Vec<String>,
    /// Failure modes.
    pub failure_modes: Vec<String>,
    /// SLA in seconds.
    pub sla_seconds: Option<u64>,
}

/// Agent capabilities definition.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentCapabilities {
    /// Allowed tools.
    pub tools: Vec<String>,
    /// Allowed network scopes.
    pub network: Vec<String>,
    /// Allowed file scopes.
    pub file_scopes: Vec<String>,
    /// Token budget.
    pub token_budget: Option<u64>,
    /// Prohibited actions.
    pub prohibited: Vec<String>,
}

/// Agent constraints.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentConstraints {
    /// Maximum runtime in seconds.
    pub max_runtime_seconds: Option<u64>,
    /// Maximum concurrent tasks.
    pub max_concurrency: Option<u32>,
    /// Rate limit per minute.
    pub rate_limit_per_minute: Option<u32>,
}

/// Agent dependencies.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct AgentDependencies {
    /// Required agents.
    pub requires: Vec<String>,
    /// Creates (outputs).
    pub creates: Vec<String>,
    /// Shadows (fallback for).
    pub shadows: Vec<String>,
}

/// Complete registry record for an agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RegistryRecord {
    /// Schema version.
    pub schema_version: String,
    /// Unique agent identifier (e.g., "agent.github-monitor.v1").
    pub id: String,
    /// Human-readable name.
    pub name: String,
    /// Semantic version.
    pub version: String,
    /// Agent kind.
    pub kind: AgentKind,
    /// Project scope.
    pub project: String,
    /// Owner identifier.
    pub owner: String,
    /// Current status.
    pub status: LifecycleState,
    /// Identity metadata.
    #[serde(default)]
    pub identity: HashMap<String, serde_json::Value>,
    /// Capabilities.
    #[serde(default)]
    pub capabilities: AgentCapabilities,
    /// Constraints.
    #[serde(default)]
    pub constraints: AgentConstraints,
    /// Activation mode.
    #[serde(default)]
    pub activation: ActivationMode,
    /// Contract definition.
    #[serde(default)]
    pub contracts: AgentContract,
    /// Dependencies.
    #[serde(default)]
    pub dependencies: AgentDependencies,
    /// Health metrics.
    #[serde(default)]
    pub health: AgentHealth,
    /// Lifecycle state.
    #[serde(default)]
    pub lifecycle: LifecycleState,
    /// Communication addressing.
    #[serde(default)]
    pub addressing: AgentAddressing,
}

impl Default for RegistryRecord {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            id: String::new(),
            name: String::new(),
            version: "0.1.0".to_string(),
            kind: AgentKind::default(),
            project: String::new(),
            owner: String::new(),
            status: LifecycleState::default(),
            identity: HashMap::new(),
            capabilities: AgentCapabilities::default(),
            constraints: AgentConstraints::default(),
            activation: ActivationMode::default(),
            contracts: AgentContract::default(),
            dependencies: AgentDependencies::default(),
            health: AgentHealth::default(),
            lifecycle: LifecycleState::default(),
            addressing: AgentAddressing::default(),
        }
    }
}

// ============================================================================
// Lifecycle Event
// ============================================================================

/// Unique identifier for a lifecycle event.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EventId(pub Uuid);

impl EventId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for EventId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for EventId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "evt_{}", self.0)
    }
}

/// Lifecycle state transition event.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct LifecycleEvent {
    /// Schema version.
    pub schema_version: String,
    /// Unique event identifier.
    pub event_id: EventId,
    /// Agent this event is about.
    pub agent_id: String,
    /// Previous state.
    pub from_state: Option<LifecycleState>,
    /// New state.
    pub to_state: LifecycleState,
    /// Reason for transition.
    pub reason: String,
    /// Timestamp.
    pub timestamp: DateTime<Utc>,
    /// Actor that triggered the transition.
    pub actor: String,
    /// Optional trace ID for context.
    #[serde(default)]
    pub trace_id: Option<TraceId>,
    /// Additional event data.
    #[serde(default)]
    pub event_data: HashMap<String, serde_json::Value>,
}

impl Default for LifecycleEvent {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            event_id: EventId::new(),
            agent_id: String::new(),
            from_state: None,
            to_state: LifecycleState::default(),
            reason: String::new(),
            timestamp: Utc::now(),
            actor: String::new(),
            trace_id: None,
            event_data: HashMap::new(),
        }
    }
}

// ============================================================================
// Dispatch Record
// ============================================================================

/// Routing decision rationale.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct DispatchDecision {
    /// Contract compatibility check passed.
    pub contract_match: bool,
    /// Lifecycle eligibility check passed.
    pub lifecycle_eligible: bool,
    /// Health check passed.
    pub health_ok: bool,
    /// Project affinity match.
    pub project_match: bool,
    /// Policy fit check passed.
    pub policy_ok: bool,
    /// Tie-break reason (if applicable).
    pub tie_break_reason: Option<String>,
    /// Additional rationale.
    pub rationale: Vec<String>,
}

/// Dispatch record for routing audit trail.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DispatchRecord {
    /// Unique dispatch identifier.
    pub dispatch_id: i64,
    /// Trace ID.
    pub trace_id: TraceId,
    /// Task ID.
    pub task_id: TaskId,
    /// Selected agent.
    pub selected_agent: String,
    /// Decision rationale.
    pub decision: DispatchDecision,
    /// When the dispatch occurred.
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Evaluation
// ============================================================================

/// Evaluation scores for an artifact.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct EvaluationScores {
    /// Does artifact fulfill entire task scope?
    pub completeness: f32,
    /// Is information factually accurate?
    pub correctness: f32,
    /// Does it comply with required format/schema?
    pub structure: f32,
    /// Is output high quality, not duplicated noise?
    pub usefulness: f32,
    /// Does it respect operational law?
    pub policy_compliance: f32,
    /// Does agent expose uncertainty honestly?
    pub confidence_disclosure: f32,
}

/// Evaluation decision.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EvaluationDecision {
    /// Artifact meets all standards.
    Accept,
    /// Artifact is malformed, retry.
    Retry,
    /// Requires human intervention.
    Escalate,
    /// Fundamentally fails contract.
    Reject,
    /// Severe policy breach, quarantine agent.
    Quarantine,
}

/// Evaluation result.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct EvaluationResult {
    /// Artifact being evaluated.
    pub artifact_id: ArtifactId,
    /// Score breakdown.
    pub scores: EvaluationScores,
    /// Final decision.
    pub decision: EvaluationDecision,
    /// Reason for decision.
    pub reason: String,
    /// Repair recommendation (if applicable).
    pub repair_recommendation: Option<RepairAction>,
}

// ============================================================================
// Repair Actions
// ============================================================================

/// Repair action types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RepairActionType {
    /// Re-attempt unchanged.
    RetryUnchanged,
    /// Break down into smaller payload.
    RetryReducedScope,
    /// Route to alternate worker.
    FallbackAgent,
    /// Pause to retrieve dependency.
    RequestMissingArtifact,
    /// Hand to human governance.
    EscalateOperator,
    /// Strip routing eligibility.
    QuarantineAgent,
}

/// Repair action recommendation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RepairAction {
    /// Action type.
    pub action: RepairActionType,
    /// Target agent (for fallback).
    pub target_agent: Option<String>,
    /// Reason for this action.
    pub reason: String,
    /// Maximum retries (if applicable).
    pub max_retries: Option<u32>,
}

// ============================================================================
// Memory Ladder
// ============================================================================

/// Memory tier levels.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryTier {
    /// Hot, noisy layer - recent outputs, scratchpad.
    #[default]
    WorkingDetail,
    /// Focused context - project purpose, decisions.
    ProjectMemory,
    /// Big-picture map - active domains, priorities.
    OverviewMemory,
    /// Deep truth - identity, preferences, missions.
    CoreMemory,
}

/// Memory visibility states.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryVisibility {
    /// Owning agent only.
    #[default]
    Private,
    /// Local + reviewers.
    Inspectable,
    /// Sibling agents.
    Shared,
    /// Entire organism.
    Canonical,
}

/// Memory envelope (metadata).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct MemoryEnvelope {
    /// Unique memory ID.
    pub memory_id: String,
    /// Owner agent.
    pub owner: String,
    /// Memory tier.
    pub tier: MemoryTier,
    /// Visibility state.
    pub visibility: MemoryVisibility,
    /// Scope (project, domain, etc.).
    pub scope: String,
    /// Confidence level (0.0-1.0).
    pub confidence: f32,
    /// Tags for discovery.
    pub tags: Vec<String>,
    /// Promotion status.
    pub promoted_from: Option<MemoryTier>,
    /// Conflict flags.
    pub has_conflict: bool,
    /// When created.
    pub created_at: DateTime<Utc>,
    /// When last updated.
    pub updated_at: DateTime<Utc>,
}

/// Complete memory object with envelope and body.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct MemoryObject {
    /// Envelope metadata.
    pub envelope: MemoryEnvelope,
    /// Content body (permission-gated).
    pub body: serde_json::Value,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_packet_default() {
        let packet = TaskPacket::default();
        assert_eq!(packet.schema_version, SCHEMA_VERSION);
        assert!(!packet.task_id.0.is_nil());
        assert!(!packet.trace_id.0.is_nil());
    }

    #[test]
    fn test_task_packet_serialization() {
        let packet = TaskPacket {
            project: "openclaw-core".to_string(),
            task_type: "scheduled_tick".to_string(),
            priority: TaskPriority::High,
            payload: serde_json::json!({"repos": ["aegntic/openclaw"]}),
            ..Default::default()
        };
        let json = serde_json::to_string(&packet).unwrap();
        let back: TaskPacket = serde_json::from_str(&json).unwrap();
        assert_eq!(back.project, "openclaw-core");
        assert_eq!(back.task_type, "scheduled_tick");
        assert_eq!(back.priority, TaskPriority::High);
    }

    #[test]
    fn test_artifact_record_default() {
        let artifact = ArtifactRecord::default();
        assert_eq!(artifact.schema_version, SCHEMA_VERSION);
        assert_eq!(artifact.version, 1);
    }

    #[test]
    fn test_registry_record_default() {
        let record = RegistryRecord::default();
        assert_eq!(record.schema_version, SCHEMA_VERSION);
        assert_eq!(record.kind, AgentKind::Worker);
        assert_eq!(record.status, LifecycleState::Draft);
    }

    #[test]
    fn test_lifecycle_event_default() {
        let event = LifecycleEvent::default();
        assert_eq!(event.schema_version, SCHEMA_VERSION);
        assert!(!event.event_id.0.is_nil());
    }

    #[test]
    fn test_agent_kind_serde() {
        let kinds = vec![
            AgentKind::Worker,
            AgentKind::ScheduledSpecialist,
            AgentKind::Evaluator,
            AgentKind::Repair,
            AgentKind::Operator,
            AgentKind::Genesis,
        ];
        for kind in kinds {
            let json = serde_json::to_string(&kind).unwrap();
            let back: AgentKind = serde_json::from_str(&json).unwrap();
            assert_eq!(kind, back);
        }
    }

    #[test]
    fn test_lifecycle_state_serde() {
        let states = vec![
            LifecycleState::Draft,
            LifecycleState::Validated,
            LifecycleState::Active,
            LifecycleState::Dormant,
            LifecycleState::Degraded,
            LifecycleState::Quarantined,
            LifecycleState::Retired,
        ];
        for state in states {
            let json = serde_json::to_string(&state).unwrap();
            let back: LifecycleState = serde_json::from_str(&json).unwrap();
            assert_eq!(state, back);
        }
    }

    #[test]
    fn test_evaluation_scores_default() {
        let scores = EvaluationScores::default();
        assert_eq!(scores.completeness, 0.0);
        assert_eq!(scores.correctness, 0.0);
    }

    #[test]
    fn test_evaluation_decision_serde() {
        let decisions = vec![
            EvaluationDecision::Accept,
            EvaluationDecision::Retry,
            EvaluationDecision::Escalate,
            EvaluationDecision::Reject,
            EvaluationDecision::Quarantine,
        ];
        for decision in decisions {
            let json = serde_json::to_string(&decision).unwrap();
            let back: EvaluationDecision = serde_json::from_str(&json).unwrap();
            assert_eq!(decision, back);
        }
    }

    #[test]
    fn test_memory_tier_serde() {
        let tiers = vec![
            MemoryTier::WorkingDetail,
            MemoryTier::ProjectMemory,
            MemoryTier::OverviewMemory,
            MemoryTier::CoreMemory,
        ];
        for tier in tiers {
            let json = serde_json::to_string(&tier).unwrap();
            let back: MemoryTier = serde_json::from_str(&json).unwrap();
            assert_eq!(tier, back);
        }
    }

    #[test]
    fn test_memory_visibility_serde() {
        let visibilities = vec![
            MemoryVisibility::Private,
            MemoryVisibility::Inspectable,
            MemoryVisibility::Shared,
            MemoryVisibility::Canonical,
        ];
        for vis in visibilities {
            let json = serde_json::to_string(&vis).unwrap();
            let back: MemoryVisibility = serde_json::from_str(&json).unwrap();
            assert_eq!(vis, back);
        }
    }

    #[test]
    fn test_dispatch_decision_default() {
        let decision = DispatchDecision::default();
        assert!(!decision.contract_match);
        assert!(!decision.lifecycle_eligible);
        assert!(decision.rationale.is_empty());
    }

    #[test]
    fn test_repair_action_serde() {
        let action = RepairAction {
            action: RepairActionType::FallbackAgent,
            target_agent: Some("agent.backup.v1".to_string()),
            reason: "Primary agent failed".to_string(),
            max_retries: Some(3),
        };
        let json = serde_json::to_string(&action).unwrap();
        let back: RepairAction = serde_json::from_str(&json).unwrap();
        assert_eq!(back.action, RepairActionType::FallbackAgent);
        assert_eq!(back.target_agent, Some("agent.backup.v1".to_string()));
    }
}
