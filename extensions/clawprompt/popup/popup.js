/**
 * ClawPrompt - Popup Script
 * Chrome Extension for managing AI prompt templates
 */

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'clawprompt_templates',
  SETTINGS: 'clawprompt_settings',
  RECENT: 'clawprompt_recent',
  FAVORITES: 'clawprompt_favorites',
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  showNotifications: true,
  autoSave: true,
  defaultCategory: 'general',
  insertDelay: 100,
};

// State
let templates = [];
let currentCategory = 'all';
let searchQuery = '';
let editingTemplate = null;
let contextMenuTarget = null;

// DOM Elements
const elements = {
  searchInput: null,
  templatesList: null,
  emptyState: null,
  editorModal: null,
  templateForm: null,
  tabs: null,
  toastContainer: null,
  contextMenu: null,
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  await loadTemplates();
  await loadSettings();
  setupEventListeners();
  renderTemplates();
});

// Initialize DOM elements
function initElements() {
  elements.searchInput = document.getElementById('search-input');
  elements.templatesList = document.getElementById('templates-list');
  elements.emptyState = document.getElementById('empty-state');
  elements.editorModal = document.getElementById('editor-modal');
  elements.templateForm = document.getElementById('template-form');
  elements.tabs = document.querySelectorAll('.tab');
  elements.toastContainer = document.getElementById('toast-container');
  elements.contextMenu = document.getElementById('context-menu');

  // Create context menu element
  if (!elements.contextMenu) {
    elements.contextMenu = document.createElement('div');
    elements.contextMenu.className = 'context-menu';
    elements.contextMenu.id = 'context-menu';
    document.body.appendChild(elements.contextMenu);
  }
}

// Load templates from storage
async function loadTemplates() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
    templates = result[STORAGE_KEYS.TEMPLATES] || [];
    if (!Array.isArray(templates)) {
      templates = [];
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    templates = [];
  }
}

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    Object.assign(DEFAULT_SETTINGS, result[STORAGE_KEYS.SETTINGS] || {});
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  elements.searchInput?.addEventListener('input', debounce(handleSearch, 200));

  // Clear search
  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    renderTemplates();
  });

  // Tabs
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderTemplates();
    });
  });

  // Add template button
  document.getElementById('btn-add')?.addEventListener('click', () => {
    openEditor();
  });

  // Create first template button
  document.getElementById('btn-create-first')?.addEventListener('click', () => {
    openEditor();
  });

  // Settings button
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Close editor
  document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);
  document.getElementById('btn-cancel-editor')?.addEventListener('click', closeEditor);

  // Modal backdrop
  elements.editorModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeEditor);

  // Save template
  document.getElementById('btn-save-template')?.addEventListener('click', saveTemplate);

  // Paste last
  document.getElementById('btn-paste-last')?.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT);
    const recent = result[STORAGE_KEYS.RECENT] || [];
    if (recent.length > 0) {
      const lastTemplate = templates.find(t => t.id === recent[0]);
      if (lastTemplate) {
        await insertTemplate(lastTemplate);
        showToast('Template inserted!', 'success');
      }
    } else {
      showToast('No recent template found', 'error');
    }
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', exportTemplates);

  // Import
  document.getElementById('btn-import')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleImport;
    input.click();
  });

  // Context menu
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.template-item')) {
      e.preventDefault();
      showContextMenu(e, e.target.closest('.template-item'));
    } else {
      hideContextMenu();
    }
  });

  document.addEventListener('click', hideContextMenu);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
}

