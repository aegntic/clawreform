import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const STATE_FILE = path.join(__dirname, "runtime-state.json");
const ZEROCLAW_ROOT = path.join(WORKSPACE_ROOT, "zeroclaw");
const AUTOMATON_ROOT = path.join(WORKSPACE_ROOT, "automaton");
const PORT = Number(process.env.PORT || 4545);

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
  "sandbox command failure",
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

const activeRuns = new Map();

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function titleCase(text) {
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 240);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)] || null;
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonSafe(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function runGit(repoPath, args) {
  try {
    const out = spawnSync("git", args, {
      cwd: repoPath,
      encoding: "utf8"
    });
    if (out.status !== 0) return null;
    return (out.stdout || "").trim() || null;
  } catch {
    return null;
  }
}

function getRepoSnapshot(repoPath, label) {
  if (!fs.existsSync(repoPath)) {
    return {
      label,
      path: repoPath,
      connected: false
    };
  }

  return {
    label,
    path: repoPath,
    connected: true,
    branch: runGit(repoPath, ["rev-parse", "--abbrev-ref", "HEAD"]),
    commit: runGit(repoPath, ["rev-parse", "--short", "HEAD"]),
    origin: runGit(repoPath, ["remote", "get-url", "origin"])
  };
}

function discoverZeroclawProviders() {
  const catalog = new Set(Object.keys(PROVIDER_MODEL_DEFAULTS));
  const modPath = path.join(ZEROCLAW_ROOT, "src/providers/mod.rs");

  if (fs.existsSync(modPath)) {
    const source = fs.readFileSync(modPath, "utf8");
    const matchBlock = source.match(/match name \{([\s\S]*?)\n\s*_\s*=>/m);
    const block = matchBlock ? matchBlock[1] : source;

    for (const line of block.split("\n")) {
      if (!line.includes("=>")) continue;
      const left = line.split("=>")[0];
      if (!left.includes('"')) continue;

      const values = [...left.matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
      for (const candidate of values) {
        if (!candidate) continue;
        if (candidate.includes("http://") || candidate.includes("https://")) continue;
        if (candidate.includes(" ")) continue;
        if (candidate.includes("custom:")) continue;
        catalog.add(candidate);
      }
    }

    ["moonshot", "zai", "glm", "minimax", "qwen", "qianfan", "custom", "anthropic-custom"].forEach((name) => {
      catalog.add(name);
    });
  }

  return [...catalog]
    .filter((id) => id.length > 1)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      id,
      label: titleCase(id)
    }));
}

