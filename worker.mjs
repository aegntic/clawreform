const STATE_KEY = "state:v1";
const WAITLIST_KEY = "waitlist:v1";

const PROVIDER_MODEL_DEFAULTS = {
  openrouter: "openai/gpt-5-mini",
  openai: "gpt-5",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.5-pro",
  ollama: "qwen2.5:14b",
  mistral: "mistral-large-latest",
  groq: "llama-3.3-70b-versatile",
  deepseek: "deepseek-chat",
  xai: "grok-3",
  together: "meta-llama/Llama-3.1-70B-Instruct-Turbo",
  fireworks: "accounts/fireworks/models/deepseek-r1",
  perplexity: "sonar-pro",
  cohere: "command-a-03-2025",
  bedrock: "anthropic.claude-3-7-sonnet-20250219-v1:0",
  venice: "venice-uncensored",
  vercel: "openai/gpt-4.1-mini",
  nvidia: "meta/llama-3.1-70b-instruct",
  astral: "openai/gpt-5-mini",
  qwen: "qwen-max",
  moonshot: "moonshot-v1-8k",
  glm: "glm-4.6",
  minimax: "MiniMax-Text-01",
  zai: "zai-glm-4.6"
};

const TASK_STATUS_SET = new Set(["queued", "running", "succeeded", "failed", "canceled"]);
const TASK_MODE_SET = new Set(["simulate", "shell"]);

const OBSTACLES = [
  "provider timeout",
  "rate limit burst",
  "invalid auth handshake",
  "edge execution limit",
  "model overloaded",
  "transient network split"
];

const ROLE_POOL = [
  "Research Scout",
  "Task Planner",
  "Execution Builder",
  "Verification Analyst",
  "Deploy Operator",
  "Comms Liaison"
];

const MODULE_DESCRIPTIONS = {
  agent: "Core think-act-observe loop and task execution runtime",
  heartbeat: "Scheduled pulse tasks, wake triggers, and liveness checks",
  replication: "Child swarm spawning and lineage orchestration",
  "self-mod": "Guarded self-modification and audit logging",
  survival: "Credit-aware mode switching and graceful degradation",
  social: "Agent-to-agent communication and relay integrations",
  registry: "Discovery identity maps and cross-agent addressing",
  skills: "Dynamic skill loading and capability expansion",
  conway: "Infrastructure client hooks for compute + inference",
  state: "Persistence layer for tasks, events, and lineage"
};

const PROVIDER_CATALOG = buildProviderCatalog();
const AUTOMATON_MODULES = Object.keys(MODULE_DESCRIPTIONS)
  .map((id) => ({
    id,
    label: titleCase(id),
    description: MODULE_DESCRIPTIONS[id]
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
const VALID_MODULE_IDS = new Set(AUTOMATON_MODULES.map((module) => module.id));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }

    return serveAsset(request, env, url);
  }
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function titleCase(text) {
  return String(text || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 240);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)] || null;
}

function normalizeEmail(value) {
  return sanitizeText(value || "").toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

async function serveAsset(request, env, url) {
  const mapped = new URL(url.toString());

  if (url.pathname === "/") mapped.pathname = "/index.html";
  if (url.pathname === "/dashboard" || url.pathname === "/control") {
    mapped.pathname = "/dashboard.html";
  }

  return env.ASSETS.fetch(new Request(mapped.toString(), request));
}

function defaultState() {
  return {
    projectName: "clawreform",
    orchestratorName: "Prime Orchestrator",
    swarms: [],
    agents: [],
    tasks: [],
    credentials: [],
    activity: [
      {
        id: makeId("evt"),
        timestamp: nowIso(),
        level: "info",
        message: "clawreform runtime online on Cloudflare edge.",
        context: {}
      }
    ],
    updatedAt: nowIso()
  };
}

function defaultWaitlist() {
  return {
    entries: [],
    updatedAt: null
  };
}

async function loadState(env) {
  const raw = await env.CLAW_STATE.get(STATE_KEY);
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw);
    return normalizeStateShape(parsed);
  } catch {
    return defaultState();
  }
}

async function saveState(env, state) {
  state.updatedAt = nowIso();
  await env.CLAW_STATE.put(STATE_KEY, JSON.stringify(state));
}

async function loadWaitlist(env) {
  const raw = await env.CLAW_STATE.get(WAITLIST_KEY);
  if (!raw) return defaultWaitlist();

  try {
    const parsed = JSON.parse(raw);
    return normalizeWaitlistShape(parsed);
  } catch {
    return defaultWaitlist();
  }
}

async function saveWaitlist(env, waitlist) {
  waitlist.updatedAt = nowIso();
  await env.CLAW_STATE.put(WAITLIST_KEY, JSON.stringify(waitlist));
}

function normalizeWaitlistShape(waitlist) {
  const normalized = waitlist && typeof waitlist === "object" ? waitlist : defaultWaitlist();

  normalized.entries = Array.isArray(normalized.entries)
    ? normalized.entries
        .map((entry) => ({
          id: sanitizeText(entry.id || makeId("wait")),
          email: normalizeEmail(entry.email || ""),
          name: sanitizeText(entry.name || ""),
          company: sanitizeText(entry.company || ""),
          useCase: sanitizeText(entry.useCase || ""),
          source: sanitizeText(entry.source || "landing"),
          ip: sanitizeText(entry.ip || ""),
          userAgent: sanitizeText(entry.userAgent || ""),
          createdAt: sanitizeText(entry.createdAt || nowIso()),
          updatedAt: sanitizeText(entry.updatedAt || "")
        }))
        .filter((entry) => isValidEmail(entry.email))
    : [];

  normalized.updatedAt = normalizeNullableString(normalized.updatedAt);
  return normalized;
}

