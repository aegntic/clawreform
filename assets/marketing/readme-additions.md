# GitHub README Additions

## Quick Start Section

```markdown
## 🚀 Quick Start

### One-Line Install

```bash
# macOS / Linux
curl -fsSL https://clawreform.com/install | sh

# Windows PowerShell
irm https://clawreform.com/install.ps1 | iex
```

### Manual Build

```bash
git clone https://github.com/aegntic/clawreform.git
cd clawreform
cargo build --release
./target/release/clawreform start
```

### Docker

```bash
docker run -d \
  --name clawreform \
  -p 4332:4332 \
  -v clawreform-data:/data \
  ghcr.io/aegntic/clawreform:latest
```

Dashboard at http://127.0.0.1:4332
```

---

## Features Highlight Section

```markdown
## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔄 **Self-Modification** | Rewrite and improve the codebase through natural language — with snapshots and auto-rollback |
| ⚡ **Rust Core** | 14 modular crates · 1,744+ tests · zero clippy warnings |
| 🎯 **60+ Skills** | DevOps, cloud, security, data, and development workflows — batteries included |
| 🤖 **7 Hands** | Browser, lead gen, research, prediction, social media, and more |
| 📡 **25+ Channels** | Slack, Discord, Telegram, WhatsApp, Teams, Matrix, and more |
| 🔌 **23+ MCP Servers** | GitHub, GitLab, Playwright, Supabase, memory, filesystem, and more |
| 🌐 **Tailscale Mesh** | Encrypted P2P networking across all your devices — no VPN config |
| 🤝 **A2A Protocol** | Multi-agent collaboration via the Agent-to-Agent standard |
| 🧠 **Persistent Memory** | Learns and remembers context across sessions |
| 🛡️ **Enterprise Security** | Capability-based auth, approval workflows, full audit logs |
```

---

## Demo Section

```markdown
## 🎬 Demo

Watch clawREFORM in action:

[![clawREFORM Demo](assets/media/frames/preview.png)](assets/media/clawreform-final-demo.mp4)

### Self-Modification Demo

```bash
# Ask clawREFORM to improve itself
clawreform chat "Add a /metrics endpoint to the API"

# The system will:
# 1. Map the API module structure
# 2. Risk-score the change (low: new endpoint, no breaking changes)
# 3. Create an atomic snapshot
# 4. Generate and apply the diff
# 5. Run cargo build + test + clippy
# 6. Ship it — or roll back cleanly if anything fails
```
```

---

## Badges Section

```markdown
[![GitHub stars](https://img.shields.io/github/stars/aegntic/clawreform?style=social)](https://github.com/aegntic/clawreform/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aegntic/clawreform?style=social)](https://github.com/aegntic/clawreform/network/members)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue)](LICENSE-MIT)
[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange)](rust-toolchain.toml)
[![Tests](https://img.shields.io/badge/tests-1744%2B-brightgreen)](https://github.com/aegntic/clawreform)
[![Clippy](https://img.shields.io/badge/clippy-0%20warnings-brightgreen)](https://github.com/aegntic/clawreform)
```

---

## Sponsors Section

```markdown
## 💖 Support the Project

clawREFORM is free and open source. If it's useful to you, consider supporting development:

- [GitHub Sponsors](https://github.com/sponsors/aegntic)

### Sponsor Tiers

| Tier | Price | Benefits |
|------|-------|---------|
| ☕ Supporter | $5/mo | Community role, early access to announcements |
| 🚀 Builder | $25/mo | Above + priority support in community |
| 🏢 Partner | $100/mo | Above + logo on README |
```
