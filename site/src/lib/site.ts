import type { Metadata } from "next";

export const siteBrand = {
  name: "clawREFORM",
  owner: "aegntic.ai",
  baseUrl: "https://clawreform.com",
  githubUrl: "https://github.com/aegntic/clawreform",
  issuesUrl: "https://github.com/aegntic/clawreform/issues",
  discussionsUrl: "https://github.com/aegntic/clawreform/discussions",
  contactEmail: "hello@aegntic.ai",
} as const;

export const siteTheme = {
  storageKey: "clawreform-theme",
  defaultMode: "dark",
  modes: {
    dark: { label: "Dark", className: "dark" },
    light: { label: "Light", className: "light" },
  },
} as const;

export type ThemeMode = keyof typeof siteTheme.modes;

export type SiteLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type SiteRoute = {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

export const siteNavigation: SiteLink[] = [
  { href: "/platform", label: "Platform" },
  { href: "/architecture", label: "Architecture" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
];

export const siteFooterSections = {
  Product: [
    { href: "/platform", label: "Platform" },
    { href: "/architecture", label: "Architecture" },
    { href: "/pricing", label: "Pricing" },
    { href: "/download", label: "Download" },
  ],
  Resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs/getting-started", label: "Getting Started" },
    { href: siteBrand.githubUrl, label: "GitHub" },
    { href: "/contact", label: "Contact" },
  ],
  Company: [
    { href: "https://aegntic.ai", label: "aegntic.ai" },
    {
      href: "https://github.com/aegntic/clawreform/blob/main/LICENSE-MIT",
      label: "License",
    },
  ],
} as const;

export const siteFooterMeta = {
  github: siteBrand.githubUrl,
  x: "https://x.com/aegntic",
} as const;

export const siteRoutes: SiteRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/platform", changeFrequency: "weekly", priority: 0.9 },
  { path: "/architecture", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/getting-started", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/concepts", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/api", changeFrequency: "weekly", priority: 0.7 },
  { path: "/docs/configuration", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/download", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
];

export function createPageMetadata(path: string, title: string, description: string): Metadata {
  const canonicalPath = path === "/" ? "" : path;
  const url = `${siteBrand.baseUrl}${canonicalPath}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: siteBrand.name,
      title: `${title} | ${siteBrand.name}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteBrand.name}`,
      description,
    },
  };
}

export const heroTerminalLines = [
  { type: "cmd", text: "$ clawreform start" },
  { type: "out", text: "scheduler  triggered scheduled task" },
  { type: "out", text: "dispatcher routed job to github-monitor agent" },
  { type: "success", text: "registry   audit artifact recorded at trace-7fd2.json" },
  { type: "gap", text: "" },
  { type: "cmd", text: '$ clawreform message architect "add approval gate to github-monitor"' },
  { type: "out", text: "policy     snapshot sealed before edit" },
  { type: "out", text: "planner    proposed a 4-file change set" },
  { type: "gap", text: "" },
  { type: "cmd", text: "$ cargo test -p clawreform-runtime --quiet" },
  { type: "json", text: "evaluator  score=0.97  trace=inspection-221" },
  { type: "success", text: "policy     change accepted, lifecycle renewed" },
] as const;

export const homeProofPills = [
  { value: "14", label: "Rust crates" },
  { value: "1", label: "Observable trace" },
  { value: "∞", label: "Repair loops" },
] as const;

export const homeSignalStack = [
  {
    title: "Governed self-editing",
    desc: "Agents can modify the system, but only behind snapshots, inspections, and rollback permits.",
  },
  {
    title: "Public records",
    desc: "Specialists file artifacts you can inspect instead of burying decisions in prompt context.",
  },
  {
    title: "Wake-on-demand",
    desc: "The right agent spins up only when there is a real task and the schedule says it should.",
  },
  {
    title: "Full audit trail",
    desc: "One evidence trail shows what opened, what ran, what changed, and why it was permitted.",
  },
] as const;

export const homeMatrixRows = [
  {
    dimension: "Execution model",
    monolith: "One tangled loop",
    reform: "Independent specialists",
  },
  {
    dimension: "Memory handling",
    monolith: "Oversized context dumps",
    reform: "Layered, selective retention",
  },
  {
    dimension: "Failure recovery",
    monolith: "Silent crashes",
    reform: "Classified repair loops",
  },
  {
    dimension: "Scaling model",
    monolith: "Brittle sprawl",
    reform: "Observable services",
  },
] as const;

export const homeFabricStages = [
  {
    index: "01",
    title: "The scheduler fires",
    desc: "A timer, webhook, or message turns a rule into a real task the runtime can act on.",
  },
  {
    index: "02",
    title: "The dispatcher picks the right agent",
    desc: "Health, budget, and capability checks decide which specialist should handle the task.",
  },
  {
    index: "03",
    title: "That agent does one bounded job",
    desc: "The agent wakes, uses a clear contract, and writes an explicit artifact instead of vague chat residue.",
  },
  {
    index: "04",
    title: "The evaluator inspects the result",
    desc: "Tests, scores, or policy gates verify the output before the system treats it as real.",
  },
  {
    index: "05",
    title: "The registry records what happened",
    desc: "The trace, decision, and artifact are saved so the run can be audited, repaired, or replayed later.",
  },
] as const;

export const homeMemoryLadder = [
  {
    title: "Core",
    desc: "Small durable truths that should survive across projects and over time.",
  },
  {
    title: "Overview",
    desc: "The current high-level map of what matters now, synthesized from real records instead of chat scraps.",
  },
  {
    title: "Projects",
    desc: "Per-project dossiers where repeated, relevant, validated knowledge becomes canonical.",
  },
  {
    title: "Working detail",
    desc: "Hot short-term context that helps with current work but is not allowed to silently become doctrine.",
  },
] as const;

export const homeMemorySubstrate = [
  "Structured per-agent and shared KV storage in SQLite",
  "Semantic retrieval through vector embeddings",
  "Knowledge graph entities and relations",
  "Persistent sessions with canonical cross-channel summaries",
] as const;

export const homeFeatures = [
  {
    label: "Agent Lifecycle",
    title: "Agent Lifecycle",
    desc: "Spawn, configure, and monitor agents with full lifecycle management.",
  },
  {
    label: "Channel Adapters",
    title: "Channel Adapters",
    desc: "Connect agents to Slack, Discord, and custom platforms out of the box.",
  },
  {
    label: "Skill System",
    title: "Skill System",
    desc: "Extend agent capabilities with bundled and custom skills.",
  },
  {
    label: "Persistent Memory",
    title: "Persistent Memory",
    desc: "Agents remember context across sessions with built-in vector storage.",
  },
  {
    label: "Budget & Metering",
    title: "Budget & Metering",
    desc: "Track every token. Set per-agent spending limits. No surprises.",
  },
  {
    label: "A2A Protocol",
    title: "A2A Protocol",
    desc: "Inter-agent communication via the open Agent-to-Agent protocol.",
  },
] as const;

export const homeExtensions = [
  {
    name: "DevScribe",
    version: "v0.1.0",
    tagline: "Development companion",
    icon: "\u2699",
    backDesc: "Capture, annotate, and export from the clawREFORM dashboard.",
    backPlatforms: "Connects to localhost:4332",
    ctaText: "Add to Chrome",
    ctaHref: "#",
  },
  {
    name: "clawPrompt",
    version: "v1.0.4",
    tagline: "Swarm command prompts",
    icon: "\u26A1",
    backDesc: "One-click inject swarm prompts into ChatGPT, Claude, Grok, Gemini, and OpenRouter. Zero data collection.",
    backPlatforms: "Works on any AI chat site",
    ctaText: "Add to Chrome",
    ctaHref: "#",
  },
] as const;

export const docsIndexSections = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    desc: "Install clawREFORM, start the daemon, send your first agent message.",
  },
  {
    title: "Core Concepts",
    href: "/docs/concepts",
    desc: "Agents, kernels, skills, channels, wire protocol, and budget governance.",
  },
  {
    title: "API Reference",
    href: "/docs/api",
    desc: "REST endpoints for agents, budget, peers, A2A, and system health.",
  },
  {
    title: "Configuration",
    href: "/docs/configuration",
    desc: "Config file format, environment variables, and per-agent overrides.",
  },
] as const;

export const docsGettingStartedSteps = [
  {
    title: "Clone and build",
    code: `$ git clone https://github.com/aegntic/clawreform.git\n$ cd clawreform\n$ cargo build --release`,
    note: "Requires Rust 1.75+ and a C linker. Takes 2-4 minutes.",
  },
  {
    title: "Start the daemon",
    code: `$ export GROQ_API_KEY=your-key-here   # or OPENAI_API_KEY\n$ ./target/release/clawreform start`,
    note: "The daemon starts the API on http://127.0.0.1:4332 and the embedded dashboard at the same address.",
  },
  {
    title: "Verify",
    code: `$ curl http://127.0.0.1:4332/api/health\n{"status":"ok","version":"0.3.0"}`,
    note: "",
  },
  {
    title: "Open the dashboard",
    code: `Navigate to http://127.0.0.1:4332/`,
    note: "The embedded Alpine.js dashboard shows agents, budgets, skills, and network status in real time.",
  },
  {
    title: "Send a message",
    code: `$ curl -X POST http://127.0.0.1:4332/api/agents/default/message \\\n  -H "Content-Type: application/json" \\\n  -d '{"message": "Hello, clawREFORM!"}'`,
    note: "This sends a message to the default agent, which routes to your configured LLM provider and returns a response.",
  },
] as const;

