# Hacker News Post

---

## Title
Show HN: ClawReform – Open-source AI agent framework that modifies its own code

---

## Comment

Hi HN,

We're open-sourcing ClawReform, an AI agent framework built in Rust that can modify and improve its own codebase through natural language.

GitHub: https://github.com/aegntic/clawreform

The core idea: AI systems should be able to evolve and improve themselves, but with proper guardrails. We built a "Self-Modification Kernel" that:

1. Analyzes codebase structure
2. Proposes changes based on natural language requests
3. Creates automatic backups
4. Applies changes atomically
5. Validates everything works
6. Rolls back if needed

Example:
```
clawreform chat "Add caching to the API for repeated queries"
```

ClawReform will analyze the API, design a caching strategy, implement it safely, and validate it works.

What's included:
- 61 bundled skills (Docker, K8s, AWS, security audit, etc.)
- 7 specialized "hands" (browser automation, research, prediction)
- 25+ communication channels (Slack, Discord, Telegram)
- 23+ MCP servers (filesystem, memory, GitHub)
- Full web dashboard + CLI + desktop app (Tauri)

Safety mechanisms:
- Human approval workflows
- Complete audit trails
- Capability-based permissions
- Sandboxed execution

Built with Rust for performance and reliability. MIT/Apache 2.0 dual licensed.

Would love feedback on the self-modification approach and potential use cases!

---

*ClawReform 0.2.1*