function discoverAutomatonModules() {
  const srcDir = path.join(AUTOMATON_ROOT, "src");
  const fallback = Object.keys(MODULE_DESCRIPTIONS).map((id) => ({
    id,
    label: titleCase(id),
    description: MODULE_DESCRIPTIONS[id]
  }));

  if (!fs.existsSync(srcDir)) return fallback;

  return fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      id: entry.name,
      label: titleCase(entry.name),
      description: MODULE_DESCRIPTIONS[entry.name] || "Automation module from automaton runtime"
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const providerCatalog = discoverZeroclawProviders();
const automatonModules = discoverAutomatonModules();
const validModuleSet = new Set(automatonModules.map((module) => module.id));

const savedState = readJsonSafe(STATE_FILE, null);
const state = {
  projectName: "anyre.quest",
  orchestratorName: "Prime Orchestrator",
  swarms: [],
  agents: [],
  tasks: [],
  credentials: [],
  activity: [],
  updatedAt: nowIso(),
  ...(savedState && typeof savedState === "object" ? savedState : {})
};

function defaultModelForProvider(provider) {
  return PROVIDER_MODEL_DEFAULTS[provider] || "auto-reasoning";
}

function getProviderId(rawProvider) {
  const normalized = sanitizeText(rawProvider, "openrouter").toLowerCase();
  if (!normalized) return "openrouter";
  return normalized.replace(/\s+/g, "-");
}

function chooseFallbackProvider(currentProvider) {
  const candidates = providerCatalog.map((item) => item.id).filter((id) => id !== currentProvider);
  const provider = candidates.length ? pick(candidates) : currentProvider;
  return {
    provider,
    model: defaultModelForProvider(provider)
  };
}

function persistState() {
  state.updatedAt = nowIso();
  writeJsonSafe(STATE_FILE, state);
}

function addActivity(level, message, context = {}) {
  state.activity.unshift({
    id: makeId("evt"),
    timestamp: nowIso(),
    level,
    message,
    context
  });
  state.activity = state.activity.slice(0, 300);
  persistState();
}

function normalizeStateShape() {
  state.swarms = Array.isArray(state.swarms) ? state.swarms : [];
  state.agents = Array.isArray(state.agents) ? state.agents : [];
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.credentials = Array.isArray(state.credentials) ? state.credentials : [];
  state.activity = Array.isArray(state.activity) ? state.activity : [];

  for (const swarm of state.swarms) {
    swarm.agentIds = Array.isArray(swarm.agentIds) ? swarm.agentIds : [];
    swarm.status = swarm.status || "draft";
    swarm.autoAdapt = swarm.autoAdapt !== false;
    swarm.automationModules = Array.isArray(swarm.automationModules)
      ? swarm.automationModules.filter((id) => validModuleSet.has(id))
      : [];
    swarm.completedTasks = Number.isFinite(swarm.completedTasks) ? swarm.completedTasks : 0;
    swarm.obstaclesResolved = Number.isFinite(swarm.obstaclesResolved) ? swarm.obstaclesResolved : 0;
    swarm.ideaCount = Number.isFinite(swarm.ideaCount) ? swarm.ideaCount : 0;
    swarm.deployTarget = swarm.deployTarget || "local";
    swarm.deployCommand = sanitizeText(swarm.deployCommand || "");
    swarm.lastDeployedAt = swarm.lastDeployedAt || null;
  }

  const swarmIds = new Set(state.swarms.map((swarm) => swarm.id));

  state.agents = state.agents.filter((agent) => swarmIds.has(agent.swarmId));
  for (const agent of state.agents) {
    agent.status = agent.status || "idle";
    agent.obstacles = Number.isFinite(agent.obstacles) ? agent.obstacles : 0;
    agent.recoveries = Number.isFinite(agent.recoveries) ? agent.recoveries : 0;
    agent.messageCount = Number.isFinite(agent.messageCount) ? agent.messageCount : 0;
    agent.heartbeatMs = Number.isFinite(agent.heartbeatMs) ? agent.heartbeatMs : 8000;
    agent.currentTaskId = sanitizeText(agent.currentTaskId || "") || null;
  }

  const agentIds = new Set(state.agents.map((agent) => agent.id));
  state.tasks = state.tasks.filter((task) => swarmIds.has(task.swarmId));

  for (const task of state.tasks) {
    task.title = sanitizeText(task.title, "Untitled task");
    task.details = sanitizeText(task.details || "");
    task.executionMode = TASK_MODE_SET.has(task.executionMode) ? task.executionMode : "simulate";
    task.command = sanitizeText(task.command || "");
    task.execCwd = sanitizeText(task.execCwd || "");
    task.priority = clamp(Number(task.priority) || 3, 1, 5);
    task.maxAttempts = clamp(Number(task.maxAttempts) || 3, 1, 10);
    task.timeoutMs = clamp(Number(task.timeoutMs) || 90_000, 5_000, 600_000);
    task.attempts = Number.isFinite(task.attempts) ? task.attempts : 0;
    task.status = TASK_STATUS_SET.has(task.status) ? task.status : "queued";
    task.assignedAgentId = agentIds.has(task.assignedAgentId) ? task.assignedAgentId : null;
    task.createdAt = task.createdAt || nowIso();
    task.queuedAt = task.queuedAt || task.createdAt;
    task.outputPreview = sanitizeText(task.outputPreview || "");
    task.lastError = sanitizeText(task.lastError || "");
    task.provider = sanitizeText(task.provider || "") || null;
    task.model = sanitizeText(task.model || "") || null;

    if (task.status === "running") {
      task.status = "queued";
      task.assignedAgentId = null;
      task.startedAt = null;
      task.queuedAt = nowIso();
    }
  }

  for (const agent of state.agents) {
    if (agent.currentTaskId && !state.tasks.some((task) => task.id === agent.currentTaskId)) {
      agent.currentTaskId = null;
      if (agent.status === "executing") {
        agent.status = "running";
      }
    }
  }
}

normalizeStateShape();

function getIntegrations() {
  return {
    zeroclaw: getRepoSnapshot(ZEROCLAW_ROOT, "ZeroClaw"),
    automaton: getRepoSnapshot(AUTOMATON_ROOT, "Automaton")
  };
}

function findSwarmById(id) {
  return state.swarms.find((swarm) => swarm.id === id) || null;
}

function findAgentById(id) {
  return state.agents.find((agent) => agent.id === id) || null;
}

function findTaskById(id) {
  return state.tasks.find((task) => task.id === id) || null;
}

function findCredentialById(id) {
  return state.credentials.find((credential) => credential.id === id) || null;
}

function listAgentsForSwarm(swarmId) {
  return state.agents.filter((agent) => agent.swarmId === swarmId);
}

function listTasksForSwarm(swarmId) {
  return state.tasks.filter((task) => task.swarmId === swarmId);
}

function countTaskStatsForSwarm(swarmId) {
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

function getAvailableAgentsForSwarm(swarm) {
  return listAgentsForSwarm(swarm.id).filter((agent) => {
    if (agent.currentTaskId) return false;
    if (agent.status === "paused") return false;
    if (agent.status === "blocked") return false;
    if (swarm.status !== "live") return false;
    return true;
  });
}

function createAgents(swarm, count) {
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
      nextBeatAt: Date.now() + 2_000 + Math.floor(Math.random() * 5_000),
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

function createTask(swarm, input = {}) {
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
    execCwd: sanitizeText(input.execCwd || ""),
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
    endedAt: null
  };

  state.tasks.unshift(task);
  return task;
}

function startSwarm(swarm) {
  swarm.status = "live";
  swarm.lastDeployedAt = nowIso();

  const swarmAgents = listAgentsForSwarm(swarm.id);
  for (const agent of swarmAgents) {
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

function pauseSwarm(swarm) {
  swarm.status = "paused";

  const swarmAgents = listAgentsForSwarm(swarm.id);
  for (const agent of swarmAgents) {
    if (agent.currentTaskId) continue;
    agent.status = "paused";
  }
}

function boundedOutput(text, max = 2200) {
  if (!text) return "";
  return String(text).slice(0, max);
}

function resolveExecCwd(raw) {
  const value = sanitizeText(raw || "");
  if (!value) return WORKSPACE_ROOT;

  const candidate = path.isAbsolute(value) ? value : path.join(WORKSPACE_ROOT, value);
  const resolved = path.resolve(candidate);

  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    return WORKSPACE_ROOT;
  }

  try {
    if (fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
  } catch {
    return WORKSPACE_ROOT;
  }

  return WORKSPACE_ROOT;
}

function runShellCommand(command, options = {}) {
  const cwd = resolveExecCwd(options.cwd);
  const timeoutMs = clamp(Number(options.timeoutMs) || 90_000, 5_000, 600_000);

  return new Promise((resolve) => {
    const startedMs = Date.now();
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    if (typeof options.onSpawn === "function") {
      options.onSpawn(child);
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 24_000) {
        stdout = stdout.slice(-24_000);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 24_000) {
        stderr = stderr.slice(-24_000);
      }
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        exitCode: code,
        timedOut,
        durationMs: Date.now() - startedMs,
        stdout: boundedOutput(stdout, 4000),
        stderr: boundedOutput(stderr, 4000),
        cwd
      });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        exitCode: null,
        timedOut: false,
        durationMs: Date.now() - startedMs,
        stdout: boundedOutput(stdout, 4000),
        stderr: boundedOutput(`${stderr}\n${error.message}`, 4000),
        cwd
      });
    });
  });
}