export const docsConcepts = [
  {
    term: "Agent",
    definition:
      "An autonomous unit of work with its own ID, model binding, budget envelope, skill set, and tool permissions. Agents persist across restarts.",
  },
  {
    term: "Kernel",
    definition:
      "The core orchestrator. Spawns, manages, and terminates agents. Dispatches messages, enforces budgets, and coordinates with the runtime.",
  },
  {
    term: "Skill",
    definition:
      "A declarative TOML pack that defines a system prompt, allowed tools, and constraints. Skills compose — an agent can load multiple skills simultaneously.",
  },
  {
    term: "Channel",
    definition:
      "A communication adapter that connects agents to external platforms (Slack, Discord, Telegram, email, webhooks, etc.). Channels run as async tasks.",
  },
  {
    term: "Wire Protocol (OFP)",
    definition:
      "Open Federation Protocol. TLS-encrypted peer-to-peer messaging between agents on different machines. Supports mDNS local discovery and configurable seed peers.",
  },
  {
    term: "Budget",
    definition:
      "A spend limit attached to an agent or globally. The kernel tracks token usage and cost per call. Hard-stops agents that exceed their budget.",
  },
  {
    term: "Tool",
    definition:
      "A callable function available to agents — file I/O, shell commands, HTTP requests, code execution. Tools are sandboxed with timeouts and output capture.",
  },
  {
    term: "Runtime",
    definition:
      "The execution environment for agents. Runs the agent loop (message -> LLM -> tool calls -> response) and manages tool execution.",
  },
  {
    term: "KernelHandle",
    definition:
      "A trait defined in clawreform-runtime, implemented on the kernel. Inverts the dependency so runtime can call kernel methods without importing the kernel crate.",
  },
] as const;

