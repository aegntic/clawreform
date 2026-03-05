// ClawReform App — Alpine.js init, hash router, global store
'use strict';

// Marked.js configuration
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
      if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang }).value; } catch(e) {}
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
    navigator.clipboard.writeText(code.textContent).then(function() {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
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
document.addEventListener('alpine:init', function() {
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
    version: '0.2.1',
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
      } catch(e) { /* silent */ }
    },

    async checkStatus() {
      try {
        var s = await ClawReformAPI.get('/api/status');
        this.connected = true;
        this.booting = false;
        this.lastError = '';
        this.version = s.version || '0.2.1';
        this.agentCount = s.agent_count || 0;
      } catch(e) {
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
      } catch(e) {
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
      } catch(e) {
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
  var validPages = ['overview','agents','sessions','memory-layers','collective','obsidian','organism','approvals','workflows','scheduler','channels','skills','hands','analytics','logs','settings','wizard'];
  var pageRedirects = {
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
    'organs': 'organism',
    'organ-system': 'organism',
    'audit': 'logs',
    'security': 'settings',
    'peers': 'settings',
    'migration': 'settings',
    'usage': 'analytics',
    'approval': 'approvals'
  };
  var advancedPages = ['sessions','memory-layers','collective','organism','approvals','workflows','scheduler','channels','skills','hands','analytics','logs'];

  return {
    page: 'agents',
    obsidianGraphUrl: localStorage.getItem('clawreform-obsidian-graph-url') || '',
    showObsidianVaultEditor: !!(localStorage.getItem('clawreform-obsidian-graph-url') || '').trim(),
    themeMode: localStorage.getItem('clawreform-theme-mode') || 'dark',
    theme: (() => {
      var mode = localStorage.getItem('clawreform-theme-mode') || 'dark';
      if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return mode;
    })(),
    sidebarCollapsed: localStorage.getItem('clawreform-sidebar') === 'collapsed',
    mobileMenuOpen: false,
    connected: false,
    wsConnected: false,
    version: '0.2.1',
    agentCount: 0,

    get agents() { return Alpine.store('app').agents; },
    isAdvancedPage(pageName) {
      return advancedPages.indexOf(pageName) >= 0;
    },
    normalizePage(rawPage) {
      var page = rawPage || 'agents';
      if (pageRedirects[page]) page = pageRedirects[page];
      if (validPages.indexOf(page) < 0) page = 'agents';
      if (!Alpine.store('app').developerMode && this.isAdvancedPage(page)) {
        if (page === 'sessions' || page === 'memory-layers' || page === 'collective' || page === 'organism') {
          return 'obsidian';
        }
        return 'overview';
      }
      return page;
    },

    init() {
      var self = this;

      // Listen for OS theme changes (only matters when mode is 'system')
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (self.themeMode === 'system') {
          self.theme = e.matches ? 'dark' : 'light';
          document.body.setAttribute('data-theme', self.theme);
        }
      });

      // Hash routing
      function handleHash() {
        var current = window.location.hash.replace('#', '') || 'agents';
        var normalized = self.normalizePage(current);
        if (normalized !== current) {
          window.location.hash = normalized;
          return;
        }
        self.page = normalized;
      }
      window.addEventListener('hashchange', handleHash);
      window.addEventListener('clawreform:developer-mode-changed', handleHash);
      handleHash();
      document.body.setAttribute('data-theme', this.theme);

      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Ctrl+K — focus agent switch / go to agents
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          self.navigate('agents');
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
        }
      });

      // Connection state listener
      ClawReformAPI.onConnectionChange(function(state) {
        Alpine.store('app').connectionState = state;
      });

      // Initial data load
      this.pollStatus();
      Alpine.store('app').checkOnboarding();
      Alpine.store('app').checkAuth().then(function() {
        Alpine.store('app').checkOpenRouterGate();
      });
      setInterval(function() { self.pollStatus(); }, 5000);
    },

    navigate(p) {
      var target = this.normalizePage(p);
      this.page = target;
      window.location.hash = target;
      this.mobileMenuOpen = false;
    },

    get hasObsidianGraphLinked() {
      var raw = (this.obsidianGraphUrl || '').trim();
      return /^obsidian:\/\//i.test(raw) || /^https?:\/\//i.test(raw);
    },

    get obsidianEmbedUrl() {
      var raw = (this.obsidianGraphUrl || '').trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      return '';
    },

    saveObsidianGraphUrl() {
      var trimmed = (this.obsidianGraphUrl || '').trim();
      this.obsidianGraphUrl = trimmed;
      localStorage.setItem('clawreform-obsidian-graph-url', trimmed);
      this.showObsidianVaultEditor = !!trimmed;
    },

    startAddObsidianVault() {
      this.showObsidianVaultEditor = true;
      setTimeout(function() {
        var el = document.getElementById('obsidian-graph-url');
        if (el) el.focus();
      }, 20);
    },

    createObsidianVault() {
      var vaultName = (localStorage.getItem('clawreform-obsidian-vault-name') || 'clawREFORM').trim();
      if (!vaultName) vaultName = 'clawREFORM';
      var encodedVault = encodeURIComponent(vaultName);
      this.obsidianGraphUrl = 'obsidian://graph?vault=' + encodedVault;
      this.saveObsidianGraphUrl();
      this.showObsidianVaultEditor = true;
      localStorage.setItem('clawreform-obsidian-vault-name', vaultName);
      window.open('obsidian://open?vault=' + encodedVault, '_blank', 'noopener,noreferrer');
      if (window.ClawReformToast && ClawReformToast.info) {
        ClawReformToast.info('Vault flow started in Obsidian. Return here and click Open Graph.');
      }
    },

    openObsidianGraph() {
      var target = (this.obsidianGraphUrl || '').trim();
      if (!target) {
        target = window.prompt('Enter your Obsidian graph URL (obsidian://... or https://...)', '');
        if (!target) return;
        this.obsidianGraphUrl = target.trim();
        this.saveObsidianGraphUrl();
      }
      window.open(target, '_blank', 'noopener,noreferrer');
    },

    setTheme(mode) {
      this.themeMode = mode;
      localStorage.setItem('clawreform-theme-mode', mode);
      if (mode === 'system') {
        this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        this.theme = mode;
      }
      document.body.setAttribute('data-theme', this.theme);
    },

    toggleTheme() {
      var modes = ['light', 'system', 'dark'];
      var next = modes[(modes.indexOf(this.themeMode) + 1) % modes.length];
      this.setTheme(next);
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('clawreform-sidebar', this.sidebarCollapsed ? 'collapsed' : 'expanded');
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
