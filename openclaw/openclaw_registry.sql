-- OpenClaw Registry SQL Schema
-- Canonical database layout for the multi-agent ecosystem
-- Reference: openclaw/IMPLEMENTATION_PACK.md

-- Ensure we're using the right database
-- \c openclaw

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Agent kind enum
CREATE TYPE agent_kind AS ENUM (
    'worker',
    'scheduled_specialist',
    'evaluator',
    'repair',
    'operator',
    'genesis',
    'project_agent'
);

-- Lifecycle state enum
CREATE TYPE lifecycle_state AS ENUM (
    'draft',
    'validated',
    'active',
    'dormant',
    'degraded',
    'quarantined',
    'retired'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
    'low',
    'normal',
    'high',
    'critical'
);

-- Retention class enum
CREATE TYPE retention_class AS ENUM (
    'temporary',
    'standard',
    'permanent',
    'compliance'
);

-- Evaluation decision enum
CREATE TYPE evaluation_decision AS ENUM (
    'accept',
    'retry',
    'escalate',
    'reject',
    'quarantine'
);

-- Memory tier enum
CREATE TYPE memory_tier AS ENUM (
    'working_detail',
    'project_memory',
    'overview_memory',
    'core_memory'
);

-- Memory visibility enum
CREATE TYPE memory_visibility AS ENUM (
    'private',
    'inspectable',
    'shared',
    'canonical'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Agents table (Registry backend)
-- The authoritative source of truth for the agent ecosystem
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    kind agent_kind NOT NULL DEFAULT 'worker',
    project TEXT NOT NULL,
    owner TEXT NOT NULL,
    status lifecycle_state NOT NULL DEFAULT 'draft',
    record_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lifecycle events (Audit trail)
-- Immutable log of all agent state transitions
CREATE TABLE lifecycle_events (
    event_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    from_state lifecycle_state,
    to_state lifecycle_state NOT NULL,
    reason TEXT NOT NULL,
    actor TEXT NOT NULL,
    trace_id TEXT,
    event_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Artifacts (Durable outputs)
-- Versioned outputs produced by worker agents
CREATE TABLE artifacts (
    artifact_id TEXT PRIMARY KEY,
    artifact_type TEXT NOT NULL,
    owner_agent TEXT NOT NULL REFERENCES agents(id),
    project TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    source_task_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    path TEXT NOT NULL,
    retention_class retention_class NOT NULL DEFAULT 'standard',
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatch records (Routing rationale)
-- Debuggable routing log for every task dispatched
CREATE TABLE dispatch_records (
    dispatch_id BIGSERIAL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    selected_agent TEXT REFERENCES agents(id),
    decision_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Task queue (Pending tasks)
-- Tasks waiting to be processed
CREATE TABLE task_queue (
    task_id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    project TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority task_priority NOT NULL DEFAULT 'normal',
    payload_json JSONB NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
);

-- Evaluation results
-- Artifact evaluation history
CREATE TABLE evaluation_results (
    evaluation_id BIGSERIAL PRIMARY KEY,
    artifact_id TEXT NOT NULL REFERENCES artifacts(artifact_id),
    evaluator_agent TEXT NOT NULL REFERENCES agents(id),
    scores_json JSONB NOT NULL,
    decision evaluation_decision NOT NULL,
    reason TEXT NOT NULL,
    repair_recommendation_json JSONB,
    evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- Memory objects
-- Memory ladder storage
CREATE TABLE memory_objects (
    memory_id TEXT PRIMARY KEY,
    owner TEXT NOT NULL REFERENCES agents(id),
    tier memory_tier NOT NULL DEFAULT 'working_detail',
    visibility memory_visibility NOT NULL DEFAULT 'private',
    scope TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0.5,
    tags TEXT[] DEFAULT '{}',
    promoted_from memory_tier,
    has_conflict BOOLEAN NOT NULL DEFAULT false,
    body_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule definitions
-- Cron schedules for dormant specialists
CREATE TABLE schedules (
    schedule_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    cron_expression TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    overlap_policy TEXT NOT NULL DEFAULT 'skip',
    last_tick_at TIMESTAMPTZ,
    next_tick_at TIMESTAMPTZ,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Health metrics
-- Agent health tracking
CREATE TABLE agent_health (
    agent_id TEXT PRIMARY KEY REFERENCES agents(id),
    failure_streak INTEGER NOT NULL DEFAULT 0,
    success_streak INTEGER NOT NULL DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    total_successes BIGINT NOT NULL DEFAULT 0,
    total_failures BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms REAL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Agent lookups
CREATE INDEX idx_agents_project ON agents(project);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_kind ON agents(kind);
CREATE INDEX idx_agents_owner ON agents(owner);

-- Lifecycle event lookups
CREATE INDEX idx_lifecycle_agent ON lifecycle_events(agent_id);
CREATE INDEX idx_lifecycle_created ON lifecycle_events(created_at DESCENDING);

-- Artifact lookups
CREATE INDEX idx_artifacts_trace ON artifacts(trace_id);
CREATE INDEX idx_artifacts_owner ON artifacts(owner_agent);
CREATE INDEX idx_artifacts_project ON artifacts(project);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX idx_artifacts_created ON artifacts(created_at DESCENDING);

-- Dispatch lookups
CREATE INDEX idx_dispatch_trace ON dispatch_records(trace_id);
CREATE INDEX idx_dispatch_task ON dispatch_records(task_id);
CREATE INDEX idx_dispatch_agent ON dispatch_records(selected_agent);
CREATE INDEX idx_dispatch_created ON dispatch_records(created_at DESCENDING);

-- Task queue lookups
CREATE INDEX idx_task_queue_status ON task_queue(status);
CREATE INDEX idx_task_queue_priority ON task_queue(priority, requested_at);
CREATE INDEX idx_task_queue_project ON task_queue(project);

-- Evaluation lookups
CREATE INDEX idx_evaluation_artifact ON evaluation_results(artifact_id);
CREATE INDEX idx_evaluation_decision ON evaluation_results(decision);

-- Memory lookups
CREATE INDEX idx_memory_owner ON memory_objects(owner);
CREATE INDEX idx_memory_tier ON memory_objects(tier);
CREATE INDEX idx_memory_visibility ON memory_objects(visibility);
CREATE INDEX idx_memory_scope ON memory_objects(scope);

-- Schedule lookups
CREATE INDEX idx_schedules_agent ON schedules(agent_id);
CREATE INDEX idx_schedules_next_tick ON schedules(next_tick_at) WHERE enabled = true;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memory_updated_at
    BEFORE UPDATE ON memory_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER health_updated_at
    BEFORE UPDATE ON agent_health
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- Active agents view
CREATE VIEW active_agents AS
SELECT id, name, kind, project, owner, status, record_json, created_at, updated_at
FROM agents
WHERE status IN ('active', 'dormant');

-- Healthy agents view (for dispatcher routing)
CREATE VIEW healthy_agents AS
SELECT a.id, a.name, a.kind, a.project, a.status, h.failure_streak, h.success_streak
FROM agents a
LEFT JOIN agent_health h ON a.id = h.agent_id
WHERE a.status IN ('active', 'dormant')
  AND (h.failure_streak IS NULL OR h.failure_streak < 3);

-- Recent dispatches view
CREATE VIEW recent_dispatches AS
SELECT d.*, a.name as agent_name
FROM dispatch_records d
LEFT JOIN agents a ON d.selected_agent = a.id
ORDER BY d.created_at DESC
LIMIT 100;

-- Pending tasks view
CREATE VIEW pending_tasks AS
SELECT *
FROM task_queue
WHERE status = 'pending'
ORDER BY
    CASE priority
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
    END,
    requested_at;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert seed agents for bootstrap
INSERT INTO agents (id, name, version, kind, project, owner, status, record_json) VALUES
('agent.operator-core.v1', 'Operator Core', '1.0.0', 'operator', 'openclaw-core', 'system', 'active',
 '{"identity": {"archetype": "coordinator", "vibe": "calm"}, "capabilities": {"tools": ["agent_list", "agent_status", "trace_query"]}, "activation": {"mode": "always"}}'::jsonb),

('agent.github-monitor.v1', 'GitHub Monitor', '1.0.0', 'scheduled_specialist', 'openclaw-core', 'system', 'dormant',
 '{"identity": {"archetype": "sentinel", "vibe": "technical"}, "capabilities": {"tools": ["github_api", "file_write"], "network": ["api.github.com:443"]}, "activation": {"mode": "scheduled"}, "contracts": {"input_types": ["scheduled_tick"], "output_types": ["repo_change_summary"]}}'::jsonb),

('agent.artifact-quality-evaluator.v1', 'Artifact Quality Evaluator', '1.0.0', 'evaluator', 'openclaw-core', 'system', 'active',
 '{"identity": {"archetype": "inspector", "vibe": "strict"}, "capabilities": {"tools": ["artifact_read", "schema_validate"]}, "activation": {"mode": "event"}}'::jsonb);

-- Initialize health records
INSERT INTO agent_health (agent_id)
SELECT id FROM agents;

-- Initialize schedules
INSERT INTO schedules (schedule_id, agent_id, cron_expression, next_tick_at)
VALUES
('sched.github-monitor', 'agent.github-monitor.v1', '*/15 * * * *', now() + interval '15 minutes');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openclaw;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openclaw;
