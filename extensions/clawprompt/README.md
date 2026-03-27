# ClawPrompt

> AI Prompt Templates for Chrome

A Chrome extension for managing and inserting AI prompt templates into any text field. Works with Claude, ChatGPT, Gemini, Copilot, Poe, Perplexity, and any site with an editable field.

## Features

- **Template Management** — create, edit, duplicate, and delete templates
- **Categories** — organize templates by category (coding, writing, business, analysis, creative, general)
- **Tags** — add comma-separated tags for filtering
- **Favorites** — mark frequently used templates with a star
- **Search** — fuzzy search across template name, content, and tags (200ms debounce)
- **Keyboard Shortcuts** — open popup and quick-insert via customizable shortcuts
- **Context Menu** — right-click in any text field to insert a template
- **Inline Picker** — overlay picker triggered by `Ctrl+Shift+P` while focused on a text field
- **Import/Export** — backup and share templates as JSON
- **Options Page** — full management interface with templates table, categories grid, and settings

## Installation

### Manual Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extensions/clawprompt` folder
5. The ClawPrompt icon appears in your toolbar

## Usage

### Popup

1. Click the ClawPrompt icon in the Chrome toolbar
2. Browse templates by category tabs (All, Favorites, Recent) or search by name/tag
3. Click **Insert** on a template to insert it into the active text field
4. Double-click a template card to insert it directly
5. Click **Copy** to copy the template content to clipboard

### Inline Picker

1. Focus on any editable text field (input, textarea, or contenteditable)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. A floating picker appears with all your templates
4. Type to filter, then click a template to insert it at the cursor position
5. Press `Esc` to close the picker

### Context Menu

1. Right-click in any text field
2. Select **Insert ClawPrompt Template**
3. Choose from the submenu

### Quick Insert Last Used

Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on macOS) to insert the most recently used template into the active text field.

## Keyboard Shortcuts

| Shortcut | macOS | Action |
|----------|-------|--------|
| `Ctrl+Shift+P` | `Cmd+Shift+P` | Open popup / show inline picker |
| `Ctrl+Shift+I` | `Cmd+Shift+I` | Quick insert last used template |
| `Esc` | `Esc` | Close popup, picker, or editor modal |

Shortcuts can be customized in Chrome at `chrome://extensions/shortcuts`.

## Template Variables

Use these placeholders in your templates — they are replaced automatically on insertion:

| Variable | Description |
|----------|-------------|
| `{{cursor}}` | Sets the cursor position after insertion (marker is removed) |
| `{{selected}}` | Replaced with currently selected text in the field |
| `{{date}}` | Current date (locale-formatted) |
| `{{time}}` | Current time (locale-formatted) |
| `{{datetime}}` | Current date and time (locale-formatted) |

Custom variables like `{{subject}}`, `{{name}}`, etc. are left as-is for you to fill in manually.

## Options Page

Open the options page from the popup's gear icon, or go to `chrome://extensions/` > ClawPrompt > **Details** > **Extension options**.

The options page has three sections:

### Templates

- Full table view of all templates with name, preview, category, tags, and actions
- Sort by clicking column headers
- Search/filter templates
- Edit, duplicate, copy, and delete templates
- **Load Defaults** button restores the 10 built-in sample templates
- **Delete All** permanently removes all templates and categories

### Categories

- Grid view showing each category with its template count
- Built-in categories: general, coding, writing, analysis, creative, business
- Click **View** on a category to filter the templates table
- Create custom categories with a name and icon

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | `dark` | UI theme (dark / light) |
| Font Size | `medium` | Popup and options page font size (small / medium / large) |
| Show Notifications | `true` | Show toast notifications for actions |
| Auto Save | `true` | Automatically save template edits |
| Default Category | `general` | Category pre-selected when creating a new template |
| Insert Delay | `100` | Milliseconds delay before template insertion |

## Default Templates

ClawPrompt ships with 10 sample templates. Load them via **Load Defaults** on the options page:

| Name | Category | Tags |
|------|----------|------|
| Code Review | coding | code, review, quality |
| Explain Code | coding | explain, understand, code |
| Refactor Request | coding | refactor, clean, improve |
| Bug Report | coding | bug, issue, debug |
| Git Commit Message | coding | git, commit, message |
| Meeting Summary | business | meeting, summary, notes |
| Professional Email | writing | email, professional, communication |
| Data Analysis | analysis | data, analysis, report |
| Creative Story | creative | story, creative, fiction |
| Product Description | business | product, marketing, description |

## Search

The search bar filters templates in real-time (200ms debounce) across:
- Template **name**
- Template **content** (full text)
- **Tags**

Results are sorted alphabetically by name.

## Import/Export

### Export

Click **Export** in the popup or **Export All** in the options page. Downloads a JSON file named `clawprompt-templates-YYYY-MM-DD.json` containing all templates.

### Import

Click **Import** and select a `.json` file. Imported templates receive new IDs to avoid conflicts with existing templates. Templates are merged — no duplicates are removed.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Shortcut does not work | Check `chrome://extensions/shortcuts` for conflicts with other extensions |
| Template not inserting | Ensure the text field is focused before inserting; some sites block programmatic input |
| Popup closes immediately | This is normal — templates are inserted and the popup auto-closes |
| Inline picker does not appear | The focused element must be editable (input, textarea, or contenteditable) |
| Imported templates missing | Verify the JSON file has a `templates` array at its root |

## Supported Sites

ClawPrompt's inline picker and content script work on all sites. The manifest includes host permissions for popular AI chat sites:

- claude.ai
- chat.openai.com / chatgpt.com
- gemini.google.com
- copilot.microsoft.com
- poe.com
- perplexity.ai

The popup and context menu work on any site.

## Development

```
extensions/clawprompt/
  manifest.json              — MV3 manifest (v1.0.0, i18n)
  background/service-worker.js — Background service worker
  content/content.js         — Inline picker, template insertion, variable processing
  content/content.css        — Picker overlay styles
  popup/popup.html           — Popup UI
  popup/popup.js             — Popup logic, search, template management
  options/options.html       — Full options page
  options/options.js         — Settings, categories, import/export
  templates/sample-templates.json — 8 bundled sample templates
  _locales/en/messages.json  — English locale strings
  icons/                     — Extension icons (16, 32, 48, 128)
```

## Privacy

ClawPrompt stores all data locally in Chrome's storage. No data is sent to external servers.

## License

MIT License — See LICENSE file for details.

## Credits

Created by [aegntic.ai](https://aegntic.ai)
Part of the [clawREFORM](https://github.com/aegntic/clawreform) ecosystem.
