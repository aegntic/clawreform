// ClawReform Organism Page — organ inventory, health, and file preview
'use strict';

function organismPage() {
  return {
    selectedAgentId: '',
    loading: false,
    loadError: '',
    files: [],
    selectedFile: '',
    fileContent: '',
    fileLoading: false,
    fileError: '',
    groups: [
      {
        id: 'core',
        label: 'Core Organs',
        files: ['IDENTITY.md', 'SOUL.md', 'HANDS.md', 'MEMORY.md', 'HEARTBEAT.md', 'COLLECTIVE.md']
      },
      {
        id: 'support',
        label: 'Support Organs',
        files: ['USER.md', 'TOOLS.md', 'SKILLS.md', 'AGENTS.md', 'BOOTSTRAP.md']
      },
      {
        id: 'memory',
        label: 'Memory Views',
        files: ['CORE.md', 'OVERVIEW.md', 'PROJECT.md', 'COLLECTIVE.md']
      }
    ],

    async loadData() {
      await this.ensureAgentSelected();
      await this.loadOrganism();
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

    async loadOrganism() {
      if (!this.selectedAgentId) {
        this.files = [];
        this.loadError = 'Select an agent to inspect organism files.';
        return;
      }
      this.loading = true;
      this.loadError = '';
      this.fileContent = '';
      this.fileError = '';
      try {
        var listResp = await ClawReformAPI.get('/api/agents/' + this.selectedAgentId + '/files');
        this.files = (listResp && listResp.files) || [];
        var target = this.selectedFile;
        if (!target || !this.fileMeta(target).exists) {
          target = this.firstExistingFile();
        }
        if (target) {
          await this.openFile(target);
        } else {
          this.selectedFile = '';
          this.fileContent = '';
        }
      } catch (e) {
        this.files = [];
        this.loadError = e.message || 'Could not load organism file list.';
      }
      this.loading = false;
    },

    fileMeta(name) {
      for (var i = 0; i < this.files.length; i++) {
        if (this.files[i].name === name) return this.files[i];
      }
      return { name: name, exists: false, size_bytes: 0 };
    },

    firstExistingFile() {
      for (var g = 0; g < this.groups.length; g++) {
        var files = this.groups[g].files;
        for (var i = 0; i < files.length; i++) {
          if (this.fileMeta(files[i]).exists) return files[i];
        }
      }
      return '';
    },

    async openFile(name) {
      this.selectedFile = name;
      this.fileLoading = true;
      this.fileError = '';
      this.fileContent = '';
      try {
        var meta = this.fileMeta(name);
        if (!meta.exists) {
          this.fileContent = '';
          this.fileError = name + ' is missing for this agent.';
        } else {
          var resp = await ClawReformAPI.get('/api/agents/' + this.selectedAgentId + '/files/' + encodeURIComponent(name));
          this.fileContent = (resp && resp.content) || '';
        }
      } catch (e) {
        this.fileError = e.message || ('Could not read ' + name);
      }
      this.fileLoading = false;
    },

    existingCount(group) {
      var n = 0;
      for (var i = 0; i < group.files.length; i++) {
        if (this.fileMeta(group.files[i]).exists) n++;
      }
      return n;
    },

    completion(group) {
      if (!group.files.length) return 0;
      return Math.round((this.existingCount(group) / group.files.length) * 100);
    }
  };
}
