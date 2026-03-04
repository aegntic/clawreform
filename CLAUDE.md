# clawREFORM by aegntic.ai — Agent Instructions

## Project Overview
clawREFORM by aegntic.ai is an open-source Agent Operating System written in Rust (14 crates).
- Config: `~/.clawreform/config.toml`
- Default API: `http://127.0.0.1:4332`
- CLI binary: `target/release/clawreform` (or `target/debug/clawreform`)

## Build & Verify Workflow
After every feature implementation, run ALL THREE checks:
```bash
cargo build --workspace --lib          # Must compile (use --lib if exe is locked)
cargo test --workspace                 # All tests must pass (currently 1744+)
cargo clippy --workspace --all-targets -- -D warnings  # Zero warnings
```

### Run a Single Test
```bash
cargo test -p <crate> <test_name>      # e.g., cargo test -p clawreform-kernel test_spawn
cargo test -p <crate> --test <file>    # Run all tests in a specific test file
```

## MANDATORY: Live Integration Testing
**After implementing any new endpoint, feature, or wiring change, you MUST run live integration tests.** Unit tests alone are not enough — they can pass while the feature is actually dead code. Live tests catch:
- Missing route registrations in server.rs
- Config fields not being deserialized from TOML
- Type mismatches between kernel and API layers
- Endpoints that compile but return wrong/empty data

### How to Run Live Integration Tests

#### Step 1: Stop any running daemon
```bash
# Linux
pkill -f clawreform
# Or find and kill manually
ps aux | grep clawreform
kill <pid>

# Windows (MSYS2/Git Bash)
tasklist | grep -i clawreform
taskkill //PID <pid> //F

# Wait 2-3 seconds for port to release
sleep 3
```

#### Step 2: Build fresh release binary
```bash
cargo build --release -p clawreform-cli
```

#### Step 3: Start daemon with required API keys
```bash
GROQ_API_KEY=<key> target/release/clawreform start &
sleep 6  # Wait for full boot
curl -s http://127.0.0.1:4332/api/health  # Verify it's up
```
The daemon command is `start` (not `daemon`).

#### Step 4: Test every new endpoint
```bash
# GET endpoints — verify they return real data, not empty/null
curl -s http://127.0.0.1:4332/api/<new-endpoint>

# POST/PUT endpoints — send real payloads
curl -s -X POST http://127.0.0.1:4332/api/<endpoint> \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# Verify write endpoints persist — read back after writing
curl -s -X PUT http://127.0.0.1:4332/api/<endpoint> -d '...'
curl -s http://127.0.0.1:4332/api/<endpoint>  # Should reflect the update
```

#### Step 5: Test real LLM integration
```bash
# Get an agent ID
curl -s http://127.0.0.1:4332/api/agents | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])"

# Send a real message (triggers actual LLM call to Groq/OpenAI)
curl -s -X POST "http://127.0.0.1:4332/api/agents/<id>/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Say hello in 5 words."}'
```

#### Step 6: Verify side effects
After an LLM call, verify that any metering/cost/usage tracking updated:
```bash
curl -s http://127.0.0.1:4332/api/budget       # Cost should have increased
curl -s http://127.0.0.1:4332/api/budget/agents  # Per-agent spend should show
```

#### Step 7: Verify dashboard HTML
```bash
# Check that new UI components exist in the served HTML
curl -s http://127.0.0.1:4332/ | grep -c "newComponentName"
# Should return > 0
```

#### Step 8: Cleanup
```bash
# Linux
pkill -f clawreform

# Windows (MSYS2/Git Bash)
tasklist | grep -i clawreform
taskkill //PID <pid> //F
```

### Key API Endpoints for Testing
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Basic health check |
| `/api/agents` | GET | List all agents |
| `/api/agents/{id}/message` | POST | Send message (triggers LLM) |
| `/api/budget` | GET/PUT | Global budget status/update |
| `/api/budget/agents` | GET | Per-agent cost ranking |
| `/api/budget/agents/{id}` | GET | Single agent budget detail |
| `/api/network/status` | GET | OFP network status |
| `/api/peers` | GET | Connected OFP peers |
| `/api/a2a/agents` | GET | External A2A agents |
| `/api/a2a/discover` | POST | Discover A2A agent at URL |
| `/api/a2a/send` | POST | Send task to external A2A agent |
| `/api/a2a/tasks/{id}/status` | GET | Check external A2A task status |

## Architecture Notes
- **Don't touch `clawreform-cli`** — user is actively building the interactive CLI
- `KernelHandle` trait (defined in `clawreform-runtime`, implemented on `ClawReformKernel` in `clawreform-kernel`) avoids circular deps between runtime and kernel
- `AppState` in `server.rs` bridges kernel to API routes
- New routes must be registered in `server.rs` router AND implemented in `routes.rs`
- Dashboard is Alpine.js SPA in `static/index_body.html` — new tabs need both HTML and JS data/methods
- Config fields need: struct field + `#[serde(default)]` + Default impl entry + Serialize/Deserialize derives

### Crate Dependency Order (lower crates depend on nothing above them)
```
clawreform-cli / clawreform-desktop
    ↓
clawreform-api
    ↓
clawreform-kernel
    ↓
clawreform-runtime / clawreform-channels / clawreform-wire / clawreform-skills / clawreform-migrate
    ↓
clawreform-memory
    ↓
clawreform-types
```

### Key Files by Task
| Task | Key Files |
|------|-----------|
| Add API endpoint | `crates/clawreform-api/src/server.rs` (route), `crates/clawreform-api/src/routes.rs` (handler) |
| Add tool | `crates/clawreform-runtime/src/tool_runner.rs` |
| Add config field | `crates/clawreform-types/src/config.rs` (struct + Default impl) |
| Add channel adapter | `crates/clawreform-channels/src/<platform>.rs` + `lib.rs` |
| Add skill | `crates/clawreform-skills/bundled/<skill>/skill.toml` |
| Modify dashboard | `static/index_body.html` (Alpine.js SPA) |

## Common Gotchas
- `clawreform` binary may be locked if daemon is running — use `--lib` flag or kill daemon first
- `PeerRegistry` is `Option<PeerRegistry>` on kernel but `Option<Arc<PeerRegistry>>` on `AppState` — wrap with `.as_ref().map(|r| Arc::new(r.clone()))`
- Config fields added to `KernelConfig` struct MUST also be added to the `Default` impl or build fails
- `AgentLoopResult` field is `.response` not `.response_text`
- CLI command to start daemon is `start` not `daemon`
- Process management:
  - Linux: `pkill -f clawreform` or `kill <pid>`
  - Windows (MSYS2/Git Bash): `taskkill //PID <pid> //F` (double slashes)
- Dashboard tabs require both HTML elements AND corresponding Alpine.js data/methods in `index_body.html`
