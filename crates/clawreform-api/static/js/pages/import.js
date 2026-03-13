// Import Page — Scan and import MCP servers, skills, plugins
'use strict';

function importPage() {
  return {
    // Scan state
    scanPath: '',
    scanResults: null,
    scanning: false,
    scanError: '',
    suggestions: [],
    discoveredItems: [],
    selectedItems: [],

    // Import state
    importing: false,
    importResults: null,

    // UI state
    showScanModal: false,
    showImportModal: false,

    // Computed
    get hasDiscovered() {
      return this.discoveredItems.length > 0 ||
      this.selectedItems.length > 0;
    },

    get selectedSkills() {
      return this.discoveredItems.filter(function(item) { return item.item_type === 'skill'; });
    },

    get selectedMcpServers() {
      return this.discoveredItems.filter(function(item) { return item.item_type === 'mcp_server'; });
    },

    get selectedPlugins() {
      return this.discoveredItems.filter(function(item) { return item.item_type === 'plugin'; });
    },

    // Methods
    async loadSuggestions() {
      try {
        var data = await ClawReformAPI.get('/api/import/suggestions');
        this.suggestions = data.suggestions || [];
      } catch(e) {
        this.scanError = 'Failed to load suggestions: ' + e.message;
      }
    },

    async scanDirectory(dir) {
      this.scanPath = dir;
      this.scanning = true;
      this.scanError = '';

      try {
        var data = await ClawReformAPI.post('/api/import/scan', { directory: dir });
        if (data.error) {
          this.scanError = data.error;
          return;
        }
        this.scanResults = data;
        this.discoveredItems = []
          .concat(data.mcp_servers || [])
          .concat(data.skills || [])
          .concat(data.plugins || []);

        // Flatten for UI display
        this.discoveredItems = this.scanResults.mcp_servers
          .concat(this.scanResults.skills)
          .concat(this.scanResults.plugins);
        this.scanning = false;
      } catch(e) {
        this.scanError = 'Scan failed: ' + e.message;
        this.showToast('error', 'Scan failed: ' + e.message);
      }
    },

    toggleSelect(item) {
      var index = this.selectedItems.findIndex(function(i) {
        return i.path === item.path && i.item_type === item.item_type;
      });
      if (index === -1) {
        this.selectedItems.push(item);
      } else {
        this.selectedItems.splice(index, 1);
      }
    },

    isSelected(item) {
      return this.selectedItems.some(function(i) {
        return i.path === item.path;
      });
    },

    selectAll() {
      var self = this;
      for (var item of this.discoveredItems) {
        if (item.can_import && !item.already_installed) {
          self.toggleSelect(item);
        }
      }
    },

    deselectAll() {
      this.selectedItems = [];
    },

    async importSelected() {
      if (this.selectedItems.length === 0) {
        this.showToast('warning', 'No items selected');
        return;
      }

      this.importing = true;
      this.importResults = null;

      try {
        var data = await ClawReformAPI.post('/api/import', {
          items: this.selectedItems
        });
        if (data.success) {
          // Reload skills if any were imported
          await Alpine.store('app').refreshSkills();
          await Alpine.store('app').refreshAgents();

          // Update installed status
          for (var i = 0; i < this.selectedItems.length; i++) {
            var item = this.selectedItems[i];
            var discovered = this.discoveredItems.find(function(d) {
              return d.path === item.path;
            });
            if (discovered) {
              discovered.already_installed = true;
              discovered.can_import = false;
            }
          }

          // Clear selection
          this.selectedItems = [];
          this.importResults = data;
          this.importing = false;
          this.showToast('success', data.message || 'Imported ' + data.imported.length + ' item(s)');
        } else {
          this.showToast('error', data.message || 'Import failed');
        }
        this.importing = false;
      } catch(e) {
        this.showToast('error', 'Import failed: ' + e.message);
        this.importing = false;
      }
    },

    closeModal() {
      this.showScanModal = false;
      this.showImportModal = false;
    },

    formatContext(ctx) {
      if (!ctx) return '-';
      if (ctx >= 1000000000) return (ctx / 1000000000).toFixed(1) + 'B';
      if (ctx >= 1000000) return (ctx / 1000000).toFixed(1) + 'M';
      if (ctx >= 1000) return (ctx / 1000).toFixed(0) + 'K';
      return ctx.toString();
    },

    formatCost(cost) {
      if (!cost && cost !== 0) return '-';
      if (cost === 0) return 'Free';
      return '$' + cost.toFixed(4) + '/M tokens';
    }
  };
}
