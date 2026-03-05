// ClawReform Collective Page — collective evidence and promotion visualization
'use strict';

function collectMetric(text, label) {
  if (!text) return 0;
  var re = new RegExp(label + '\\s*:\\s*(\\d+)', 'i');
  var match = text.match(re);
  if (!match || !match[1]) return 0;
  var n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : 0;
}

function extractTopClaims(autoSection) {
  if (!autoSection) return [];
  var lines = autoSection.split('\n');
  var claims = [];
  var inClaims = false;
  for (var i = 0; i < lines.length; i++) {
    var line = (lines[i] || '').trim();
    if (!line) continue;
    if (line.indexOf('### Top Claims') === 0) {
      inClaims = true;
      continue;
    }
    if (!inClaims) continue;
    if (line.indexOf('### ') === 0) break;
    if (line.indexOf('- ') !== 0) continue;
    claims.push(line.slice(2));
  }
  return claims;
}

function collectivePage() {
  return {
    selectedAgentId: '',
    loading: false,
    loadError: '',
    collectiveContent: '',
    autoSection: '',
    updatedAt: '',
    totalClaims: 0,
    projectReady: 0,
    overviewReady: 0,
    coreCandidates: 0,
    topClaims: [],

    async loadData() {
      await this.ensureAgentSelected();
      await this.loadCollective();
    },

    async ensureAgentSelected() {
      var store = Alpine.store('app');
      if ((!store.agents || !store.agents.length) && store.refreshAgents) {
        await store.refreshAgents();
      }
      if (!this.selectedAgentId && store.agents && store.agents.length) {
        this.selectedAgentId = store.agents[0].id;
      }
    },

    async loadCollective() {
      if (!this.selectedAgentId) {
        this.loadError = 'Select an agent to inspect collective memory.';
        return;
      }
      this.loading = true;
      this.loadError = '';
      this.collectiveContent = '';
      this.autoSection = '';
      this.topClaims = [];
      try {
        var fileResp = await ClawReformAPI.get('/api/agents/' + this.selectedAgentId + '/files/COLLECTIVE.md');
        var content = (fileResp && fileResp.content) || '';
        var auto = extractManagedAutoSection(content);
        this.collectiveContent = content;
        this.autoSection = auto;
        this.updatedAt = parseUpdatedAt(auto);
        this.totalClaims = collectMetric(auto, 'Total tracked claims');
        this.projectReady = collectMetric(auto, 'Project-ready truths');
        this.overviewReady = collectMetric(auto, 'Overview-ready truths');
        this.coreCandidates = collectMetric(auto, 'Core candidates');
        this.topClaims = extractTopClaims(auto);
      } catch (e) {
        this.loadError = e.message || 'Could not load COLLECTIVE.md';
      }
      this.loading = false;
    },

    ratio(value) {
      if (!this.totalClaims) return 0;
      var pct = (value / this.totalClaims) * 100;
      if (pct < 0) return 0;
      if (pct > 100) return 100;
      return Math.round(pct);
    }
  };
}
