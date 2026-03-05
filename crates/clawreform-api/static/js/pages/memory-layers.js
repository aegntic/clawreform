// ClawReform Memory Layers Page — CORE/OVERVIEW/PROJECT/COLLECTIVE tracking
'use strict';

function extractManagedAutoSection(markdown) {
  if (!markdown) return '';
  var startMarker = '<!-- clawreform:auto:start -->';
  var endMarker = '<!-- clawreform:auto:end -->';
  var start = markdown.indexOf(startMarker);
  var end = markdown.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return '';
  var body = markdown.slice(start + startMarker.length, end);
  return body.trim();
}

function previewLine(markdown, fallback) {
  if (!markdown) return fallback;
  var lines = markdown.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = (lines[i] || '').trim();
    if (!line) continue;
    if (line.indexOf('#') === 0) continue;
    if (line.indexOf('<!--') === 0) continue;
    if (line.indexOf('_Last updated:') === 0) continue;
    return line.length > 180 ? line.slice(0, 177) + '...' : line;
  }
  return fallback;
}

function parseUpdatedAt(autoSection) {
  if (!autoSection) return '';
  var m = autoSection.match(/_Last updated:\s*([^_]+)_/i);
  return m && m[1] ? m[1].trim() : '';
}

function memoryLayersPage() {
  return {
    selectedAgentId: '',
    loading: false,
    loadError: '',
    layers: [],
    selectedLayer: 'CORE.md',

    async loadData() {
      await this.ensureAgentSelected();
      await this.loadLayers();
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

    async loadLayers() {
      if (!this.selectedAgentId) {
        this.layers = [];
        this.loadError = 'Select an agent to view memory layers.';
        return;
      }
      this.loading = true;
      this.loadError = '';
      try {
        var names = ['CORE.md', 'OVERVIEW.md', 'PROJECT.md', 'COLLECTIVE.md'];
        var labels = {
          'CORE.md': 'Core Memory',
          'OVERVIEW.md': 'Overview Memory',
          'PROJECT.md': 'Project Memory',
          'COLLECTIVE.md': 'Collective Conscience'
        };
        var listResp = await ClawReformAPI.get('/api/agents/' + this.selectedAgentId + '/files');
        var fileList = (listResp && listResp.files) || [];
        var metaByName = {};
        for (var i = 0; i < fileList.length; i++) {
          metaByName[fileList[i].name] = fileList[i];
        }

        var out = [];
        for (var n = 0; n < names.length; n++) {
          var name = names[n];
          var meta = metaByName[name] || { exists: false, size_bytes: 0 };
          var content = '';
          var autoSection = '';
          var updatedAt = '';
          var bullets = 0;
          var preview = meta.exists ? 'Loading...' : 'File missing for this agent.';
          if (meta.exists) {
            var resp = await ClawReformAPI.get('/api/agents/' + this.selectedAgentId + '/files/' + encodeURIComponent(name));
            content = (resp && resp.content) || '';
            autoSection = extractManagedAutoSection(content);
            updatedAt = parseUpdatedAt(autoSection);
            bullets = (autoSection.match(/^\s*-\s+/gm) || []).length;
            preview = previewLine(autoSection || content, 'No summary yet.');
          }
          out.push({
            name: name,
            label: labels[name] || name,
            exists: !!meta.exists,
            sizeBytes: meta.size_bytes || 0,
            content: content,
            autoSection: autoSection,
            updatedAt: updatedAt,
            bulletCount: bullets,
            preview: preview
          });
        }
        this.layers = out;
        if (!this.activeLayer && out.length) {
          this.selectedLayer = out[0].name;
        }
      } catch (e) {
        this.layers = [];
        this.loadError = e.message || 'Could not load memory layers.';
      }
      this.loading = false;
    },

    get activeLayer() {
      for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].name === this.selectedLayer) return this.layers[i];
      }
      return this.layers.length ? this.layers[0] : null;
    },

    get activeLayerRender() {
      var layer = this.activeLayer;
      if (!layer) return '';
      return layer.autoSection || layer.content || '_No content yet._';
    }
  };
}