function releaseAgentFromTask(task, swarm) {
  const agent = task.assignedAgentId ? findAgentById(task.assignedAgentId) : null;
  if (!agent) return;

  agent.currentTaskId = null;
  if (swarm?.status === "paused") {
    agent.status = "paused";
  } else if (agent.status === "blocked" && swarm?.autoAdapt === false) {
    agent.status = "blocked";
  } else {
    agent.status = "running";
  }

  agent.lastTaskAt = nowIso();
}

function finalizeTaskSuccess(taskId, summary, outputPreview = "") {
  const task = findTaskById(taskId);
  if (!task) return;
  if (task.status === "canceled") {
    activeRuns.delete(taskId);
    return;
  }

  const swarm = findSwarmById(task.swarmId);
  task.status = "succeeded";
  task.endedAt = nowIso();
  task.lastError = "";
  task.outputPreview = boundedOutput(outputPreview || summary, 2200);

  if (swarm) {
    swarm.completedTasks += 1;
  }

  releaseAgentFromTask(task, swarm);
  activeRuns.delete(taskId);

  addActivity("info", `Task ${task.title} succeeded. ${summary}`, {
    taskId: task.id,
    swarmId: task.swarmId,
    agentId: task.assignedAgentId
  });
}

function finalizeTaskFailure(taskId, reason, outputPreview = "", obstacleHint = null) {
  const task = findTaskById(taskId);
  if (!task) return;
  if (task.status === "canceled") {
    activeRuns.delete(taskId);
    return;
  }

  const swarm = findSwarmById(task.swarmId);
  const agent = task.assignedAgentId ? findAgentById(task.assignedAgentId) : null;

  task.lastError = sanitizeText(reason, "Unknown failure");
  task.outputPreview = boundedOutput(outputPreview || reason, 2200);
  activeRuns.delete(taskId);

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
      "warn",
      `Task ${task.title} hit ${obstacleHint || "an obstacle"}; retry queued (${task.attempts}/${task.maxAttempts}) with ${fallback.provider}/${fallback.model}.`,
      {
        taskId: task.id,
        swarmId: task.swarmId,
        agentId: agent?.id || null
      }
    );

    persistState();
    return;
  }

  task.status = "failed";
  task.endedAt = nowIso();
  releaseAgentFromTask(task, swarm);

  addActivity("error", `Task ${task.title} failed: ${reason}`, {
    taskId: task.id,
    swarmId: task.swarmId,
    agentId: agent?.id || null
  });
}