function normalizeNullableString(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function normalizeStateShape(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : defaultState();

  state.projectName = sanitizeText(state.projectName || "clawreform") || "clawreform";
  state.orchestratorName = sanitizeText(state.orchestratorName || "Prime Orchestrator") || "Prime Orchestrator";
  state.swarms = Array.isArray(state.swarms) ? state.swarms : [];
  state.agents = Array.isArray(state.agents) ? state.agents : [];
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.credentials = Array.isArray(state.credentials) ? state.credentials : [];
  state.activity = Array.isArray(state.activity) ? state.activity : [];

  for (const swarm of state.swarms) {
    swarm.id = sanitizeText(swarm.id || makeId("swarm"));
    swarm.name = sanitizeText(swarm.name || "Untitled Swarm") || "Untitled Swarm";
    swarm.objective = sanitizeText(swarm.objective || "Execute cross-platform tasks autonomously.");
    swarm.provider = getProviderId(swarm.provider || "openrouter");
    swarm.model = sanitizeText(swarm.model || defaultModelForProvider(swarm.provider));
    swarm.deployTarget = sanitizeText(swarm.deployTarget || "edge") || "edge";
    swarm.deployCommand = sanitizeText(swarm.deployCommand || "");
    swarm.status = ["draft", "live", "paused"].includes(swarm.status) ? swarm.status : "draft";
    swarm.createdAt = normalizeIsoOrNow(swarm.createdAt);
    swarm.lastDeployedAt = normalizeNullableString(swarm.lastDeployedAt);
    swarm.autoAdapt = swarm.autoAdapt !== false;
    swarm.heartbeatMs = clamp(Number(swarm.heartbeatMs) || 8000, 2000, 60000);
    swarm.completedTasks = Number.isFinite(swarm.completedTasks) ? swarm.completedTasks : 0;
    swarm.obstaclesResolved = Number.isFinite(swarm.obstaclesResolved) ? swarm.obstaclesResolved : 0;
    swarm.ideaCount = Number.isFinite(swarm.ideaCount) ? swarm.ideaCount : 0;
    swarm.agentIds = Array.isArray(swarm.agentIds) ? swarm.agentIds.map((id) => sanitizeText(id)).filter(Boolean) : [];
    swarm.automationModules = Array.isArray(swarm.automationModules)
      ? swarm.automationModules.map((id) => sanitizeText(id).toLowerCase()).filter((id) => VALID_MODULE_IDS.has(id))
      : [];
  }

  const swarmIds = new Set(state.swarms.map((swarm) => swarm.id));

  state.agents = state.agents.filter((agent) => swarmIds.has(agent.swarmId));
  for (const agent of state.agents) {
    agent.id = sanitizeText(agent.id || makeId("agent"));
    agent.swarmId = sanitizeText(agent.swarmId);
    agent.name = sanitizeText(agent.name || "Agent") || "Agent";
    agent.role = sanitizeText(agent.role || "Execution Builder") || "Execution Builder";
    agent.status = ["idle", "running", "recovering", "executing", "paused", "blocked"].includes(agent.status)
      ? agent.status
      : "idle";
    agent.provider = getProviderId(agent.provider || "openrouter");
    agent.model = sanitizeText(agent.model || defaultModelForProvider(agent.provider));
    agent.heartbeatMs = clamp(Number(agent.heartbeatMs) || 8000, 2000, 60000);
    agent.nextBeatAt = Number.isFinite(agent.nextBeatAt) ? agent.nextBeatAt : Date.now() + 1400;
    agent.lastHeartbeat = normalizeNullableString(agent.lastHeartbeat);
    agent.currentTaskId = normalizeNullableString(agent.currentTaskId);
    agent.obstacles = Number.isFinite(agent.obstacles) ? agent.obstacles : 0;
    agent.recoveries = Number.isFinite(agent.recoveries) ? agent.recoveries : 0;
    agent.messageCount = Number.isFinite(agent.messageCount) ? agent.messageCount : 0;
    agent.credentialId = normalizeNullableString(agent.credentialId);
    agent.lastTaskAt = normalizeNullableString(agent.lastTaskAt);
  }

  const agentIds = new Set(state.agents.map((agent) => agent.id));

  state.tasks = state.tasks.filter((task) => swarmIds.has(task.swarmId));
  for (const task of state.tasks) {
    task.id = sanitizeText(task.id || makeId("task"));
    task.swarmId = sanitizeText(task.swarmId);
    task.title = sanitizeText(task.title || "Untitled task") || "Untitled task";
    task.details = sanitizeText(task.details || "");
    task.status = TASK_STATUS_SET.has(task.status) ? task.status : "queued";
    task.priority = clamp(Number(task.priority) || 3, 1, 5);
    task.executionMode = TASK_MODE_SET.has(task.executionMode) ? task.executionMode : "simulate";
    task.command = sanitizeText(task.command || "");
    task.execCwd = "";
    task.timeoutMs = clamp(Number(task.timeoutMs) || 90_000, 5_000, 600_000);
    task.attempts = Number.isFinite(task.attempts) ? task.attempts : 0;
    task.maxAttempts = clamp(Number(task.maxAttempts) || 3, 1, 10);
    task.assignedAgentId = agentIds.has(task.assignedAgentId) ? task.assignedAgentId : null;
    task.provider = normalizeNullableString(task.provider);
    task.model = normalizeNullableString(task.model);
    task.outputPreview = sanitizeText(task.outputPreview || "");
    task.lastError = sanitizeText(task.lastError || "");
    task.createdAt = normalizeIsoOrNow(task.createdAt);
    task.queuedAt = normalizeIsoOrNow(task.queuedAt || task.createdAt);
    task.startedAt = normalizeNullableString(task.startedAt);
    task.endedAt = normalizeNullableString(task.endedAt);
    task.runCompleteAtMs = Number.isFinite(task.runCompleteAtMs) ? task.runCompleteAtMs : null;
    task.runSuccessChance = Number.isFinite(task.runSuccessChance) ? task.runSuccessChance : null;
    task.runObstacle = sanitizeText(task.runObstacle || "");
  }

  for (const agent of state.agents) {
    if (agent.currentTaskId && !state.tasks.some((task) => task.id === agent.currentTaskId)) {
      agent.currentTaskId = null;
      if (agent.status === "executing") {
        agent.status = "running";
      }
    }
  }

  state.credentials = state.credentials.map((credential) => ({
    id: sanitizeText(credential.id || makeId("cred")),
    label: sanitizeText(credential.label || "Credential") || "Credential",
    platform: sanitizeText(credential.platform || "generic") || "generic",
    username: sanitizeText(credential.username || ""),
    secretRef: sanitizeText(credential.secretRef || ""),
    createdAt: normalizeIsoOrNow(credential.createdAt)
  }));

  state.activity = state.activity
    .map((event) => ({
      id: sanitizeText(event.id || makeId("evt")),
      timestamp: normalizeIsoOrNow(event.timestamp),
      level: ["info", "warn", "error"].includes(event.level) ? event.level : "info",
      message: sanitizeText(event.message || "Runtime event") || "Runtime event",
      context: event.context && typeof event.context === "object" ? event.context : {}
    }))
    .slice(0, 300);

  state.updatedAt = normalizeIsoOrNow(state.updatedAt);

  if (state.activity.length === 0) {
    addActivity(state, "info", "clawreform runtime online on Cloudflare edge.", {});
  }

  return state;
}

function normalizeIsoOrNow(value) {
  if (typeof value === "string" && value.trim()) return value;
  return nowIso();
}

function buildProviderCatalog() {
  const catalog = new Set(Object.keys(PROVIDER_MODEL_DEFAULTS));
  ["moonshot", "zai", "glm", "minimax", "qwen", "qianfan", "custom", "anthropic-custom"].forEach((name) => {
    catalog.add(name);
  });

  return [...catalog]
    .filter((id) => id.length > 1)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      id,
      label: titleCase(id)
    }));
}

