// ClawReform App — Alpine.js init, hash router, global store
'use strict';

// Marked.js configuration
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang }).value; } catch (e) { }
      }
      return code;
    }
  });
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined') {
    var html = marked.parse(text);
    // Add copy buttons to code blocks
    html = html.replace(/<pre><code/g, '<pre><button class="copy-btn" onclick="copyCode(this)">Copy</button><code');
    return html;
  }
  return escapeHtml(text);
}

function copyCode(btn) {
  var code = btn.nextElementSibling;
  if (code) {
    navigator.clipboard.writeText(code.textContent).then(function () {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
    });
  }
}

// Tool category icon SVGs — returns inline SVG for each tool category
function toolIcon(toolName) {
  if (!toolName) return '';
  var n = toolName.toLowerCase();
  var s = 'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  // File/directory operations
  if (n.indexOf('file_') === 0 || n.indexOf('directory_') === 0)
    return '<svg ' + s + '><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
  // Web/fetch
  if (n.indexOf('web_') === 0 || n.indexOf('link_') === 0)
    return '<svg ' + s + '><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>';
  // Shell/exec
  if (n.indexOf('shell') === 0 || n.indexOf('exec_') === 0)
    return '<svg ' + s + '><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
  // Agent operations
  if (n.indexOf('agent_') === 0)
    return '<svg ' + s + '><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  // Memory/knowledge
  if (n.indexOf('memory_') === 0 || n.indexOf('knowledge_') === 0)
    return '<svg ' + s + '><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
  // Cron/schedule
  if (n.indexOf('cron_') === 0 || n.indexOf('schedule_') === 0)
    return '<svg ' + s + '><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  // Browser/playwright
  if (n.indexOf('browser_') === 0 || n.indexOf('playwright_') === 0)
    return '<svg ' + s + '><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>';
  // Container/docker
  if (n.indexOf('container_') === 0 || n.indexOf('docker_') === 0)
    return '<svg ' + s + '><path d="M22 12H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
  // Image/media
  if (n.indexOf('image_') === 0 || n.indexOf('tts_') === 0)
    return '<svg ' + s + '><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  // Hand tools
  if (n.indexOf('hand_') === 0)
    return '<svg ' + s + '><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.4L3.4 16a2 2 0 0 1 3.2-2.4L8 15"/></svg>';
  // Task/collab
  if (n.indexOf('task_') === 0)
    return '<svg ' + s + '><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>';
  // Default — wrench
  return '<svg ' + s + '><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
}