// Render templates list
function renderTemplates() {
  let filtered = templates;

  // Filter by category
  if (currentCategory === 'favorites') {
    filtered = templates.filter(t => t.favorite);
  } else if (currentCategory === 'recent') {
    renderRecentTemplates();
    return;
  }

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = templates.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.content.toLowerCase().includes(query) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Sort by name
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  // Show/hide empty state
  if (filtered.length === 0) {
    elements.emptyState?.classList.remove('hidden');
    elements.templatesList?.classList.add('hidden');
    return;
  }

  elements.emptyState?.classList.add('hidden');
  elements.templatesList?.classList.remove('hidden');

  // Render list
  elements.templatesList.innerHTML = filtered.map(template => `
    <div class="template-item" data-id="${template.id}">
      <div class="template-header">
        <div class="template-title-row">
          <span class="template-name">${escapeHtml(template.name)}</span>
          ${template.favorite ? '<span class="template-favorite">★</span>' : ''}
        </div>
        <div class="template-meta">
          <span class="template-category">${escapeHtml(template.category || 'general')}</span>
          ${template.shortcut ? `<span class="shortcut-badge">${escapeHtml(formatShortcut(template.shortcut))}</span>` : ''}
        </div>
      </div>
      <div class="template-preview">${escapeHtml(template.content.substring(0, 100))}${template.content.length > 100 ? '...' : ''}</div>
      <div class="template-actions">
        <button class="btn btn-sm btn-insert" data-action="insert" title="Insert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Insert
        </button>
        <button class="btn btn-sm btn-copy" data-action="copy" title="Copy to Clipboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1"></path>
          </svg>
          Copy
        </button>
      </div>
    </div>
  `).join('');

  // Add click listeners
  elements.templatesList?.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button) {
        const action = button.dataset.action;
        if (action) {
          e.stopPropagation();
          handleTemplateAction(item.dataset.id, action);
        }
        return;
      }
      // Double click to insert
      if (e.detail === 2) {
        handleTemplateAction(item.dataset.id, 'insert');
      }
    });
  });
}