export const docsConfigurationEnvVars = [
  { name: "GROQ_API_KEY", desc: "API key for Groq (fast inference). Used as default LLM provider." },
  { name: "OPENAI_API_KEY", desc: "API key for OpenAI. Enables GPT models." },
  { name: "ANTHROPIC_API_KEY", desc: "API key for Anthropic. Enables Claude models." },
  { name: "CLAWREFORM_PORT", desc: "Override the default API port (4332)." },
  { name: "CLAWREFORM_LOG", desc: "Log level: error, warn, info, debug, trace." },
] as const;

export const docsApiEndpoints = [
  { method: "GET", path: "/api/health", purpose: "Health check + version" },
  { method: "GET", path: "/api/agents", purpose: "List all agents" },
  { method: "POST", path: "/api/agents/{id}/message", purpose: "Send message to agent (triggers LLM)" },
  { method: "GET", path: "/api/budget", purpose: "Global budget status" },
  { method: "PUT", path: "/api/budget", purpose: "Update global budget limits" },
  { method: "GET", path: "/api/budget/agents", purpose: "Per-agent cost ranking" },
  { method: "GET", path: "/api/budget/agents/{id}", purpose: "Single agent budget detail" },
  { method: "GET", path: "/api/network/status", purpose: "OFP network status" },
  { method: "GET", path: "/api/peers", purpose: "Connected OFP peers" },
  { method: "GET", path: "/api/a2a/agents", purpose: "External A2A agents" },
  { method: "POST", path: "/api/a2a/discover", purpose: "Discover A2A agent at URL" },
  { method: "POST", path: "/api/a2a/send", purpose: "Send task to external A2A agent" },
  { method: "GET", path: "/api/a2a/tasks/{id}/status", purpose: "Check external task status" },
] as const;