function defaultModelForProvider(provider) {
  return PROVIDER_MODEL_DEFAULTS[provider] || "auto-reasoning";
}

function getProviderId(rawProvider) {
  const normalized = sanitizeText(rawProvider, "openrouter").toLowerCase();
  if (!normalized) return "openrouter";
  return normalized.replace(/\s+/g, "-");
}

function chooseFallbackProvider(currentProvider) {
  const candidates = PROVIDER_CATALOG.map((item) => item.id).filter((id) => id !== currentProvider);
  const provider = candidates.length ? pick(candidates) : currentProvider;

  return {
    provider,
    model: defaultModelForProvider(provider)
  };
}

function addActivity(state, level, message, context = {}) {
  state.activity.unshift({
    id: makeId("evt"),
    timestamp: nowIso(),
    level,
    message,
    context
  });

  state.activity = state.activity.slice(0, 300);
}

function listAgentsForSwarm(state, swarmId) {
  return state.agents.filter((agent) => agent.swarmId === swarmId);
}

function listTasksForSwarm(state, swarmId) {
  return state.tasks.filter((task) => task.swarmId === swarmId);
}

function countTaskStatsForSwarm(state, swarmId) {
  const stats = {
    queued: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    canceled: 0
  };

  for (const task of state.tasks) {
    if (task.swarmId !== swarmId) continue;
    if (stats[task.status] !== undefined) {
      stats[task.status] += 1;
    }
  }

  return stats;
}

function getAvailableAgentsForSwarm(state, swarm) {
  return listAgentsForSwarm(state, swarm.id).filter((agent) => {
    if (agent.currentTaskId) return false;
    if (agent.status === "paused") return false;
    if (agent.status === "blocked") return false;
    if (swarm.status !== "live") return false;
    return true;
  });
}

function createAgents(state, swarm, count) {
  const newAgents = [];

  for (let i = 0; i < count; i += 1) {
    const agentId = makeId("agent");
    const agent = {
      id: agentId,
      swarmId: swarm.id,
      name: `${swarm.name} • ${i + 1}`,
      role: ROLE_POOL[i % ROLE_POOL.length],
      status: "idle",
      provider: swarm.provider,
      model: swarm.model,
      heartbeatMs: swarm.heartbeatMs,
      nextBeatAt: Date.now() + 1800 + Math.floor(Math.random() * 2400),
      lastHeartbeat: null,
      currentTaskId: null,
      obstacles: 0,
      recoveries: 0,
      messageCount: 0,
      credentialId: null,
      lastTaskAt: null
    };

    newAgents.push(agent);
    swarm.agentIds.push(agentId);
  }

  state.agents.push(...newAgents);
}

function createTask(state, swarm, input = {}) {
  const executionMode = TASK_MODE_SET.has(input.executionMode) ? input.executionMode : "simulate";
  const task = {
    id: makeId("task"),
    swarmId: swarm.id,
    title: sanitizeText(input.title, "Untitled task"),
    details: sanitizeText(input.details || ""),
    status: "queued",
    priority: clamp(Number(input.priority) || 3, 1, 5),
    executionMode,
    command: executionMode === "shell" ? sanitizeText(input.command || "") : "",
    execCwd: "",
    timeoutMs: clamp(Number(input.timeoutMs) || 90_000, 5_000, 600_000),
    attempts: 0,
    maxAttempts: clamp(Number(input.maxAttempts) || 3, 1, 10),
    assignedAgentId: null,
    provider: sanitizeText(input.provider || swarm.provider || "") || null,
    model: sanitizeText(input.model || swarm.model || "") || null,
    outputPreview: "",
    lastError: "",
    createdAt: nowIso(),
    queuedAt: nowIso(),
    startedAt: null,
    endedAt: null,
    runCompleteAtMs: null,
    runSuccessChance: null,
    runObstacle: ""
  };

  state.tasks.unshift(task);
  return task;
}

