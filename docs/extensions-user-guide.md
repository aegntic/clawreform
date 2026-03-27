# clawREFORM Extensions User Guide

A comprehensive guide to the two Chrome extensions that complement the clawREFORM Agent Operating System.

## Introduction

clawREFORM ships with two browser extensions that extend its capabilities:

| Extension | Purpose | Where it runs |
|-----------|---------|---------------|
| **ClawPrompt** | AI prompt template manager — create, organize, and insert templates into any text field | All websites |
| **DevScribe** | Development companion — notes, screenshots, console/network capture, Alpine.js inspection, GitHub issues | clawREFORM dashboard only (`http://127.0.0.1:4332`) |

Together they form a workflow: use DevScribe to capture observations from the dashboard, then use ClawPrompt to quickly insert structured prompts when working with AI assistants.

## Getting Started

### Prerequisites

- Chrome or a Chromium-based browser (Edge, Brave, Arc)
- clawREFORM dashboard running at `http://127.0.0.1:4332` (required for DevScribe)

### Installation

Both extensions are installed as unpacked extensions:

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `extensions/clawprompt` for ClawPrompt
5. Click **Load unpacked** again
6. Select `extensions/devscribe` for DevScribe
7. Navigate to `http://127.0.0.1:4332` to verify DevScribe's gold FAB appears

---

## ClawPrompt Deep Dive

### Template Creation Workflow

1. Open the popup by clicking the ClawPrompt toolbar icon
2. Click the **+** button to open the editor modal
3. Fill in:
   - **Name** — short identifier (e.g. "Code Review")
   - **Category** — select from existing categories or type a new one
   - **Tags** — comma-separated (e.g. "code, review, quality")
   - **Content** — the full prompt text
   - **Shortcut** — optional custom keyboard shortcut
4. Click **Save Template**

Templates are also manageable from the full options page, which provides a table view with sorting, bulk operations, and category management.

### Template Variables

Variables are placeholders replaced at insertion time:

```
{{selected}}   — Replaced with text selected in the field before insertion
{{date}}       — Today's date (e.g. "3/28/2026")
{{time}}       — Current time (e.g. "2:30:00 PM")
{{datetime}}   — Full date and time
{{cursor}}     — Cursor is positioned here after insertion; the marker is removed
```

**Example** — A Git commit template using variables:

```
Write a git commit message for these changes:

{{selected}}

Follow conventional commits format:
- feat: for new features
- fix: for bug fixes
```

Select code in your editor, trigger the template, and `{{selected}}` is replaced with your highlighted code.

**Example** — Using `{{cursor}}` for fill-in fields:

```
Dear {{cursor}},

Thank you for your inquiry about [topic].
```

After insertion, the cursor lands between "Dear " and "," so you can type the recipient's name immediately.

### Categories and Tags

Categories are high-level groupings. Built-in categories with their icons:

| Category | Icon | Use case |
|----------|------|----------|
| general | :page_facing_up: | Uncategorized templates |
| coding | :computer: | Code review, debugging, refactoring |
| writing | :writing_hand: | Emails, blog posts, documentation |
| analysis | :mag: | Data analysis, research summaries |
| creative | :art: | Stories, brainstorming, creative writing |
| business | :briefcase: | Meeting notes, product descriptions, proposals |

Tags are more granular. A template can have multiple tags (e.g. "bug, issue, debug"). Tags are searchable from the popup and options page.

Custom categories can be created from the options page. When you assign a new category name to a template, it appears automatically.

### Search Tips

- Search matches against **name**, **content**, and **tags**
- The search input debounces at 200ms — no need to wait for it
- From the options page, use `category:writing` in the search box to filter by category
- The **Recent** tab in the popup shows the last 10 inserted templates

### Import/Export Strategies

**Backup your library regularly:**

1. Open the options page
2. Click **Export All** — saves everything as `clawprompt-templates-YYYY-MM-DD.json`
3. Store the file in version control or cloud storage

**Share templates with a team:**

1. Create templates in your own extension
2. Export to JSON
3. Send the file to teammates
4. They import via **Import** — new IDs are generated so there are no conflicts

**Merge from multiple sources:**

Importing is additive. If you import a file that has templates with the same names as existing ones, both copies are kept (with different IDs). Clean up duplicates manually from the options page.

### Options Page Walkthrough

The options page has a sidebar navigation with three sections:

1. **Templates** — sortable table with search. Each row has Edit, Duplicate, Copy, and Delete buttons. The **Load Defaults** button restores the 10 built-in templates without removing your custom ones.

2. **Categories** — grid cards showing category name, icon, and template count. Click **View** to jump to filtered templates. Create custom categories with the **Add Category** form.