export const platformCapabilities = [
  {
    title: "Agent Lifecycle Management",
    desc: "Spawn, pause, resume, and kill agents programmatically. Every agent has an ID, a budget envelope, a model binding, and a set of tools. The kernel handles the rest.",
    detail: "Agents persist across restarts. State is checkpointed to local storage. No external database required.",
  },
  {
    title: "Multi-Provider LLM Routing",
    desc: "Bind each agent to a different provider and model. Route by cost, latency, or capability. Fall back automatically when a provider is down.",
    detail: "Supported: OpenAI, Anthropic, Groq, Ollama, any OpenAI-compatible endpoint. Model tiers (fast/balanced/quality) are configurable per-agent.",
  },
  {
    title: "Budget Governance",
    desc: "Set per-agent and global spend limits in real dollars. The kernel tracks token usage and cost per call, and hard-stops agents that exceed their budget.",
    detail: "Budget data is queryable via API. Alerts can trigger at configurable thresholds. Costs are metered to the cent.",
  },
  {
    title: "40+ Channel Adapters",
    desc: "Connect agents to Slack, Discord, Telegram, WhatsApp, Matrix, IRC, email, SMS, webhooks, and more. One agent identity, every communication surface.",
    detail: "Each adapter runs as a lightweight async task. Adapters are composable — an agent can listen on multiple channels simultaneously.",
  },
  {
    title: "Wire Protocol (OFP)",
    desc: "Open Federation Protocol for encrypted peer-to-peer agent communication. Agents on different machines discover each other and exchange messages without a central broker.",
    detail: "TLS-encrypted by default. Peer discovery uses mDNS on local networks and configurable seed peers for WAN.",
  },
  {
    title: "Skills Ecosystem",
    desc: "Declarative TOML skill packs define system prompts, tool sets, and constraints. Bundled skills ship with the binary. Community skills install from git.",
    detail: "Skills compose. An agent can load multiple skills. Skill conflicts are detected at bind time, not at runtime.",
  },
  {
    title: "Tool Runner",
    desc: "Sandboxed tool execution with timeout, output capture, and structured result parsing. Built-in tools for file I/O, shell commands, HTTP, and code execution.",
    detail: "Custom tools are registered as async Rust functions or external processes. The tool runner handles serialization and error wrapping.",
  },
  {
    title: "REST API + Dashboard",
    desc: "Full HTTP API for every kernel operation. Alpine.js dashboard for monitoring agents, budgets, network peers, and skills in real time.",
    detail: "API runs on port 4332 by default. Dashboard is embedded in the binary — no separate frontend deploy.",
  },
] as const;

/* ── Interactive Architecture Diagram Data ── */

export type ArchCrateLayer = {
  id: string;
  name: string;
  crates: string[];
  color: string;
};

export const archCrateLayers: ArchCrateLayer[] = [
  { id: "presentation", name: "Presentation", crates: ["clawreform-cli", "clawreform-desktop"], color: "var(--metal-light)" },
  { id: "api", name: "API + Dashboard", crates: ["clawreform-api"], color: "var(--metal-mid)" },
  { id: "kernel", name: "Kernel", crates: ["clawreform-kernel"], color: "var(--amber-core)" },
  { id: "services", name: "Services", crates: ["clawreform-runtime", "clawreform-channels", "clawreform-wire", "clawreform-skills", "clawreform-migrate"], color: "var(--metal-mid)" },
  { id: "storage", name: "Storage", crates: ["clawreform-memory"], color: "var(--metal-dark)" },
  { id: "foundation", name: "Foundation", crates: ["clawreform-types"], color: "var(--metal-light)" },
];

export type KernelSubsystem = {
  id: string;
  name: string;
  desc: string;
};

