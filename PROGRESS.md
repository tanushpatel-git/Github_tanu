# Command Wizard — Progress Report

## Project Overview

A VS Code extension that provides a visual terminal assistant for executing Git commands without memorizing syntax. It offers a tree view in the activity bar, a webview form for command input, favorites/recent tracking, and dangerous command detection.

---

## Architecture

```
src/
├── extension.ts                    # Entry point — activates services + registers commands
├── commands/
│   └── git.json                    # 22 Git command definitions
├── providers/
│   └── TreeProvider.ts             # Activity bar tree view (categories, favorites, recent)
├── services/
│   ├── CommandService.ts           # Loads & queries command definitions
│   ├── StorageService.ts           # Persists favorites + recent via globalState
│   └── TerminalService.ts          # Wraps vscode.Terminal for execution
├── utils/
│   └── helpers.ts                  # Types, danger detection, command builder
└── webview/
    ├── FormPanel.ts                # Webview panel lifecycle & message handling
    ├── form.html                   # HTML shell with CSP
    ├── form.js                     # Client-side form rendering + validation + preview
    └── form.css                    # VS Code–themed styles
```

---

## What's Built

### Command Definitions (22 Git commands)

| Group | Commands |
|---|---|
| **Setup** | Init, Clone |
| **Status** | Status, Log |
| **Staging** | Add File, Add All, Reset |
| **Committing** | Commit, Commit Amend |
| **Branching** | List Branches, Create Branch, Checkout, Merge Branch |
| **Remote** | Push, Pull, Fetch |
| **Undo** | Reset Hard, Revert |
| **Stash** | Stash, Stash Pop |

### Core Features

- **Tree View** — Commands organized by category in the VS Code activity bar, with expandable Favorites and Recent sections
- **Webview Form** — Dynamic form generated per command showing the right input fields (text, file picker, dropdowns, checkboxes, radios)
- **Command Preview** — See the final command string before executing
- **Danger Detection** — Warns before running destructive commands (`rm -rf`, `git reset --hard`, etc.)
- **Favorites** — Star commands for quick access (persisted)
- **Recent History** — Last 10 unique commands tracked
- **Quick Pick Search** — `Cmd+Shift+P`–style search across all commands
- **File/Folder Browsing** — Native VS Code file dialogs for `{file}` and `{folder}` inputs

### Registered VS Code Commands

| Command | Title | Icon |
|---|---|---|
| `commandWizard.execute` | Execute Command | — |
| `commandWizard.executeRecent` | Execute Recent Command | — |
| `commandWizard.search` | Search Commands | `$(search)` |
| `commandWizard.refresh` | Refresh | `$(refresh)` |
| `commandWizard.addFavorite` | Add to Favorites | `$(star-add)` |
| `commandWizard.removeFavorite` | Remove from Favorites | `$(star-delete)` |

---

## In Progress / Todo

- [ ] Compile and test the extension in VS Code
- [ ] More Git commands (rebase, cherry-pick, bisect, submodule)
- [ ] Command search/filter in the tree view
- [ ] Keyboard shortcuts for common commands
- [ ] Configuration options (danger patterns, max recent count, etc.)
- [ ] Publishing to VS Code Marketplace

---

## Tech Stack

- **Language:** TypeScript (strict mode, ES2020)
- **Runtime:** VS Code Extension API (`^1.85.0`)
- **Build:** `tsc` via npm scripts
- **Dependencies:** None (only `@types/vscode`, `@types/node`, `typescript`)
