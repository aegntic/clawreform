# OpenClaw Implementation Pack - ClawReform Restructuring Guide

> Extracted from the OpenClaw ecosystem notebook - Complete guide for restructuring ClawReform

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Rust (14 crates) | Core agent OS, kernel, runtime |
| **Frontend JS** | Bun | Fast JavaScript runtime, bundler |
| **Python Services** | Astral UV | Package management, service stubs |
| **Database** | PostgreSQL 16 | Registry, artifacts, lifecycle events |
| **Message Queue** | Redis 7 | Event bus, mailboxes, pub/sub |
| **Web Framework** | FastAPI (Python) / Axum (Rust) | Service APIs |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLAWREFORM ECOSYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   GENESIS    │    │   OPERATOR   │    │   REPAIR     │                   │
│  │   (Phase 7)  │    │    CORE      │    │   ROUTER     │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        EXECUTION PLANE                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ DISPATCHER │  │ SCHEDULER  │  │  WORKER    │  │ EVALUATOR  │     │   │
│  │  │ (Routing)  │  │ (Time/Wake)│  │ (Execute)  │  │ (Trust)    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                   │                   │                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         CONTROL PLANE                                 │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      REGISTRY                                  │  │   │
│  │  │  (Agent Census • Capabilities • Lifecycle • Health)            │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                   │                   │                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        KNOWLEDGE PLANE                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  ARTIFACT  │  │  MEMORY    │  │  EVENT     │  │  DISPATCH  │     │   │
│  │  │  STORE     │  │  LADDER    │  │  BUS       │  │  RECORDS   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      INFRASTRUCTURE                                   │   │
│  │  PostgreSQL 16  │  Redis 7  │  Docker Compose  │  Trace System       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Registry Service

**Purpose:** The authoritative source of truth - "census office" for the agent ecosystem.

### What It Stores

| Category | Data |
|----------|------|
| **Identity** | agent_id, name, version, kind, project, owner |
| **Operational Law** | capabilities, contracts, constraints |
| **State & Health** | status, health, failure_streaks, last_success |
| **Routing** | activation_mode, mailbox, topics, relationships |
| **Tracking** | lifecycle_events, artifacts, dispatch_records |

### API Endpoints

```python
# registry-api/app.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="OpenClaw Registry API")

@app.get("/health")
def health():
    return {"ok": True, "service": "registry_api"}

@app.post("/agents")
def register_agent(record: dict):
    agent_id = record.get("id")
    if not agent_id:
        raise HTTPException(status_code=400, detail="missing id")
    # Validate against REGISTRY_RECORD schema
    # Insert into agents table
    return {"ok": True, "id": agent_id}

@app.get("/agents")
def list_agents(project: str = None, kind: str = None, status: str = None):
    # Query agents with filters
    pass

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    # Return full registry record
    pass

@app.patch("/agents/{agent_id}/health")
def update_health(agent_id: str, health: dict):
    # Update health metrics, failure streaks
    pass

@app.patch("/agents/{agent_id}/lifecycle")
def update_lifecycle(agent_id: str, transition: dict):
    # Record lifecycle state change
    # Emit LIFECYCLE_EVENT
    pass
```

---

## 2. Dispatcher Service

**Purpose:** Deterministic routing engine - routes task packets to eligible agents.

### 6-Step Decision Order

1. **Contract Compatibility** - Can agent accept this task type/payload?
2. **Lifecycle Eligibility** - Is agent routable (active/dormant-wakeable)?
3. **Health Fit** - Is agent healthy enough for live work?
4. **Project Affinity** - Is it the correct project-scoped worker?
5. **Policy Fit** - Do permissions/budgets allow this run?
6. **Tie-Break** - Deterministic selection if multiple candidates match

### Service Stub

```python
# dispatcher/app.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="OpenClaw Dispatcher")

@app.get("/health")
def health():
    return {"ok": True, "service": "dispatcher"}

@app.post("/dispatch")
def dispatch(task: dict):
    task_type = task.get("type")
    if not task_type:
        raise HTTPException(status_code=400, detail="missing task type")

    # Query Registry for eligible candidates
    # Apply 6-step decision order
    # Log routing rationale to dispatch_records

    selected = "agent.github-monitor.v1" if task_type in {"scheduled_tick", "repo_event_batch"} else "agent.operator-core.v1"

    return {
        "trace_id": task.get("trace_id"),
        "task_id": task.get("task_id"),
        "selected_agent": selected,
        "rationale": ["contract_match", "lifecycle_active", "health_ok"]
    }
```

---

## 3. Scheduler Service

**Purpose:** Time and wake engine - emits cron ticks, enforces overlap protection.

