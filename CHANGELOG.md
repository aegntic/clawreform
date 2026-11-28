# clawREFORM by aegntic.ai Changelog

All notable changes to clawREFORM by aegntic.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.35.1] - 2026-11-27

### Added

- **`clawreform-teams` crate**: 3-tier multi-agent team orchestration (`Orchestrator` -> `TeamLead` -> `Worker`) with `ContextBus`, `MessageBus`, `ScopedFileSystem`, `TemplateRegistry`, and `TeamManager`.
- **Browser extension sync API**: Added `POST /api/extension/sync` and `GET /api/extension/prompts` with `chrome-extension://` / `moz-extension://` CORS support.
- **ClawPrompt & DevScribe browser extensions**: Shipped companion Chrome extensions and dedicated landing pages (`/clwprmpt`, `/devscribe`).
- **Next.js marketing & docs site (`site/`)**: Static Cloudflare Pages site with interactive architecture/lifecycle views and `/api/waitlist` D1 function.
- **Install endpoint `get.clawreform.com`**: Cloudflare Worker that serves the install scripts from one pinned commit and does not serve an installer that is not the clawREFORM installer (`infra/clawreform-install-endpoint`).

### Fixed

- Resolved Rust workspace Clippy (`-D warnings`), `rustfmt`, unused dependency, and cross-platform `ScopedFileSystem` macOS/Windows path canonicalization issues.
- Fixed Qwen3.5 `[TOOL_CALL]` text recovery parser trailing-brace capture and quote edge cases.
- Fixed API auth middleware for dashboard static assets (`/logo.png`, `/favicon.ico`, `/branding/*`) and loopback-only extension sync; added `OPENCLAW_*_URL` env overrides and concurrent health probes.
- Fixed `settings.js` `ClawReformToast.warning` crash and Playwright `dashboard-proof.sh` inline console parsing.
- Aligned JS/Python SDKs, `whatsapp-gateway`, `clawreform-npm`, `Dockerfile`, `docker-compose.yml`, and `scripts/install.{sh,ps1}` on port `4332`, `CLAWREFORM_*` env vars, and `aegntic/clawreform`.
- Fixed `sota-fullstack-suite` workspace dependency (`@fastify/helmet@^11.1.1`), added missing hero video/poster assets, fixed broken web/doc links, and removed committed `secrets.env`, temp logs, and unmapped gitlinks.

### Documentation, security and CI

- Repointed every install, contributing and funding link that named the `RightNow-AI` org, whose `clawreform` repository returns 404.
- Rewrote the README in Simplified Technical English with five diagrams. Corrected the confidence formula, the provider and test counts, and the description of memory promotion and of the self-modification module.
- `SECURITY.md` uses GitHub private vulnerability reporting. The old address was on a domain with no DNS record. The supported line is 0.35.x.
- The install smoke test in CI fails when the repository or `get.clawreform.com` serves an installer of a different product.
- The macOS jobs of the release workflow build without code signing when the certificate is not configured. The desktop app version is 0.35.1.

## [0.3.0] - 2026-03-07

### Changed

- Improved first-run startup UX to route new users directly into guided setup when onboarding is incomplete.
- Added beginner-safe overview behavior that prioritizes setup actions before advanced diagnostics.
- Improved CLI startup auth failure messaging with direct recovery steps (`configure`, `set-key`, `doctor`).
- Bumped workspace/package version metadata and visible runtime version strings from `0.2.2` to `0.3.0`.

## [0.2.2] - 2026-03-06

### Changed

- Bumped workspace and package version metadata from `0.2.1` to `0.2.2`.
- Updated app/runtime visible version strings (web UI, desktop metadata, SDK package manifests, agent manifests, and User-Agent headers).
- Synced lockfile workspace crate versions to `0.2.2` for release consistency.

## [0.2.1] - 2026-03-01