function simulateRunDurationMs(task) {
  const base = 2_800;
  const priorityWeight = (6 - task.priority) * 550;
  const jitter = Math.floor(Math.random() * 2_400);
  return base + priorityWeight + jitter;
}

function computeSimulatedSuccessChance(task, swarm) {
  const base = 0.84;
  const priorityPenalty = (task.priority - 3) * 0.04;
  const adaptBoost = swarm.autoAdapt ? 0.07 : 0;
  return clamp(base - priorityPenalty + adaptBoost, 0.2, 0.97);
}

function startTaskRun(agent, task, swarm) {
  task.status = "running";
  task.startedAt = nowIso();
  task.endedAt = null;
  task.assignedAgentId = agent.id;
  task.attempts += 1;

  agent.currentTaskId = task.id;
  agent.status = "executing";
  agent.lastHeartbeat = nowIso();

  const run = {
    id: makeId("run"),
    taskId: task.id,
    swarmId: swarm.id,
    agentId: agent.id,
    mode: task.executionMode,
    startedAt: nowIso(),
    startedMs: Date.now(),
    completeAtMs: null,
    successChance: null,
    obstacle: pick(OBSTACLES),
    child: null
  };

  if (task.executionMode === "shell" && task.command) {
    activeRuns.set(task.id, run);

    runShellCommand(task.command, {
      cwd: task.execCwd,
      timeoutMs: task.timeoutMs,
      onSpawn: (child) => {
        run.child = child;
      }
    }).then((result) => {
      const summary = result.ok
        ? `shell exit ${result.exitCode ?? 0} in ${Math.round(result.durationMs / 100) / 10}s`
        : result.timedOut
          ? `shell timeout after ${Math.round(result.durationMs / 100) / 10}s`
          : `shell failed with exit ${result.exitCode ?? "unknown"}`;

      const preview = [result.stdout, result.stderr].filter(Boolean).join("\n");

      if (result.ok) {
        finalizeTaskSuccess(task.id, summary, preview || summary);
      } else {
        finalizeTaskFailure(task.id, summary, preview || summary, "shell command error");
      }
    });
  } else {
    run.mode = "simulate";
    run.completeAtMs = Date.now() + simulateRunDurationMs(task);
    run.successChance = computeSimulatedSuccessChance(task, swarm);
    activeRuns.set(task.id, run);
  }

  addActivity(
    "info",
    `Task ${task.title} assigned to ${agent.name} (${task.executionMode}).`,
    { taskId: task.id, swarmId: swarm.id, agentId: agent.id }
  );
}