export const kernelSubsystems: KernelSubsystem[] = [
  { id: "agent-spawn", name: "Agent Spawner", desc: "Creates new agent instances with ID, model binding, budget envelope, and tool permissions. Persists state to SQLite." },
  { id: "dispatcher", name: "Message Dispatcher", desc: "Routes incoming messages to the correct agent based on capability matching, health checks, and budget validation." },
  { id: "llm-router", name: "LLM Router", desc: "Selects and calls the appropriate LLM provider (OpenAI, Anthropic, Groq, Ollama). Handles fallbacks and retries." },
  { id: "tool-runner", name: "Tool Runner", desc: "Sandboxed execution of agent tool calls — file I/O, shell commands, HTTP requests, code execution. Timeout + output capture." },
  { id: "evaluator", name: "Output Evaluator", desc: "Scores and validates agent outputs against acceptance criteria, tests, and policy gates before committing results." },
  { id: "budget-enforcer", name: "Budget Enforcer", desc: "Tracks token usage and cost per call per agent. Hard-stops agents that exceed their spending limits." },
  { id: "registry", name: "Audit Registry", desc: "Records every decision, trace, and artifact. Produces JSON audit trails that are queryable and replayable." },
  { id: "skill-loader", name: "Skill Loader", desc: "Parses and composes TOML skill packs. Detects conflicts at bind time, not runtime. Supports community skills." },
  { id: "channel-mux", name: "Channel Multiplexer", desc: "Manages 40+ platform adapters (Slack, Discord, Telegram, etc.) as lightweight async tasks." },
  { id: "wire-ofp", name: "Wire Protocol (OFP)", desc: "TLS-encrypted peer-to-peer messaging between agents on different machines. mDNS discovery + seed peers for WAN." },
  { id: "memory-kv", name: "KV Memory Store", desc: "Per-agent and shared key-value storage backed by SQLite. Supports semantic retrieval via vector embeddings." },
  { id: "checkpoint", name: "Checkpoint Manager", desc: "Periodically snapshots agent state for crash recovery and rollback. Checkpoints are append-only." },
];

export type MessageFlowStage = {
  id: string;
  label: string;
  desc: string;
};

export const messageFlowStages: MessageFlowStage[] = [
  { id: "rbac", label: "RBAC Check", desc: "Verify the sender has permission to send this message type to this agent." },
  { id: "channel-policy", label: "Channel Policy", desc: "Apply channel-specific rules — rate limits, format normalization, platform constraints." },
  { id: "quota", label: "Quota Gate", desc: "Check the agent's remaining budget. Hard-stop if the spend limit has been reached." },
  { id: "registry", label: "Registry Lookup", desc: "Retrieve the agent's contract, loaded skills, and current state from the audit registry." },
  { id: "dispatch", label: "Dispatch", desc: "Route the message to the agent's runtime loop with the full execution context." },
  { id: "llm-loop", label: "LLM Loop", desc: "Send to the LLM provider, process tool calls, iterate until the model signals completion." },
  { id: "cost", label: "Cost Accounting", desc: "Meter token usage, calculate cost, deduct from the agent's budget envelope." },
  { id: "response", label: "Response", desc: "Deliver the final output back through the channel adapter to the original sender." },
];

export type AgentState = {
  id: string;
  name: string;
  desc: string;
  color: string;
};

export const agentStates: AgentState[] = [
  { id: "spawn", name: "Spawn", desc: "Agent is being created. ID assigned, model bound, budget envelope allocated, skills loaded.", color: "var(--amber-hot)" },
  { id: "running", name: "Running", desc: "Agent is actively processing messages. The runtime loop is live and consuming tokens.", color: "var(--amber-core)" },
  { id: "suspended", name: "Suspended", desc: "Agent is paused. State is checkpointed. Can be resumed with full context restoration.", color: "var(--metal-light)" },
  { id: "terminated", name: "Terminated", desc: "Agent is shut down. Final audit trail is written. State is archived for potential replay.", color: "var(--metal-dark)" },
];

export type StateTransition = {
  id: string;
  from: string;
  to: string;
  label: string;
  desc: string;
};

export const stateTransitions: StateTransition[] = [
  { id: "spawn-run", from: "spawn", to: "running", label: "Activate", desc: "Agent passes initialization checks and enters the active message processing loop." },
  { id: "run-suspend", from: "running", to: "suspended", label: "Suspend", desc: "Operator or policy triggers a pause. State is checkpointed, budget is frozen." },
  { id: "suspend-run", from: "suspended", to: "running", label: "Resume", desc: "Restored from checkpoint. Agent resumes the message loop with prior context intact." },
  { id: "run-term", from: "running", to: "terminated", label: "Shutdown", desc: "Clean shutdown initiated. Final audit trail written, resources released." },
  { id: "suspend-term", from: "suspended", to: "terminated", label: "Decommission", desc: "Suspended agent is permanently shut down. Archived state available for replay." },
];

