import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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
  return value.trim().slice(0, 180);
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
  credentials: [],
  activity: [],
  updatedAt: nowIso(),
  ...(savedState && typeof savedState === "object" ? savedState : {})
};

function normalizeStateShape() {
  state.swarms = Array.isArray(state.swarms) ? state.swarms : [];
  state.agents = Array.isArray(state.agents) ? state.agents : [];
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
  }

  for (const agent of state.agents) {
    agent.status = agent.status || "idle";
    agent.obstacles = Number.isFinite(agent.obstacles) ? agent.obstacles : 0;
    agent.recoveries = Number.isFinite(agent.recoveries) ? agent.recoveries : 0;
    agent.messageCount = Number.isFinite(agent.messageCount) ? agent.messageCount : 0;
    agent.heartbeatMs = Number.isFinite(agent.heartbeatMs) ? agent.heartbeatMs : 8000;
  }
}

normalizeStateShape();

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
  state.activity = state.activity.slice(0, 250);
  persistState();
}

function defaultModelForProvider(provider) {
  return PROVIDER_MODEL_DEFAULTS[provider] || "auto-reasoning";
}

function getProviderId(rawProvider) {
  const normalized = sanitizeText(rawProvider, "openrouter").toLowerCase();
  if (!normalized) return "openrouter";
  return normalized.replace(/\s+/g, "-");
}

function getIntegrations() {
  return {
    zeroclaw: getRepoSnapshot(ZEROCLAW_ROOT, "ZeroClaw"),
    automaton: getRepoSnapshot(AUTOMATON_ROOT, "Automaton")
  };
}

function listAgentsForSwarm(swarmId) {
  return state.agents.filter((agent) => agent.swarmId === swarmId);
}

function chooseFallbackProvider(currentProvider) {
  const candidates = providerCatalog.map((item) => item.id).filter((id) => id !== currentProvider);
  const provider = candidates.length ? pick(candidates) : currentProvider;
  return {
    provider,
    model: defaultModelForProvider(provider)
  };
}

function computeMetrics() {
  const now = Date.now();
  const liveSwarms = state.swarms.filter((swarm) => swarm.status === "live").length;
  const blockedAgents = state.agents.filter((agent) => agent.status === "blocked").length;
  const activeAgents = state.agents.filter((agent) => agent.status === "running" || agent.status === "recovering").length;

  let staleHeartbeats = 0;
  for (const agent of state.agents) {
    if (!agent.lastHeartbeat) {
      staleHeartbeats += 1;
      continue;
    }
    const lagMs = now - new Date(agent.lastHeartbeat).getTime();
    if (lagMs > Math.max(agent.heartbeatMs * 2, 18000)) staleHeartbeats += 1;
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
    automatonModuleCount: automatonModules.length
  };
}

function toViewModel() {
  return {
    projectName: state.projectName,
    orchestratorName: state.orchestratorName,
    swarms: state.swarms,
    agents: state.agents,
    credentials: state.credentials,
    activity: state.activity,
    integrations: getIntegrations(),
    providerCatalog,
    automatonModules,
    metrics: computeMetrics(),
    updatedAt: state.updatedAt
  };
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
      nextBeatAt: Date.now() + 2000 + Math.floor(Math.random() * 5000),
      lastHeartbeat: null,
      obstacles: 0,
      recoveries: 0,
      messageCount: 0,
      credentialId: null
    };

    newAgents.push(agent);
    swarm.agentIds.push(agentId);
  }

  state.agents.push(...newAgents);
}

function startSwarm(swarm) {
  swarm.status = "live";
  swarm.lastDeployedAt = nowIso();

  const swarmAgents = listAgentsForSwarm(swarm.id);
  for (const agent of swarmAgents) {
    agent.status = "running";
    agent.nextBeatAt = Date.now() + 400 + Math.floor(Math.random() * 1200);
  }
}

function pauseSwarm(swarm) {
  swarm.status = "paused";

  const swarmAgents = listAgentsForSwarm(swarm.id);
  for (const agent of swarmAgents) {
    agent.status = "paused";
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
      agent.nextBeatAt = now + agent.heartbeatMs + Math.floor(Math.random() * 1200);

      if (agent.status !== "blocked") {
        agent.status = "running";
      }

      if (Math.random() < 0.11) {
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
            `${agent.name} encountered ${obstacle} and switched to ${fallback.provider}/${fallback.model}.`,
            { swarmId: swarm.id, agentId: agent.id }
          );
        } else {
          agent.status = "blocked";
          addActivity("error", `${agent.name} blocked by ${obstacle}. Manual action required.`, {
            swarmId: swarm.id,
            agentId: agent.id
          });
        }
      } else {
        if (agent.status === "recovering") {
          agent.status = "running";
          changed = true;
        }

        if (Math.random() < 0.18) {
          swarm.completedTasks += 1;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    persistState();
  }
}

if (state.activity.length === 0) {
  addActivity("info", "anyre.quest control plane online. ZeroClaw + Automaton adapters active.");
} else {
  persistState();
}

setInterval(tickHeartbeats, 1500);

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

    req.on("data", (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1_000_000) {
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

function findSwarmById(id) {
  return state.swarms.find((swarm) => swarm.id === id) || null;
}

function findAgentById(id) {
  return state.agents.find((agent) => agent.id === id) || null;
}

function findCredentialById(id) {
  return state.credentials.find((credential) => credential.id === id) || null;
}

async function handleApi(req, res, pathname) {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
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

    agent.status = "running";
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
