const state = {
  data: null,
  pollHandle: null
};

const refs = {
  repoStatus: document.querySelector("#repo-status"),
  refreshButton: document.querySelector("#refresh-button"),
  orchestratorForm: document.querySelector("#orchestrator-form"),
  orchestratorName: document.querySelector("#orchestrator-name"),
  swarmForm: document.querySelector("#swarm-form"),
  credentialForm: document.querySelector("#credential-form"),
  taskForm: document.querySelector("#task-form"),
  taskSwarmSelect: document.querySelector("#task-swarm-select"),
  seedTasksButton: document.querySelector("#seed-tasks-button"),
  taskModeSelect: document.querySelector("#task-mode-select"),
  taskCommandRow: document.querySelector("#task-command-row"),
  providerSuggestions: document.querySelector("#provider-suggestions"),
  providerCountText: document.querySelector("#provider-count-text"),
  providerGrid: document.querySelector("#provider-grid"),
  moduleOptions: document.querySelector("#module-options"),
  moduleGrid: document.querySelector("#module-grid"),
  swarmList: document.querySelector("#swarm-list"),
  taskList: document.querySelector("#task-list"),
  agentList: document.querySelector("#agent-list"),
  credentialList: document.querySelector("#credential-list"),
  activityList: document.querySelector("#activity-list"),
  emptyTemplate: document.querySelector("#empty-template")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asListOrEmpty(items, renderFn) {
  if (!Array.isArray(items) || items.length === 0) {
    return refs.emptyTemplate.innerHTML;
  }
  return items.map(renderFn).join("");
}

function statusClass(status) {
  return String(status || "unknown").toLowerCase();
}

function since(isoTime) {
  if (!isoTime) return "never";
  const ms = Date.now() - new Date(isoTime).getTime();
  if (ms < 0) return "now";
  if (ms < 1000) return "now";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}

function isoClock(isoTime) {
  try {
    return new Date(isoTime).toLocaleTimeString();
  } catch {
    return "--";
  }
}

function shorten(text, max = 130) {
  const value = String(text || "").trim();
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function renderMetrics(metrics) {
  document.querySelector("#metric-live-swarms").textContent = metrics.liveSwarms;
  document.querySelector("#metric-active-agents").textContent = metrics.activeAgents;
  document.querySelector("#metric-blocked-agents").textContent = metrics.blockedAgents;
  document.querySelector("#metric-queued-tasks").textContent = metrics.queuedTasks;
  document.querySelector("#metric-running-tasks").textContent = metrics.runningTasks;
  document.querySelector("#metric-completed-tasks").textContent = metrics.succeededTasks;
  document.querySelector("#metric-failed-tasks").textContent = metrics.failedTasks;
  document.querySelector("#metric-provider-count").textContent = metrics.providerCount;
}

function renderIntegrations(integrations) {
  const z = integrations.zeroclaw;
  const a = integrations.automaton;
  const zState = z.connected ? `ZeroClaw ${z.branch || "?"}@${z.commit || "?"}` : "ZeroClaw missing";
  const aState = a.connected ? `Automaton ${a.branch || "?"}@${a.commit || "?"}` : "Automaton missing";
  refs.repoStatus.textContent = `${zState} | ${aState}`;
}

function renderProviders(providerCatalog) {
  refs.providerSuggestions.innerHTML = providerCatalog
    .map((provider) => `<option value="${escapeHtml(provider.id)}"></option>`)
    .join("");

  refs.providerCountText.textContent = `${providerCatalog.length} discovered`;
  refs.providerGrid.innerHTML = providerCatalog
    .map((provider) => `<span>${escapeHtml(provider.id)}</span>`)
    .join("");
}

function renderModules(modules) {
  refs.moduleOptions.innerHTML = modules
    .map(
      (module) => `
      <label class="module-toggle" title="${escapeHtml(module.description || "")}">
        <input type="checkbox" name="moduleIds" value="${escapeHtml(module.id)}" />
        ${escapeHtml(module.id)}
      </label>
    `
    )
    .join("");

  refs.moduleGrid.innerHTML = modules
    .map(
      (module) => `
      <article class="module-card">
        <h4>${escapeHtml(module.label)}</h4>
        <p>${escapeHtml(module.description || "Automation capability")}</p>
      </article>
    `
    )
    .join("");
}

function renderCredentials(credentials) {
  refs.credentialList.innerHTML = asListOrEmpty(
    credentials,
    (credential) => `
      <article class="card">
        <div class="card-head">
          <h3>${escapeHtml(credential.label)}</h3>
          <span class="status running">${escapeHtml(credential.platform)}</span>
        </div>
        <p class="meta">${escapeHtml(credential.username)} • ${escapeHtml(credential.secretRef)}</p>
      </article>
    `
  );
}

function renderTaskSwarmOptions(swarms) {
  const previous = refs.taskSwarmSelect.value;
  refs.taskSwarmSelect.innerHTML = swarms
    .map((swarm) => `<option value="${escapeHtml(swarm.id)}">${escapeHtml(swarm.name)} (${escapeHtml(swarm.status)})</option>`)
    .join("");

  if (swarms.length === 0) {
    refs.taskSwarmSelect.innerHTML = '<option value="">No swarms yet</option>';
    refs.taskSwarmSelect.disabled = true;
    refs.seedTasksButton.disabled = true;
    return;
  }

  refs.taskSwarmSelect.disabled = false;
  refs.seedTasksButton.disabled = false;

  const exists = swarms.some((swarm) => swarm.id === previous);
  refs.taskSwarmSelect.value = exists ? previous : swarms[0].id;
}

function renderSwarms(swarms) {
  refs.swarmList.innerHTML = asListOrEmpty(
    swarms,
    (swarm) => `
      <article class="card" data-swarm-id="${escapeHtml(swarm.id)}">
        <div class="card-head">
          <h3>${escapeHtml(swarm.name)}</h3>
          <span class="status ${statusClass(swarm.status)}">${escapeHtml(swarm.status)}</span>
        </div>
        <p class="meta">${escapeHtml(swarm.objective)}</p>
        <p class="meta">${escapeHtml(swarm.provider)} / ${escapeHtml(swarm.model)} • ${escapeHtml(swarm.deployTarget)} target</p>
        <p class="meta">Tasks: queued ${swarm.taskStats.queued}, running ${swarm.taskStats.running}, done ${swarm.taskStats.succeeded}, failed ${swarm.taskStats.failed}</p>
        <p class="meta">Agents: ${swarm.agentIds.length} • Obstacles resolved: ${swarm.obstaclesResolved} • Ideas: ${swarm.ideaCount}</p>
        <p class="meta">Modules: ${swarm.automationModules.length ? swarm.automationModules.map(escapeHtml).join(", ") : "none"}</p>
        <p class="meta">Deploy cmd: ${swarm.deployCommand ? escapeHtml(shorten(swarm.deployCommand, 90)) : "none"}</p>
        <div class="row">
          <button class="btn" data-action="deploy" data-id="${escapeHtml(swarm.id)}" type="button">Deploy</button>
          <button class="btn ghost" data-action="pause" data-id="${escapeHtml(swarm.id)}" type="button">Pause</button>
          <button class="btn ghost" data-action="seed" data-id="${escapeHtml(swarm.id)}" type="button">Seed tasks</button>
        </div>
        <div class="row">
          <input data-idea-input="${escapeHtml(swarm.id)}" placeholder="Broadcast idea to this swarm" maxlength="180" />
          <button class="btn" data-action="idea" data-id="${escapeHtml(swarm.id)}" type="button">Broadcast</button>
        </div>
      </article>
    `
  );
}

function renderTasks(tasks, swarms, agents) {
  const swarmById = new Map(swarms.map((swarm) => [swarm.id, swarm.name]));
  const agentById = new Map(agents.map((agent) => [agent.id, agent.name]));

  refs.taskList.innerHTML = asListOrEmpty(
    tasks,
    (task) => `
      <article class="card" data-task-id="${escapeHtml(task.id)}">
        <div class="card-head">
          <h3>${escapeHtml(task.title)}</h3>
          <span class="status ${statusClass(task.status)}">${escapeHtml(task.status)}</span>
        </div>
        <p class="meta">${escapeHtml(swarmById.get(task.swarmId) || "Unknown swarm")} • mode ${escapeHtml(task.executionMode)} • priority ${task.priority}</p>
        <p class="meta">Attempt ${task.attempts}/${task.maxAttempts} • ${escapeHtml(task.provider || "default")}/${escapeHtml(task.model || "default")}</p>
        <p class="meta">Assigned: ${escapeHtml(agentById.get(task.assignedAgentId) || "unassigned")} • queued ${escapeHtml(since(task.queuedAt))}</p>
        <p class="meta">${escapeHtml(shorten(task.details || task.outputPreview || task.lastError || "No details"))}</p>
        <div class="row">
          <button class="btn ghost" data-task-action="retry" data-id="${escapeHtml(task.id)}" type="button">Retry</button>
          <button class="btn ghost" data-task-action="cancel" data-id="${escapeHtml(task.id)}" type="button">Cancel</button>
        </div>
      </article>
    `
  );
}

function renderAgents(agents, credentials, swarms) {
  const credentialOptions = credentials
    .map((credential) => `<option value="${escapeHtml(credential.id)}">${escapeHtml(credential.label)}</option>`)
    .join("");

  const swarmById = new Map(swarms.map((swarm) => [swarm.id, swarm.name]));

  refs.agentList.innerHTML = asListOrEmpty(
    agents,
    (agent) => `
      <article class="card" data-agent-id="${escapeHtml(agent.id)}">
        <div class="card-head">
          <h3>${escapeHtml(agent.name)}</h3>
          <span class="status ${statusClass(agent.status)}">${escapeHtml(agent.status)}</span>
        </div>
        <p class="meta">${escapeHtml(agent.role)} • ${escapeHtml(swarmById.get(agent.swarmId) || "Unknown swarm")}</p>
        <p class="meta">${escapeHtml(agent.provider)} / ${escapeHtml(agent.model)} • heartbeat ${agent.heartbeatMs}ms • last ${escapeHtml(since(agent.lastHeartbeat))}</p>
        <p class="meta">Current task: ${escapeHtml(agent.currentTaskId || "none")} • Obstacles: ${agent.obstacles} • Recoveries: ${agent.recoveries}</p>
        <div class="row">
          <select data-credential-select="${escapeHtml(agent.id)}">
            <option value="">No credential profile</option>
            ${credentialOptions}
          </select>
          <button class="btn ghost" data-action="link-credential" data-id="${escapeHtml(agent.id)}" type="button">Apply</button>
          <button class="btn" data-action="revive" data-id="${escapeHtml(agent.id)}" type="button">Revive</button>
        </div>
      </article>
    `
  );

  for (const agent of agents) {
    if (!agent.credentialId) continue;
    const select = refs.agentList.querySelector(`select[data-credential-select="${CSS.escape(agent.id)}"]`);
    if (select) select.value = agent.credentialId;
  }
}

function renderActivity(activity) {
  refs.activityList.innerHTML = asListOrEmpty(
    activity,
    (event) => `
      <article class="log-item ${statusClass(event.level)}">
        <span class="time">${escapeHtml(isoClock(event.timestamp))}</span>
        <span>${escapeHtml(event.message)}</span>
      </article>
    `
  );
}

function setTaskModeVisibility() {
  const mode = refs.taskModeSelect.value;
  const commandInput = refs.taskCommandRow.querySelector("input[name='command']");

  if (mode === "shell") {
    refs.taskCommandRow.style.display = "flex";
    commandInput.required = true;
  } else {
    refs.taskCommandRow.style.display = "none";
    commandInput.required = false;
  }
}

function render(stateView) {
  state.data = stateView;

  refs.orchestratorName.value = stateView.orchestratorName;

  renderMetrics(stateView.metrics);
  renderIntegrations(stateView.integrations);
  renderProviders(stateView.providerCatalog);
  renderModules(stateView.automatonModules);
  renderCredentials(stateView.credentials);
  renderTaskSwarmOptions(stateView.swarms);
  renderSwarms(stateView.swarms);
  renderTasks(stateView.tasks, stateView.swarms, stateView.agents);
  renderAgents(stateView.agents, stateView.credentials, stateView.swarms);
  renderActivity(stateView.activity);
  setTaskModeVisibility();
}

async function refreshState() {
  try {
    const data = await api("/api/state");
    render(data);
  } catch (error) {
    refs.repoStatus.textContent = `API offline: ${error.message}`;
  }
}

async function onOrchestratorSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.orchestratorForm);

  await api("/api/orchestrator", {
    method: "POST",
    body: {
      name: formData.get("name")
    }
  });

  await refreshState();
}

