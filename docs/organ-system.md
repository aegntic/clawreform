# clawREFORM by aegntic.ai Organ System

clawREFORM by aegntic.ai treats agent context as a small set of first-class organ files rather than one undifferentiated prompt blob. These files live in an agent workspace, remain editable by humans, and are injected into the runtime in a deterministic order.

## Core Organs

| File | Role |
|------|------|
| `IDENTITY.md` | Constitutional layer: mission, values, non-negotiables, provenance |
| `SOUL.md` | Temperament layer: tone, character, aesthetic, style of being |
| `HANDS.md` | Embodied action doctrine: how the agent is allowed to act |
| `MEMORY.md` | Memory law: what is remembered, promoted, summarized, or forgotten |
| `HEARTBEAT.md` | Maintenance cadence for autonomous agents |

## Supporting Organs

| File | Role |
|------|------|
| `TOOLS.md` | Local tool notes, interfaces, constraints, and high-risk surfaces |
| `SKILLS.md` | Procedural doctrine for reusable methods and learned workflows |
| `AGENTS.md` | Roster and operating doctrine for sub-agents and local coordination |
| `USER.md` | Durable model of the human counterpart |
| `BOOTSTRAP.md` | First-run ritual and onboarding behavior |

## Memory Views

These root workspace files now make the memory ladder inspectable and editable:

| File | Role |
|------|------|
| `CORE.md` | Durable truths with high edit friction |
| `OVERVIEW.md` | Big-picture map of current movement and priorities |
| `PROJECT.md` | Auto-curated project ledger plus human durable notes |

## `HANDS.md` vs Hands Packages

`HANDS.md` is the local action doctrine for one workspace. It tells an agent how to move, escalate, and publish safely inside that workspace.

The existing `clawreform-hands` crate is a different layer:

- `HANDS.md` = local embodied policy
- Hands packages = curated autonomous capability bundles and marketplace activations

They should align conceptually, but they are not duplicates.

## Memory Ladder

clawREFORM by aegntic.ai uses a layered memory model instead of a single long-term note:

- `Core`: durable truths that should survive across projects and seasons
- `Overview`: the current strategic map across active work
- `Projects`: canonical dossiers for individual initiatives
- `Working Detail`: hot local context that should be compacted aggressively

Derived artifacts under `memory/` make that ladder operational:

- `memory/working/YYYY-MM-DD.md` for short-term detail
- `memory/dispatches/*.md` for published dispatch notes
- `memory/summaries/*.md` for accepted session summaries

Promotion rule:

- working detail becomes project truth only when it is repeated, relevant, and validated
- project truth becomes overview truth only when it changes direction across domains
- core memory stays small and high-friction

## Dispatch and Ledger Model

Sub-agents do not write canonical truth directly.

- private thought stays local
- observations, warnings, proposals, and handoffs are published as dispatches
- stewards ratify project-local truth into ledgers
- overview memory is synthesized from ledgers, not from raw chatter

This keeps the system inspectable without turning every transient thought into official memory.

## Runtime Behavior

When a workspace includes these files, clawREFORM by aegntic.ai:

1. loads them as first-class workspace organs
2. injects them into the runtime prompt in a deterministic order
3. exposes them through the API file editor for live inspection and editing
4. preserves user edits by generating them once and never overwriting existing files

## Provenance

Generated organ files are branded with:

- platform: `clawREFORM by aegntic.ai`
- operator: `ae.ltd`
- ecosystem: `aegntic.ai`

This keeps identity and provenance visible both to humans and to the runtime.
