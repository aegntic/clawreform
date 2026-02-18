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
  providerSuggestions: document.querySelector("#provider-suggestions"),
  providerCountText: document.querySelector("#provider-count-text"),
  providerGrid: document.querySelector("#provider-grid"),
  moduleOptions: document.querySelector("#module-options"),
  moduleGrid: document.querySelector("#module-grid"),
  swarmList: document.querySelector("#swarm-list"),
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
        <p class="meta">Agents: ${swarm.agentIds.length} • Completed tasks: ${swarm.completedTasks} • Obstacle recoveries: ${swarm.obstaclesResolved}</p>
        <p class="meta">Modules: ${swarm.automationModules.length ? swarm.automationModules.map(escapeHtml).join(", ") : "none"}</p>
        <div class="row">
          <button class="btn" data-action="deploy" data-id="${escapeHtml(swarm.id)}" type="button">Deploy</button>
          <button class="btn ghost" data-action="pause" data-id="${escapeHtml(swarm.id)}" type="button">Pause</button>
        </div>
        <div class="row">
          <input data-idea-input="${escapeHtml(swarm.id)}" placeholder="Broadcast idea to this swarm" maxlength="180" />
          <button class="btn" data-action="idea" data-id="${escapeHtml(swarm.id)}" type="button">Broadcast</button>
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
        <p class="meta">Obstacles: ${agent.obstacles} • Recoveries: ${agent.recoveries} • Messages: ${agent.messageCount}</p>
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

function render(stateView) {
  state.data = stateView;

  refs.orchestratorName.value = stateView.orchestratorName;

  renderMetrics(stateView.metrics);
  renderIntegrations(stateView.integrations);
  renderProviders(stateView.providerCatalog);
  renderModules(stateView.automatonModules);
  renderCredentials(stateView.credentials);
  renderSwarms(stateView.swarms);
  renderAgents(stateView.agents, stateView.credentials, stateView.swarms);
  renderActivity(stateView.activity);
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
  refs.swarmList.addEventListener("click", (event) => {
    onSwarmActionClick(event).catch((error) => alert(error.message));
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
  }, 2500);
}

boot().catch((error) => {
  refs.repoStatus.textContent = `Boot error: ${error.message}`;
});