### Key Concepts

- **Tick Emission**: Emits `scheduled_tick` messages at cron intervals
- **Overlap Protection**: `skip` policy prevents duplicate runs
- **Dormant Wake**: Wakes sleeping specialists without consuming resources

### Service Stub

```python
# scheduler/app.py
from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="OpenClaw Scheduler")

@app.get("/health")
def health():
    return {"ok": True, "service": "scheduler"}

@app.get("/tick/{schedule_id}")
def emit_tick(schedule_id: str):
    now = datetime.now(timezone.utc).isoformat()

    # Check overlap protection
    # If previous run still active and policy is "skip", return skip

    return {
        "message_id": f"msg_{schedule_id}_{now}",
        "trace_id": f"trace_{now}",
        "from": "scheduler",
        "to": schedule_id,
        "type": "scheduled_tick",
        "timestamp": now,
        "payload": {
            "task_id": f"task_{now}",
            "schedule_id": f"sched.{schedule_id}",
        },
        "retry_count": 0,
        "idempotency_key": f"{schedule_id}-{now}"
    }
```

---

## 4. Evaluator Service

**Purpose:** Trust gate - scores artifacts before downstream consumption.

### Evaluation Criteria

| Criterion | Description |
|-----------|-------------|
| **Completeness** | Does artifact fulfill entire task scope? |
| **Correctness** | Is information factually accurate? |
| **Structure** | Does it comply with required format/schema? |
| **Usefulness** | Is output high quality, not duplicated noise? |
| **Policy Compliance** | Does it respect operational law? |
| **Confidence Disclosure** | Does agent expose uncertainty honestly? |

### Decisions

| Decision | Action |
|----------|--------|
| **accept** | Add to durable memory |
| **retry** | Re-attempt task |
| **escalate** | Hand to human governance |
| **reject** | Output fundamentally fails contract |
| **quarantine** | Severe policy breach - strip routing eligibility |

### Service Stub

```python
# evaluator/app.py
from fastapi import FastAPI

app = FastAPI(title="OpenClaw Evaluator")

@app.get("/health")
def health():
    return {"ok": True, "service": "evaluator"}

@app.post("/evaluate")
def evaluate(artifact: dict):
    # Load artifact
    # Score on 6 criteria
    # Return structured decision

    return {
        "artifact_id": artifact.get("artifact_id"),
        "scores": {
            "completeness": 0.95,
            "correctness": 0.90,
            "structure": 1.0,
            "usefulness": 0.85,
            "policy_compliance": 1.0,
            "confidence_disclosure": 0.80
        },
        "decision": "accept",
        "reason": "All criteria above threshold",
        "repair_recommendation": None
    }
```

---

## 5. Repair Router Service

**Purpose:** Maintenance crew - intercepts failures, chooses safe recovery actions.

### Recovery Paths

| Path | When Used |
|------|-----------|
| **retry_unchanged** | Transient error (network timeout) |
| **retry_reduced_scope** | Task too complex |
| **fallback_agent** | Route to alternate worker |
| **request_missing_artifact** | Pause to retrieve dependency |
| **escalate_operator** | Human judgment required |
| **quarantine_agent** | Severe breach, strip routing eligibility |

### Quarantine Behavior

1. Agent is completely contained
2. Dispatcher refuses to route work
3. Locked until human operator reviews runbook
4. Manual approval required for recovery or retirement

---

## 6. Memory Ladder Architecture

### 4 Memory Tiers (Vertical Axis)

| Tier | Name | Contents | Properties |
|------|------|----------|------------|
| 1 | **Working Detail** | Recent outputs, scratchpad, experiments | Low compression, low trust, low friction |
| 2 | **Project Memory** | Purpose, status, decisions, files | Semi-compressed, medium trust |
| 3 | **Overview Memory** | Active domains, priorities, summaries | Medium durability, high compression |
| 4 | **Core Memory** | Identity truths, preferences, missions | Tiny, curated, high edit friction |

### 4 Visibility States (Horizontal Axis)

| State | Scope | Description |
|-------|-------|-------------|
| **Private** | Owning agent only | Raw local cognition, scratch thinking |
| **Inspectable** | Local + reviewers | Local heuristics, patterns |
| **Shared** | Sibling agents | Project findings, status updates |
| **Canonical** | Entire organism | Promoted truth, official record |

### Envelope vs Body Protocol

- **Envelope**: Metadata (owner, scope, confidence, tags) - always visible
- **Body**: Raw content - permission-gated

---

## 7. Agent Constitutional Bundle (13 Files)

### Machine-Readable Law Files

