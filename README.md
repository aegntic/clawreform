<p align="center">
  <img src="assets/branding/clawreform-logo-v2.png" width="220" alt="clawREFORM by aegntic.ai v2 brand logo" />
</p>

<h1 align="center">clawREFORM by aegntic.ai</h1>
<h3 align="center">The self-evolving agent operating system from aegntic.ai</h3>

<p align="center">
  <strong>clawREFORM by aegntic.ai with autonomous self-modification capabilities</strong><br/>
  Built in Rust • 14 crates • robust test coverage • zero clippy warnings
</p>

<p align="center">
  <a href="https://github.com/aegntic/clawreform">GitHub</a> •
  <a href="https://clawreform.com">Website</a> •
  <a href="https://x.com/clawreform">Twitter / X</a> •
  <a href="https://skool.com/autoclaw">Skool Community</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/language-Rust-orange?style=flat-square" alt="Rust" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" />
  <img src="https://img.shields.io/badge/version-0.2.1-purple?style=flat-square" alt="v0.2.1" />
  <img src="https://img.shields.io/badge/self--modify-enabled-brightgreen?style=flat-square" alt="Self-Modify" />
</p>

---

## 🦾 What is clawREFORM by aegntic.ai?

clawREFORM by aegntic.ai is an enhanced fork of [ClawReform](https://github.com/RightNow-AI/clawreform) with **autonomous self-modification capabilities**. It can:

- **Modify its own code** through natural language requests
- **Self-improve** by adding features, fixing bugs, and refactoring
- **Validate changes** with automatic build/test/clippy checks
- **Rollback safely** when modifications fail

## Key Features

| Feature               | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| **Self-Modification** | Ask clawREFORM by aegntic.ai to add features and it modifies its own codebase |
| **Tailscale Mesh**    | Secure P2P networking across all your devices                   |
| **MCP Servers**       | 23+ Model Context Protocol servers for extended capabilities    |
| **60+ Bundled Skills** | Pre-built skills for common tasks                              |
| **7 Hands**           | Browser, Clip, Lead, Collector, Predictor, Researcher, Twitter  |

## Repository Structure

```text
.
├── agents/             # Agent manifests and configurations
├── assets/             # Branding, social media, and marketing materials
├── crates/             # Core Rust workspace crates (API, business logic, etc.)
├── docs/               # Technical documentation
├── scripts/            # Helper scripts and utilities
├── sdk/                # Language-specific SDKs (Python, JS)
└── xtask/              # Custom build and automation tasks
```

## Very Simple Install

```bash
# macOS / Linux
curl -fsSL https://clawreform.sh/install | sh

# Windows PowerShell
irm https://clawreform.sh/install.ps1 | iex

# Start + open dashboard
clawreform start
# http://127.0.0.1:4332
```

When the dashboard opens, it asks for your OpenRouter API key first, then unlocks the full app.

## Theme System

clawREFORM ships with a dual-mode premium theme system inspired by the v2 metallic-C logo:

- **Dark-first default**: forged-steel surfaces, layered depth, and burnished-gold accents.
- **Elegant light mode**: a handcrafted brushed-metal light palette (not a simple inversion).
- **Shared visual language**: the same accent hue, spacing rhythm, and typography stack (`Manrope` + `IBM Plex Mono`) across both modes.

## Architecture Maps & Flowcharts

### System Map

```mermaid
flowchart LR
    U["You"] --> CLI["CLI / TUI"]
    U --> WEB["Web Dashboard (:4332)"]
    WEB --> API["API Daemon"]
    CLI --> K["Kernel Orchestrator"]
    API --> K
    K --> PB["Prompt Builder (Core Organs)"]
    PB --> LLM["LLM Providers (OpenRouter-first + others)"]
    K --> MCP["Tools + MCP Servers"]
    K --> CH["Channels + Hands"]
    K --> MEM["Memory Pipeline"]
    MEM --> CORE["CORE.md"]
    MEM --> OVER["OVERVIEW.md"]
    MEM --> PROJ["PROJECT.md"]
    MEM --> COLL["COLLECTIVE.md + ledger.json"]
```

### Request Flow

```mermaid
flowchart TD
    A["Open dashboard or run command"] --> B{"Dashboard?"}
    B -- "No" --> C["CLI/TUI request enters kernel"]
    B -- "Yes" --> D{"OpenRouter key configured?"}
    D -- "No" --> E["Show OpenRouter setup gate"]
    E --> F["Save + test OPENROUTER_API_KEY"]
    F --> G["Load main dashboard"]
    D -- "Yes" --> G
    G --> H["Request enters kernel"]
    C --> H
    H --> I["Build context from IDENTITY/SOUL/HANDS/MEMORY/SKILLS/COLLECTIVE"]
    I --> J["Model + tool/MCP loop"]
    J --> K["Write output + update memory layers"]
```

### Memory Promotion Flow

```mermaid
flowchart TD
    D["Dispatches"] --> X["Collective claim extraction"]
    S["Session summaries"] --> X
    X --> Y["Score claims (evidence + recurrence + cross-source)"]
    Y --> L["Update COLLECTIVE.md + memory/collective/ledger.json"]
    Y --> Z{"Promotion threshold met?"}
    Z -- "Project-ready" --> P["PROJECT.md"]
    Z -- "Overview-ready" --> O["OVERVIEW.md"]
    Z -- "Core-candidate" --> C["CORE.md"]
```

## Quick Start

```bash
# Initialize config + provider setup
clawreform init

# Start the daemon
clawreform start

# Ask it to modify itself
clawreform chat "Add a /api/health endpoint"
```

## Documentation

- [Getting Started](https://clawreform.com/docs/getting-started)
- [Self-Modification Guide](https://clawreform.com/docs/self-modify)
- [MCP Configuration](https://clawreform.com/docs/mcp)
- [API Reference](https://clawreform.com/docs/api)

## Community

- [Skool Community](https://skool.com/autoclaw) - Learn and share
- [Twitter/X](https://x.com/clawreform) - Latest updates
- [GitHub Discussions](https://github.com/aegntic/clawreform/discussions)

## License

MIT or Apache-2.0 - your choice.

---

<p align="center">
  <strong>Built with 🦀 by ae.ltd for aegntic.ai</strong>
</p>