// Render recent templates
async function renderRecentTemplates() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT);
    const recent = result[STORAGE_KEYS.RECENT] || [];
    elements.emptyState?.classList.add('hidden');
    elements.templatesList?.classList.remove('hidden');

    if (recent.length === 0) {
      elements.templatesList.innerHTML = '<div class="empty-message">No recent templates</div>';
      return;
    }

    const recentTemplates = templates.filter(t => recent.includes(t.id));
    elements.templatesList.innerHTML = recentTemplates.map(template => `
      <div class="template-item" data-id="${template.id}">
        <div class="template-header">
          <span class="template-name">${escapeHtml(template.name)}</span>
          ${template.favorite ? '<span class="template-favorite">★</span>' : ''}
        </div>
        <div class="template-preview">${escapeHtml(template.content.substring(0, 100))}...</div>
        <div class="template-actions">
          <button class="btn btn-sm btn-insert" data-action="insert">Insert</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error rendering recent templates:', error);
  }
}

// Handle template action
async function handleTemplateAction(templateId, action) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  switch (action) {
    case 'insert':
      await insertTemplate(template);
      showToast('Template inserted!', 'success');
      break;
    case 'copy':
      await copyToClipboard(template.content);
      showToast('Copied to clipboard!', 'success');
      break;
  }
}

// Insert template into active tab
async function insertTemplate(template) {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    // Send to content script
    await chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_TEMPLATE',
      template: template.content
    });

    // Update recent list
    await updateRecent(template.id);

    // Close popup
    window.close();
  } catch (error) {
    console.error('Error inserting template:', error);
    showToast('Failed to insert template', 'error');
  }
}

// Update recent list
async function updateRecent(templateId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT);
    const recent = result[STORAGE_KEYS.RECENT] || [];
    const updated = [templateId, ...recent.filter(id => id !== templateId)].slice(0, 10);
    await chrome.storage.local.set({ [STORAGE_KEYS.RECENT]: updated });
  } catch (error) {
    console.error('Error updating recent:', error);
  }
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Failed to copy', 'error');
  }
}

// Open editor modal
function openEditor(template = null) {
  editingTemplate = template;
  const title = document.getElementById('editor-title');
  const form = elements.templateForm;

  if (template) {
    title.textContent = 'Edit Template';
    form.querySelector('#template-name').value = template.name;
    form.querySelector('#template-category').value = template.category || 'general';
    form.querySelector('#template-tags').value = (template.tags || []).join(', ');
    form.querySelector('#template-content').value = template.content;
    form.querySelector('#template-shortcut').value = template.shortcut || '';
  } else {
    title.textContent = 'New Template';
    form.reset();
  }

  elements.editorModal?.classList.remove('hidden');
}

// Close editor modal
function closeEditor() {
  elements.editorModal?.classList.add('hidden');
  editingTemplate = null;
}

// Save template
async function saveTemplate() {
  const form = elements.templateForm;
  const name = form.querySelector('#template-name').value.trim();
  const category = form.querySelector('#template-category').value;
  const tagsInput = form.querySelector('#template-tags').value;
  const content = form.querySelector('#template-content').value.trim();
  const shortcut = form.querySelector('#template-shortcut').value.trim();

  if (!name || !content) {
    showToast('Name and content are required', 'error');
    return;
  }

  const tags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t);

  const template = {
    id: editingTemplate?.id || generateId(),
    name,
    category,
    tags,
    content,
    shortcut,
    favorite: editingTemplate?.favorite || false,
    createdAt: editingTemplate?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  // Update or add template
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  // Save to storage
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
    closeEditor();
    renderTemplates();
    showToast('Template saved!', 'success');
  } catch (error) {
    console.error('Error saving template:', error);
    showToast('Failed to save template', 'error');
  }
}

// Show context menu
function showContextMenu(event, templateItem) {
  const templateId = templateItem.dataset.id;
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  contextMenuTarget = template;

  const menu = elements.contextMenu;
  menu.innerHTML = `
    <div class="context-menu-item" data-action="edit">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Edit
    </div>
    <div class="context-menu-item" data-action="favorite">
      ${template.favorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
    </div>
    <div class="context-menu-item" data-action="duplicate">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1"></path>
      </svg>
      Duplicate
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item danger" data-action="delete">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Delete
    </div>
  `;

  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');

  // Add click handlers
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      handleContextAction(item.dataset.action);
      hideContextMenu();
    });
  });
}

// Hide context menu
function hideContextMenu() {
  elements.contextMenu?.classList.add('hidden');
  contextMenuTarget = null;
}

// Handle context menu action
async function handleContextAction(action) {
  if (!contextMenuTarget) return;

  switch (action) {
    case 'edit':
      openEditor(contextMenuTarget);
      break;
    case 'favorite':
      await toggleFavorite(contextMenuTarget.id);
      break;
    case 'duplicate':
      await duplicateTemplate(contextMenuTarget);
      break;
    case 'delete':
      if (confirm(`Delete "${contextMenuTarget.name}"?`)) {
        await deleteTemplate(contextMenuTarget.id);
      }
      break;
  }
}

// Toggle favorite
async function toggleFavorite(templateId) {
  const index = templates.findIndex(t => t.id === templateId);
  if (index >= 0) {
    templates[index].favorite = !templates[index].favorite;
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
    renderTemplates();
    showToast(templates[index].favorite ? 'Added to favorites!' : 'Removed from favorites', 'success');
  }
}

// Duplicate template
async function duplicateTemplate(template) {
  const duplicate = {
    ...template,
    id: generateId(),
    name: `${template.name} (copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  templates.push(duplicate);
  await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
  renderTemplates();
  showToast('Template duplicated!', 'success');
}

// Delete template
async function deleteTemplate(templateId) {
  const index = templates.findIndex(t => t.id === templateId);
  if (index >= 0) {
    templates.splice(index, 1);
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
    renderTemplates();
    showToast('Template deleted', 'success');
  }
}

// Export templates
async function exportTemplates() {
  try {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      templates: templates,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clawprompt-templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Templates exported!', 'success');
  } catch (error) {
    console.error('Error exporting:', error);
    showToast('Failed to export', 'error');
  }
}

// Import templates
async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.templates || !Array.isArray(data.templates)) {
      throw new Error('Invalid template file');
    }

    // Merge with existing templates
    const newTemplates = data.templates.map(t => ({
      ...t,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    templates.push(...newTemplates);
    await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
    renderTemplates();
    showToast(`Imported ${newTemplates.length} templates!`, 'success');
  } catch (error) {
    console.error('Error importing:', error);
    showToast('Failed to import templates', 'error');
  }
}

// Handle keyboard shortcuts
function handleKeyboard(event) {
  // Escape closes modals
  if (event.key === 'Escape') {
    if (!elements.editorModal?.classList.contains('hidden')) {
      closeEditor();
    }
    hideContextMenu();
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  elements.toastContainer?.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utility functions
function generateId() {
  return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatShortcut(shortcut) {
  return shortcut
    .replace(/ctrl/gi, 'Ctrl')
    .replace(/shift/gi, 'Shift')
    .replace(/alt/gi, 'Alt')
    .replace(/meta/gi, '⌘')
    .replace(/\+/g, '+');
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function handleSearch() {
  searchQuery = elements.searchInput?.value || '';
  renderTemplates();

  // Show/hide clear button
  const clearBtn = document.getElementById('btn-clear-search');
  if (searchQuery) {
    clearBtn?.classList.remove('hidden');
  } else {
    clearBtn?.classList.add('hidden');
  }
}