| File | Purpose |
|------|---------|
| `AGENT_CARD.yaml` | Identity, version, kind, project, owner, status |
| `CAPABILITIES.yaml` | Allowed tools, scopes, permissions, budgets |
| `CONTRACT.yaml` | Input types, output schemas, failure modes, SLAs |
| `ENVIRONMENT.yaml` | Runtime bindings, queues, storage paths |
| `STATE_SCHEMA.json` | Persistent state shape |

### Behavioral Prompt Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Existential purpose, core values |
| `IDENTITY.md` | Role, archetype, tone, visibility rights |
| `RULES.md` | Invariant prohibitions, scope boundaries |
| `USER.md` | Human operator relationship, preferences |
| `MISSION.md` | Current operational mission, success metrics |
| `HEARTBEAT.md` | Temporal behavior, wake conditions, retry handling |

### Validation Files

| File | Purpose |
|------|---------|
| `RUNBOOK.md` | Intervention guide for operators |
| `TESTS.md` | Validation cases, edge cases, policy tests |

---

## 8. Canonical Schemas

### TASK_PACKET

```json
{
  "schema_version": "1.0",
  "task_id": "task_xxx",
  "trace_id": "trace_xxx",
  "project": "openclaw-core",
  "type": "scheduled_tick",
  "priority": 1,
  "requested_at": "2026-03-12T10:00:00Z",
  "payload": {}
}
```

### ARTIFACT_RECORD

```json
{
  "schema_version": "1.0",
  "artifact_id": "art_xxx",
  "artifact_type": "repo_change_summary",
  "owner_agent": "agent.github-monitor.v1",
  "project": "openclaw-core",
  "trace_id": "trace_xxx",
  "source_task_id": "task_xxx",
  "version": 1,
  "created_at": "2026-03-12T10:00:00Z",
  "path": "artifacts/github-monitor/summary.md",
  "retention_class": "standard"
}
```

### REGISTRY_RECORD

```json
{
  "schema_version": "1.0",
  "id": "agent.github-monitor.v1",
  "name": "GitHub Monitor",
  "version": "1.0.0",
  "kind": "scheduled_specialist",
  "project": "openclaw-core",
  "owner": "system",
  "status": "dormant",
  "identity": {},
  "capabilities": {},
  "constraints": {},
  "activation": {"mode": "scheduled"},
  "contracts": {},
  "dependencies": [],
  "health": {"failure_streak": 0, "last_success": null},
  "lifecycle": {"state": "validated"},
  "addressing": {"mailbox": "github-monitor", "topics": ["github"]}
}
```

### LIFECYCLE_EVENT

```json
{
  "schema_version": "1.0",
  "event_id": "evt_xxx",
  "agent_id": "agent.github-monitor.v1",
  "from_state": "validated",
  "to_state": "active",
  "reason": "Passed bootstrap validation",
  "timestamp": "2026-03-12T10:00:00Z",
  "actor": "system"
}
```

---

## 9. SQL Schema

```sql
-- openclaw_registry.sql

-- Agents table (Registry backend)
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    kind TEXT NOT NULL,  -- worker, scheduled_specialist, evaluator, etc.
    project TEXT NOT NULL,
    owner TEXT NOT NULL,
    status TEXT NOT NULL,  -- active, dormant, degraded, quarantined
    record_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lifecycle events (Audit trail)
CREATE TABLE lifecycle_events (
    event_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    from_state TEXT,
    to_state TEXT NOT NULL,
    reason TEXT NOT NULL,
    actor TEXT NOT NULL,
    trace_id TEXT,
    event_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Artifacts (Durable outputs)
CREATE TABLE artifacts (
    artifact_id TEXT PRIMARY KEY,
    artifact_type TEXT NOT NULL,
    owner_agent TEXT NOT NULL,
    project TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    source_task_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    path TEXT NOT NULL,
    metadata_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatch records (Routing rationale)
CREATE TABLE dispatch_records (
    dispatch_id BIGSERIAL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    selected_agent TEXT,
    decision_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_agents_project ON agents(project);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_lifecycle_agent ON lifecycle_events(agent_id);
CREATE INDEX idx_artifacts_trace ON artifacts(trace_id);
CREATE INDEX idx_dispatch_trace ON dispatch_records(trace_id);
```

---

## 10. Docker Compose Layout