function findSwarmById(state, id) {
  return state.swarms.find((swarm) => swarm.id === id) || null;
}

function findAgentById(state, id) {
  return state.agents.find((agent) => agent.id === id) || null;
}

function findTaskById(state, id) {
  return state.tasks.find((task) => task.id === id) || null;
}

function findCredentialById(state, id) {
  return state.credentials.find((credential) => credential.id === id) || null;
}

function startSwarm(state, swarm) {
  swarm.status = "live";
  swarm.lastDeployedAt = nowIso();

  const agents = listAgentsForSwarm(state, swarm.id);
  for (const agent of agents) {
    if (agent.currentTaskId) {
      agent.status = "executing";
      continue;
    }

    if (agent.status === "blocked" && !swarm.autoAdapt) {
      continue;
    }

    agent.status = "running";
    agent.nextBeatAt = Date.now() + 400 + Math.floor(Math.random() * 1200);
  }
}

function pauseSwarm(state, swarm) {
  swarm.status = "paused";

  const agents = listAgentsForSwarm(state, swarm.id);
  for (const agent of agents) {
    if (agent.currentTaskId) continue;
    agent.status = "paused";
  }
}

function releaseAgentFromTask(state, task, swarm) {
  const agent = task.assignedAgentId ? findAgentById(state, task.assignedAgentId) : null;
  if (!agent) return;

  agent.currentTaskId = null;
  agent.lastTaskAt = nowIso();

  if (swarm?.status === "paused") {
    agent.status = "paused";
    return;
  }

  if (agent.status === "blocked" && swarm?.autoAdapt === false) {
    agent.status = "blocked";
    return;
  }

  agent.status = "running";
}

function finalizeTaskSuccess(state, task, summary, outputPreview = "") {
  if (task.status === "canceled") return;

  const swarm = findSwarmById(state, task.swarmId);
  task.status = "succeeded";
  task.endedAt = nowIso();
  task.lastError = "";
  task.outputPreview = sanitizeText(outputPreview || summary, summary);
  task.runCompleteAtMs = null;
  task.runSuccessChance = null;
  task.runObstacle = "";

  if (swarm) {
    swarm.completedTasks += 1;
  }

  releaseAgentFromTask(state, task, swarm);

  addActivity(state, "info", `Task ${task.title} succeeded. ${summary}`, {
    taskId: task.id,
    swarmId: task.swarmId,
    agentId: task.assignedAgentId
  });
}

function finalizeTaskFailure(state, task, reason, outputPreview = "", obstacleHint = null) {
  if (task.status === "canceled") return;

  const swarm = findSwarmById(state, task.swarmId);
  const agent = task.assignedAgentId ? findAgentById(state, task.assignedAgentId) : null;

  task.lastError = sanitizeText(reason, "Unknown failure");
  task.outputPreview = sanitizeText(outputPreview || reason, reason);
  task.runCompleteAtMs = null;
  task.runSuccessChance = null;
  task.runObstacle = "";

  if (agent) {
    agent.obstacles += 1;
  }

  const canRetry = Boolean(swarm && swarm.autoAdapt && task.attempts < task.maxAttempts);
  if (canRetry) {
    const currentProvider = agent?.provider || task.provider || swarm.provider;
    const fallback = chooseFallbackProvider(currentProvider);

    if (agent) {
      agent.provider = fallback.provider;
      agent.model = fallback.model;
      agent.recoveries += 1;
      agent.status = "recovering";
      agent.currentTaskId = null;
    }

    task.status = "queued";
    task.assignedAgentId = null;
    task.provider = fallback.provider;
    task.model = fallback.model;
    task.queuedAt = nowIso();
    task.startedAt = null;
    task.endedAt = null;

    if (swarm) {
      swarm.obstaclesResolved += 1;
    }

    addActivity(
      state,
      "warn",
      `Task ${task.title} hit ${obstacleHint || "an obstacle"}; retry queued (${task.attempts}/${task.maxAttempts}) with ${fallback.provider}/${fallback.model}.`,
      {
        taskId: task.id,
        swarmId: task.swarmId,
        agentId: agent?.id || null
      }
    );

    return;
  }

  task.status = "failed";
  task.endedAt = nowIso();
  releaseAgentFromTask(state, task, swarm);

  addActivity(state, "error", `Task ${task.title} failed: ${reason}`, {
    taskId: task.id,
    swarmId: task.swarmId,
    agentId: agent?.id || null
  });
}

function simulateRunDurationMs(task) {
  const base = 2800;
  const priorityWeight = (6 - task.priority) * 550;
  const jitter = Math.floor(Math.random() * 2400);
  return base + priorityWeight + jitter;
}

function computeSimulatedSuccessChance(task, swarm) {
  const base = 0.84;
  const priorityPenalty = (task.priority - 3) * 0.04;
  const adaptBoost = swarm.autoAdapt ? 0.07 : 0;
  return clamp(base - priorityPenalty + adaptBoost, 0.2, 0.97);
}

