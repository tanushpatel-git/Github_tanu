import * as vscode from 'vscode';
import { CommandService } from '../services/CommandService';
import { StorageService } from '../services/StorageService';
import { CommandDefinition } from '../utils/helpers';

type TreeItemType =
  | 'category'
  | 'command'
  | 'favorite'
  | 'recent'
  | 'favorites-header'
  | 'recent-header'
  | 'search-header';

export class TreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private commandService: CommandService,
    private storageService: StorageService
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: vscode.TreeItem
  ): Promise<vscode.TreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    return this.getChildItems(element);
  }

  private getRootItems(): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];

    const favorites = this.storageService.getFavorites();
    if (favorites.length > 0) {
      items.push(this.createHeader('⭐ Favorites', 'favorites-header'));
    }

    const recent = this.storageService.getRecentCommands();
    if (recent.length > 0) {
      items.push(
        this.createHeader('🕐 Recent', 'recent-header')
      );
    }

    const categories = this.commandService.getCategories();
    for (const category of categories) {
      const catItem = new vscode.TreeItem(
        category,
        vscode.TreeItemCollapsibleState.Expanded
      );
      catItem.contextValue = 'category';
      catItem.iconPath = new vscode.ThemeIcon('folder');
      catItem.id = `category:${category}`;
      items.push(catItem);
    }

    return items;
  }

  private getChildItems(element: vscode.TreeItem): vscode.TreeItem[] {
    const id = element.id || '';
    const favorites = this.storageService.getFavorites();
    const recent = this.storageService.getRecentCommands();

    if (id === 'favorites-header') {
      return favorites.map(cmd =>
        this.createCommandItem(cmd, 'favorite')
      );
    }

    if (id === 'recent-header') {
      return recent.map(entry => {
        const def = this.commandService.getCommandByNameAndCategory(
          entry.commandName,
          entry.category
        );
        if (def) {
          return this.createCommandItem(def, 'recent');
        }
        const item = new vscode.TreeItem(
          entry.command,
          vscode.TreeItemCollapsibleState.None
        );
        item.contextValue = 'recent';
        item.iconPath = new vscode.ThemeIcon('terminal');
        item.id = `recent:${entry.timestamp}`;
        item.description = entry.category;
        item.tooltip = entry.command;
        return item;
      });
    }

    if (id.startsWith('category:')) {
      const category = id.slice('category:'.length);
      const commands = this.commandService.getCommandsByCategory(
        category
      );
      return commands.map(cmd =>
        this.createCommandItem(cmd, 'command')
      );
    }

    return [];
  }

  private createHeader(
    label: string,
    type: TreeItemType
  ): vscode.TreeItem {
    const item = new vscode.TreeItem(
      label,
      vscode.TreeItemCollapsibleState.Expanded
    );
    item.contextValue = type;
    item.id = type;
    switch (type) {
      case 'favorites-header':
        item.iconPath = new vscode.ThemeIcon('star');
        break;
      case 'recent-header':
        item.iconPath = new vscode.ThemeIcon('history');
        break;
      case 'search-header':
        item.iconPath = new vscode.ThemeIcon('search');
        break;
    }
    return item;
  }

  private createCommandItem(
    cmd: CommandDefinition,
    contextType: TreeItemType
  ): vscode.TreeItem {
    const item = new vscode.TreeItem(
      cmd.name,
      vscode.TreeItemCollapsibleState.None
    );
    item.contextValue = contextType;
    item.iconPath = new vscode.ThemeIcon('terminal');
    item.id = `${contextType}:${cmd.category}:${cmd.name}`;
    item.description = cmd.description;
    item.tooltip = cmd.command;
    item.command = {
      command: 'commandWizard.execute',
      title: 'Execute Command',
      arguments: [cmd],
    };
    return item;
  }

  getParent?(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    return null;
  }
}