3. **Settings** — form controls for theme, font size, notifications, auto-save, default category, and insert delay. Changes are saved automatically (300ms debounce).

### Inline Picker Usage

The inline picker is designed for fast insertion without leaving the page:

1. Click into any text field on any website
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
3. A floating overlay appears with a search bar and template list
4. Each item shows the template name and category
5. Type to filter, click to insert, or press `Esc` to dismiss

The picker works with `<input>`, `<textarea>`, and `contenteditable` elements. It also works on AI chat sites (Claude, ChatGPT, Gemini) that use contenteditable fields.

---

## DevScribe Deep Dive

### Dashboard Integration

DevScribe is a content script that only activates on `http://127.0.0.1:4332`. It injects a Shadow DOM panel that is isolated from the dashboard's own styles and Alpine.js scope.

The panel uses a gold/gunmetal/silver metallic design language that visually distinguishes it from the dashboard UI.

### Note-Taking Workflow

1. Click the gold **DS** FAB or press `Ctrl+Shift+N`
2. The Notes tab opens with the title field focused
3. Select a note type from the dropdown:
   - **Observation** — general observation (default)
   - **Bug** — defect or unexpected behavior
   - **Feature** — feature request or idea
   - **Debt** — technical debt item
   - **Performance** — performance concern or optimization
4. Write the note body
5. Optionally add comma-separated labels (e.g. "auth, login, urgent")
6. Click **Save Note**

Notes appear as cards with a color-coded type badge. Each card has Edit, Delete, and GitHub Issue buttons.

### Capture Tools Walkthrough

#### Screenshots

1. Switch to the **Capture** tab (or press `Ctrl+Shift+S`)
2. Click **Screenshot**
3. The viewport is captured using `html2canvas`
4. A new note is prompted with the screenshot attached and the type pre-set to "observation"

#### Element Selection

1. Click **Element Select** (or press `Ctrl+Shift+E`)
2. The cursor becomes a crosshair; hover over elements to highlight them with a gold border
3. Click an element to capture its details:
   - Tag name, ID, and classes
   - Alpine.js directives (`x-data`, `x-show`, `@click`, etc.)
   - Data attributes
   - Detected API endpoints (from click handlers or hrefs)
4. The element info is attached to a new observation note
5. Press `Esc` or `Ctrl+Shift+E` again to cancel selection

#### Console Capture

The console capture intercepts `console.log`, `console.warn`, and `console.error` calls into a ring buffer. Enable it in Settings (on by default).

The Capture tab's Console section shows entries with:
- Log level (color-coded: gray for log, yellow for warn, red for error)
- Timestamp
- Serialized arguments

The buffer holds the most recent 100 entries (configurable).

#### Network Capture

Network capture intercepts `fetch` and `XMLHttpRequest` calls to `/api/` endpoints. Enable it in Settings (off by default — enable when debugging API issues).

The Capture tab's Network section shows:
- HTTP method and URL
- Response status code
- Latency in milliseconds
- Timestamp

The buffer holds the most recent 50 entries (configurable).

### Search Across All Data Types

The Search tab provides full-text search across all saved notes:

1. Type a query — matches against note title, body, and labels
2. Filter by type using the pill buttons (All / Bug / Feature / Debt / Performance / Observation)
3. Filter by date range (All / Today / Week / Month)
4. Previous searches are saved in the search history for quick re-access
5. Click a search history item to re-run that query

### GitHub Issue Creation from Notes

1. Configure GitHub in DevScribe options:
   - Enter a Personal Access Token (needs `repo` scope)
   - Enter the repo as `owner/repo`
   - Click **Test Connection** to verify
2. On any note card, click the **GitHub Issue** button
3. The note's title becomes the issue title, and the body (including type, labels, and timestamp) becomes the issue body
4. The extension creates the issue via the GitHub API and shows a success toast

### Hover Tooltips for Inspection

When hover tooltips are enabled (default), moving the mouse over any dashboard element shows a floating tooltip with:

- **Element identity** — tag, ID, class list
- **Alpine.js data** — directives and reactive data keys (up to 5)
- **Data attributes** — all `data-*` key-value pairs
- **API endpoints** — auto-detected from click handlers or `href` patterns matching `/api/`

The tooltip appears after a 300ms hover delay and repositions to stay within the viewport.

Toggle tooltips with `Ctrl+Shift+H` or the Settings page.

### Alpine.js State Tab

The State tab provides a read-only dump of the dashboard's `Alpine.store("app")` data:

| Field | Description |
|-------|-------------|
| `page` / `currentPage` | Current active page/tab in the dashboard |
| `agents` | Array of agent objects |
| `agentsCount` | Number of agents |
| `connected` | WebSocket or API connection status |
| `devMode` | Whether dev mode is active |
| `version` | Running clawREFORM version |

