# DevScribe

> Development companion for clawREFORM — capture, annotate, and export from the dashboard

A Chrome extension that lives inside the clawREFORM dashboard at `http://127.0.0.1:4332`. Take notes, capture screenshots, inspect elements, monitor console/network traffic, read Alpine.js state, and create GitHub issues — all without leaving the dashboard.

## Features

- **Floating Action Button (FAB)** — gold coin button in the bottom-right corner opens the side panel
- **Notes** — create notes typed as Bug, Feature, Debt, Performance, or Observation
- **Screenshots** — capture the current viewport and attach to a note
- **Element Selection** — hover-highlight any dashboard element to inspect its tag, classes, Alpine.js bindings, data attributes, and API endpoints
- **Console Capture** — intercepts `console.log`, `console.warn`, `console.error` into a ring buffer (max 100 entries)
- **Network Capture** — intercepts `/api/` fetch and XHR calls with status, timing, and error info (max 50 entries)
- **Alpine.js Inspection** — reads the `Alpine.store("app")` state including current page, agents, connection status, and version
- **Hover Tooltips** — mouse over any element to see a tooltip with tag, ID, classes, Alpine bindings, data attributes, and detected API endpoints
- **Full-Text Search** — search across all notes with type and date-range filters; search history is persisted
- **GitHub Integration** — configure a personal access token and repo, then create issues directly from notes
- **Import/Export** — backup and restore notes as JSON

## Requirements

- clawREFORM dashboard running at `http://127.0.0.1:4332`
- Chrome or Chromium-based browser with Developer mode enabled

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extensions/devscribe` folder
5. Navigate to `http://127.0.0.1:4332` — the gold FAB appears in the bottom-right corner

## Usage

### Getting Started

Click the gold **DS** FAB in the bottom-right corner of the dashboard. The side panel opens with four tabs:

| Tab | Purpose |
|-----|---------|
| **Notes** | Create, view, edit, and delete notes |
| **Capture** | Screenshots, element selection, state snapshots |
| **Search** | Full-text search across all notes |
| **State** | Live Alpine.js store data and dashboard metadata |

### Notes

1. Switch to the **Notes** tab
2. Fill in a title, select a type (Bug / Feature / Debt / Performance / Observation), and write the body
3. Optionally add comma-separated labels
4. Click **Save Note**
5. Each note card shows its type badge, timestamp, and body preview
6. Use the **Edit**, **Delete**, or **GitHub Issue** buttons on each card

### Capture

The **Capture** tab provides four tools:

| Tool | Description |
|------|-------------|
| **Screenshot** | Captures the current viewport and prompts to attach it to a new note |
| **Element Select** | Enters selection mode — click any element to inspect it |
| **Console** | Shows intercepted console entries (log/warn/error) with timestamps |
| **Network** | Shows intercepted `/api/` requests with method, URL, status, and latency |

### Search

Type a query in the search input. Filter by note type (All / Bug / Feature / Debt / Performance / Observation) or date range (All / Today / Week / Month). Previous searches are saved in the search history.

### State Tab

Displays a read-only view of the dashboard's Alpine.js store data including:
- Current page / route
- Agent list and count
- Connection status
- Dev mode flag
- Running version

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+N` | Open panel, switch to Notes tab, focus title input |
| `Ctrl+Shift+S` | Open panel, switch to Capture tab, take screenshot |
| `Ctrl+Shift+E` | Open panel, switch to Capture tab, toggle element selection |
| `Ctrl+Shift+F` | Open panel, switch to Search tab, focus search input |
| `Ctrl+Shift+H` | Toggle hover tooltips on/off |
| `Esc` | Cancel element selection or collapse panel |

> On macOS, `Ctrl` maps to `Cmd` automatically.

## Hover Tooltips

When enabled (default), hovering over any element on the dashboard shows a tooltip with:

- **Tag, ID, and classes** — basic element identity
- **Alpine.js bindings** — `x-data`, `x-show`, `x-text`, `@click`, `:class`, etc.
- **Data attributes** — all `data-*` attributes on the element
- **API endpoints** — auto-detected from click handlers or `href` patterns

Toggle tooltips with `Ctrl+Shift+H` or via the Settings page.

## Settings

Open `chrome://extensions/` > DevScribe > **Details** > **Extension options**, or right-click the FAB and select Options.

| Setting | Default | Description |
|---------|---------|-------------|
| Capture Console | `true` | Intercept console.log/warn/error into the ring buffer |
| Capture Network | `false` | Intercept fetch/XHR calls to `/api/` endpoints |
| Show Toasts | `true` | Show toast notifications for actions |
| Max Console Entries | `100` | Ring buffer size for console capture |
| Max Network Entries | `50` | Ring buffer size for network capture |
| Panel Auto Open | `true` | Automatically expand the panel on page load |
| Panel Minimized | `false` | Start with the panel collapsed |
| Default Note Type | `observation` | Pre-selected type when creating a new note |
| Default Labels | `""` | Comma-separated labels applied to new notes |

## GitHub Integration

1. Generate a **Personal Access Token** at GitHub Settings > Developer settings > Personal access tokens
2. Open DevScribe options and enter the token in the **GitHub Token** field
3. Enter the repository as `owner/repo` (e.g. `aegntic/clawreform`)
4. Click **Test Connection** to verify
5. Click **Save GitHub Settings**
6. On any note card, click the **GitHub Issue** button to create an issue from that note

## Data Management

### Export

From the options page, click **Export All Notes** to download a JSON file containing all notes, settings, and GitHub configuration.

### Import

Click **Import Notes** and select a previously exported `.json` file. Imported notes are merged with existing ones.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| FAB does not appear | Ensure you are on `http://127.0.0.1:4332`; DevScribe only runs on that origin |
| Panel is blank | Open DevTools (F12) and check the console for errors; reload the page |
| Console/Network tabs empty | Verify **Capture Console** and **Capture Network** are enabled in Settings |
| GitHub issue creation fails | Check that the token has `repo` scope and the repo format is `owner/repo` |
| Shortcuts not working | Ensure no other extension is capturing the same key combos; try reloading the page |

## Development

```
extensions/devscribe/
  manifest.json    — MV3 manifest (v0.1.0)
  content.js       — Side panel, FAB, capture tools, search, hover tooltips
  content.css      — Injected styles for the selection overlay
  background.js    — Service worker (storage, GitHub API proxy)
  popup.html       — Extension popup (quick actions)
  popup.js         — Popup logic
  options.html     — Full settings page
  options.js       — Settings management, import/export
  icons/           — Extension icons (16, 48, 128)
```

To test changes:

1. Edit files in `extensions/devscribe/`
2. Go to `chrome://extensions/`
3. Click the **reload** icon on the DevScribe card
4. Refresh the dashboard tab

## Privacy

All data (notes, settings, GitHub token) is stored locally in Chrome's extension storage. No data is sent to external servers except GitHub API calls when you explicitly create an issue.

## Credits

Created by [aegntic.ai](https://aegntic.ai)
Part of the [clawREFORM](https://github.com/aegntic/clawreform) ecosystem.