export const pricingTiers = [
  {
    name: "Open Source",
    price: "Free",
    desc: "Self-host the full Agent OS. No limits. No phone-home.",
    features: [
      "Full kernel + all 14 crates",
      "Unlimited agents",
      "All 40+ channel adapters",
      "Wire protocol (OFP) federation",
      "Skills ecosystem",
      "REST API + dashboard",
      "Community support via GitHub",
    ],
    cta: { label: "Clone the repo", href: siteBrand.githubUrl },
    highlight: false,
  },
  {
    name: "Managed Alpha",
    price: "Early Access",
    desc: "We run clawREFORM for you. Zero ops. Priority support. Alpha pricing locks in.",
    features: [
      "Everything in Open Source",
      "Hosted infrastructure",
      "Automatic updates",
      "Priority email support",
      "Usage dashboard & analytics",
      "SLA during business hours",
      "Alpha pricing grandfathered",
    ],
    cta: { label: "Join the waitlist", href: "/contact" },
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Dedicated deployment, SSO, audit logs, and hands-on onboarding for teams that need control.",
    features: [
      "Everything in Managed",
      "Dedicated infrastructure",
      "SSO / SAML integration",
      "Audit logs & compliance",
      "Custom channel adapters",
      "Architecture review session",
      "Dedicated Slack channel",
    ],
    cta: { label: "Talk to us", href: "/contact" },
    highlight: false,
  },
] as const;

export const downloadMethods = [
  {
    title: "From Source (Recommended)",
    steps: [
      "git clone https://github.com/aegntic/clawreform.git",
      "cd clawreform",
      "cargo build --release",
      "./target/release/clawreform start",
    ],
    note: "Requires Rust 1.75+ and a C linker. Build takes 2-4 minutes on a modern machine.",
  },
  {
    title: "Docker",
    steps: [
      "docker pull ghcr.io/aegntic/clawreform:latest",
      "docker run -p 4332:4332 ghcr.io/aegntic/clawreform:latest",
    ],
    note: "Image includes the binary and default config. Mount a volume at /root/.clawreform for persistent state.",
  },
  {
    title: "npm (JavaScript/TypeScript SDK)",
    steps: ["npm install clawreform"],
    note: "The npm package provides the JS/TS client SDK for interacting with a running clawREFORM instance.",
  },
] as const;

export const architectureLayers = [
  {
    name: "Presentation Layer",
    crates: ["clawreform-cli", "clawreform-desktop"],
    desc: "Interactive terminal UI (Ratatui) and native desktop app (Tauri). Both consume the API layer. The CLI is the primary interface for operators.",
  },
  {
    name: "API Layer",
    crates: ["clawreform-api"],
    desc: "Axum HTTP server with REST endpoints, embedded Alpine.js dashboard, auth middleware, and WebSocket support. Routes are registered in server.rs, handlers in routes.rs.",
  },
  {
    name: "Kernel",
    crates: ["clawreform-kernel"],
    desc: "The core orchestrator. Manages agent lifecycles, dispatches messages to LLM providers, enforces budget limits, and coordinates the runtime. Implements the KernelHandle trait.",
  },
  {
    name: "Services Layer",
    crates: [
      "clawreform-runtime",
      "clawreform-channels",
      "clawreform-wire",
      "clawreform-skills",
      "clawreform-migrate",
    ],
    desc: "Runtime provides tool execution and agent loop. Channels adapts to 40+ messaging platforms. Wire implements OFP for peer-to-peer federation. Skills loads and composes TOML skill packs. Migrate handles schema evolution.",
  },
  {
    name: "Storage",
    crates: ["clawreform-memory"],
    desc: "Pluggable memory backend. Local SQLite by default. Handles conversation history, agent state checkpoints, and budget ledger.",
  },
  {
    name: "Foundation",
    crates: ["clawreform-types"],
    desc: "Shared type definitions, config structs, error types, and serialization. Every other crate depends on this. Zero external dependencies beyond serde.",
  },
] as const;