This is useful for debugging state-related issues without opening the browser's DevTools.

---

## Keyboard Shortcuts Reference

### ClawPrompt

| Shortcut | macOS | Action |
|----------|-------|--------|
| `Ctrl+Shift+P` | `Cmd+Shift+P` | Open popup / show inline picker |
| `Ctrl+Shift+I` | `Cmd+Shift+I` | Quick insert last used template |
| `Esc` | `Esc` | Close popup, picker, or editor modal |

### DevScribe

| Shortcut | macOS | Action |
|----------|-------|--------|
| `Ctrl+Shift+N` | `Cmd+Shift+N` | New note (focus title input) |
| `Ctrl+Shift+S` | `Cmd+Shift+S` | Screenshot |
| `Ctrl+Shift+E` | `Cmd+Shift+E` | Toggle element selection |
| `Ctrl+Shift+F` | `Cmd+Shift+F` | Search (focus search input) |
| `Ctrl+Shift+H` | `Cmd+Shift+H` | Toggle hover tooltips |
| `Esc` | `Esc` | Cancel selection / collapse panel |

> **Note**: Both extensions use `Ctrl+Shift+P`. On the clawREFORM dashboard, DevScribe intercepts `Ctrl+Shift+P` first since it's a content script. Use the popup toolbar icon to open ClawPrompt when on the dashboard.

---

## Settings Reference

### ClawPrompt Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | `dark` | UI color scheme |
| Font Size | `medium` | Text size (small / medium / large) |
| Show Notifications | `true` | Toast notifications |
| Auto Save | `true` | Auto-save edits |
| Default Category | `general` | Pre-selected category for new templates |
| Insert Delay | `100` | Delay before insertion (ms) |

### DevScribe Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Capture Console | `true` | Intercept console output |
| Capture Network | `false` | Intercept API network calls |
| Show Toasts | `true` | Toast notifications |
| Max Console Entries | `100` | Console ring buffer size |
| Max Network Entries | `50` | Network ring buffer size |
| Panel Auto Open | `true` | Auto-expand panel on load |
| Panel Minimized | `false` | Start collapsed |
| Default Note Type | `observation` | Pre-selected note type |
| Default Labels | `""` | Comma-separated labels for new notes |

---

## Common Workflows

### Debugging a clawREFORM Issue

1. Enable **Capture Console** and **Capture Network** in DevScribe settings
2. Reproduce the issue on the dashboard
3. Check the Console and Network tabs for errors or failed API calls
4. Use **Element Select** to inspect the relevant UI component
5. Create a **Bug** note with your findings
6. Click **GitHub Issue** to file the bug directly from the note

### Documenting a Feature

1. Navigate to the feature in the dashboard
2. Take a **Screenshot** with DevScribe
3. Write an **Observation** or **Feature** note describing what you see
4. Use hover tooltips to inspect Alpine.js state and API endpoints
5. Export your notes for documentation or sharing

### Managing Prompt Libraries

1. Create templates in ClawPrompt for recurring prompts
2. Organize them into categories (coding, writing, business)
3. Tag them for cross-category search (e.g. "rust" across coding and analysis)
4. Use **Favorites** to pin your most-used templates
5. Export your library regularly and store in version control
6. Share templates with teammates via import/export

---

## Troubleshooting

### ClawPrompt

| Problem | Solution |
|---------|----------|
| Shortcut conflicts with another extension | Go to `chrome://extensions/shortcuts` and reassign |
| Template inserts but text field doesn't update | Some SPAs block programmatic input; try the clipboard copy approach instead |
| Inline picker doesn't appear | Ensure the cursor is in an editable field (not just a clicked div) |
| Imported templates not showing | Check the JSON has a `"templates"` array; try the options page Import instead |

### DevScribe

| Problem | Solution |
|---------|----------|
| FAB not visible | Ensure you're on `http://127.0.0.1:4332`; check that the extension is enabled |
| Panel content is blank | Reload the dashboard; check the browser console for errors |
| Console/Network tabs show nothing | Enable capture in Settings; reload the page after changing settings |
| GitHub issue fails | Verify token has `repo` scope; confirm repo format is `owner/repo`; check the browser console for the API error |
| Hover tooltips are annoying | Press `Ctrl+Shift+H` to disable, or turn them off in Settings |
| Element selection won't start | Another DevTools overlay may be active; close Chrome DevTools first |

---

## See Also

- [ClawPrompt README](../extensions/clawprompt/README.md) — quick-reference per-extension docs
- [DevScribe README](../extensions/devscribe/README.md) — quick-reference per-extension docs
- [Getting Started](getting-started.md) — clawREFORM installation and first-run guide
- [API Reference](api-reference.md) — dashboard API endpoints that DevScribe monitors
