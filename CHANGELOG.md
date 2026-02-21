# Changelog

## [0.1.0] — 2026-02-22

### Added
- Local dashboard + control-plane API for orchestrating ZeroClaw swarms
- Animated teaser landing page (void black + blood-red + cyan theme)
- Mission control dashboard with swarm builder
- Real task queue with lifecycle states (queued, running, succeeded, failed, canceled)
- Task execution modes: `simulate` (autonomous) and `shell` (real commands)
- Heartbeat engine with continuous pulse per agent
- Obstacle handling with automatic provider/model failover
- Inter-agent idea broadcast
- Live provider catalog sourced from ZeroClaw `mod.rs`
- Module catalog sourced from Automaton `src/`
- Credential profile mapping by reference (never raw secrets)
- Cloudflare Workers deployment with KV state persistence
- Render deployment support
- Full documentation suite:
  - ZeroClaw integration spec
  - AgentZero integration spec
  - Master objectives and $1M MRR execution plan
  - Skool community setup guide
  - 8-week CLI-ReForm course outline
  - Landing page copy
  - Launch X thread templates