// Alpine.js global store
document.addEventListener('alpine:init', function () {
  // Restore saved API key on load
  var savedKey = localStorage.getItem('clawreform-api-key');
  if (savedKey) ClawReformAPI.setAuthToken(savedKey);

  Alpine.store('app', {
    agents: [],
    connected: false,
    booting: true,
    wsConnected: false,
    connectionState: 'connected',
    lastError: '',
    version: '0.3.0',
    agentCount: 0,
    pendingAgent: null,
    focusMode: localStorage.getItem('clawreform-focus') === 'true',
    developerMode: localStorage.getItem('clawreform-developer-mode') === 'true',
    showOnboarding: false,
    showAuthPrompt: false,
    showOpenRouterGate: true,
    openRouterGateLoading: true,
    openRouterSaving: false,
    openRouterError: '',
    openRouterKeyInput: '',
    openRouterProviderStatus: 'unknown',
    openRouterHelpUrl: 'https://openrouter.ai/keys',

    toggleFocusMode() {
      this.focusMode = !this.focusMode;
      localStorage.setItem('clawreform-focus', this.focusMode);
    },

    toggleDeveloperMode(forceValue) {
      var next = (typeof forceValue === 'boolean') ? forceValue : !this.developerMode;
      this.developerMode = next;
      localStorage.setItem('clawreform-developer-mode', next ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('clawreform:developer-mode-changed', {
        detail: { enabled: next }
      }));
    },

    async refreshAgents() {
      try {
        var agents = await ClawReformAPI.get('/api/agents');
        this.agents = Array.isArray(agents) ? agents : [];
        this.agentCount = this.agents.length;
      } catch (e) { /* silent */ }
    },

    async checkStatus() {
      try {
        var s = await ClawReformAPI.get('/api/status');
        this.connected = true;
        this.booting = false;
        this.lastError = '';
        this.version = s.version || '0.3.0';
        this.agentCount = s.agent_count || 0;
      } catch (e) {
        this.connected = false;
        this.lastError = e.message || 'Unknown error';
        console.warn('[ClawReform] Status check failed:', e.message);
      }
    },

    async checkOnboarding() {
      if (localStorage.getItem('clawreform-onboarded')) return;
      try {
        var config = await ClawReformAPI.get('/api/config');
        var apiKey = config && config.api_key;
        var noKey = !apiKey || apiKey === 'not set' || apiKey === '';
        if (noKey && this.agentCount === 0) {
          this.showOnboarding = true;
        }
      } catch (e) {
        // If config endpoint fails, still show onboarding if no agents
        if (this.agentCount === 0) this.showOnboarding = true;
      }
    },

    dismissOnboarding() {
      this.showOnboarding = false;
      localStorage.setItem('clawreform-onboarded', 'true');
    },

    async checkAuth() {
      try {
        var data = await ClawReformAPI.get('/api/providers');
        this.showAuthPrompt = false;
        this.updateOpenRouterGateFromProviders((data && data.providers) || []);
        this.openRouterGateLoading = false;
      } catch (e) {
        if (e.message && (e.message.indexOf('Not authorized') >= 0 || e.message.indexOf('401') >= 0 || e.message.indexOf('Missing Authorization') >= 0)) {
          this.showAuthPrompt = true;
          this.showOpenRouterGate = false;
          this.openRouterGateLoading = false;
        }
      }
    },

    updateOpenRouterGateFromProviders(providers) {
      if (!Array.isArray(providers)) {
        this.showOpenRouterGate = false;
        return;
      }
      var provider = null;
      for (var i = 0; i < providers.length; i++) {
        if (providers[i].id === 'openrouter') {
          provider = providers[i];
          break;
        }
      }
      if (!provider) {
        this.openRouterProviderStatus = 'missing';
        this.showOpenRouterGate = false;
        return;
      }
      this.openRouterProviderStatus = provider.auth_status || 'unknown';
      this.showOpenRouterGate = this.openRouterProviderStatus !== 'configured';
    },

    async checkOpenRouterGate() {
      if (this.showAuthPrompt) {
        this.showOpenRouterGate = false;
        return;
      }
      this.openRouterGateLoading = true;
      this.openRouterError = '';
      try {
        var data = await ClawReformAPI.get('/api/providers');
        this.updateOpenRouterGateFromProviders((data && data.providers) || []);
      } catch (e) {
        if (e.message && (e.message.indexOf('Not authorized') >= 0 || e.message.indexOf('401') >= 0 || e.message.indexOf('Missing Authorization') >= 0)) {
          this.showAuthPrompt = true;
          this.showOpenRouterGate = false;
        } else {
          this.openRouterError = e.message || 'Could not verify OpenRouter setup.';
          this.showOpenRouterGate = true;
        }
      }
      this.openRouterGateLoading = false;
    },

    async saveOpenRouterKey() {
      var key = (this.openRouterKeyInput || '').trim();
      if (!key) {
        this.openRouterError = 'Please enter your OpenRouter API key.';
        return;
      }
      this.openRouterSaving = true;
      this.openRouterError = '';
      try {
        await ClawReformAPI.post('/api/providers/openrouter/key', { key: key });
        var test = await ClawReformAPI.post('/api/providers/openrouter/test', {});
        if (test && test.status && test.status !== 'ok') {
          throw new Error(test.error || 'OpenRouter key test failed');
        }
        this.openRouterKeyInput = '';
        this.openRouterProviderStatus = 'configured';
        this.showOpenRouterGate = false;
        ClawReformToast.success('OpenRouter is configured');
      } catch (e) {
        this.openRouterError = e.message || 'Failed to save OpenRouter key.';
        ClawReformToast.error(this.openRouterError);
      }
      this.openRouterSaving = false;
    },

    async submitApiKey(key) {
      if (!key || !key.trim()) return;
      ClawReformAPI.setAuthToken(key.trim());
      localStorage.setItem('clawreform-api-key', key.trim());
      this.showAuthPrompt = false;
      await this.refreshAgents();
      await this.checkOpenRouterGate();
    },

    clearApiKey() {
      ClawReformAPI.setAuthToken('');
      localStorage.removeItem('clawreform-api-key');
    }
  });
});