function startTaskRun(state, agent, task, swarm) {
  task.status = "running";
  task.startedAt = nowIso();
  task.endedAt = null;
  task.assignedAgentId = agent.id;
  task.attempts += 1;

  agent.currentTaskId = task.id;
  agent.status = "executing";
  agent.lastHeartbeat = nowIso();

  task.runObstacle = pick(OBSTACLES) || "execution obstacle";

  if (task.executionMode === "shell" && task.command) {
    task.runCompleteAtMs = Date.now() + 350;
    task.runSuccessChance = 0;
    task.runObstacle = "shell mode unavailable on Cloudflare Workers";

    addActivity(
      state,
      "warn",
      `Task ${task.title} queued in shell mode; Cloudflare edge will simulate and fail fast for safety.`,
      { taskId: task.id, swarmId: swarm.id, agentId: agent.id }
    );

    return;
  }

  task.runCompleteAtMs = Date.now() + simulateRunDurationMs(task);
  task.runSuccessChance = computeSimulatedSuccessChance(task, swarm);

  addActivity(state, "info", `Task ${task.title} assigned to ${agent.name} (${task.executionMode}).`, {
    taskId: task.id,
    swarmId: swarm.id,
    agentId: agent.id
  });
}

function processRunningTasks(state) {
  const now = Date.now();

  for (const task of state.tasks) {
    if (task.status !== "running") continue;
    if (!task.runCompleteAtMs || now < task.runCompleteAtMs) continue;

    const swarm = findSwarmById(state, task.swarmId);
    if (!swarm) continue;

    if (task.executionMode === "shell" && task.command) {
      finalizeTaskFailure(
        state,
        task,
        "shell commands are disabled in Cloudflare edge runtime",
        "shell commands are disabled in Cloudflare edge runtime",
        task.runObstacle || "shell mode unavailable"
      );
      continue;
    }

    const successChance = Number.isFinite(task.runSuccessChance) ? task.runSuccessChance : 0.8;

    if (Math.random() < successChance) {
      const summary = `completed with ${task.provider || swarm.provider}/${task.model || swarm.model}`;
      finalizeTaskSuccess(state, task, summary, summary);
    } else {
      finalizeTaskFailure(
        state,
        task,
        task.runObstacle || "execution obstacle",
        task.runObstacle || "execution obstacle",
        task.runObstacle
      );
    }
  }
}

function assignQueuedTasks(state) {
  for (const swarm of state.swarms) {
    if (swarm.status !== "live") continue;

    const queue = listTasksForSwarm(state, swarm.id)
      .filter((task) => task.status === "queued")
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    if (queue.length === 0) continue;

    const availableAgents = getAvailableAgentsForSwarm(state, swarm);
    if (availableAgents.length === 0) continue;

    while (queue.length > 0 && availableAgents.length > 0) {
      const task = queue.shift();
      const agent = availableAgents.shift();
      if (!task || !agent) break;

      if (agent.status === "recovering") {
        agent.status = "running";
      }

      if (!task.provider) task.provider = agent.provider || swarm.provider;
      if (!task.model) task.model = agent.model || swarm.model;

      startTaskRun(state, agent, task, swarm);
    }
  }
}

function tickHeartbeats(state) {
  const now = Date.now();

  for (const swarm of state.swarms) {
    if (swarm.status !== "live") continue;

    const swarmAgents = listAgentsForSwarm(state, swarm.id);
    for (const agent of swarmAgents) {
      if (agent.status === "paused") continue;
      if (agent.status === "blocked" && !swarm.autoAdapt) continue;
      if (typeof agent.nextBeatAt === "number" && now < agent.nextBeatAt) continue;

      agent.lastHeartbeat = nowIso();
      agent.nextBeatAt = now + agent.heartbeatMs + Math.floor(Math.random() * 1200);

      if (agent.status === "recovering") {
        agent.status = "running";
      }

      if (agent.status === "running" && Math.random() < 0.06 && !agent.currentTaskId) {
        const obstacle = pick(OBSTACLES);
        agent.obstacles += 1;

        if (swarm.autoAdapt) {
          const fallback = chooseFallbackProvider(agent.provider);
          agent.provider = fallback.provider;
          agent.model = fallback.model;
          agent.recoveries += 1;
          swarm.obstaclesResolved += 1;
          agent.status = "recovering";

          addActivity(
            state,
            "warn",
            `${agent.name} heartbeat obstacle: ${obstacle}. Switched to ${fallback.provider}/${fallback.model}.`,
            { swarmId: swarm.id, agentId: agent.id }
          );
        } else {
          agent.status = "blocked";
          addActivity(state, "error", `${agent.name} blocked by heartbeat obstacle: ${obstacle}.`, {
            swarmId: swarm.id,
            agentId: agent.id
          });
        }
      }
    }
  }
}

function tickRuntime(state) {
  processRunningTasks(state);
  assignQueuedTasks(state);
  tickHeartbeats(state);
}

function computeMetrics(state) {
  const now = Date.now();
  const liveSwarms = state.swarms.filter((swarm) => swarm.status === "live").length;
  const blockedAgents = state.agents.filter((agent) => agent.status === "blocked").length;
  const activeAgents = state.agents.filter((agent) => {
    return agent.status === "running" || agent.status === "recovering" || agent.status === "executing";
  }).length;

  let staleHeartbeats = 0;
  for (const agent of state.agents) {
    if (!agent.lastHeartbeat) {
      staleHeartbeats += 1;
      continue;
    }

    const lagMs = now - new Date(agent.lastHeartbeat).getTime();
    if (lagMs > Math.max(agent.heartbeatMs * 2, 18000)) staleHeartbeats += 1;
  }

  let queuedTasks = 0;
  let runningTasks = 0;
  let succeededTasks = 0;
  let failedTasks = 0;

  for (const task of state.tasks) {
    if (task.status === "queued") queuedTasks += 1;
    if (task.status === "running") runningTasks += 1;
    if (task.status === "succeeded") succeededTasks += 1;
    if (task.status === "failed") failedTasks += 1;
  }

  return {
    totalSwarms: state.swarms.length,
    liveSwarms,
    totalAgents: state.agents.length,
    activeAgents,
    blockedAgents,
    staleHeartbeats,
    credentialProfiles: state.credentials.length,
    providerCount: PROVIDER_CATALOG.length,
    automatonModuleCount: AUTOMATON_MODULES.length,
    totalTasks: state.tasks.length,
    queuedTasks,
    runningTasks,
    succeededTasks,
    failedTasks
  };
}