async function onSwarmSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.swarmForm);

  const moduleIds = [...refs.swarmForm.querySelectorAll("input[name='moduleIds']:checked")].map((input) => input.value);

  await api("/api/swarms", {
    method: "POST",
    body: {
      name: formData.get("name"),
      objective: formData.get("objective"),
      provider: formData.get("provider"),
      model: formData.get("model"),
      agentCount: Number(formData.get("agentCount")),
      heartbeatMs: Number(formData.get("heartbeatMs")),
      deployTarget: formData.get("deployTarget"),
      deployCommand: formData.get("deployCommand"),
      autoAdapt: formData.get("autoAdapt") === "on",
      moduleIds
    }
  });

  refs.swarmForm.reset();
  refs.swarmForm.querySelector("input[name='autoAdapt']").checked = true;
  await refreshState();
}

async function onCredentialSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.credentialForm);

  await api("/api/credentials", {
    method: "POST",
    body: {
      label: formData.get("label"),
      platform: formData.get("platform"),
      username: formData.get("username"),
      secretRef: formData.get("secretRef")
    }
  });

  refs.credentialForm.reset();
  await refreshState();
}

async function onTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.taskForm);
  const swarmId = String(formData.get("swarmId") || "").trim();

  if (!swarmId) {
    throw new Error("Select a swarm first.");
  }

  await api(`/api/swarms/${encodeURIComponent(swarmId)}/tasks`, {
    method: "POST",
    body: {
      title: formData.get("title"),
      details: formData.get("details"),
      executionMode: formData.get("executionMode"),
      command: formData.get("command"),
      priority: Number(formData.get("priority")),
      maxAttempts: Number(formData.get("maxAttempts")),
      timeoutMs: Number(formData.get("timeoutMs")),
      execCwd: formData.get("execCwd")
    }
  });

  const preservedSwarm = swarmId;
  refs.taskForm.reset();
  refs.taskForm.querySelector("input[name='priority']").value = "3";
  refs.taskForm.querySelector("input[name='maxAttempts']").value = "3";
  refs.taskForm.querySelector("input[name='timeoutMs']").value = "90000";
  refs.taskModeSelect.value = "simulate";
  setTaskModeVisibility();

  await refreshState();
  refs.taskSwarmSelect.value = preservedSwarm;
}

