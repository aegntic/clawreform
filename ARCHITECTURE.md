# anyre.quest Fusion Architecture

## Goal

Build a control plane that can orchestrate **ZeroClaw execution swarms** with **Automaton autonomy primitives** (heartbeat, adaptation, replication), while keeping strict safety and operational control.

## System Layers

1. Interface Layer (this repo)
- User dashboard for swarm creation, deployment, heartbeat monitoring, and credential-profile binding.
- Runtime controls: deploy, pause, revive, broadcast ideas.

2. Orchestration Layer
- Swarm planner:
  - Task decomposition
  - Role assignment
  - Provider/model routing
- Adaptation engine:
  - Detect obstacle class (timeout, auth, rate-limit, tool failure)
  - Retry policy
  - Fallback provider/model switch

3. Execution Layer (ZeroClaw)
- Core tool execution and model-provider abstraction.
- Multi-provider compatibility.
- Tool and channel integrations.

4. Autonomy Layer (Automaton patterns)
- Heartbeat daemon behavior.
- Survival/fallback modes.
- Replication playbooks and lineage tracking.
- Audit-first self-modification approach (gated).

## Core Data Contracts

- `Swarm`
  - identity, objective, target, status, adaptation policy, enabled modules.
- `AgentNode`
  - role, provider/model, heartbeat timestamps, obstacle counts, credential-profile reference.
- `CredentialProfile`
  - platform + username + secret reference key only.
- `ActivityEvent`
  - timestamped operational log with severity and context.

## Safety and Hardening Rules

- Never store raw credentials in dashboard state.
- All high-risk actions require policy gates (production mode).
- Keep immutable audit logs for adaptation and self-modification events.
- Enforce allowlisted tools per role.
- Require signed artifacts for deploy pipelines.

## Phased Build Plan

Phase 1 (done in this prototype)
- Local dashboard
- Live heartbeat simulation
- Provider catalog from ZeroClaw
- Module catalog from Automaton
- Swarm lifecycle controls

Phase 2
- Real execution bridge into ZeroClaw CLI/runtime.
- Replace simulation heartbeat with real event ingestion.
- Add multi-tenant auth and role-based access.

Phase 3
- Add Automaton replication/lineage services as optional modules.
- Add policy engine for safety gates + environment boundaries.
- Add robust persistence (Postgres + queue + event store).

Phase 4
- Distributed control plane (multi-region workers).
- Adaptive routing based on cost/latency/quality telemetry.
- Human-in-the-loop escalation and compliance reporting.
