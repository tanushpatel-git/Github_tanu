import * as vscode from 'vscode';
import { CommandDefinition, RecentCommand } from '../utils/helpers';

const FAVORITES_KEY = 'commandWizard.favorites';
const RECENT_KEY = 'commandWizard.recent';
const MAX_RECENT = 10;

export class StorageService {
  constructor(private context: vscode.ExtensionContext) {}

  getFavorites(): CommandDefinition[] {
    return this.context.globalState.get<CommandDefinition[]>(
      FAVORITES_KEY,
      []
    );
  }

  addFavorite(command: CommandDefinition): void {
    const favorites = this.getFavorites();
    const exists = favorites.some(
      f => f.name === command.name && f.category === command.category
    );
    if (!exists) {
      favorites.push(command);
      this.context.globalState.update(FAVORITES_KEY, favorites);
    }
  }

  removeFavorite(command: CommandDefinition): void {
    let favorites = this.getFavorites();
    favorites = favorites.filter(
      f => !(f.name === command.name && f.category === command.category)
    );
    this.context.globalState.update(FAVORITES_KEY, favorites);
  }

  isFavorite(command: CommandDefinition): boolean {
    return this.getFavorites().some(
      f => f.name === command.name && f.category === command.category
    );
  }

  getRecentCommands(): RecentCommand[] {
    return this.context.globalState.get<RecentCommand[]>(RECENT_KEY, []);
  }

  addRecentCommand(
    command: string,
    commandName: string,
    category: string
  ): void {
    const recent = this.getRecentCommands();
    recent.unshift({ command, commandName, category, timestamp: Date.now() });

    const seen = new Set<string>();
    const unique = recent.filter(entry => {
      const key = entry.command;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    this.context.globalState.update(
      RECENT_KEY,
      unique.slice(0, MAX_RECENT)
    );
  }
}
