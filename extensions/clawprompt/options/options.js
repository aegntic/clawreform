/**
 * ClawPrompt - Options Page Script
 * Chrome Extension settings and template management
 */

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'clawprompt_templates',
  SETTINGS: 'clawprompt_settings',
  CATEGORIES: 'clawprompt_categories',
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
let categories = [];
let currentSection = 'templates';
let settings = { ...DEFAULT_SETTINGS };
let editingTemplate = null;
let sortField = 'name';
let sortDirection = 'asc';
let confirmCallback = null;

// DOM Elements
const elements = {
  sections: null,
  navItems: null,
  templatesTable: null,
  categoriesGrid: null,
  settingsForm: null,
  templateEditor: null,
  confirmModal: null,
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  await loadData();
  setupNavigation();
  setupEventListeners();
  renderTemplates();
  renderCategories();
  renderSettings();
  showSection('templates');
});

// Initialize DOM elements
function initElements() {
  elements.sections = document.querySelectorAll('.section');
  elements.navItems = document.querySelectorAll('.nav-item');
  elements.templatesTable = document.querySelector('.templates-table');
  elements.categoriesGrid = document.getElementById('categories-grid');
  elements.settingsForm = document.querySelector('.settings-form');
  elements.templateEditor = document.getElementById('editor-modal');
  elements.confirmModal = document.getElementById('confirm-modal');
}

// Load data from storage
async function loadData() {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.TEMPLATES,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.SETTINGS
    ]);
    templates = result[STORAGE_KEYS.TEMPLATES] || [];
    categories = result[STORAGE_KEYS.CATEGORIES] || [];
    settings = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  } catch (error) {
    console.error('Error loading data:', error);
    templates = [];
    categories = [];
    settings = { ...DEFAULT_SETTINGS };
  }
}

// Setup navigation
function setupNavigation() {
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      showSection(section);
    });
  });
}

