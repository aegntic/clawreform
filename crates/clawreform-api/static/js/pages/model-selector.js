// ClawReform Model Selector — Rich model selection with availability, tiers, and costs
'use strict';

function modelSelectorPage() {
  return {
    models: [],
    providers: [],
    loading: true,
    error: '',

    // Filters
    search: '',
    providerFilter: '',
    tierFilter: '',
    showAvailableOnly: false,

    // Selection
    selectedModelId: '',
    onSelect: null, // Callback function

    // View mode
    viewMode: 'cards', // 'cards' or 'table'

    // Computed
    get uniqueProviders() {
      var seen = {};
      this.models.forEach(function(m) { seen[m.provider] = true; });
      return Object.keys(seen).sort();
    },

    get uniqueTiers() {
      var seen = {};
      this.models.forEach(function(m) { if (m.tier) seen[m.tier] = true; });
      return Object.keys(seen).sort();
    },

    get availableModels() {
      return this.models.filter(function(m) { return m.available; });
    },

    get unavailableModels() {
      return this.models.filter(function(m) { return !m.available; });
    },

    get filteredModels() {
      var self = this;
      var list = this.showAvailableOnly ? this.availableModels : this.models;

      return list.filter(function(m) {
        if (self.providerFilter && m.provider !== self.providerFilter) return false;
        if (self.tierFilter && m.tier !== self.tierFilter) return false;
        if (self.search) {
          var q = self.search.toLowerCase();
          if (m.id.toLowerCase().indexOf(q) === -1 &&
              (m.display_name || '').toLowerCase().indexOf(q) === -1 &&
              m.provider.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      }).sort(function(a, b) {
        // Available models first, then by tier priority, then by name
        if (a.available !== b.available) return a.available ? -1 : 1;
        var tierPriority = { frontier: 1, smart: 2, balanced: 3, fast: 4, local: 5 };
        var ta = tierPriority[a.tier] || 99;
        var tb = tierPriority[b.tier] || 99;
        if (ta !== tb) return ta - tb;
        return (a.display_name || a.id).localeCompare(b.display_name || b.id);
      });
    },

    get groupedByProvider() {
      var groups = {};
      this.filteredModels.forEach(function(m) {
        if (!groups[m.provider]) groups[m.provider] = [];
        groups[m.provider].push(m);
      });
      // Sort providers by number of available models
      var sorted = Object.keys(groups).sort(function(a, b) {
        var availA = groups[a].filter(function(m) { return m.available; }).length;
        var availB = groups[b].filter(function(m) { return m.available; }).length;
        if (availA !== availB) return availB - availA;
        return a.localeCompare(b);
      });
      var result = [];
      sorted.forEach(function(p) {
        result.push({ provider: p, models: groups[p] });
      });
      return result;
    },

    get selectedModel() {
      var self = this;
      return this.models.find(function(m) { return m.id === self.selectedModelId; }) || null;
    },

    // Lifecycle
    async loadData() {
      this.loading = true;
      this.error = '';
      try {
        var results = await Promise.all([
          ClawReformAPI.get('/api/models'),
          ClawReformAPI.get('/api/providers')
        ]);
        this.models = results[0].models || [];
        this.providers = results[1].providers || [];
      } catch(e) {
        this.error = e.message || 'Failed to load models';
      }
      this.loading = false;
    },

    // Helpers
    tierClass(tier) {
      if (!tier) return '';
      var t = tier.toLowerCase();
      if (t === 'frontier') return 'tier-frontier';
      if (t === 'smart') return 'tier-smart';
      if (t === 'balanced') return 'tier-balanced';
      if (t === 'fast') return 'tier-fast';
      if (t === 'local') return 'tier-local';
      return '';
    },

    tierIcon(tier) {
      if (!tier) return '';
      var t = tier.toLowerCase();
      if (t === 'frontier') return '★';
      if (t === 'smart') return '◆';
      if (t === 'balanced') return '●';
      if (t === 'fast') return '⚡';
      if (t === 'local') return '◐';
      return '';
    },

    formatContext(ctx) {
      if (!ctx) return '-';
      if (ctx >= 1000000) return (ctx / 1000000).toFixed(1) + 'M';
      if (ctx >= 1000) return Math.round(ctx / 1000) + 'K';
      return String(ctx);
    },

    formatCost(cost) {
      if (!cost && cost !== 0) return '-';
      if (cost === 0) return 'Free';
      if (cost < 0.01) return '$' + cost.toFixed(6);
      return '$' + cost.toFixed(4);
    },

    formatCostShort(cost) {
      if (!cost && cost !== 0) return '-';
      if (cost === 0) return 'Free';
      return '$' + cost.toFixed(2);
    },

    providerDisplayName(providerId) {
      var p = this.providers.find(function(p) { return p.id === providerId; });
      return p ? p.display_name : providerId;
    },

    providerConfigured(providerId) {
      var p = this.providers.find(function(p) { return p.id === providerId; });
      return p && p.auth_status === 'configured';
    },

    capabilityIcons(model) {
      var icons = [];
      if (model.supports_vision) icons.push({ icon: '👁', title: 'Vision' });
      if (model.supports_tools) icons.push({ icon: '🔧', title: 'Function calling' });
      if (model.supports_streaming) icons.push({ icon: '↯', title: 'Streaming' });
      return icons;
    },

    // Selection
    selectModel(modelId) {
      this.selectedModelId = modelId;
      if (this.onSelect && typeof this.onSelect === 'function') {
        var model = this.selectedModel;
        this.onSelect(model);
      }
    },

    isSelected(modelId) {
      return this.selectedModelId === modelId;
    },

    clearSelection() {
      this.selectedModelId = '';
    },

    // Actions
    toggleAvailableOnly() {
      this.showAvailableOnly = !this.showAvailableOnly;
    },

    setProviderFilter(provider) {
      this.providerFilter = this.providerFilter === provider ? '' : provider;
    },

    setTierFilter(tier) {
      this.tierFilter = this.tierFilter === tier ? '' : tier;
    },

    clearFilters() {
      this.search = '';
      this.providerFilter = '';
      this.tierFilter = '';
      this.showAvailableOnly = false;
    },

    // Quick presets
    presetCheapest() {
      this.showAvailableOnly = true;
      this.tierFilter = 'fast';
    },

    presetSmartest() {
      this.showAvailableOnly = true;
      this.tierFilter = 'frontier';
    },

    presetLocal() {
      this.providerFilter = 'ollama';
    }
  };
}

// Standalone model selector function for embedding in other pages
async function fetchAvailableModels() {
  try {
    var data = await ClawReformAPI.get('/api/models');
    return (data.models || []).filter(function(m) { return m.available; });
  } catch(e) {
    return [];
  }
}

function getDefaultModelForProvider(providerId, models) {
  // Find the best available model for a provider
  var providerModels = models.filter(function(m) { return m.provider === providerId && m.available; });
  if (providerModels.length === 0) return null;

  // Prefer smart tier, then balanced, then fast
  var tiers = ['smart', 'balanced', 'fast'];
  for (var i = 0; i < tiers.length; i++) {
    var match = providerModels.find(function(m) { return m.tier === tiers[i]; });
    if (match) return match;
  }
  return providerModels[0];
}