function processSimulatedRuns() {
  const now = Date.now();

  for (const run of activeRuns.values()) {
    if (run.mode !== "simulate") continue;
    if (!run.completeAtMs || now < run.completeAtMs) continue;

    const task = findTaskById(run.taskId);
    if (!task) {
      activeRuns.delete(run.taskId);
      continue;
    }

    const swarm = findSwarmById(task.swarmId);
    const successChance = run.successChance ?? 0.8;

    if (Math.random() < successChance) {
      const summary = `completed with ${task.provider || swarm?.provider || "default"}/${task.model || swarm?.model || "default"}`;
      finalizeTaskSuccess(task.id, summary, summary);
    } else {
      finalizeTaskFailure(task.id, run.obstacle || "execution obstacle", run.obstacle || "execution obstacle", run.obstacle);
    }
  }
}

function assignQueuedTasks() {
  for (const swarm of state.swarms) {
    if (swarm.status !== "live") continue;

    const queue = listTasksForSwarm(swarm.id)
      .filter((task) => task.status === "queued")
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    if (queue.length === 0) continue;

    const availableAgents = getAvailableAgentsForSwarm(swarm);
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

      startTaskRun(agent, task, swarm);
    }

    persistState();
  }
}

function tickHeartbeats() {
  let changed = false;

  for (const swarm of state.swarms) {
    if (swarm.status !== "live") continue;

    const swarmAgents = listAgentsForSwarm(swarm.id);
    for (const agent of swarmAgents) {
      if (agent.status === "paused") continue;
      if (agent.status === "blocked" && !swarm.autoAdapt) continue;

      const now = Date.now();
      if (typeof agent.nextBeatAt === "number" && now < agent.nextBeatAt) continue;

      agent.lastHeartbeat = nowIso();
      agent.nextBeatAt = now + agent.heartbeatMs + Math.floor(Math.random() * 1_200);

      if (agent.status === "recovering") {
        agent.status = "running";
        changed = true;
      }

      if (agent.status === "running" && Math.random() < 0.06 && !agent.currentTaskId) {
        const obstacle = pick(OBSTACLES);
        agent.obstacles += 1;
        changed = true;

        if (swarm.autoAdapt) {
          const fallback = chooseFallbackProvider(agent.provider);
          agent.provider = fallback.provider;
          agent.model = fallback.model;
          agent.recoveries += 1;
          swarm.obstaclesResolved += 1;
          agent.status = "recovering";

          addActivity(
            "warn",
            `${agent.name} heartbeat obstacle: ${obstacle}. Switched to ${fallback.provider}/${fallback.model}.`,
            { swarmId: swarm.id, agentId: agent.id }
          );
        } else {
          agent.status = "blocked";
          addActivity("error", `${agent.name} blocked by heartbeat obstacle: ${obstacle}.`, {
            swarmId: swarm.id,
            agentId: agent.id
          });
        }
      }
    }
  }

  if (changed) {
    persistState();
  }
}

function tickRuntime() {
  processSimulatedRuns();
  assignQueuedTasks();
}