async function seedTasksForSwarm(swarmId, count = 4) {
  await api(`/api/swarms/${encodeURIComponent(swarmId)}/tasks/seed`, {
    method: "POST",
    body: { count }
  });

  await refreshState();
}

async function onSwarmActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === "deploy") {
    await api(`/api/swarms/${encodeURIComponent(id)}/deploy`, { method: "POST" });
    await refreshState();
    return;
  }

  if (action === "pause") {
    await api(`/api/swarms/${encodeURIComponent(id)}/pause`, { method: "POST" });
    await refreshState();
    return;
  }

  if (action === "seed") {
    await seedTasksForSwarm(id, 4);
    return;
  }

  if (action === "idea") {
    const input = refs.swarmList.querySelector(`input[data-idea-input="${CSS.escape(id)}"]`);
    const message = input?.value.trim();
    if (!message) return;

    await api(`/api/swarms/${encodeURIComponent(id)}/idea`, {
      method: "POST",
      body: { message }
    });

    input.value = "";
    await refreshState();
  }
}

async function onTaskActionClick(event) {
  const button = event.target.closest("button[data-task-action]");
  if (!button) return;

  const action = button.dataset.taskAction;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === "retry") {
    await api(`/api/tasks/${encodeURIComponent(id)}/retry`, { method: "POST" });
    await refreshState();
    return;
  }

  if (action === "cancel") {
    await api(`/api/tasks/${encodeURIComponent(id)}/cancel`, { method: "POST" });
    await refreshState();
  }
}