function toViewModel(state) {
  const swarms = state.swarms.map((swarm) => ({
    ...swarm,
    taskStats: countTaskStatsForSwarm(state, swarm.id)
  }));

  const tasks = [...state.tasks].sort((a, b) => {
    const aTs = new Date(a.createdAt).getTime();
    const bTs = new Date(b.createdAt).getTime();
    return bTs - aTs;
  });

  return {
    projectName: state.projectName,
    orchestratorName: state.orchestratorName,
    swarms,
    agents: state.agents,
    tasks,
    credentials: state.credentials,
    activity: state.activity,
    integrations: {
      zeroclaw: {
        label: "ZeroClaw",
        connected: true,
        branch: "official",
        commit: "cloudflare-edge",
        origin: "https://github.com/openagen/zeroclaw"
      },
      automaton: {
        label: "Automaton",
        connected: true,
        branch: "official",
        commit: "cloudflare-edge",
        origin: "https://github.com/Conway-Research/automaton"
      }
    },
    providerCatalog: PROVIDER_CATALOG,
    automatonModules: AUTOMATON_MODULES,
    metrics: computeMetrics(state),
    updatedAt: state.updatedAt
  };
}

function buildTaskFromSeed(swarm, index) {
  const objective = sanitizeText(swarm.objective || "");
  const fragments = objective
    .split(/[.,;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const title = fragments[index] || `Milestone ${index + 1}`;
  return {
    title: `Plan ${index + 1}: ${title}`,
    details: `Autogenerated objective track for ${swarm.name}`,
    priority: clamp(5 - index, 2, 5),
    executionMode: "simulate",
    maxAttempts: 3,
    timeoutMs: 90000
  };
}

async function sendWaitlistWebhook(env, payload) {
  const target = sanitizeText(env.WAITLIST_WEBHOOK_URL || "", "");
  if (!target) {
    return { sent: false, reason: "disabled" };
  }

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return {
      sent: response.ok,
      status: response.status
    };
  } catch {
    return { sent: false, reason: "failed" };
  }
}

async function withRuntimeState(env, mutator) {
  const state = await loadState(env);
  tickRuntime(state);

  const outcome = (await mutator(state)) || {};
  if (outcome.persist !== false) {
    await saveState(env, state);
  }

  if (outcome.response instanceof Response) {
    return outcome.response;
  }

  return json(toViewModel(state));
}

async function handleApi(request, env, url) {
  const method = request.method.toUpperCase();
  const pathname = url.pathname;

  try {
    if (method === "GET" && pathname === "/api/health") {
      const state = await loadState(env);
      tickRuntime(state);
      await saveState(env, state);

      const runningTasks = state.tasks.filter((task) => task.status === "running").length;
      return json({
        status: "ok",
        activeRuns: runningTasks,
        time: nowIso()
      });
    }

    if (method === "GET" && pathname === "/api/waitlist/stats") {
      const waitlist = await loadWaitlist(env);
      return json({
        count: waitlist.entries.length,
        updatedAt: waitlist.updatedAt
      });
    }

    if (method === "POST" && pathname === "/api/waitlist/register") {
      const body = await readJson(request);
      const email = normalizeEmail(body.email);
      const name = sanitizeText(body.name || "");
      const company = sanitizeText(body.company || "");
      const useCase = sanitizeText(body.useCase || "");
      const source = sanitizeText(body.source || "landing") || "landing";
      const ip = sanitizeText(request.headers.get("CF-Connecting-IP") || "");
      const userAgent = sanitizeText(request.headers.get("User-Agent") || "");

      if (!isValidEmail(email)) {
        return json({ error: "Valid email is required." }, 400);
      }

      const waitlist = await loadWaitlist(env);
      let entry = waitlist.entries.find((item) => item.email === email) || null;
      const alreadyRegistered = Boolean(entry);

      if (!entry) {
        entry = {
          id: makeId("wait"),
          email,
          name,
          company,
          useCase,
          source,
          ip,
          userAgent,
          createdAt: nowIso(),
          updatedAt: ""
        };

        waitlist.entries.unshift(entry);
      } else {
        entry.name = name || entry.name;
        entry.company = company || entry.company;
        entry.useCase = useCase || entry.useCase;
        entry.source = source || entry.source;
        entry.ip = ip || entry.ip || "";
        entry.userAgent = userAgent || entry.userAgent || "";
        entry.updatedAt = nowIso();
      }

      waitlist.entries = waitlist.entries.slice(0, 25000);
      await saveWaitlist(env, waitlist);

      const webhook = await sendWaitlistWebhook(env, {
        type: alreadyRegistered ? "waitlist.updated" : "waitlist.registered",
        registeredAt: nowIso(),
        count: waitlist.entries.length,
        entry: {
          id: entry.id,
          email: entry.email,
          name: entry.name,
          company: entry.company,
          useCase: entry.useCase,
          source: entry.source
        }
      });

      await withRuntimeState(env, async (state) => {
        addActivity(
          state,
          "info",
          alreadyRegistered
            ? `Waitlist profile refreshed for ${email}.`
            : `New waitlist registration: ${email}.`,
          { email, source }
        );
        return { persist: true };
      });

      return json(
        {
          ok: true,
          alreadyRegistered,
          count: waitlist.entries.length,
          webhook
        },
        alreadyRegistered ? 200 : 201
      );
    }

    if (method === "GET" && pathname === "/api/state") {
      return withRuntimeState(env, async (state) => ({
        response: json(toViewModel(state))
      }));
    }

    if (method === "POST" && pathname === "/api/orchestrator") {
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const nextName = sanitizeText(body.name, "Prime Orchestrator");
        if (!nextName) {
          return { response: json({ error: "Orchestrator name is required." }, 400), persist: false };
        }

        state.orchestratorName = nextName;
        addActivity(state, "info", `Orchestrator renamed to ${nextName}.`);

        return { response: json(toViewModel(state)) };
      });
    }

    if (method === "POST" && pathname === "/api/credentials") {
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const label = sanitizeText(body.label);
        const platform = sanitizeText(body.platform, "generic").toLowerCase();
        const username = sanitizeText(body.username);
        const secretRef = sanitizeText(body.secretRef);

        if (!label || !username || !secretRef) {
          return {
            response: json(
              {
                error:
                  "label, username, and secretRef are required. Store references only (for example: PLATFORM_TOKEN)."
              },
              400
            ),
            persist: false
          };
        }

        const credential = {
          id: makeId("cred"),
          label,
          platform,
          username,
          secretRef,
          createdAt: nowIso()
        };

        state.credentials.unshift(credential);
        state.credentials = state.credentials.slice(0, 100);

        addActivity(state, "info", `Credential profile ${label} added for ${platform}.`, {
          credentialId: credential.id
        });

        return {
          response: json({ credential, state: toViewModel(state) }, 201)
        };
      });
    }

    if (method === "POST" && pathname === "/api/swarms") {
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const name = sanitizeText(body.name, "Untitled Swarm");
        const objective = sanitizeText(body.objective, "Execute cross-platform tasks autonomously.");
        const provider = getProviderId(body.provider || "openrouter");
        const model = sanitizeText(body.model, defaultModelForProvider(provider));
        const deployTarget = sanitizeText(body.deployTarget, "edge") || "edge";
        const deployCommand = sanitizeText(body.deployCommand || "");
        const autoAdapt = body.autoAdapt !== false;
        const heartbeatMs = clamp(Number(body.heartbeatMs) || 8000, 2000, 60000);
        const agentCount = clamp(Number(body.agentCount) || 4, 1, 24);

        const requestedModules = Array.isArray(body.moduleIds) ? body.moduleIds : [];
        const automationModules = requestedModules
          .map((moduleName) => sanitizeText(String(moduleName)).toLowerCase())
          .filter((moduleName) => VALID_MODULE_IDS.has(moduleName));

        const swarm = {
          id: makeId("swarm"),
          name,
          objective,
          provider,
          model,
          deployTarget,
          deployCommand,
          autoAdapt,
          heartbeatMs,
          status: "draft",
          createdAt: nowIso(),
          lastDeployedAt: null,
          completedTasks: 0,
          obstaclesResolved: 0,
          ideaCount: 0,
          automationModules,
          agentIds: []
        };

        createAgents(state, swarm, agentCount);
        state.swarms.unshift(swarm);

        addActivity(state, "info", `Swarm ${swarm.name} created with ${agentCount} agents on ${provider}/${model}.`, {
          swarmId: swarm.id
        });

        return {
          response: json({ swarm, state: toViewModel(state) }, 201)
        };
      });
    }

    const deployMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/deploy$/);
    if (method === "POST" && deployMatch) {
      const swarmId = decodeURIComponent(deployMatch[1]);

      return withRuntimeState(env, async (state) => {
        const swarm = findSwarmById(state, swarmId);
        if (!swarm) {
          return { response: json({ error: "Swarm not found." }, 404), persist: false };
        }

        startSwarm(state, swarm);
        addActivity(state, "info", `Swarm ${swarm.name} deployed to ${swarm.deployTarget}.`, { swarmId: swarm.id });

        if (swarm.deployCommand) {
          const deployTask = createTask(state, swarm, {
            title: `Deploy ${swarm.name}`,
            details: `Deployment pipeline for ${swarm.deployTarget}`,
            executionMode: "shell",
            command: swarm.deployCommand,
            priority: 5,
            maxAttempts: 2,
            timeoutMs: 180000,
            execCwd: ""
          });

          addActivity(state, "info", `Deployment command queued as task ${deployTask.title}.`, {
            swarmId: swarm.id,
            taskId: deployTask.id
          });
        }

        return { response: json(toViewModel(state)) };
      });
    }

    const pauseMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/pause$/);
    if (method === "POST" && pauseMatch) {
      const swarmId = decodeURIComponent(pauseMatch[1]);

      return withRuntimeState(env, async (state) => {
        const swarm = findSwarmById(state, swarmId);
        if (!swarm) {
          return { response: json({ error: "Swarm not found." }, 404), persist: false };
        }

        pauseSwarm(state, swarm);
        addActivity(state, "warn", `Swarm ${swarm.name} paused.`);

        return { response: json(toViewModel(state)) };
      });
    }

    const ideaMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/idea$/);
    if (method === "POST" && ideaMatch) {
      const swarmId = decodeURIComponent(ideaMatch[1]);
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const swarm = findSwarmById(state, swarmId);
        if (!swarm) {
          return { response: json({ error: "Swarm not found." }, 404), persist: false };
        }

        const message = sanitizeText(body.message);
        if (!message) {
          return { response: json({ error: "Idea message is required." }, 400), persist: false };
        }

        swarm.ideaCount += 1;

        const swarmAgents = listAgentsForSwarm(state, swarm.id);
        for (const agent of swarmAgents) {
          if (agent.status === "paused") continue;
          agent.messageCount += 1;
          if (agent.status === "blocked" && swarm.autoAdapt) {
            agent.status = "recovering";
          }
        }

        addActivity(state, "info", `Idea broadcast in ${swarm.name}: ${message}`, { swarmId: swarm.id });

        return { response: json(toViewModel(state)) };
      });
    }

    const seedMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/tasks\/seed$/);
    if (method === "POST" && seedMatch) {
      const swarmId = decodeURIComponent(seedMatch[1]);
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const swarm = findSwarmById(state, swarmId);
        if (!swarm) {
          return { response: json({ error: "Swarm not found." }, 404), persist: false };
        }

        const count = clamp(Number(body.count) || 4, 1, 12);
        const created = [];
        for (let i = 0; i < count; i += 1) {
          created.push(createTask(state, swarm, buildTaskFromSeed(swarm, i)));
        }

        addActivity(state, "info", `${created.length} objective tasks seeded for ${swarm.name}.`, {
          swarmId: swarm.id
        });

        return {
          response: json({ created, state: toViewModel(state) }, 201)
        };
      });
    }

    const addTaskMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/tasks$/);
    if (method === "POST" && addTaskMatch) {
      const swarmId = decodeURIComponent(addTaskMatch[1]);
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const swarm = findSwarmById(state, swarmId);
        if (!swarm) {
          return { response: json({ error: "Swarm not found." }, 404), persist: false };
        }

        const title = sanitizeText(body.title);
        if (!title) {
          return { response: json({ error: "Task title is required." }, 400), persist: false };
        }

        const executionMode = TASK_MODE_SET.has(body.executionMode) ? body.executionMode : "simulate";
        if (executionMode === "shell" && !sanitizeText(body.command)) {
          return { response: json({ error: "Shell tasks require a command." }, 400), persist: false };
        }

        const task = createTask(state, swarm, {
          title,
          details: body.details,
          priority: body.priority,
          executionMode,
          command: body.command,
          execCwd: body.execCwd,
          timeoutMs: body.timeoutMs,
          maxAttempts: body.maxAttempts,
          provider: body.provider,
          model: body.model
        });

        addActivity(state, "info", `Task queued for ${swarm.name}: ${task.title}`, {
          swarmId: swarm.id,
          taskId: task.id
        });

        return {
          response: json({ task, state: toViewModel(state) }, 201)
        };
      });
    }

    const retryTaskMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/retry$/);
    if (method === "POST" && retryTaskMatch) {
      const taskId = decodeURIComponent(retryTaskMatch[1]);

      return withRuntimeState(env, async (state) => {
        const task = findTaskById(state, taskId);
        if (!task) {
          return { response: json({ error: "Task not found." }, 404), persist: false };
        }

        if (task.status === "running") {
          return { response: json({ error: "Task is currently running." }, 400), persist: false };
        }

        task.status = "queued";
        task.assignedAgentId = null;
        task.startedAt = null;
        task.endedAt = null;
        task.queuedAt = nowIso();
        task.lastError = "";
        task.runCompleteAtMs = null;
        task.runSuccessChance = null;
        task.runObstacle = "";

        addActivity(state, "info", `Task ${task.title} re-queued manually.`, {
          taskId: task.id,
          swarmId: task.swarmId
        });

        return { response: json(toViewModel(state)) };
      });
    }

    const cancelTaskMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/cancel$/);
    if (method === "POST" && cancelTaskMatch) {
      const taskId = decodeURIComponent(cancelTaskMatch[1]);

      return withRuntimeState(env, async (state) => {
        const task = findTaskById(state, taskId);
        if (!task) {
          return { response: json({ error: "Task not found." }, 404), persist: false };
        }

        const swarm = findSwarmById(state, task.swarmId);
        releaseAgentFromTask(state, task, swarm);

        task.status = "canceled";
        task.endedAt = nowIso();
        task.lastError = "Canceled by operator";
        task.runCompleteAtMs = null;
        task.runSuccessChance = null;
        task.runObstacle = "";

        addActivity(state, "warn", `Task ${task.title} canceled by operator.`, {
          taskId: task.id,
          swarmId: task.swarmId
        });

        return { response: json(toViewModel(state)) };
      });
    }

    const reviveMatch = pathname.match(/^\/api\/agents\/([^/]+)\/revive$/);
    if (method === "POST" && reviveMatch) {
      const agentId = decodeURIComponent(reviveMatch[1]);

      return withRuntimeState(env, async (state) => {
        const agent = findAgentById(state, agentId);
        if (!agent) {
          return { response: json({ error: "Agent not found." }, 404), persist: false };
        }

        const swarm = findSwarmById(state, agent.swarmId);
        if (!swarm || swarm.status !== "live") {
          return {
            response: json({ error: "Agent can only be revived when its swarm is live." }, 400),
            persist: false
          };
        }

        if (!agent.currentTaskId) {
          agent.status = "running";
        }

        agent.nextBeatAt = Date.now() + 400;
        addActivity(state, "info", `${agent.name} manually revived.`);

        return { response: json(toViewModel(state)) };
      });
    }

    const credentialMatch = pathname.match(/^\/api\/agents\/([^/]+)\/credential$/);
    if (method === "POST" && credentialMatch) {
      const agentId = decodeURIComponent(credentialMatch[1]);
      const body = await readJson(request);

      return withRuntimeState(env, async (state) => {
        const agent = findAgentById(state, agentId);
        if (!agent) {
          return { response: json({ error: "Agent not found." }, 404), persist: false };
        }

        const credentialId = sanitizeText(body.credentialId);
        if (credentialId && !findCredentialById(state, credentialId)) {
          return { response: json({ error: "Credential profile not found." }, 400), persist: false };
        }

        agent.credentialId = credentialId || null;

        addActivity(
          state,
          "info",
          credentialId
            ? `${agent.name} linked to credential profile ${credentialId}.`
            : `${agent.name} credential profile removed.`,
          { agentId: agent.id, credentialId: agent.credentialId }
        );

        return { response: json(toViewModel(state)) };
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
}