function killRunProcess(taskId) {
  const run = activeRuns.get(taskId);
  if (!run || !run.child) return;

  try {
    run.child.kill("SIGTERM");
  } catch {
    // ignore
  }
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
    timeoutMs: 90_000
  };
}

function computeMetrics() {
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
    if (lagMs > Math.max(agent.heartbeatMs * 2, 18_000)) staleHeartbeats += 1;
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
    providerCount: providerCatalog.length,
    automatonModuleCount: automatonModules.length,
    totalTasks: state.tasks.length,
    queuedTasks,
    runningTasks,
    succeededTasks,
    failedTasks
  };
}

function toViewModel() {
  const swarms = state.swarms.map((swarm) => {
    const taskStats = countTaskStatsForSwarm(swarm.id);
    return {
      ...swarm,
      taskStats
    };
  });

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
    integrations: getIntegrations(),
    providerCatalog,
    automatonModules,
    metrics: computeMetrics(),
    updatedAt: state.updatedAt
  };
}

if (state.activity.length === 0) {
  addActivity("info", "anyre.quest runtime online. Queue engine + adapters active.");
} else {
  persistState();
}

setInterval(() => {
  tickHeartbeats();
  tickRuntime();
}, 1200);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function notFound(res, message = "Not found") {
  sendJson(res, 404, { error: message });
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", (err) => reject(err));
  });
}