async function onAgentActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === "revive") {
    await api(`/api/agents/${encodeURIComponent(id)}/revive`, { method: "POST" });
    await refreshState();
    return;
  }

  if (action === "link-credential") {
    const select = refs.agentList.querySelector(`select[data-credential-select="${CSS.escape(id)}"]`);
    const credentialId = select?.value || "";

    await api(`/api/agents/${encodeURIComponent(id)}/credential`, {
      method: "POST",
      body: { credentialId }
    });

    await refreshState();
  }
}

function attachEvents() {
  refs.refreshButton.addEventListener("click", refreshState);

  refs.orchestratorForm.addEventListener("submit", (event) => {
    onOrchestratorSubmit(event).catch((error) => alert(error.message));
  });

  refs.swarmForm.addEventListener("submit", (event) => {
    onSwarmSubmit(event).catch((error) => alert(error.message));
  });

  refs.credentialForm.addEventListener("submit", (event) => {
    onCredentialSubmit(event).catch((error) => alert(error.message));
  });

  refs.taskForm.addEventListener("submit", (event) => {
    onTaskSubmit(event).catch((error) => alert(error.message));
  });

  refs.seedTasksButton.addEventListener("click", () => {
    const swarmId = refs.taskSwarmSelect.value;
    if (!swarmId) return;

    seedTasksForSwarm(swarmId, 4).catch((error) => alert(error.message));
  });

  refs.taskModeSelect.addEventListener("change", () => {
    setTaskModeVisibility();
  });

  refs.swarmList.addEventListener("click", (event) => {
    onSwarmActionClick(event).catch((error) => alert(error.message));
  });

  refs.taskList.addEventListener("click", (event) => {
    onTaskActionClick(event).catch((error) => alert(error.message));
  });

  refs.agentList.addEventListener("click", (event) => {
    onAgentActionClick(event).catch((error) => alert(error.message));
  });
}

async function boot() {
  attachEvents();
  await refreshState();

  state.pollHandle = setInterval(() => {
    refreshState();
  }, 2_500);
}

boot().catch((error) => {
  refs.repoStatus.textContent = `Boot error: ${error.message}`;
});
