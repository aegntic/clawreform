/**
 * ClawPrompt - Content Script
 * Handles template insertion into text fields
 */

// State
let templatePickerVisible = false;
let templates = [];

// Initialize
document.addEventListener('DOMContentLoaded', init);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'INSERT_TEMPLATE':
      insertTemplate(message.template);
      sendResponse({ success: true });
      break;
    case 'SHOW_TEMPLATE_PICKER':
      showTemplatePicker(message.templates);
      sendResponse({ success: true });
      break;
    case 'SHOW_NOTIFICATION':
      showNotification(message.message, message.notificationType || 'info');
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true;
});

// Initialize
function init() {
  // Create template picker element
  createTemplatePicker();

  // Add keyboard listener for quick insert
  document.addEventListener('keydown', handleKeyboard);
}

// Insert template into focused element
function insertTemplate(templateContent) {
  const activeElement = document.activeElement;

  if (!activeElement || !isEditable(activeElement)) {
    showNotification('Please focus on a text field first', 'warning');
    return;
  }

  // Process template content
  let content = processTemplate(templateContent, activeElement);

  // Get cursor position
  const start = activeElement.selectionStart;
  const end = activeElement.selectionEnd;

  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    // For input/textarea elements
    const currentValue = activeElement.value;
    activeElement.value = currentValue.substring(0, start) + content + currentValue.substring(end);
    // Set cursor position
    const cursorOffset = content.indexOf('{{cursor}}');
    if (cursorOffset >= 0) {
      const newCursorPos = start + cursorOffset;
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
      // Remove {{cursor}} marker
      activeElement.value = activeElement.value.replace('{{cursor}}', '');
    } else {
      activeElement.setSelectionRange(start + content.length, start + content.length);
    }
  } else if (activeElement.isContentEditable) {
    // For contenteditable elements
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // Insert content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    range.deleteContents();
    range.insertNode(fragment);
  }

  // Trigger input event
  activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  activeElement.dispatchEvent(new Event('change', { bubbles: true }));

  showNotification('Template inserted!', 'success');
}
// Process template placeholders
function processTemplate(content, element) {
  // Replace {{selected}} with currently selected text
  const selectedText = element.value?.substring(
    element.selectionStart,
    element.selectionEnd
  ) || '';

  content = content.replace(/\{\{selected\}\}/g, selectedText);

  // Replace {{date}} with current date
  content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

  // Replace {{time}} with current time
  content = content.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());

  // Replace {{datetime}} with current datetime
  content = content.replace(/\{\{datetime\}\}/g, new Date().toLocaleString());

  return content;
}
// Check if element is editable
function isEditable(element) {
  if (!element) return false;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT' && ['text', 'search', 'email', 'url'].includes(element.type)) return true;
  if (element.isContentEditable) return true;
  return false;
}
// Create template picker element
function createTemplatePicker() {
  const picker = document.createElement('div');
  picker.id = 'clawprompt-picker';
  picker.className = 'clawprompt-picker hidden';
  picker.innerHTML = `
    <div class="clawprompt-picker-content">
      <div class="clawprompt-picker-header">
        <span>ClawPrompt</span>
        <button class="clawprompt-picker-close">&times;</button>
      </div>
      <div class="clawprompt-picker-search">
        <input type="text" placeholder="Search templates...">
      </div>
      <div class="clawprompt-picker-list"></div>
    </div>
  `;

  document.body.appendChild(picker);

  // Add event listeners
  picker.querySelector('.clawprompt-picker-close').addEventListener('click', () => {
    hideTemplatePicker();
  });

  picker.querySelector('.clawprompt-picker-search input').addEventListener('input', (e) => {
    filterTemplates(e.target.value);
  });

  // Close on outside click
  picker.addEventListener('click', (e) => {
    if (e.target === picker) {
      hideTemplatePicker();
    }
  });
}
// Show template picker
function showTemplatePicker(templateList) {
  templates = templateList;
  const picker = document.getElementById('clawprompt-picker');
  if (!picker) return;

  // Populate list
  const list = picker.querySelector('.clawprompt-picker-list');
  list.innerHTML = templates.map(t => `
    <div class="clawprompt-picker-item" data-id="${t.id}">
      <div class="clawprompt-picker-item-name">${escapeHtml(t.name)}</div>
      <div class="clawprompt-picker-item-category">${escapeHtml(t.category || 'general')}</div>
    </div>
  `).join('');

  // Add click handlers
  list.querySelectorAll('.clawprompt-picker-item').forEach(item => {
    item.addEventListener('click', () => {
      selectTemplate(item.dataset.id);
    });
  });

  // Show picker
  picker.classList.remove('hidden');
  templatePickerVisible = true;
}
// Hide template picker
function hideTemplatePicker() {
  const picker = document.getElementById('clawprompt-picker');
  if (picker) {
    picker.classList.add('hidden');
  }
  templatePickerVisible = false;
}
// Filter templates in picker
function filterTemplates(query) {
  const list = document.getElementById('clawprompt-picker')?.querySelector('.clawprompt-picker-list');
  if (!list) return;

  const items = list.querySelectorAll('.clawprompt-picker-item');
  const lowerQuery = query.toLowerCase();

  items.forEach(item => {
    const name = item.querySelector('.clawprompt-picker-item-name').textContent.toLowerCase();
    if (name.includes(lowerQuery)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}
// Select template from picker
function selectTemplate(templateId) {
  hideTemplatePicker();
  // Send message to background to get full template
  chrome.runtime.sendMessage({
    type: 'GET_TEMPLATE',
    templateId,
  }, (response) => {
    if (response.template) {
      insertTemplate(response.template.content);
    }
  });
}
// Handle keyboard shortcuts
function handleKeyboard(event) {
  // Escape to close picker
  if (event.key === 'Escape' && templatePickerVisible) {
    hideTemplatePicker();
    event.preventDefault();
  }

  // Ctrl+Shift+P to show picker
  if (event.ctrlKey && event.shiftKey && event.key === 'P') {
    if (isEditable(document.activeElement)) {
      chrome.runtime.sendMessage({
        type: 'GET_TEMPLATES',
      }, (response) => {
        if (response.templates) {
          showTemplatePicker(response.templates);
        }
      });
      event.preventDefault();
    }
  }
}
// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `clawprompt-notification clawprompt-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.classList.add('clawprompt-notification-visible');
  });

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('clawprompt-notification-visible');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