function serveStatic(res, pathname) {
  const targetPath = pathname === "/" ? "/index.html" : pathname;
  const normalized = path.normalize(targetPath).replace(/^\/+/, "");
  const filePath = path.join(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".js"
          ? "text/javascript; charset=utf-8"
          : ext === ".json"
            ? "application/json; charset=utf-8"
            : "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache"
  });

  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, pathname) {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      activeRuns: activeRuns.size,
      time: nowIso()
    });
    return;
  }

  if (method === "GET" && pathname === "/api/state") {
    sendJson(res, 200, toViewModel());
    return;
  }

  if (method === "POST" && pathname === "/api/orchestrator") {
    const body = await readBody(req);
    const nextName = sanitizeText(body.name, "Prime Orchestrator");

    if (!nextName) {
      sendJson(res, 400, { error: "Orchestrator name is required." });
      return;
    }

    state.orchestratorName = nextName;
    addActivity("info", `Orchestrator renamed to ${nextName}.`);
    sendJson(res, 200, toViewModel());
    return;
  }

  if (method === "POST" && pathname === "/api/credentials") {
    const body = await readBody(req);
    const label = sanitizeText(body.label);
    const platform = sanitizeText(body.platform, "generic").toLowerCase();
    const username = sanitizeText(body.username);
    const secretRef = sanitizeText(body.secretRef);

    if (!label || !username || !secretRef) {
      sendJson(res, 400, {
        error: "label, username, and secretRef are required. Store references only (for example: PLATFORM_TOKEN)."
      });
      return;
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

    addActivity("info", `Credential profile ${label} added for ${platform}.`, {
      credentialId: credential.id
    });

    sendJson(res, 201, { credential, state: toViewModel() });
    return;
  }

  if (method === "POST" && pathname === "/api/swarms") {
    const body = await readBody(req);

    const name = sanitizeText(body.name, "Untitled Swarm");
    const objective = sanitizeText(body.objective, "Execute cross-platform tasks autonomously.");
    const provider = getProviderId(body.provider || "openrouter");
    const model = sanitizeText(body.model, defaultModelForProvider(provider));
    const deployTarget = sanitizeText(body.deployTarget, "local") || "local";
    const deployCommand = sanitizeText(body.deployCommand || "");
    const autoAdapt = body.autoAdapt !== false;
    const heartbeatMs = clamp(Number(body.heartbeatMs) || 8000, 2000, 60000);
    const agentCount = clamp(Number(body.agentCount) || 4, 1, 24);

    const requestedModules = Array.isArray(body.moduleIds) ? body.moduleIds : [];
    const automationModules = requestedModules
      .map((moduleName) => sanitizeText(String(moduleName)).toLowerCase())
      .filter((moduleName) => validModuleSet.has(moduleName));

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

    createAgents(swarm, agentCount);
    state.swarms.unshift(swarm);

    addActivity("info", `Swarm ${swarm.name} created with ${agentCount} agents on ${provider}/${model}.`, {
      swarmId: swarm.id
    });

    sendJson(res, 201, { swarm, state: toViewModel() });
    return;
  }

  const deployMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/deploy$/);
  if (method === "POST" && deployMatch) {
    const swarmId = decodeURIComponent(deployMatch[1]);
    const swarm = findSwarmById(swarmId);

    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    startSwarm(swarm);
    addActivity("info", `Swarm ${swarm.name} deployed to ${swarm.deployTarget}.`, { swarmId: swarm.id });

    if (swarm.deployCommand) {
      const deployTask = createTask(swarm, {
        title: `Deploy ${swarm.name}`,
        details: `Deployment pipeline for ${swarm.deployTarget}`,
        executionMode: "shell",
        command: swarm.deployCommand,
        priority: 5,
        maxAttempts: 2,
        timeoutMs: 180_000,
        execCwd: ""
      });

      addActivity("info", `Deployment command queued as task ${deployTask.title}.`, {
        swarmId: swarm.id,
        taskId: deployTask.id
      });
    }

    persistState();
    sendJson(res, 200, toViewModel());
    return;
  }

  const pauseMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/pause$/);
  if (method === "POST" && pauseMatch) {
    const swarmId = decodeURIComponent(pauseMatch[1]);
    const swarm = findSwarmById(swarmId);

    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    pauseSwarm(swarm);
    addActivity("warn", `Swarm ${swarm.name} paused.`);
    sendJson(res, 200, toViewModel());
    return;
  }

  const ideaMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/idea$/);
  if (method === "POST" && ideaMatch) {
    const swarmId = decodeURIComponent(ideaMatch[1]);
    const swarm = findSwarmById(swarmId);

    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    const body = await readBody(req);
    const message = sanitizeText(body.message);

    if (!message) {
      sendJson(res, 400, { error: "Idea message is required." });
      return;
    }

    swarm.ideaCount += 1;

    const swarmAgents = listAgentsForSwarm(swarm.id);
    for (const agent of swarmAgents) {
      if (agent.status === "paused") continue;
      agent.messageCount += 1;
      if (agent.status === "blocked" && swarm.autoAdapt) {
        agent.status = "recovering";
      }
    }

    addActivity("info", `Idea broadcast in ${swarm.name}: ${message}`, { swarmId: swarm.id });
    sendJson(res, 200, toViewModel());
    return;
  }

  const seedMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/tasks\/seed$/);
  if (method === "POST" && seedMatch) {
    const swarmId = decodeURIComponent(seedMatch[1]);
    const swarm = findSwarmById(swarmId);

    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    const body = await readBody(req);
    const count = clamp(Number(body.count) || 4, 1, 12);

    const created = [];
    for (let i = 0; i < count; i += 1) {
      created.push(createTask(swarm, buildTaskFromSeed(swarm, i)));
    }

    addActivity("info", `${created.length} objective tasks seeded for ${swarm.name}.`, {
      swarmId: swarm.id
    });

    persistState();
    sendJson(res, 201, { created, state: toViewModel() });
    return;
  }

  const addTaskMatch = pathname.match(/^\/api\/swarms\/([^/]+)\/tasks$/);
  if (method === "POST" && addTaskMatch) {
    const swarmId = decodeURIComponent(addTaskMatch[1]);
    const swarm = findSwarmById(swarmId);

    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    const body = await readBody(req);
    const title = sanitizeText(body.title);
    if (!title) {
      sendJson(res, 400, { error: "Task title is required." });
      return;
    }

    const executionMode = TASK_MODE_SET.has(body.executionMode) ? body.executionMode : "simulate";
    if (executionMode === "shell" && !sanitizeText(body.command)) {
      sendJson(res, 400, { error: "Shell tasks require a command." });
      return;
    }

    const task = createTask(swarm, {
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

    addActivity("info", `Task queued for ${swarm.name}: ${task.title}`, {
      swarmId: swarm.id,
      taskId: task.id
    });

    sendJson(res, 201, { task, state: toViewModel() });
    return;
  }

  const retryTaskMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/retry$/);
  if (method === "POST" && retryTaskMatch) {
    const taskId = decodeURIComponent(retryTaskMatch[1]);
    const task = findTaskById(taskId);

    if (!task) {
      notFound(res, "Task not found.");
      return;
    }

    const swarm = findSwarmById(task.swarmId);
    if (!swarm) {
      notFound(res, "Swarm not found.");
      return;
    }

    if (task.status === "running") {
      sendJson(res, 400, { error: "Task is currently running." });
      return;
    }

    task.status = "queued";
    task.assignedAgentId = null;
    task.startedAt = null;
    task.endedAt = null;
    task.queuedAt = nowIso();
    task.lastError = "";

    addActivity("info", `Task ${task.title} re-queued manually.`, {
      taskId: task.id,
      swarmId: task.swarmId
    });

    sendJson(res, 200, toViewModel());
    return;
  }

  const cancelTaskMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/cancel$/);
  if (method === "POST" && cancelTaskMatch) {
    const taskId = decodeURIComponent(cancelTaskMatch[1]);
    const task = findTaskById(taskId);

    if (!task) {
      notFound(res, "Task not found.");
      return;
    }

    if (task.status === "running") {
      killRunProcess(task.id);
      activeRuns.delete(task.id);
    }

    const swarm = findSwarmById(task.swarmId);
    releaseAgentFromTask(task, swarm);

    task.status = "canceled";
    task.endedAt = nowIso();
    task.lastError = "Canceled by operator";

    addActivity("warn", `Task ${task.title} canceled by operator.`, {
      taskId: task.id,
      swarmId: task.swarmId
    });

    sendJson(res, 200, toViewModel());
    return;
  }

  const reviveMatch = pathname.match(/^\/api\/agents\/([^/]+)\/revive$/);
  if (method === "POST" && reviveMatch) {
    const agentId = decodeURIComponent(reviveMatch[1]);
    const agent = findAgentById(agentId);

    if (!agent) {
      notFound(res, "Agent not found.");
      return;
    }

    const swarm = findSwarmById(agent.swarmId);
    if (!swarm || swarm.status !== "live") {
      sendJson(res, 400, { error: "Agent can only be revived when its swarm is live." });
      return;
    }

    if (!agent.currentTaskId) {
      agent.status = "running";
    }
    agent.nextBeatAt = Date.now() + 400;
    addActivity("info", `${agent.name} manually revived.`);
    sendJson(res, 200, toViewModel());
    return;
  }

  const credentialMatch = pathname.match(/^\/api\/agents\/([^/]+)\/credential$/);
  if (method === "POST" && credentialMatch) {
    const agentId = decodeURIComponent(credentialMatch[1]);
    const agent = findAgentById(agentId);

    if (!agent) {
      notFound(res, "Agent not found.");
      return;
    }

    const body = await readBody(req);
    const credentialId = sanitizeText(body.credentialId);

    if (credentialId && !findCredentialById(credentialId)) {
      sendJson(res, 400, { error: "Credential profile not found." });
      return;
    }

    agent.credentialId = credentialId || null;
    addActivity(
      "info",
      credentialId
        ? `${agent.name} linked to credential profile ${credentialId}.`
        : `${agent.name} credential profile removed.`,
      { agentId: agent.id, credentialId: agent.credentialId }
    );

    sendJson(res, 200, toViewModel());
    return;
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    serveStatic(res, pathname);
  } catch (error) {
    sendJson(res, 500, {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(PORT, () => {
  console.log(`anyre.quest running at http://localhost:${PORT}`);
  console.log(`ZeroClaw repo: ${ZEROCLAW_ROOT}`);
  console.log(`Automaton repo: ${AUTOMATON_ROOT}`);
});
