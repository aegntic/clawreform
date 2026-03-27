/**
 * ClawPrompt - Background Service Worker
 * Handles context menus, keyboard shortcuts, and template storage
 */

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'clawprompt_templates',
  RECENT: 'clawprompt_recent',
  SETTINGS: 'clawprompt_settings',
};

// Template storage
let templates = [];

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set up context menu
    chrome.contextMenus.create({
      id: 'clawprompt-insert',
      title: 'Insert ClawPrompt Template',
      contexts: ['editable'],
    });

    // Create default templates on first install
    await createDefaultTemplates();
  }
});

// Load templates on startup
async function loadTemplates() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
    templates = result[STORAGE_KEYS.TEMPLATES] || [];
  } catch (error) {
    console.error('Error loading templates:', error);
    templates = [];
  }
}

// Initialize
loadTemplates();

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'clawprompt-insert') {
    // Show template picker
    await showTemplatePicker(tab.id);
  }
});

// Show template picker in content script
async function showTemplatePicker(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_TEMPLATE_PICKER',
      templates: templates.slice(0, 10).map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
      })),
    });
  } catch (error) {
    console.error('Error showing template picker:', error);
  }
}

// Message handler from popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_TEMPLATES':
      sendResponse({ templates });
      break;
    case 'INSERT_TEMPLATE':
      insertTemplateIntoActiveTab(message.templateId);
      sendResponse({ success: true });
      break;
    case 'GET_TEMPLATE':
      const template = templates.find(t => t.id === message.templateId);
      sendResponse({ template });
      break;
    case 'UPDATE_TEMPLATES':
      templates = message.templates;
      chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true; // Keep message channel open
});

// Insert template into active tab
async function insertTemplateIntoActiveTab(templateId) {
  try {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    await chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_TEMPLATE',
      template: template.content,
    });

    // Update recent list
    await updateRecent(templateId);
  } catch (error) {
    console.error('Error inserting template:', error);
  }
}

// Update recent templates list
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

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'quick-insert':
      quickInsertLastTemplate();
      break;
  }
});

// Quick insert last used template
async function quickInsertLastTemplate() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT);
    const recent = result[STORAGE_KEYS.RECENT] || [];
    if (recent.length === 0) {
      // Show toast via content script instead of notifications API
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_NOTIFICATION',
          message: 'No recent templates found',
          notificationType: 'warning',
        });
      }
      return;
    }

    await insertTemplateIntoActiveTab(recent[0]);
  } catch (error) {
    console.error('Error in quick insert:', error);
  }
}

// Storage change listener
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[STORAGE_KEYS.TEMPLATES]) {
    templates = changes[STORAGE_KEYS.TEMPLATES].newValue || [];
  }
});

// Canonical default templates (10 templates)
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

// Create default templates
async function createDefaultTemplates() {
  const defaults = getCanonicalTemplates();

  const templatesWithIds = defaults.map(t => ({
    ...t,
    id: 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    useCount: 0,
  }));

  await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templatesWithIds });
  templates = templatesWithIds;
}
