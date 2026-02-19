# clawreform

Local dashboard + control-plane API for orchestrating **ZeroClaw swarms** with **Automaton-inspired autonomy** (heartbeat, replication-oriented modules, and adaptive fallback behavior).

## Project identity

`clawreform` is an independent project with its own repository and roadmap.
It is not a fork of ZeroClaw or Conway Automaton.

## What this prototype does

- Renamable main orchestrator node.
- Swarm builder with:
  - Any provider + any model fields.
  - Agent count, heartbeat interval, deploy target.
  - Optional deploy command (queued as an executable task on deploy).
  - Module toggles sourced from local `automaton/src`.
- Deploy/pause swarms.
- Continuous heartbeat and scheduler runtime per agent.
- Real task queue with lifecycle states: `queued`, `running`, `succeeded`, `failed`, `canceled`.
- Task execution modes:
  - `simulate` (autonomous runtime simulation)
  - `shell` (real command execution with timeout + output capture)
- Retry/cancel controls and objective-based task seeding.
- Obstacle handling with automatic provider/model failover when auto-adapt is enabled.
- Inter-agent idea broadcast.
- Credential profile mapping by reference (`secretRef`, never raw secrets).
- Live provider catalog sourced from local `zeroclaw/src/providers/mod.rs`.

## Project layout

- `server.mjs`: local API + runtime heartbeat/adaptation engine.
- `public/index.html`: animated teaser landing page.
- `public/dashboard.html`: mission control dashboard shell.
- `public/styles.css`: responsive UI styles.
- `public/app.js`: data fetching + interaction handlers.
- `public/teaser.css`: full-screen teaser visuals.
- `public/teaser.js`: waitlist registration + background animation.
- `runtime-state.json`: generated state snapshot (ignored by git).
- `waitlist-data.json`: waitlist registrations (ignored by git).

## Run

```bash
cd "/Users/airbook-tabs/Documents/New project/anyre.quest"
npm start
```

Then open:

- `http://localhost:4545`
- `http://localhost:4545/dashboard`

## Notes

- This is a local orchestration layer; it does not mutate `zeroclaw` or `automaton` code.
- It reads both repositories for capability discovery and repo metadata.
- For production, move credential refs to a secret manager and enforce authn/authz on API routes.
- Shell task execution runs commands from your local machine context; use carefully.
- For waitlist forwarding, set `WAITLIST_WEBHOOK_URL` in your environment.

## Attribution

- Inspired by [openagen/zeroclaw](https://github.com/openagen/zeroclaw)
- Inspired by [Conway-Research/automaton](https://github.com/Conway-Research/automaton)
- See `CREDITS.md` for attribution details.