```yaml
# docker-compose.openclaw.yml
version: "3.9"

services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: openclaw
      POSTGRES_USER: openclaw
      POSTGRES_PASSWORD: openclaw_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./openclaw_registry.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  registry-api:
    build:
      context: ./apps/registry-api
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://openclaw:openclaw_secret@postgres:5432/openclaw

  dispatcher:
    build:
      context: ./apps/dispatcher
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    depends_on:
      - registry-api
      - redis
    environment:
      REGISTRY_URL: http://registry-api:8001
      REDIS_URL: redis://redis:6379

  scheduler:
    build:
      context: ./apps/scheduler
      dockerfile: Dockerfile
    ports:
      - "8003:8003"
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379

  evaluator:
    build:
      context: ./apps/evaluator
      dockerfile: Dockerfile
    ports:
      - "8004:8004"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://openclaw:openclaw_secret@postgres:5432/openclaw
      REDIS_URL: redis://redis:6379

  repair:
    build:
      context: ./apps/repair
      dockerfile: Dockerfile
    ports:
      - "8005:8005"
    depends_on:
      - registry-api
      - redis
    environment:
      REGISTRY_URL: http://registry-api:8001
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
  redis_data:
```

---

## 11. Bootstrap Sequence (9 Steps)

1. **Repo & Schema Baseline** - Directory structure, JSON schemas, validator
2. **Three Sample Agents** - operator-core, github-monitor, evaluator
3. **Registry** - Implement census office, registration, queries
4. **Dispatcher** - Build routing engine with 6-step decision
5. **Scheduler** - Time/wake engine with overlap protection
6. **Artifact Store** - Local file writing with metadata
7. **Evaluator** - Trust gate with scoring pipeline
8. **Trace Observability** - Single trace_id through entire chain
9. **Failure State Handling** - Degraded/quarantined states

### Seed Agents

| Agent | Kind | Purpose |
|-------|------|---------|
| **operator-core** | Worker | Human-facing coordinator, status, routing |
| **github-monitor** | Scheduled Specialist | Dormant until tick, produces repo summaries |
| **artifact-quality-evaluator** | Evaluator | Scores artifacts for trust |

---

## 12. Front-End Design System

### Visual Identity: "Chrome and Amber Neumorphic" / "Liquid Metal Skeuomorphic"

**Materials:**
- Deep matte charcoal background with subtle noise texture
- Brushed silver, polished chrome, forged steel metallic elements

**Lighting:**
- **Global Directional**: Top-left light source, white highlights, dark shadows
- **Localized Emissive**: Amber/gold/orange LED backlighting for active states

**Components:**
- 3D pill-shaped buttons
- Debossed input fields with inner shadows
- Kinetic progress bars with liquid glow
- Floating cards with generous padding
- Amber notification system (warning=amber glow, success=silver, error=dead matte)

**Navigation:**
- Top horizontal navigation bar
- Left vertical sidebar with skeuomorphic icons

---

## 13. Delivery Roadmap (8 Phases)

| Phase | Deliverable |
|-------|-------------|
| 0 | Foundations - repo structure, schemas, test harness |
| 1 | Agent Constitution Layer - 13-file bundle, validator |
| 2 | Registry - census office, registration, lifecycle |
| 3 | Dispatcher & Scheduler - routing, time engine |
| 4 | Mailbox / Event Bus - inbox/outbox, pub/sub, dead-letter |
| 5 | Artifact Store & Memory Fabric - durable outputs |
| 6 | Evaluator & Repair - immune system |
| 7 | Genesis - agent creation factory |
| 8 | Shadow Mode & Evolution - safe improvement |

---

## 14. Prompt Matrix

### Layer 1: Root Prompts
- Master System Prompt (constitutional posture)
- First User Kickoff Prompt (reality audit, gap map)
- Bootstrap Alignment Prompt (snap back from drift)
- Expert Mode Instruction (scaled orchestration)

### Layer 2: Core Runtime Prompts
- Operator-Core Prompt (thin coordination)
- Project-Agent Prompt (project isolation)
- Generic Worker Prompt (bounded execution)
- Evaluator Prompt (trust gate)
- Repair Prompt (failure classification)

### Layer 3: Business Role Prompts
- Business-Executor, Growth Engine, Content Engine
- Research Engine, Customer Ops, Finance Ops, Analytics

### Layer 4: Factory Prompts
- Genesis Prompt (agent creation)
- Shadow/Evolution Prompt (comparison/promotion)
- Policy Hardening Insert (approval gates)

---

## Next Steps for ClawReform

1. **Create Rust types** for canonical schemas in `clawreform-types`
2. **Implement Registry** as Rust service with Axum
3. **Wire Dispatcher** into existing kernel
4. **Add Scheduler** for cron-based agent waking
5. **Implement Evaluator** for artifact scoring
6. **Build Repair Router** for failure recovery
7. **Apply Memory Ladder** to existing memory crate
8. **Update front-end** to Chrome/Amber design system using Bun
9. **Create Python service stubs** using UV package manager
