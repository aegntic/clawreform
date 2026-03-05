# Reddit Post — r/MachineLearning, r/rust, r/artificial

---

## Title
[Project] clawREFORM — open-source Agent OS in Rust that can modify its own codebase via natural language

---

## Body

**GitHub:** https://github.com/aegntic/clawreform

Hi everyone — we've been building something we think is genuinely novel and wanted to share it here for feedback.

**clawREFORM by aegntic.ai** is an open-source Agent Operating System built in Rust. The headline feature: a self-modification kernel that can safely modify and improve the system's own codebase through natural language, with automated validation and rollback.

---

### What makes it different from LangChain, AutoGPT, CrewAI, etc.?

Most agent frameworks are static post-deployment. clawREFORM has a **self-modification kernel**:

1. Parse the request → map affected modules → risk-score the change
2. Create an atomic snapshot before any file is touched
3. Generate and apply a scoped diff
4. Run `cargo build + test + clippy` — all 1,744+ tests
5. Auto-rollback from snapshot if any step fails

Full audit trail. Human approval workflow for high-risk changes. Nothing is applied without validation passing.

---

### Technical Details

- **Core:** Rust — 14 modular crates
- **Tests:** 1,744+ · clippy warnings: 0
- **Skills:** 60+ bundled (Docker, K8s, AWS, GCP, security audits, data pipelines)
- **Hands:** 7 specialised (browser automation, research, prediction, lead gen)
- **Channels:** 25+ (Slack, Discord, Telegram, WhatsApp, Teams, Matrix)
- **MCP:** 23+ Model Context Protocol servers (GitHub, GitLab, Playwright, Supabase)
- **Networking:** Tailscale mesh — encrypted P2P across devices
- **Multi-agent:** A2A (Agent-to-Agent) protocol for hierarchical systems
- **License:** MIT / Apache-2.0 dual

---

### Example

```bash
# Start clawREFORM
clawreform start

# Ask it to modify itself
clawreform chat "Add a /metrics endpoint to the API"

# It will:
# 1. Map the API module structure
# 2. Risk-score: low (new endpoint, no breaking changes)
# 3. Snapshot the current state
# 4. Generate the implementation diff
# 5. Apply it
# 6. Run cargo build + test + clippy
# 7. Report success (or rollback cleanly)
```

---

### Safety Mechanisms

We know "AI modifying its own code" raises flags. Here's what we built:

- **Human approval workflows** — high-risk changes are gated behind explicit approval
- **Audit logs** — every request, diff, and outcome is logged and queryable
- **Capability-based permissions** — surgically scope what the kernel can and can't touch
- **Sandboxed validation** — build and test run in isolation before any change is committed
- **Atomic rollback** — snapshot-based, not git-based, so rollback is instant and reliable

---

### Why Rust?

The self-modification kernel operates on its own codebase. We needed the validation loop to be fast, deterministic, and reliable. Python's GIL and memory overhead made it the wrong choice for this use case. Rust's ownership model also makes an entire class of bugs at the kernel level compile-time impossible.

---

We'd genuinely love feedback on:

1. The self-modification design — are there edge cases we haven't considered?
2. The risk-scoring approach — what heuristics would you add?
3. Use cases you'd want to see supported
4. Any concerns about the safety model

Happy to answer questions or go deeper on any part of the architecture.

---

**Links:**
- GitHub: https://github.com/aegntic/clawreform
- Website: https://clawreform.com
- Community: https://skool.com/autoclaw

---

*clawREFORM by aegntic.ai — The self-evolving Agent OS*

