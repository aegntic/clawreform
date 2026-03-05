# Hacker News Post

---

## Title
Show HN: clawREFORM — open-source Agent OS in Rust that modifies its own code

---

## Comment

Hi HN,

We're open-sourcing **clawREFORM by aegntic.ai** — an Agent Operating System built in Rust that can safely modify its own codebase through natural language.

GitHub: https://github.com/aegntic/clawreform

---

**The core idea**

Most AI agent frameworks are frozen after deployment. Every improvement requires a human developer back in the loop. We built a self-modification kernel to change that:

1. Parse a natural language request
2. Map affected modules, risk-score the change
3. Create an atomic snapshot (not a git commit — in-process, fast)
4. Generate and apply a scoped diff
5. Run `cargo build + cargo test + cargo clippy -- -D warnings`
6. Auto-rollback from snapshot if any step fails
7. Log everything to the audit trail

The kernel never applies a change that doesn't pass the full validation pipeline.

---

**Why Rust?**

The self-modification kernel operates on its own codebase. We needed:
- Deterministic validation (no GIL surprises)
- Fast compile + test feedback loops for the validation step
- Memory safety at the kernel level — when the system modifies itself, a corruption bug in the modification layer would be very bad
- Native concurrency for multi-agent workflows

14 crates, 1,744+ tests, zero clippy warnings. We hold ourselves to the same bar the kernel enforces.

---

**What's included**

- 60+ bundled skills (Docker, K8s, AWS, GCP, security audit, Ansible...)
- 7 specialised hands (browser automation via Playwright, research, prediction, lead gen...)
- 25+ communication channels (Slack, Discord, Telegram, WhatsApp, Teams, Matrix...)
- 23+ MCP servers (GitHub, GitLab, Playwright, Supabase, Firebase, memory, filesystem, sequential thinking...)
- Tailscale mesh networking — encrypted P2P, no VPN config
- Multi-agent A2A protocol
- Web dashboard + CLI + Tauri desktop app
- MIT/Apache-2.0 dual license

---

**Safety**

We know "AI modifying its own code" is a red flag for a lot of people. Here's the design:

- High-risk changes (core types, public API surfaces) require explicit human approval before the kernel proceeds
- Every operation is logged: request, diff, risk score, validation result, outcome
- Capability-based permissions — you can surgically scope what the kernel can and can't touch
- Sandboxed build/test execution — validation runs in isolation
- Rollback is atomic and instant — snapshot-based, not git-based

---

**Try it**

```bash
curl -fsSL https://clawreform.com/install | sh
clawreform start
clawreform chat "Add a /metrics endpoint to the API"
```

Watch the kernel work. It maps the API structure, generates the implementation, validates it, and either ships it or rolls back cleanly.

---

Would genuinely appreciate feedback from HN on:

- The risk-scoring approach — what heuristics are we missing?
- The snapshot-vs-git rollback trade-off — any concerns?
- Use cases you'd want to see covered
- Any part of the safety model you'd challenge

Happy to go deep on architecture questions.

---

*clawREFORM by aegntic.ai — open-source, MIT/Apache-2.0*

