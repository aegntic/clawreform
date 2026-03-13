// ClawReform Skills Page — OpenClaw/ClawHub ecosystem + local skills + MCP servers
'use strict';

function skillsPage() {
  return {
    tab: 'installed',
    skills: [],
    loading: true,
    loadError: '',

    // ClawHub state
    clawhubSearch: '',
    clawhubResults: [],
    clawhubBrowseResults: [],
    clawhubLoading: false,
    clawhubError: '',
    clawhubSort: 'trending',
    clawhubNextCursor: null,
    installingSlug: null,
    installResult: null,
    _searchTimer: null,

    // Skill detail modal
    skillDetail: null,
    detailLoading: false,

    // MCP servers
    mcpServers: [],
    mcpLoading: false,

    // Category definitions from the OpenClaw ecosystem
    categories: [
      { id: 'coding', name: 'Coding & IDEs' },
      { id: 'git', name: 'Git & GitHub' },
      { id: 'web', name: 'Web & Frontend' },
      { id: 'devops', name: 'DevOps & Cloud' },
      { id: 'browser', name: 'Browser & Automation' },
      { id: 'search', name: 'Search & Research' },
      { id: 'ai', name: 'AI & LLMs' },
      { id: 'data', name: 'Data & Analytics' },
      { id: 'productivity', name: 'Productivity' },
      { id: 'communication', name: 'Communication' },
      { id: 'media', name: 'Media & Streaming' },
      { id: 'notes', name: 'Notes & PKM' },
      { id: 'security', name: 'Security' },
      { id: 'cli', name: 'CLI Utilities' },
      { id: 'marketing', name: 'Marketing & Sales' },
      { id: 'finance', name: 'Finance' },
      { id: 'smart-home', name: 'Smart Home & IoT' },
      { id: 'docs', name: 'PDF & Documents' },
    ],

    runtimeBadge: function(rt) {
      var r = (rt || '').toLowerCase();
      if (r === 'python' || r === 'py') return { text: 'PY', cls: 'runtime-badge-py' };
      if (r === 'node' || r === 'nodejs' || r === 'js' || r === 'javascript') return { text: 'JS', cls: 'runtime-badge-js' };
      if (r === 'wasm' || r === 'webassembly') return { text: 'WASM', cls: 'runtime-badge-wasm' };
      if (r === 'prompt_only' || r === 'prompt' || r === 'promptonly') return { text: 'PROMPT', cls: 'runtime-badge-prompt' };
      return { text: r.toUpperCase().substring(0, 4), cls: 'runtime-badge-prompt' };
    },

    sourceBadge: function(source) {
      if (!source) return { text: 'Local', cls: 'badge-dim' };
      switch (source.type) {
        case 'clawhub': return { text: 'ClawHub', cls: 'badge-info' };
        case 'openclaw': return { text: 'OpenClaw', cls: 'badge-info' };
        case 'bundled': return { text: 'Built-in', cls: 'badge-success' };
        default: return { text: 'Local', cls: 'badge-dim' };
      }
    },

    formatDownloads: function(n) {
      if (!n) return '0';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    },

    async loadSkills() {
      this.loading = true;
      this.loadError = '';
      try {
        var data = await ClawReformAPI.get('/api/skills');
        this.skills = (data.skills || []).map(function(s) {
          return {
            name: s.name,
            description: s.description || '',
            version: s.version || '',
            author: s.author || '',
            runtime: s.runtime || 'unknown',
            tools_count: s.tools_count || 0,
            tags: s.tags || [],
            enabled: s.enabled !== false,
            source: s.source || { type: 'local' },
            has_prompt_context: !!s.has_prompt_context
          };
        });
      } catch(e) {
        this.skills = [];
        this.loadError = e.message || 'Could not load skills.';
      }
      this.loading = false;
    },

    async loadData() {
      await this.loadSkills();
    },

    // Debounced search — fires 350ms after user stops typing
    onSearchInput() {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      var q = this.clawhubSearch.trim();
      if (!q) {
        this.clawhubResults = [];
        this.clawhubError = '';
        return;
      }
      var self = this;
      this._searchTimer = setTimeout(function() { self.searchClawHub(); }, 350);
    },

    // ClawHub search
    async searchClawHub() {
      if (!this.clawhubSearch.trim()) {
        this.clawhubResults = [];
        return;
      }
      this.clawhubLoading = true;
      this.clawhubError = '';
      try {
        var data = await ClawReformAPI.get('/api/clawhub/search?q=' + encodeURIComponent(this.clawhubSearch.trim()) + '&limit=20');
        this.clawhubResults = data.items || [];
        if (data.error) this.clawhubError = data.error;
      } catch(e) {
        this.clawhubResults = [];
        this.clawhubError = e.message || 'Search failed';
      }
      this.clawhubLoading = false;
    },

    // Clear search and go back to browse
    clearSearch() {
      this.clawhubSearch = '';
      this.clawhubResults = [];
      this.clawhubError = '';
      if (this._searchTimer) clearTimeout(this._searchTimer);
    },

    // ClawHub browse by sort
    async browseClawHub(sort) {
      this.clawhubSort = sort || 'trending';
      this.clawhubLoading = true;
      this.clawhubError = '';
      this.clawhubNextCursor = null;
      try {
        var data = await ClawReformAPI.get('/api/clawhub/browse?sort=' + this.clawhubSort + '&limit=20');
        this.clawhubBrowseResults = data.items || [];
        this.clawhubNextCursor = data.next_cursor || null;
        if (data.error) this.clawhubError = data.error;
      } catch(e) {
        this.clawhubBrowseResults = [];
        this.clawhubError = e.message || 'Browse failed';
      }
      this.clawhubLoading = false;
    },

    // ClawHub load more results
    async loadMoreClawHub() {
      if (!this.clawhubNextCursor || this.clawhubLoading) return;
      this.clawhubLoading = true;
      try {
        var data = await ClawReformAPI.get('/api/clawhub/browse?sort=' + this.clawhubSort + '&limit=20&cursor=' + encodeURIComponent(this.clawhubNextCursor));
        this.clawhubBrowseResults = this.clawhubBrowseResults.concat(data.items || []);
        this.clawhubNextCursor = data.next_cursor || null;
      } catch(e) {
        // silently fail on load more
      }
      this.clawhubLoading = false;
    },

    // Show skill detail
    async showSkillDetail(slug) {
      this.detailLoading = true;
      this.skillDetail = null;
      this.installResult = null;
      try {
        var data = await ClawReformAPI.get('/api/clawhub/skill/' + encodeURIComponent(slug));
        this.skillDetail = data;
      } catch(e) {
        ClawReformToast.error('Failed to load skill details');
      }
      this.detailLoading = false;
    },

    closeDetail() {
      this.skillDetail = null;
      this.installResult = null;
    },

    // Install from ClawHub
    async installFromClawHub(slug) {
      this.installingSlug = slug;
      this.installResult = null;
      try {
        var data = await ClawReformAPI.post('/api/clawhub/install', { slug: slug });
        this.installResult = data;
        if (data.warnings && data.warnings.length > 0) {
          ClawReformToast.success('Skill "' + data.name + '" installed with ' + data.warnings.length + ' warning(s)');
        } else {
          ClawReformToast.success('Skill "' + data.name + '" installed successfully');
        }
        // Update installed state in detail modal if open
        if (this.skillDetail && this.skillDetail.slug === slug) {
          this.skillDetail.installed = true;
        }
        await this.loadSkills();
      } catch(e) {
        var msg = e.message || 'Install failed';
        if (msg.includes('already_installed')) {
          ClawReformToast.error('Skill is already installed');
        } else if (msg.includes('SecurityBlocked')) {
          ClawReformToast.error('Skill blocked by security scan');
        } else {
          ClawReformToast.error('Install failed: ' + msg);
        }
      }
      this.installingSlug = null;
    },

    // Uninstall
    uninstallSkill: function(name) {
      var self = this;
      ClawReformToast.confirm('Uninstall Skill', 'Uninstall skill "' + name + '"? This cannot be undone.', async function() {
        try {
          await ClawReformAPI.post('/api/skills/uninstall', { name: name });
          ClawReformToast.success('Skill "' + name + '" uninstalled');
          await self.loadSkills();
        } catch(e) {
          ClawReformToast.error('Failed to uninstall skill: ' + e.message);
        }
      });
    },

    // Create prompt-only skill
    async createDemoSkill(skill) {
      try {
        await ClawReformAPI.post('/api/skills/create', {
          name: skill.name,
          description: skill.description,
          runtime: 'prompt_only',
          prompt_context: skill.prompt_context || skill.description
        });
        ClawReformToast.success('Skill "' + skill.name + '" created');
        this.tab = 'installed';
        await this.loadSkills();
      } catch(e) {
        ClawReformToast.error('Failed to create skill: ' + e.message);
      }
    },

    // Load MCP servers
    async loadMcpServers() {
      this.mcpLoading = true;
      try {
        var data = await ClawReformAPI.get('/api/mcp/servers');
        this.mcpServers = data;
      } catch(e) {
        this.mcpServers = { configured: [], connected: [], total_configured: 0, total_connected: 0 };
      }
      this.mcpLoading = false;
    },

    // Category search on ClawHub
    searchCategory: function(cat) {
      this.clawhubSearch = cat.name;
      this.searchClawHub();
    },

    // Quick start skills (prompt-only, zero deps)
    quickStartSkills: [
      { name: 'code-review-guide', description: 'Adds code review best practices and checklist to agent context.', prompt_context: 'You are an expert code reviewer. When reviewing code:\n1. Check for bugs and logic errors\n2. Evaluate code style and readability\n3. Look for security vulnerabilities\n4. Suggest performance improvements\n5. Verify error handling\n6. Check test coverage' },
      { name: 'writing-style', description: 'Configurable writing style guide for content generation.', prompt_context: 'Follow these writing guidelines:\n- Use clear, concise language\n- Prefer active voice over passive voice\n- Keep paragraphs short (3-4 sentences)\n- Use bullet points for lists\n- Maintain consistent tone throughout' },
      { name: 'api-design', description: 'REST API design patterns and conventions.', prompt_context: 'When designing REST APIs:\n- Use nouns for resources, not verbs\n- Use HTTP methods correctly (GET, POST, PUT, DELETE)\n- Return appropriate status codes\n- Use pagination for list endpoints\n- Version your API\n- Document all endpoints' },
      { name: 'security-checklist', description: 'OWASP-aligned security review checklist.', prompt_context: 'Security review checklist (OWASP aligned):\n- Input validation on all user inputs\n- Output encoding to prevent XSS\n- Parameterized queries to prevent SQL injection\n- Authentication and session management\n- Access control checks\n- CSRF protection\n- Security headers\n- Error handling without information leakage' },
    ],

    // Check if skill is installed by slug
    isSkillInstalled: function(slug) {
      return this.skills.some(function(s) {
        return s.source && s.source.type === 'clawhub' && s.source.slug === slug;
      });
    },

    // Check if skill is installed by name
    isSkillInstalledByName: function(name) {
      return this.skills.some(function(s) { return s.name === name; });
    },

    // Local skills scanning
    localSkills: [],
    localLoading: false,
    localError: '',
    localScannedDirs: [],

    async scanLocalSkills() {
      this.localLoading = true;
      this.localError = '';
      this.localSkills = [];
      this.localScannedDirs = [];

      var home = window.location.hostname === 'localhost' ? '' : '';
      var commonDirs = [
        '~/.claude/skills',
        '~/.codex/skills',
        '~/.gemini/skills',
        '~/.opencode/skills',
        '~/.cline/skills',
        '~/.aider/skills',
        '~/.cursor/skills',
        '~/.continue/skills',
        '~/.local/share/mcp/skills',
      ];

      // Try to get suggestions from API first
      try {
        var data = await ClawReformAPI.get('/api/import/suggestions');
        if (data.suggestions && data.suggestions.length > 0) {
          for (var i = 0; i < data.suggestions.length; i++) {
            var s = data.suggestions[i];
            if (s.exists && s.item_count > 0) {
              this.localScannedDirs.push({ path: s.path, count: s.item_count });
            }
          }
        }
      } catch(e) {
        // API suggestions failed, use hardcoded list
      }

      // Scan each suggested directory
      for (var j = 0; j < this.localScannedDirs.length; j++) {
        var dir = this.localScannedDirs[j];
        try {
          var scanData = await ClawReformAPI.post('/api/import/scan', { directory: dir.path });
          if (scanData.skills && scanData.skills.length > 0) {
            for (var k = 0; k < scanData.skills.length; k++) {
              var skill = scanData.skills[k];
              if (!skill.already_installed && skill.can_import) {
                this.localSkills.push(skill);
              }
            }
          }
        } catch(err) {
          // Skip directories that fail to scan
        }
      }

      // If no results from suggestions, scan home directories
      if (this.localSkills.length === 0) {
        for (var m = 0; m < commonDirs.length; m++) {
          var path = commonDirs[m];
          try {
            var scanRes = await ClawReformAPI.post('/api/import/scan', { directory: path });
            if (scanRes.skills && scanRes.skills.length > 0) {
              for (var n = 0; n < scanRes.skills.length; n++) {
                var sk = scanRes.skills[n];
                if (!sk.already_installed && sk.can_import) {
                  this.localSkills.push(sk);
                }
              }
            }
          } catch(err2) {
            // Skip
          }
        }
      }

      this.localLoading = false;
      if (this.localSkills.length === 0 && this.localScannedDirs.length === 0) {
        this.localError = 'No local skills found. Try scanning a specific directory in Settings > Import.';
      }
    },

    async importLocalSkill(skill) {
      try {
        var data = await ClawReformAPI.post('/api/import', {
          items: [{ item_type: 'skill', path: skill.path, name: skill.name }]
        });
        if (data.success) {
          ClawReformToast.success('Skill "' + skill.name + '" imported');
          // Remove from local list
          var idx = this.localSkills.findIndex(function(s) { return s.path === skill.path; });
          if (idx !== -1) this.localSkills.splice(idx, 1);
          await this.loadSkills();
        } else {
          ClawReformToast.error(data.message || 'Import failed');
        }
      } catch(e) {
        ClawReformToast.error('Import failed: ' + e.message);
      }
    },

    async importAllLocalSkills() {
      if (this.localSkills.length === 0) return;
      var items = this.localSkills.map(function(s) {
        return { item_type: 'skill', path: s.path, name: s.name };
      });
      try {
        var data = await ClawReformAPI.post('/api/import', { items: items });
        if (data.success) {
          ClawReformToast.success('Imported ' + data.imported.length + ' skill(s)');
          this.localSkills = [];
          await this.loadSkills();
        } else {
          ClawReformToast.error(data.message || 'Import failed');
        }
      } catch(e) {
        ClawReformToast.error('Import failed: ' + e.message);
      }
    },
  };
}
