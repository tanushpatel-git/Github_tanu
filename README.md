# GitHub Tanu - Command Wizard

A visual terminal assistant for executing Git commands without memorizing syntax.

## Features

- **Visual Git Commands** — 22+ Git commands organized by category (Setup, Status, Staging, Committing, Branching, Remote, Undo, Stash)
- **Dynamic Forms** — Each command generates a custom form with the right input types (text, select, checkbox, file picker, etc.)
- **Command Preview** — See the final command before executing; edit it inline if needed
- **Danger Detection** — Built-in safety checks warn you before running destructive commands
- **Favorites** — Star frequently used commands for quick access
- **Recent History** — Your last 10 executed commands are always available
- **Quick Pick Search** — Search all commands by name, category, or description

## Usage

1. Click the **Command Wizard** icon in the activity bar
2. Browse commands by category or use the search icon
3. Click a command to open its form, fill in the fields, and preview the command
4. Click **Run** to execute in a VS Code terminal

## Requirements

- VS Code 1.85.0 or higher

## Commands

| Command | Description |
|---|---|
| `Execute Command` | Open a command's form |
| `Search Commands` | QuickPick search across all commands |
| `Execute Recent Command` | Re-run a recent command |
| `Add to Favorites` | Star a command |
| `Remove from Favorites` | Unstar a command |

## License

MIT
