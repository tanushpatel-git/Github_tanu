import * as vscode from 'vscode';
import { TreeProvider } from './providers/TreeProvider';
import { CommandService } from './services/CommandService';
import { TerminalService } from './services/TerminalService';
import { StorageService } from './services/StorageService';
import { FormPanel } from './webview/FormPanel';
import { CommandDefinition, isDangerousCommand } from './utils/helpers';

let treeProvider: TreeProvider;
let commandService: CommandService;
let terminalService: TerminalService;
let storageService: StorageService;

export function activate(context: vscode.ExtensionContext): void {
  commandService = new CommandService();
  terminalService = new TerminalService();
  storageService = new StorageService(context);

  treeProvider = new TreeProvider(commandService, storageService);

  vscode.window.registerTreeDataProvider('commandWizard', treeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'commandWizard.execute',
      (command: CommandDefinition) => {
        FormPanel.createOrShow(
          context.extensionUri,
          command,
          terminalService,
          storageService
        );
        treeProvider.refresh();
      }
    ),

    vscode.commands.registerCommand(
      'commandWizard.executeRecent',
      async (commandText: string) => {
        if (isDangerousCommand(commandText)) {
          const result = await vscode.window.showWarningMessage(
            `This command may be dangerous:\n\n${commandText}\n\nAre you sure?`,
            { modal: true },
            'Yes, Execute',
            'Cancel'
          );
          if (result !== 'Yes, Execute') {
            return;
          }
        }
        terminalService.executeCommand(commandText);
      }
    ),

    vscode.commands.registerCommand(
      'commandWizard.search',
      async () => {
        const items = commandService.getAllCommands().map((cmd) => ({
          label: cmd.name,
          description: cmd.category,
          detail: cmd.description,
          cmd: cmd,
        }));

        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'Search Commands';
        quickPick.placeholder = 'Type to search commands...';
        quickPick.items = items;
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;

        quickPick.onDidAccept(() => {
          const selected = quickPick.selectedItems[0];
          if (selected) {
            const cmd = (selected as any).cmd as CommandDefinition;
            if (cmd) {
              vscode.commands.executeCommand(
                'commandWizard.execute',
                cmd
              );
            }
          }
          quickPick.hide();
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      }
    ),

    vscode.commands.registerCommand(
      'commandWizard.refresh',
      () => {
        treeProvider.refresh();
      }
    ),

    vscode.commands.registerCommand(
      'commandWizard.addFavorite',
      (command: CommandDefinition) => {
        storageService.addFavorite(command);
        treeProvider.refresh();
        vscode.window.setStatusBarMessage(
          `Added "${command.name}" to favorites`,
          3000
        );
      }
    ),

    vscode.commands.registerCommand(
      'commandWizard.removeFavorite',
      (command: CommandDefinition) => {
        storageService.removeFavorite(command);
        treeProvider.refresh();
        vscode.window.setStatusBarMessage(
          `Removed "${command.name}" from favorites`,
          3000
        );
      }
    )
  );
}

export function deactivate(): void {}
