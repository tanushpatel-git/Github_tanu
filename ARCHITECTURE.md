# Architecture & File Guide

## Data Flow

```
User clicks command in tree view
        │
        v
extension.ts ──> commandWizard.execute
        │
        v
FormPanel.ts ──> Creates webview panel
        │
        v
form.html + form.js ──> Renders dynamic form with inputs
        │
        v
User fills form, clicks Preview ──> Shows final command string
        │
        v
User clicks Run ──> postMessage({ type: 'execute' })
        │
        v
FormPanel.ts ──> Checks danger patterns ──> TerminalService
        │                                              │
        v                                              v
StorageService.ts (save recent)              VS Code Terminal (executes)
```

---

## File-by-File Breakdown

### `src/extension.ts`
The entry point. On activation, it creates three services (CommandService, TerminalService, StorageService) and the TreeProvider, then registers six VS Code commands (`execute`, `executeRecent`, `search`, `refresh`, `addFavorite`, `removeFavorite`).

### `src/commands/git.json`
A JSON array of 22 Git command definitions. Each command has: `name`, `category` ("Git"), `description`, `command` (template string with `{placeholder}` variables), and `inputs[]` (typed form fields — text, file, select, etc.). This is the only data source for commands.

### `src/services/CommandService.ts`
Imports `git.json` and loads all commands into memory. Provides lookup methods: `getAllCommands()`, `getCategories()`, `getCommandsByCategory()`, `search()`, `getCommandByNameAndCategory()`.

### `src/services/StorageService.ts`
Persists favorites and recent commands using VS Code's `globalState` (extension-level key-value store). Favorites stored as `CommandDefinition[]`, recent as `RecentCommand[]` (capped at 10). Methods: `getFavorites()`, `addFavorite()`, `removeFavorite()`, `isFavorite()`, `getRecentCommands()`, `addRecentCommand()`.

### `src/services/TerminalService.ts`
Thin wrapper around `vscode.window.createTerminal()`. Creates/reuses a terminal named "Command Wizard", calls `show()` and `sendText()`.

### `src/providers/TreeProvider.ts`
Implements `vscode.TreeDataProvider`. Renders the activity bar tree view with three sections:
- **Favorites** (if any exist)
- **Recent** (if any exist)
- **Category nodes** (currently "Git" — expand to show commands)

Each command item has a click handler that fires `commandWizard.execute`.

### `src/utils/helpers.ts`
Shared types and utilities:
- **`CommandInput`** — input field definition (name, label, type, required, placeholder, options)
- **`CommandDefinition`** — full command definition (name, category, description, command, inputs)
- **`RecentCommand`** — tracked execution (command string, name, category, timestamp)
- **`DANGEROUS_PATTERNS`** — 12 blacklisted patterns (`rm -rf`, `git reset --hard`, etc.)
- **`isDangerousCommand()`** — checks if a command matches any dangerous pattern
- **`buildCommand()`** — replaces `{placeholder}` tokens with actual values
- **`getNonce()`** — generates a CSP nonce for the webview

### `src/webview/FormPanel.ts`
Manages the webview panel (singleton — only one panel at a time). Receives a `CommandDefinition`, builds the HTML with injected CSS/JS, and handles messages from the webview:
- `execute` — checks danger, runs via TerminalService, saves to recent, disposes panel
- `browseFile`/`browseFolder` — opens native VS Code dialogs, sends path back to webview
- `cancel` — disposes panel

### `src/webview/form.html`
Minimal HTML shell. Has a CSP that only allows `style-src 'unsafe-inline'` and a single nonced script. Two containers: `#form-container` and `#preview-container`.

### `src/webview/form.js`
Client-side JavaScript (399 lines). Runs inside the webview sandbox. Uses `acquireVsCodeApi()` to talk to the extension host. Handles:
- **`renderForm(command)`** — builds the complete form DOM (header, badge, description, input groups, buttons)
- **`createInputGroup(input)`** — renders the right HTML for each input type: text, textarea, select, checkbox, radio, file, folder
- **`showPreview()`** — validates inputs, builds the final command, shows a read-only preview with optional edit area
- **`buildCommand()`** — regex-based `{placeholder}` substitution
- **`validate()`** — checks required fields, shows inline errors
- **Message handling** — responds to `loadCommand`, `fileSelected`, `folderSelected`

### `src/webview/form.css`
291 lines of styles using VS Code CSS variables (`--vscode-*`) for seamless theme integration. Covers: form layout, input groups, buttons (primary/secondary), preview box, edit area, error messages, empty state.

---

## VS Code Manifest (`package.json`)

| Section | What it declares |
|---|---|
| `activationEvents` | When to activate: view open, command execution |
| `viewsContainers` | Activity bar container for "Command Wizard" |
| `views` | One tree view named "COMMAND WIZARD" |
| `commands` | 6 commands (execute, executeRecent, search, refresh, add/remove favorite) |
| `menus` | Search + refresh buttons in view title; add/remove favorite in context menu |

---

## Key Design Decisions

- **No external dependencies** — only `@types/vscode`, `@types/node`, and `typescript`
- **JSON command definitions** — adding commands is data entry, not coding
- **Singleton webview panel** — prevents multiple overlapping form windows
- **Danger detection** — client-side pattern check before terminal execution
- **Webview sandbox** — CSP restricts scripts to a single nonced bundle; file browsing delegated to the extension host