Forked from [ClawReform](https://github.com/RightNow-AI/clawreform) v0.1.9

### 🦾 New Features

- **Self-Modification Module** (`clawreform-kernel/src/self_modify/`)
  - Natural language → code modification
  - Automatic backup and rollback
  - Build/test/clippy validation
  - Risk assessment and approval system

- **Enhanced MCP Integration**
  - 23 MCP servers configured
  - Support for stdio, HTTP, and SSE transports
  - GitHub, Slack, Linear, Supabase integrations
  - `aegntic/cldcde` custom servers

- **Tailscale Mesh Networking**
  - Secure P2P networking
  - Automatic peer discovery
  - End-to-end encryption

### 🎨 Branding

- Rebranded as clawREFORM by aegntic.ai
- Updated repository to [github.com/aegntic/clawreform](https://github.com/aegntic/clawreform)
- New documentation and branding assets
- **Burnished Gold Theme**: Reskinned the UI with an industrial gold and red palette.

### 🔧 Improvements

- Enhanced browser automation (Playwright)
- Improved memory integration
- Better error handling

---

## [0.1.0] - 2026-02-24

### Added

#### Core Platform

- 15-crate Rust workspace: types, memory, runtime, kernel, api, channels, wire, cli, migrate, skills, hands, extensions, desktop, xtask
- Agent lifecycle management: spawn, list, kill, clone, mode switching (Full/Assist/Observe)
- SQLite-backed memory substrate with structured KV, semantic recall, vector embeddings
- 41 built-in tools (filesystem, web, shell, browser, scheduling, collaboration, image analysis, inter-agent, TTS, media)
- WASM sandbox with dual metering (fuel + epoch interruption with watchdog thread)
- Workflow engine with pipelines, fan-out parallelism, conditional steps, loops, and variable expansion
- Visual workflow builder with drag-and-drop node graph, 7 node types, and TOML export
- Trigger system with event pattern matching, content filters, and fire limits
- Event bus with publish/subscribe and correlation IDs
- 7 Hands packages for autonomous agent actions

#### LLM Support

- 3 native LLM drivers: Anthropic, Google Gemini, OpenAI-compatible
- 27 providers: Anthropic, Gemini, OpenAI, Groq, OpenRouter, DeepSeek, Together, Mistral, Fireworks, Cohere, Perplexity, xAI, AI21, Cerebras, SambaNova, Hugging Face, Replicate, Ollama, vLLM, LM Studio, and more
- Model catalog with 130+ built-in models, 23 aliases, tier classification
- Intelligent model routing with task complexity scoring
- Fallback driver for automatic failover between providers
- Cost estimation and metering engine with per-model pricing
- Streaming support (SSE) across all drivers

#### Token Management & Context

- Token-aware session compaction (chars/4 heuristic, triggers at 70% context capacity)
- In-loop emergency trimming at 70%/90% thresholds with summary injection
- Tool profile filtering (cuts default 41 tools to 4-10 for chat agents, saving 15-20K tokens)
- Context budget allocation for system prompt, tools, history, and response
- MAX_TOOL_RESULT_CHARS reduced from 50K to 15K to prevent tool result bloat
- Default token quota raised from 100K to 1M per hour

#### Security

- Capability-based access control with privilege escalation prevention
- Path traversal protection in all file tools
- SSRF protection blocking private IPs and cloud metadata endpoints
- Ed25519 signed agent manifests
- Merkle hash chain audit trail with tamper detection
- Information flow taint tracking
- HMAC-SHA256 mutual authentication for peer wire protocol
- API key authentication with Bearer token
- GCRA rate limiter with cost-aware token buckets
- Security headers middleware (CSP, X-Frame-Options, HSTS)
- Secret zeroization on all API key fields
- Subprocess environment isolation
- Health endpoint redaction (public minimal, auth full)
- Loop guard with SHA256-based detection and circuit breaker thresholds
- Session repair (validates and fixes orphaned tool results, empty messages)

#### Channels

- 40 channel adapters: Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, Teams, Mattermost, Google Chat, Webex, Feishu/Lark, LINE, Viber, Facebook Messenger, Mastodon, Bluesky, Reddit, LinkedIn, Twitch, IRC, XMPP, and 18 more
- Unified bridge with agent routing, command handling, message splitting
- Per-channel user filtering and RBAC enforcement
- Graceful shutdown, exponential backoff, secret zeroization on all adapters

#### API

- 100+ REST/WS/SSE API endpoints (axum 0.8)
- WebSocket real-time streaming with per-agent connections
- OpenAI-compatible `/v1/chat/completions` API (streaming SSE + non-streaming)
- OpenAI-compatible `/v1/models` endpoint
- WebChat embedded UI with Alpine.js
- Google A2A protocol support (agent card, task send/get/cancel)
- Prometheus text-format `/api/metrics` endpoint for monitoring
- Multi-session management: list, create, switch, label sessions per agent
- Usage analytics: summary, by-model, daily breakdown
- Config hot-reload via polling (30-second interval, no restart required)

#### Web UI

- Chat message search with Ctrl+F, real-time filtering, text highlighting
- Voice input with hold-to-record mic button (WebM/Opus codec)
- TTS audio playback inline in tool cards
- Browser screenshot rendering in chat (inline images)
- Canvas rendering with iframe sandbox and CSP support
- Session switcher dropdown in chat header
- 6-step first-run setup wizard with provider API key help (12 providers)
- Skill marketplace with 4 tabs (Installed, ClawHub, MCP Servers, Quick Start)
- Copy-to-clipboard on messages, message timestamps
- Visual workflow builder with drag-and-drop canvas

#### Client SDKs

- JavaScript SDK (`@clawreform/sdk`): full REST API client with streaming, TypeScript declarations
- Python client SDK (`clawreform_client`): zero-dependency stdlib client with SSE streaming
- Python agent SDK (`clawreform_sdk`): decorator-based framework for writing Python agents
- Usage examples for both languages (basic + streaming)

#### CLI

- 14+ subcommands: init, start, agent, workflow, trigger, migrate, skill, channel, config, chat, status, doctor, dashboard, mcp
- Daemon auto-detection via PID file
- Shell completion generation (bash, zsh, fish, PowerShell)
- MCP server mode for IDE integration

#### Skills Ecosystem

- 60 bundled skills across 14 categories
- Skill registry with TOML manifests
- 4 runtimes: Python, Node.js, WASM, PromptOnly
- FangHub marketplace with search/install
- ClawHub client for OpenClaw skill compatibility
- SKILL.md parser with auto-conversion
- SHA256 checksum verification
- Prompt injection scanning on skill content

#### Desktop App

- Tauri 2.0 native desktop app
- System tray with status and quick actions
- Single-instance enforcement
- Hide-to-tray on close
- Updated CSP for media, frame, and blob sources

#### Session Management

- LLM-based session compaction with token-aware triggers
- Multi-session per agent with named labels
- Session switching via API and UI
- Cross-channel canonical sessions
- Extended chat commands: `/new`, `/compact`, `/model`, `/stop`, `/usage`, `/think`

#### Image Support

- `ContentBlock::Image` with base64 inline data
- Media type validation (png, jpeg, gif, webp only)
- 5MB size limit enforcement
- Mapped to all 3 native LLM drivers

#### Usage Tracking

- Per-response cost estimation with model-aware pricing
- Usage footer in WebSocket responses and WebChat UI
- Usage events persisted to SQLite
- Quota enforcement with hourly windows

#### Interoperability

- OpenClaw migration engine (YAML/JSON5 to TOML)
- MCP client (JSON-RPC 2.0 over stdio/SSE, tool namespacing)
- MCP server (exposes ClawReform tools via MCP protocol)
- A2A protocol client and server
- Tool name compatibility mappings (21 OpenClaw tool names)

#### Infrastructure

- Multi-stage Dockerfile (debian:bookworm-slim runtime)
- docker-compose.yml with volume persistence
- GitHub Actions CI (check, test, clippy, format)
- GitHub Actions release (multi-platform, GHCR push, SHA256 checksums)
- Cross-platform install script (curl/irm one-liner)
- systemd service file for Linux deployment

#### Multi-User

- RBAC with Owner/Admin/User/Viewer roles
- Channel identity resolution
- Per-user authorization checks
- Device pairing and approval system

#### Production Readiness

- 1731+ tests across 15 crates, 0 failures
- Cross-platform support (Linux, macOS, Windows)
- Graceful shutdown with signal handling (SIGINT/SIGTERM on Unix, Ctrl+C on Windows)
- Daemon PID file with stale process detection
- Release profile with LTO, single codegen unit, symbol stripping
- Prometheus metrics for monitoring
- Config hot-reload without restart

[0.1.0]: https://github.com/RightNow-AI/clawreform/releases/tag/v0.1.0