// Main app component
function app() {
  var validPages = ['overview', 'company', 'agents', 'sessions', 'memory-layers', 'collective', 'obsidian', 'agentdna', 'approvals', 'workflows', 'scheduler', 'channels', 'skills', 'hands', 'analytics', 'logs', 'settings', 'wizard'];
  var pageRedirects = {
    'org': 'company',
    'chat': 'agents',
    'templates': 'agents',
    'triggers': 'workflows',
    'cron': 'scheduler',
    'schedules': 'scheduler',
    'memory': 'obsidian',
    'memory-stack': 'memory-layers',
    'memory-ladder': 'memory-layers',
    'memory-graph': 'obsidian',
    'obsidian-memory': 'obsidian',
    'collective-consciousness': 'collective',
    'collective-memory': 'collective',
    'agentdna': 'agentdna',
    'agentdna-system': 'agentdna',
    'audit': 'logs',
    'security': 'settings',
    'peers': 'settings',
    'migration': 'settings',
    'usage': 'analytics',
    'approval': 'approvals'
  };
  var advancedPages = ['sessions', 'memory-layers', 'collective', 'agentdna', 'approvals', 'workflows', 'scheduler', 'channels', 'skills', 'hands', 'analytics', 'logs'];
  var savedThemeMode = localStorage.getItem('clawreform-theme-mode');
  if (savedThemeMode !== 'light' && savedThemeMode !== 'dark') {
    savedThemeMode = 'dark';
  }
  function applyThemeAttributes(mode) {
    var resolved = mode === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', resolved);
    if (document.body) {
      document.body.setAttribute('data-theme', resolved);
    }
  }

  return {
    page: 'overview',
    obsidianGraphUrl: localStorage.getItem('clawreform-obsidian-graph-url') || '',
    obsidianVaultName: (localStorage.getItem('clawreform-obsidian-vault-name') || 'clawREFORM').trim() || 'clawREFORM',
    showObsidianVaultEditor: false,
    obsidianVaultPending: false,
    obsidianGraphLoading: false,
    obsidianGraphSeeding: false,
    obsidianGraphError: '',
    obsidianShowExternalEmbed: false,
    obsidianGraphSelectedNodeId: 'root',
    obsidianInAppGraph: {
      agentId: '',
      generatedAt: '',
      nodes: [],
      edges: [],
      fileCount: 0
    },
    themeMode: savedThemeMode,
    theme: savedThemeMode,
    // Default to compact sidebar; users can expand explicitly or hover-expand on desktop.
    sidebarCollapsed: true,
    sidebarHoverExpanded: false,
    sidebarHoverOpenTimer: null,
    sidebarHoverCloseTimer: null,
    mobileMenuOpen: false,
    connected: false,
    wsConnected: false,
    version: '0.3.0',
    agentCount: 0,

    get agents() { return Alpine.store('app').agents; },
    isAdvancedPage(pageName) {
      return advancedPages.indexOf(pageName) >= 0;
    },
    normalizePage(rawPage) {
      var page = rawPage || 'overview';
      if (pageRedirects[page]) page = pageRedirects[page];
      if (validPages.indexOf(page) < 0) page = 'overview';
      if (!Alpine.store('app').developerMode && this.isAdvancedPage(page)) {
        if (page === 'sessions' || page === 'memory-layers' || page === 'collective' || page === 'agentdna') {
          return 'obsidian';
        }
        return 'overview';
      }
      return page;
    },

    shouldGuideOnStartup() {
      var store = Alpine.store('app');
      if (store.developerMode) return false;
      if (store.showAuthPrompt) return false;
      if ((window.location.hash || '').replace('#', '').trim()) return false;
      return !!store.showOpenRouterGate || !!store.showOnboarding;
    },

    routeToStartupPageIfNeeded() {
      if (this.shouldGuideOnStartup()) {
        this.navigate('wizard');
      }
    },

    init() {
      var self = this;

      this.obsidianShowExternalEmbed = /^https?:\/\//i.test((this.obsidianGraphUrl || '').trim());

      // Hash routing
      function handleHash() {
        var current = window.location.hash.replace('#', '') || 'overview';
        var normalized = self.normalizePage(current);
        if (normalized !== current) {
          window.location.hash = normalized;
          return;
        }
        self.page = normalized;
        if (normalized === 'obsidian' && self.hasObsidianGraphLinked) {
          self.loadObsidianInAppGraph(false);
        }
      }
      window.addEventListener('hashchange', handleHash);
      window.addEventListener('clawreform:developer-mode-changed', handleHash);
      window.addEventListener('resize', function () {
        if (window.innerWidth <= 768) {
          self.sidebarHoverExpanded = false;
          if (self.sidebarHoverOpenTimer) {
            clearTimeout(self.sidebarHoverOpenTimer);
            self.sidebarHoverOpenTimer = null;
          }
          if (self.sidebarHoverCloseTimer) {
            clearTimeout(self.sidebarHoverCloseTimer);
            self.sidebarHoverCloseTimer = null;
          }
        }
      });
      handleHash();
      applyThemeAttributes(this.theme);

      // Keyboard shortcuts
      document.addEventListener('keydown', function (e) {
        // Ctrl+K — focus agent switch / go to agents
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          self.navigate('agents');
        }
        // Ctrl+H — go to home/overview
        if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
          e.preventDefault();
          self.navigate('overview');
        }
        // Ctrl+N — new agent
        if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
          e.preventDefault();
          self.navigate('agents');
        }
        // Ctrl+Shift+F — toggle focus mode
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
          e.preventDefault();
          Alpine.store('app').toggleFocusMode();
        }
        // Escape — close mobile menu
        if (e.key === 'Escape') {
          self.mobileMenuOpen = false;
          self.sidebarHoverExpanded = false;
          if (self.sidebarHoverOpenTimer) {
            clearTimeout(self.sidebarHoverOpenTimer);
            self.sidebarHoverOpenTimer = null;
          }
          if (self.sidebarHoverCloseTimer) {
            clearTimeout(self.sidebarHoverCloseTimer);
            self.sidebarHoverCloseTimer = null;
          }
        }
      });

      // Connection state listener
      ClawReformAPI.onConnectionChange(function (state) {
        Alpine.store('app').connectionState = state;
      });

      // Initial data load
      this.pollStatus()
        .then(function () { return Alpine.store('app').checkOnboarding(); })
        .then(function () { return Alpine.store('app').checkAuth(); })
        .then(function () { return Alpine.store('app').checkOpenRouterGate(); })
        .finally(function () { self.routeToStartupPageIfNeeded(); });
      setInterval(function () { self.pollStatus(); }, 5000);
    },

    navigate(p) {
      var target = this.normalizePage(p);
      this.page = target;
      window.location.hash = target;
      this.mobileMenuOpen = false;
      if (target === 'obsidian' && this.hasObsidianGraphLinked) {
        this.loadObsidianInAppGraph(false);
      }
    },

    get hasObsidianGraphLinked() {
      var raw = (this.obsidianGraphUrl || '').trim();
      return /^obsidian:\/\//i.test(raw) || /^https?:\/\//i.test(raw);
    },

    get obsidianGraphLabel() {
      var raw = (this.obsidianGraphUrl || '').trim();
      if (!raw) return '';
      if (raw.length <= 72) return raw;
      return raw.slice(0, 69) + '...';
    },

    get obsidianEmbedUrl() {
      var raw = (this.obsidianGraphUrl || '').trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      return '';
    },

    get obsidianGraphNodes() {
      return (this.obsidianInAppGraph && this.obsidianInAppGraph.nodes) || [];
    },

    get obsidianGraphEdges() {
      return (this.obsidianInAppGraph && this.obsidianInAppGraph.edges) || [];
    },

    get obsidianSelectedNode() {
      var nodes = this.obsidianGraphNodes;
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === this.obsidianGraphSelectedNodeId) return nodes[i];
      }
      return nodes.length ? nodes[0] : null;
    },

    get obsidianCanSeedAgent() {
      return /No agents found/i.test(this.obsidianGraphError || '');
    },

    graphHash(input) {
      var str = String(input || '');
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    },

    graphClamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    graphShortLabel(label, max) {
      var text = String(label || '');
      var cap = max || 20;
      if (text.length <= cap) return text;
      return text.slice(0, cap - 1) + '…';
    },

    obsidianNodeRadius(node) {
      if (!node) return 6;
      if (node.type === 'root') return 14;
      if (node.type === 'file') return 10;
      if (node.type === 'section') return 7;
      return 6;
    },

    obsidianNodeClass(node) {
      if (!node) return '';
      var classes = ['memory-graph-node-' + node.type];
      if (this.obsidianGraphSelectedNodeId === node.id) classes.push('is-selected');
      return classes.join(' ');
    },

    buildObsidianInAppGraph(fileDocs, agentId) {
      var width = 980;
      var height = 560;
      var centerX = width / 2;
      var centerY = height / 2;
      var nodeMap = {};
      var nodes = [];
      var edges = [];
      var edgeMap = {};
      var byFileSections = {};

      function addNode(node) {
        if (!node || !node.id || nodeMap[node.id]) return nodeMap[node.id];
        var normalized = {
          id: node.id,
          label: node.label || node.id,
          shortLabel: node.shortLabel || node.label || node.id,
          type: node.type || 'topic',
          meta: node.meta || {},
          x: 0,
          y: 0,
          showLabel: !!node.showLabel
        };
        nodeMap[node.id] = normalized;
        nodes.push(normalized);
        return normalized;
      }

      function addEdge(source, target, type) {
        if (!source || !target || source === target) return;
        var edgeId = source + '->' + target;
        if (edgeMap[edgeId]) return;
        edgeMap[edgeId] = true;
        edges.push({ id: edgeId, source: source, target: target, type: type || 'link', x1: 0, y1: 0, x2: 0, y2: 0 });
      }

      addNode({
        id: 'root',
        label: 'clawREFORM Memory',
        shortLabel: 'Memory',
        type: 'root',
        showLabel: true
      });

      var fileNameToId = {};
      for (var i = 0; i < fileDocs.length; i++) {
        var file = fileDocs[i];
        if (!file || !file.name) continue;
        var fileId = 'file:' + file.name;
        fileNameToId[file.name.toLowerCase()] = fileId;
        addNode({
          id: fileId,
          label: file.name,
          shortLabel: this.graphShortLabel(file.name, 18),
          type: 'file',
          showLabel: true,
          meta: { file: file.name, sizeBytes: file.sizeBytes || 0 }
        });
        addEdge('root', fileId, 'contains');
      }

      for (var f = 0; f < fileDocs.length; f++) {
        var doc = fileDocs[f];
        if (!doc || !doc.name || !doc.content) continue;
        var parentId = 'file:' + doc.name;
        var headingRe = /^#{1,3}\s+(.+)$/gm;
        var headingMatch;
        var headingCount = 0;
        byFileSections[parentId] = byFileSections[parentId] || [];
        while ((headingMatch = headingRe.exec(doc.content)) && headingCount < 8) {
          var headingText = (headingMatch[1] || '').replace(/\s+/g, ' ').trim();
          if (!headingText) continue;
          var sectionId = 'section:' + doc.name + ':' + headingCount;
          addNode({
            id: sectionId,
            label: headingText,
            shortLabel: this.graphShortLabel(headingText, 24),
            type: 'section',
            meta: { file: doc.name }
          });
          addEdge(parentId, sectionId, 'section');
          byFileSections[parentId].push(sectionId);
          headingCount += 1;
        }

        var wikiRe = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
        var wikiMatch;
        var linkCount = 0;
        while ((wikiMatch = wikiRe.exec(doc.content)) && linkCount < 12) {
          var rawTarget = (wikiMatch[1] || '').trim();
          if (!rawTarget) continue;
          var targetFile = rawTarget.toLowerCase().endsWith('.md') ? rawTarget : rawTarget + '.md';
          var targetFileId = fileNameToId[targetFile.toLowerCase()];
          if (targetFileId) {
            addEdge(parentId, targetFileId, 'reference');
          } else {
            var normalized = rawTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            if (!normalized) continue;
            var topicId = 'topic:' + normalized.slice(0, 48);
            addNode({
              id: topicId,
              label: rawTarget,
              shortLabel: this.graphShortLabel(rawTarget, 22),
              type: 'topic',
              meta: { sourceFile: doc.name }
            });
            addEdge(parentId, topicId, 'reference');
          }
          linkCount += 1;
        }
      }

      var fileNodes = [];
      var sectionNodes = [];
      var topicNodes = [];
      for (var n = 0; n < nodes.length; n++) {
        if (nodes[n].type === 'file') fileNodes.push(nodes[n]);
        else if (nodes[n].type === 'section') sectionNodes.push(nodes[n]);
        else if (nodes[n].type === 'topic') topicNodes.push(nodes[n]);
      }

      nodeMap.root.x = centerX;
      nodeMap.root.y = centerY;

      var fileRadius = 170;
      for (var fi = 0; fi < fileNodes.length; fi++) {
        var fileNode = fileNodes[fi];
        var fileAngle = (-Math.PI / 2) + ((Math.PI * 2) * fi / Math.max(1, fileNodes.length));
        fileNode.meta.angle = fileAngle;
        fileNode.x = this.graphClamp(centerX + Math.cos(fileAngle) * fileRadius, 44, width - 44);
        fileNode.y = this.graphClamp(centerY + Math.sin(fileAngle) * fileRadius, 44, height - 44);
      }

      for (var sf = 0; sf < fileNodes.length; sf++) {
        var parentFile = fileNodes[sf];
        var list = byFileSections[parentFile.id] || [];
        for (var si = 0; si < list.length; si++) {
          var sectionNode = nodeMap[list[si]];
          if (!sectionNode) continue;
          var spread = 0.16;
          var offset = (si - ((list.length - 1) / 2)) * spread;
          var secAngle = (parentFile.meta.angle || 0) + offset;
          var secRadius = 290 + ((si % 2) * 24);
          sectionNode.x = this.graphClamp(centerX + Math.cos(secAngle) * secRadius, 32, width - 32);
          sectionNode.y = this.graphClamp(centerY + Math.sin(secAngle) * secRadius, 32, height - 32);
        }
      }

      var topicRadius = 235;
      for (var ti = 0; ti < topicNodes.length; ti++) {
        var topicNode = topicNodes[ti];
        var base = ((Math.PI * 2) * ti / Math.max(1, topicNodes.length));
        var jitter = ((this.graphHash(topicNode.id) % 100) / 100 - 0.5) * 0.2;
        var angle = base + jitter;
        topicNode.x = this.graphClamp(centerX + Math.cos(angle) * topicRadius, 24, width - 24);
        topicNode.y = this.graphClamp(centerY + Math.sin(angle) * topicRadius, 24, height - 24);
      }

      for (var ei = 0; ei < edges.length; ei++) {
        var edge = edges[ei];
        var sourceNode = nodeMap[edge.source];
        var targetNode = nodeMap[edge.target];
        if (!sourceNode || !targetNode) continue;
        edge.x1 = sourceNode.x;
        edge.y1 = sourceNode.y;
        edge.x2 = targetNode.x;
        edge.y2 = targetNode.y;
        var dx = edge.x2 - edge.x1;
        var dy = edge.y2 - edge.y1;
        edge.length = Math.sqrt((dx * dx) + (dy * dy));
        edge.angle = Math.atan2(dy, dx) * 180 / Math.PI;
      }

      return {
        agentId: agentId,
        generatedAt: new Date().toISOString(),
        nodes: nodes,
        edges: edges,
        fileCount: fileDocs.length
      };
    },

    async loadObsidianInAppGraph(force) {
      if (!this.hasObsidianGraphLinked) {
        this.obsidianInAppGraph = { agentId: '', generatedAt: '', nodes: [], edges: [], fileCount: 0 };
        this.obsidianGraphSelectedNodeId = 'root';
        this.obsidianGraphError = '';
        this.obsidianGraphLoading = false;
        return;
      }
      if (this.obsidianGraphLoading || this.obsidianGraphSeeding) return;
      if (!force && this.obsidianGraphNodes.length && this.obsidianInAppGraph.agentId) return;

      this.obsidianGraphLoading = true;
      this.obsidianGraphError = '';
      try {
        var store = Alpine.store('app');
        if ((!store.agents || !store.agents.length) && store.refreshAgents) {
          await store.refreshAgents();
        }
        var agents = (store.agents || []).slice();
        if (!agents.length) {
          this.obsidianGraphError = 'No agents found yet. Create an agent to build the in-app memory graph.';
          this.obsidianInAppGraph = { agentId: '', generatedAt: '', nodes: [], edges: [], fileCount: 0 };
          this.obsidianGraphSelectedNodeId = 'root';
          return;
        }

        var preferred = localStorage.getItem('clawreform-obsidian-agent-id') || '';
        var agentId = '';
        for (var ai = 0; ai < agents.length; ai++) {
          if (agents[ai].id === preferred) {
            agentId = preferred;
            break;
          }
        }
        if (!agentId) agentId = agents[0].id;
        localStorage.setItem('clawreform-obsidian-agent-id', agentId);

        var listResp = await ClawReformAPI.get('/api/agents/' + agentId + '/files');
        var files = (listResp && listResp.files) || [];
        var priorityNames = ['CORE.md', 'OVERVIEW.md', 'PROJECT.md', 'COLLECTIVE.md', 'MEMORY.md', 'HEARTBEAT.md', 'SOUL.md', 'HANDS.md', 'SKILLS.md'];
        var selectedNames = [];
        var seen = {};

        for (var p = 0; p < priorityNames.length; p++) {
          for (var pf = 0; pf < files.length; pf++) {
            var fileMeta = files[pf];
            if (!fileMeta || !fileMeta.exists || !fileMeta.name) continue;
            if (fileMeta.name.toUpperCase() === priorityNames[p] && !seen[fileMeta.name]) {
              selectedNames.push(fileMeta.name);
              seen[fileMeta.name] = true;
            }
          }
        }

        for (var fm = 0; fm < files.length && selectedNames.length < 14; fm++) {
          var candidate = files[fm];
          if (!candidate || !candidate.exists || !candidate.name) continue;
          if (!/\.md$/i.test(candidate.name)) continue;
          if (seen[candidate.name]) continue;
          selectedNames.push(candidate.name);
          seen[candidate.name] = true;
        }

        if (!selectedNames.length) {
          this.obsidianGraphError = 'No memory markdown files found for this agent yet.';
          this.obsidianInAppGraph = { agentId: agentId, generatedAt: new Date().toISOString(), nodes: [], edges: [], fileCount: 0 };
          this.obsidianGraphSelectedNodeId = 'root';
          return;
        }

        var docs = [];
        for (var dn = 0; dn < selectedNames.length; dn++) {
          var name = selectedNames[dn];
          try {
            var resp = await ClawReformAPI.get('/api/agents/' + agentId + '/files/' + encodeURIComponent(name));
            docs.push({ name: name, content: (resp && resp.content) || '', sizeBytes: (resp && resp.size_bytes) || 0 });
          } catch (_) {
            docs.push({ name: name, content: '', sizeBytes: 0 });
          }
        }

        this.obsidianInAppGraph = this.buildObsidianInAppGraph(docs, agentId);
        this.obsidianGraphSelectedNodeId = 'root';
      } catch (e) {
        this.obsidianGraphError = e.message || 'Could not build in-app memory graph.';
        this.obsidianInAppGraph = { agentId: '', generatedAt: '', nodes: [], edges: [], fileCount: 0 };
        this.obsidianGraphSelectedNodeId = 'root';
      } finally {
        this.obsidianGraphLoading = false;
      }
    },

    defaultObsidianSeedFiles() {
      return {
        'CORE.md': '# clawREFORM Core\n\n## North Star\nOperate as a practical agent system with clear memory, safe actions, and fast feedback.\n\n## Identity Contract\n- Brand: clawREFORM by aegntic.ai\n- Runtime: local-first with optional provider routing\n- Memory source: [[MEMORY.md]] and [[COLLECTIVE.md]]\n\n## Linked Organs\n- [[HANDS.md]]\n- [[SOUL.md]]\n- [[HEARTBEAT.md]]\n- [[SKILLS.md]]\n',
        'OVERVIEW.md': '# System Overview\n\n## User Journey\n1. Open app\n2. Connect provider\n3. Start with one active agent\n4. See live memory map in Obsidian tab\n\n## Memory Layers\n- Project context in [[PROJECT.md]]\n- Shared context in [[COLLECTIVE.md]]\n- Active facts in [[MEMORY.md]]\n\n## Ops Views\n- Runtime controls in [[HANDS.md]]\n- Personality frame in [[SOUL.md]]\n',
        'PROJECT.md': '# Project Memory\n\n## Current Goal\nDeliver an in-app memory graph that never forces users out of the dashboard.\n\n## Scope\n- Stable Obsidian link flow\n- Native graph rendering from memory files\n- Clear empty and error states\n\n## Dependencies\n- [[CORE.md]]\n- [[MEMORY.md]]\n- [[HEARTBEAT.md]]\n',
        'COLLECTIVE.md': '# Collective Context\n\n## Shared Principles\n- Prefer clarity over hidden automation\n- Keep defaults beginner-friendly\n- Keep advanced controls in developer mode\n\n## Team Signals\n- UX state: refining\n- Memory state: connected\n- Risk log: avoid fragile setup paths\n\n## Related\n- [[PROJECT.md]]\n- [[OVERVIEW.md]]\n- [[AGENTS.md]]\n',
        'MEMORY.md': '# Working Memory\n\n## Recent Decisions\n- Obsidian page defaults to native in-app graph.\n- External embed is optional and hidden until requested.\n- Graph builds from memory files.\n\n## Active Links\n- [[CORE.md]]\n- [[OVERVIEW.md]]\n- [[PROJECT.md]]\n- [[COLLECTIVE.md]]\n- [[HANDS.md]]\n- [[SOUL.md]]\n- [[HEARTBEAT.md]]\n- [[SKILLS.md]]\n',
        'HANDS.md': '# Hands (Execution)\n\n## Responsibilities\n- Apply safe code changes\n- Validate with checks before claiming done\n- Keep UX paths simple first\n\n## Action Protocol\n1. inspect\n2. patch\n3. verify\n4. prove\n\n## Hooks\n- reads [[MEMORY.md]]\n- updates [[HEARTBEAT.md]]\n',
        'SOUL.md': '# Soul (Identity)\n\n## Character\nDirect, practical, and rigorous.\n\n## Brand\nclawREFORM by aegntic.ai.\n\n## Guardrails\n- No fake success claims\n- No hidden complexity by default\n- Explain tradeoffs plainly\n\n## Connected\n- [[CORE.md]]\n- [[OVERVIEW.md]]\n',
        'SKILLS.md': '# Skills Registry\n\n## Core Skills\n- graph-building\n- memory-linking\n- setup-simplification\n- provider-routing\n\n## Sources\n- [[HANDS.md]]\n- [[PROJECT.md]]\n',
        'HEARTBEAT.md': '# Heartbeat\n\n## Status\n- daemon: running\n- api: healthy\n- memory graph: seeded\n\n## Last Update\nGraph seed applied for in-app Obsidian visualization.\n\n## Linked\n- [[MEMORY.md]]\n- [[COLLECTIVE.md]]\n'
      };
    },

    async createObsidianSeedAgent() {
      if (this.obsidianGraphSeeding) return;
      this.obsidianGraphSeeding = true;
      this.obsidianGraphError = '';
      try {
        var manifestToml = [
          'name = "memory-seed"',
          'version = "0.3.0"',
          'description = "Seeded memory agent for Obsidian graph bootstrapping."',
          'author = "aegntic.ai"',
          'module = "builtin:chat"',
          'tags = ["memory","seed","obsidian"]',
          '',
          '[model]',
          'provider = "openrouter"',
          'model = "llama-3.3-70b-versatile"',
          'api_key_env = "OPENROUTER_API_KEY"',
          'max_tokens = 2048',
          'temperature = 0.4',
          'system_prompt = """You maintain memory files for clawREFORM and keep context linked and clean."""',
          ''
        ].join('\n');
        var spawn = await ClawReformAPI.post('/api/agents', { manifest_toml: manifestToml });
        var agentId = spawn && spawn.agent_id;
        if (!agentId) throw new Error('Seed agent did not return an id.');

        var docs = this.defaultObsidianSeedFiles();
        var names = Object.keys(docs);
        for (var i = 0; i < names.length; i++) {
          var filename = names[i];
          await ClawReformAPI.put('/api/agents/' + agentId + '/files/' + encodeURIComponent(filename), {
            content: docs[filename]
          });
        }
        localStorage.setItem('clawreform-obsidian-agent-id', agentId);
        var store = Alpine.store('app');
        if (store && store.refreshAgents) {
          await store.refreshAgents();
        }
        if (window.ClawReformToast && ClawReformToast.success) {
          ClawReformToast.success('Seed memory agent created');
        }
        this.obsidianGraphSeeding = false;
        await this.loadObsidianInAppGraph(true);
      } catch (e) {
        this.obsidianGraphError = e.message || 'Failed to create seed memory agent.';
        if (window.ClawReformToast && ClawReformToast.error) {
          ClawReformToast.error(this.obsidianGraphError);
        }
      } finally {
        this.obsidianGraphSeeding = false;
      }
    },

    normalizeObsidianVaultName(name) {
      var cleaned = (name || '').replace(/\s+/g, ' ').trim();
      return cleaned || 'clawREFORM';
    },

    getObsidianGraphUrlForVault(vaultName) {
      return 'obsidian://graph?vault=' + encodeURIComponent(this.normalizeObsidianVaultName(vaultName));
    },

    extractObsidianVaultNameFromUrl(rawUrl) {
      var raw = (rawUrl || '').trim();
      if (!/^obsidian:\/\//i.test(raw)) return '';
      var match = raw.match(/[?&]vault=([^&#]+)/i);
      if (!match || !match[1]) return '';
      try {
        return decodeURIComponent(match[1].replace(/\+/g, '%20'));
      } catch (_) {
        return match[1];
      }
    },

    persistObsidianVaultName(vaultName) {
      var normalized = this.normalizeObsidianVaultName(vaultName);
      this.obsidianVaultName = normalized;
      localStorage.setItem('clawreform-obsidian-vault-name', normalized);
      return normalized;
    },

    launchObsidianUrl(url) {
      var target = (url || '').trim();
      if (!target) return false;
      try {
        var anchor = document.createElement('a');
        anchor.href = target;
        anchor.rel = 'noopener noreferrer';
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        return true;
      } catch (_) {
        return false;
      }
    },

    async saveObsidianGraphUrl() {
      var trimmed = (this.obsidianGraphUrl || '').trim();
      this.obsidianGraphUrl = trimmed;
      localStorage.setItem('clawreform-obsidian-graph-url', trimmed);
      var detectedVault = this.extractObsidianVaultNameFromUrl(trimmed);
      if (detectedVault) this.persistObsidianVaultName(detectedVault);
      this.obsidianVaultPending = false;
      this.showObsidianVaultEditor = !!trimmed;
      this.obsidianShowExternalEmbed = /^https?:\/\//i.test(trimmed);
      if (trimmed && window.ClawReformToast && ClawReformToast.success) {
        ClawReformToast.success('Obsidian memory link saved');
      }
      if (trimmed) {
        await this.loadObsidianInAppGraph(true);
      } else {
        this.obsidianInAppGraph = { agentId: '', generatedAt: '', nodes: [], edges: [], fileCount: 0 };
        this.obsidianGraphSelectedNodeId = 'root';
        this.obsidianGraphError = '';
      }
    },

    startAddObsidianVault() {
      this.showObsidianVaultEditor = true;
      setTimeout(function () {
        var el = document.getElementById('obsidian-graph-url');
        if (el) el.focus();
      }, 20);
    },

    async applyObsidianVaultPreset() {
      var vaultName = this.persistObsidianVaultName(this.obsidianVaultName);
      this.obsidianGraphUrl = this.getObsidianGraphUrlForVault(vaultName);
      await this.saveObsidianGraphUrl();
      this.obsidianVaultPending = false;
      this.showObsidianVaultEditor = true;
    },

    createObsidianVault() {
      var vaultName = this.persistObsidianVaultName(this.obsidianVaultName);
      this.obsidianVaultPending = true;
      this.showObsidianVaultEditor = false;
      this.launchObsidianUrl('obsidian://open');
      if (window.ClawReformToast && ClawReformToast.info) {
        ClawReformToast.info('Obsidian opened. Create vault "' + vaultName + '", then click Connect.');
      }
    },

    async useExistingObsidianVault() {
      var vaultName = this.persistObsidianVaultName(this.obsidianVaultName);
      var graphUrl = this.getObsidianGraphUrlForVault(vaultName);
      this.obsidianGraphUrl = graphUrl;
      localStorage.setItem('clawreform-obsidian-graph-url', graphUrl);
      this.obsidianVaultPending = false;
      this.showObsidianVaultEditor = false;
      this.obsidianShowExternalEmbed = false;
      this.launchObsidianUrl(graphUrl);
      await this.loadObsidianInAppGraph(true);
      if (window.ClawReformToast && ClawReformToast.success) {
        ClawReformToast.success('Obsidian vault linked.');
      }
    },

    disconnectObsidianVault() {
      this.obsidianGraphUrl = '';
      localStorage.removeItem('clawreform-obsidian-graph-url');
      this.obsidianVaultPending = false;
      this.showObsidianVaultEditor = false;
      this.obsidianShowExternalEmbed = false;
      this.obsidianInAppGraph = { agentId: '', generatedAt: '', nodes: [], edges: [], fileCount: 0 };
      this.obsidianGraphSelectedNodeId = 'root';
      this.obsidianGraphError = '';
      this.obsidianGraphLoading = false;
      if (window.ClawReformToast && ClawReformToast.info) {
        ClawReformToast.info('Obsidian link removed.');
      }
    },

    openObsidianGraph() {
      var target = (this.obsidianGraphUrl || '').trim();
      if (!target) {
        this.createObsidianVault();
        return;
      }
      if (/^obsidian:\/\//i.test(target)) {
        this.launchObsidianUrl(target);
        return;
      }
      window.open(target, '_blank', 'noopener,noreferrer');
    },

    setTheme(mode) {
      var next = mode === 'light' ? 'light' : 'dark';
      this.themeMode = next;
      this.theme = next;
      localStorage.setItem('clawreform-theme-mode', next);
      applyThemeAttributes(this.theme);
    },

    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      if (!this.sidebarCollapsed) {
        this.sidebarHoverExpanded = false;
      }
      localStorage.setItem('clawreform-sidebar', this.sidebarCollapsed ? 'collapsed' : 'expanded');
    },

    canSidebarHoverExpand() {
      var canHover = true;
      if (window.matchMedia) {
        canHover = window.matchMedia('(hover: hover)').matches;
      }
      return this.sidebarCollapsed && window.innerWidth > 768 && !this.mobileMenuOpen && canHover;
    },

    clearSidebarHoverTimers() {
      if (this.sidebarHoverOpenTimer) {
        clearTimeout(this.sidebarHoverOpenTimer);
        this.sidebarHoverOpenTimer = null;
      }
      if (this.sidebarHoverCloseTimer) {
        clearTimeout(this.sidebarHoverCloseTimer);
        this.sidebarHoverCloseTimer = null;
      }
    },

    onSidebarMouseEnter() {
      if (!this.canSidebarHoverExpand()) return;
      this.clearSidebarHoverTimers();
      var self = this;
      this.sidebarHoverOpenTimer = setTimeout(function () {
        self.sidebarHoverExpanded = true;
        self.sidebarHoverOpenTimer = null;
      }, 80);
    },

    onSidebarMouseLeave() {
      if (!this.sidebarCollapsed) return;
      this.clearSidebarHoverTimers();
      var self = this;
      this.sidebarHoverCloseTimer = setTimeout(function () {
        self.sidebarHoverExpanded = false;
        self.sidebarHoverCloseTimer = null;
      }, 180);
    },

    onSidebarFocusIn() {
      if (!this.canSidebarHoverExpand()) return;
      this.clearSidebarHoverTimers();
      this.sidebarHoverExpanded = true;
    },

    onSidebarFocusOut() {
      if (!this.sidebarCollapsed) return;
      this.clearSidebarHoverTimers();
      var self = this;
      this.sidebarHoverCloseTimer = setTimeout(function () {
        var sidebar = document.querySelector('.sidebar');
        var active = document.activeElement;
        if (sidebar && (!active || !sidebar.contains(active))) {
          self.sidebarHoverExpanded = false;
        }
        self.sidebarHoverCloseTimer = null;
      }, 120);
    },

    async pollStatus() {
      var store = Alpine.store('app');
      await store.checkStatus();
      await store.refreshAgents();
      this.connected = store.connected;
      this.version = store.version;
      this.agentCount = store.agentCount;
      this.wsConnected = ClawReformAPI.isWsConnected();
    }
  };
}