// Show section
function showSection(sectionId) {
  currentSection = sectionId;

  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  elements.sections.forEach(section => {
    section.classList.toggle('active', section.id === 'section-' + sectionId);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Template search
  document.getElementById('search-templates')?.addEventListener('input', debounce(filterTemplates, 200));

  // Category filter
  document.getElementById('filter-category')?.addEventListener('change', () => renderTemplates());

  // Sort selector
  document.getElementById('sort-templates')?.addEventListener('change', (e) => {
    sortField = e.target.value === 'name' ? 'name' : e.target.value === 'recent' ? 'updatedAt' : 'useCount';
    renderTemplates();
  });

  // Add template button (HTML id is btn-new-template)
  document.getElementById('btn-new-template')?.addEventListener('click', () => {
    openEditor();
  });

  // Close editor
  document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);
  document.getElementById('btn-cancel-editor')?.addEventListener('click', closeEditor);

  // Save template
  document.getElementById('btn-save-template')?.addEventListener('click', saveTemplate);

  // Category form submit
  document.getElementById('category-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCategory();
  });

  // Export
  document.getElementById('btn-export-all')?.addEventListener('click', exportTemplates);

  // Import (file input change, not a button click)
  document.getElementById('import-file')?.addEventListener('change', handleImport);

  // Delete all
  document.getElementById('btn-delete-all')?.addEventListener('click', () => {
    showConfirm('Delete All Templates', 'This will permanently delete all your templates. This cannot be undone.', () => {
      templates = [];
      categories = [];
      saveData();
      renderTemplates();
      renderCategories();
      showToast('All templates deleted', 'success');
    });
  });

  // Load defaults
  document.getElementById('btn-load-defaults')?.addEventListener('click', loadDefaultTemplates);

  // Confirm modal buttons
  document.getElementById('btn-confirm-cancel')?.addEventListener('click', closeConfirm);
  document.getElementById('btn-confirm-ok')?.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Settings form
  elements.settingsForm?.addEventListener('change', debounce(saveSettings, 300));
  elements.settingsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

// Filter templates (called from search input debounce)
function filterTemplates() {
  renderTemplates();
}

// Render templates
function renderTemplates() {
  const searchInput = document.getElementById('search-templates')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('filter-category')?.value || '';

  let filtered = templates.filter(t => {
    const matchesSearch = !searchInput ||
      t.name.toLowerCase().includes(searchInput) ||
      t.content.toLowerCase().includes(searchInput) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(searchInput));
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort
  if (sortField) {
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  const tbody = elements.templatesTable?.querySelector('tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div style="text-align: center; padding: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <p>No templates found</p>
            <button class="btn btn-primary" onclick="openEditor()">Create your first template</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(t => `
    <tr data-id="${t.id}">
      <td>
        <span class="template-favorite" data-id="${t.id}" style="cursor:pointer">${t.favorite ? '★' : '☆'}</span>
        <span class="template-name">${escapeHtml(t.name)}</span>
      </td>
      <td>${escapeHtml(t.content.substring(0, 50))}${t.content.length > 50 ? '...' : ''}</td>
      <td>
        <span class="template-category">${escapeHtml(t.category || 'general')}</span>
      </td>
      <td>
        ${(t.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </td>
      <td>
        <div class="template-actions">
          <button class="btn btn-sm" data-action="edit" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              <path d="m15 5 4 4"></path>
            </svg>
          </button>
          <button class="btn btn-sm" data-action="duplicate" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1"></path>
            </svg>
          </button>
          <button class="btn btn-sm" data-action="copy" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1"></path>
            </svg>
          </button>
          <button class="btn btn-sm btn-danger" data-action="delete" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Add row action handlers
  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.closest('tr').dataset.id;
      handleTemplateAction(id, btn.dataset.action);
    });
  });

  // Add favorite toggle
  tbody.querySelectorAll('.template-favorite').forEach(star => {
    star.addEventListener('click', () => {
      toggleFavorite(star.dataset.id);
    });
  });
}

// Handle template action
function handleTemplateAction(templateId, action) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  switch (action) {
    case 'edit':
      openEditor(template);
      break;
    case 'duplicate':
      duplicateTemplate(template);
      break;
    case 'copy':
      copyToClipboard(template.content);
      showToast('Copied to clipboard!', 'success');
      break;
    case 'delete':
      showConfirm('Delete Template', `Are you sure you want to delete "${template.name}"?`, () => {
        deleteTemplate(templateId);
      });
      break;
  }
}

// Open editor
function openEditor(template = null) {
  editingTemplate = template;
  const title = document.getElementById('editor-title');
  const form = elements.templateEditor;

  if (template) {
    title.textContent = 'Edit Template';
    form.querySelector('#template-name').value = template.name;
    form.querySelector('#template-category').value = template.category || 'general';
    form.querySelector('#template-tags').value = (template.tags || []).join(', ');
    form.querySelector('#template-content').value = template.content;
    form.querySelector('#template-shortcut').value = template.shortcut || '';
    form.querySelector('#template-description').value = template.description || '';
  } else {
    title.textContent = 'New Template';
    form.querySelector('#template-form').reset();
  }

  elements.templateEditor?.classList.remove('hidden');
}

// Close editor
function closeEditor() {
  elements.templateEditor?.classList.add('hidden');
  editingTemplate = null;
}

// Save template
async function saveTemplate() {
  const form = elements.templateEditor;
  const name = form.querySelector('#template-name').value.trim();
  const category = form.querySelector('#template-category').value;
  const tags = form.querySelector('#template-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(t => t);
  const content = form.querySelector('#template-content').value.trim();
  const shortcut = form.querySelector('#template-shortcut').value.trim();
  const description = form.querySelector('#template-description').value.trim();

  if (!name || !content) {
    showToast('Name and content are required', 'error');
    return;
  }

  const template = {
    id: editingTemplate?.id || generateId(),
    name,
    category,
    tags,
    content,
    shortcut,
    description,
    favorite: editingTemplate?.favorite || false,
    createdAt: editingTemplate?.createdAt || Date.now(),
    updatedAt: Date.now(),
    useCount: editingTemplate?.useCount || 0,
  };

  // Update or add
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  await saveData();
  closeEditor();
  renderTemplates();
  renderCategories();
  showToast('Template saved!', 'success');
}

// Delete template
async function deleteTemplate(templateId) {
  templates = templates.filter(t => t.id !== templateId);
  await saveData();
  renderTemplates();
  renderCategories();
  showToast('Template deleted', 'success');
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
  await saveData();
  renderTemplates();
  showToast('Template duplicated!', 'success');
}

// Toggle favorite
async function toggleFavorite(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (template) {
    template.favorite = !template.favorite;
    await saveData();
    renderTemplates();
    showToast(template.favorite ? 'Added to favorites!' : 'Removed from favorites', 'success');
  }
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

// Export templates
async function exportTemplates() {
  const includeUsage = document.getElementById('export-include-usage')?.checked;
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    templates: includeUsage ? templates : templates.map(({ useCount, ...t }) => t),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clawprompt-templates-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Templates exported!', 'success');
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

    const replaceExisting = document.getElementById('import-replace')?.checked;

    const newTemplates = data.templates.map(t => ({
      ...t,
      id: replaceExisting && t.id ? t.id : generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    if (replaceExisting) {
      newTemplates.forEach(nt => {
        const idx = templates.findIndex(t => t.id === nt.id);
        if (idx >= 0) {
          templates[idx] = nt;
        } else {
          templates.push(nt);
        }
      });
    } else {
      templates.push(...newTemplates);
    }

    await saveData();
    renderTemplates();
    renderCategories();
    showToast(`Imported ${newTemplates.length} templates!`, 'success');
  } catch (error) {
    console.error('Import error:', error);
    showToast('Failed to import templates', 'error');
  }

  // Reset file input
  event.target.value = '';
}

// Render categories
function renderCategories() {
  const categoryMap = {};
  templates.forEach(t => {
    const cat = t.category || 'general';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  elements.categoriesGrid.innerHTML = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `
      <div class="category-card">
        <div class="category-info">
          <span class="category-icon">${getCategoryIcon(name)}</span>
          <div>
            <div class="category-name">${escapeHtml(name)}</div>
            <div class="category-count">${count} template${count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="category-actions">
          <button class="btn btn-sm" data-action="view" data-category="${escapeHtml(name)}">View</button>
        </div>
      </div>
    `).join('');

  // Add click handlers
  elements.categoriesGrid.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('filter-category').value = btn.dataset.category;
      showSection('templates');
    });
  });
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    general: '📄',
    coding: '💻',
    writing: '✍️',
    analysis: '🔍',
    creative: '🎨',
    business: '💼',
  };
  return icons[category] || '📁';
}

// Render settings
function renderSettings() {
  const theme = document.getElementById('setting-theme');
  const fontSize = document.getElementById('setting-font-size');
  const autoSave = document.getElementById('setting-auto-save');
  const insertDelay = document.getElementById('setting-insert-delay');
  const defaultCategory = document.getElementById('setting-default-category');
  const showNotifications = document.getElementById('setting-show-notifications');

  if (theme) theme.value = settings.theme;
  if (fontSize) fontSize.value = settings.fontSize;
  if (autoSave) autoSave.checked = settings.autoSave;
  if (insertDelay) insertDelay.value = settings.insertDelay;
  if (defaultCategory) defaultCategory.value = settings.defaultCategory;
  if (showNotifications) showNotifications.checked = settings.showNotifications;
}

// Save settings
async function saveSettings() {
  settings = {
    theme: document.getElementById('setting-theme')?.value || 'dark',
    fontSize: document.getElementById('setting-font-size')?.value || 'medium',
    showNotifications: document.getElementById('setting-show-notifications')?.checked ?? true,
    autoSave: document.getElementById('setting-auto-save')?.checked ?? true,
    defaultCategory: document.getElementById('setting-default-category')?.value || 'general',
    insertDelay: parseInt(document.getElementById('setting-insert-delay')?.value) || 100,
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  applySettings();
  showToast('Settings saved!', 'success');
}

// Apply settings
function applySettings() {
  document.body.style.fontSize = settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px';
}

// Get canonical default templates (shared source of truth)
function getCanonicalTemplates() {
  return [
    {
      name: 'Code Review',
      category: 'coding',
      tags: ['code', 'review', 'quality'],
      content: `Please review the following code for:\n- Code quality and readability\n- Potential bugs or edge cases\n- Performance considerations\n- Security concerns\n\nProvide specific feedback and suggestions for improvements.`,
      description: 'Comprehensive code review checklist',
      favorite: true,
    },
    {
      name: 'Bug Report',
      category: 'coding',
      tags: ['bug', 'issue', 'debug'],
      content: `## Bug Description\nA clear and concise description of the bug.\n\n## Steps to Reproduce\n1. Step 1: ...\n2. Step 2: ...\n3. ...\n\n## Expected Behavior\nWhat should happen instead?\n\n## Actual Behavior\nWhat happens instead?\n\n## Environment\n- Browser:\n- OS:\n- Device:\n\n## Screenshots\nIf applicable, add screenshots to help explain the issue.`,
      description: 'Structured bug report template',
      favorite: false,
    },
    {
      name: 'Explain Code',
      category: 'coding',
      tags: ['explain', 'understand', 'code'],
      content: `Please explain the following code:\n\nFocus on:\n- What it does and why\n- How it works\n- Any design patterns used\n- Potential edge cases\n\nProvide a clear, step-by-step explanation suitable for someone unfamiliar with the codebase.`,
      description: 'Step-by-step code explanation',
      favorite: true,
    },
    {
      name: 'Refactor Request',
      category: 'coding',
      tags: ['refactor', 'clean', 'improve'],
      content: `Please refactor the following code to improve:\n\n- Readability\n- Maintainability\n- Performance\n- Reduce complexity\n\nKeep the same functionality while making the code cleaner and more efficient.\n\nInclude comments explaining your changes.`,
      description: 'Code refactoring request',
      favorite: false,
    },
    {
      name: 'Meeting Summary',
      category: 'business',
      tags: ['meeting', 'summary', 'notes'],
      content: `# Meeting Summary\n\n**Date:** {{date}}\n**Attendees:** {{attendees}}\n\n## Key Points\n1. First point\n2. Second point\n3. Third point\n\n## Action Items\n- [ ] Action item 1\n- [ ] Action item 2\n\n## Next Steps\n- [ ] Next step 1\n- [ ] Next step 2`,
      description: 'Meeting notes and action items',
      favorite: false,
    },
    {
      name: 'Email Draft',
      category: 'writing',
      tags: ['email', 'professional', 'communication'],
      content: `Subject: {{subject}}\n\nDear {{name}},\n\n{{cursor}}\n\nBest regards,\n{{signature}}`,
      description: 'Professional email template',
      favorite: false,
    },
    {
      name: 'Blog Post',
      category: 'writing',
      tags: ['blog', 'content', 'article'],
      content: `# {{title}}\n\nPublished: {{date}}\n\n## Introduction\n{{introduction}}\n\n## Main Content\n{{main_content}}\n\n## Conclusion\n{{conclusion}}\n\n---\n\n{{author}}`,
      description: 'Blog post structure template',
      favorite: false,
    },
    {
      name: 'Data Analysis',
      category: 'analysis',
      tags: ['data', 'analysis', 'report'],
      content: `Please analyze the following data:\n\nFocus on:\n- Key trends and patterns\n- Anomalies\n- Insights\n- Recommendations\n\nProvide a summary of findings with actionable recommendations.`,
      description: 'Data analysis and insights',
      favorite: true,
    },
    {
      name: 'Creative Story',
      category: 'creative',
      tags: ['story', 'creative', 'fiction'],
      content: `Write a short story about {{topic}}.\n\nStyle: {{style}}\nTone: {{tone}}\nLength: {{length}} words\n\nInclude:\n- Engaging opening\n- Character development\n- Unexpected twist\n- Satisfying conclusion`,
      description: 'Creative writing prompt',
      favorite: false,
    },
    {
      name: 'Product Description',
      category: 'business',
      tags: ['product', 'marketing', 'description'],
      content: `# {{product_name}}\n\n## Overview\n{{overview}}\n\n## Features\n- {{feature_1}}\n- {{feature_2}}\n- {{feature_3}}\n\n## Benefits\n- {{benefit_1}}\n- {{benefit_2}}\n\n## Pricing\n{{pricing}}\n\n## Call to Action\n{{cta}}`,
      description: 'Product marketing description',
      favorite: false,
    },
  ];
}

// Load default templates
async function loadDefaultTemplates() {
  const defaults = getCanonicalTemplates();
  const templatesWithIds = defaults.map(t => ({
    ...t,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    useCount: 0,
  }));

  templates.push(...templatesWithIds);
  await saveData();
  renderTemplates();
  renderCategories();
  showToast(`Loaded ${defaults.length} default templates!`, 'success');
}

// Save category
async function saveCategory() {
  const name = document.getElementById('new-category-name').value.trim();
  const icon = document.getElementById('new-category-icon').value.trim();

  if (!name) {
    showToast('Category name is required', 'error');
    return;
  }

  const category = { name, icon: icon || getCategoryIcon(name) };
  categories.push(category);
  await chrome.storage.local.set({ [STORAGE_KEYS.CATEGORIES]: categories });

  // Reset form
  document.getElementById('category-form').reset();
  renderCategories();
  showToast('Category added!', 'success');
}

// Show confirm modal
function showConfirm(title, message, callback) {
  confirmCallback = callback;
  elements.confirmModal.classList.remove('hidden');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
}

// Close confirm
function closeConfirm() {
  elements.confirmModal.classList.add('hidden');
  confirmCallback = null;
}

// Show toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Save data to storage
async function saveData() {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.TEMPLATES]: templates,
      [STORAGE_KEYS.CATEGORIES]: categories,
      [STORAGE_KEYS.SETTINGS]: settings,
    });
  } catch (error) {
    console.error('Error saving data:', error);
  }
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

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
