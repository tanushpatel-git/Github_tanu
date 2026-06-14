import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CommandDefinition, isDangerousCommand, getNonce } from '../utils/helpers';
import { TerminalService } from '../services/TerminalService';
import { StorageService } from '../services/StorageService';

export class FormPanel {
  private static currentPanel: FormPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private currentCommand: CommandDefinition | undefined;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private terminalService: TerminalService,
    private storageService: StorageService
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml(extensionUri);
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables
    );
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    command: CommandDefinition,
    terminalService: TerminalService,
    storageService: StorageService
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (FormPanel.currentPanel) {
      FormPanel.currentPanel.panel.reveal(column || vscode.ViewColumn.Beside);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'commandWizardForm',
        'Command Wizard',
        column || vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );
      FormPanel.currentPanel = new FormPanel(
        panel,
        extensionUri,
        terminalService,
        storageService
      );
    }

    FormPanel.currentPanel.loadCommand(command);
  }

  loadCommand(command: CommandDefinition): void {
    this.currentCommand = command;
    this.panel.title = `Command Wizard - ${command.name}`;
    this.panel.webview.postMessage({
      type: 'loadCommand',
      command: command,
    });
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'execute':
        await this.executeCommand(message.command);
        break;
      case 'browseFile':
        await this.browseFile(message.inputName);
        break;
      case 'browseFolder':
        await this.browseFolder(message.inputName);
        break;
      case 'cancel':
        this.panel.dispose();
        break;
    }
  }

  private async executeCommand(commandText: string): Promise<void> {
    if (isDangerousCommand(commandText)) {
      const result = await vscode.window.showWarningMessage(
        `This command may be dangerous:\n\n${commandText}\n\nAre you sure you want to proceed?`,
        { modal: true },
        'Yes, Execute',
        'Cancel'
      );
      if (result !== 'Yes, Execute') {
        return;
      }
    }

    this.terminalService.executeCommand(commandText);

    if (this.currentCommand) {
      this.storageService.addRecentCommand(
        commandText,
        this.currentCommand.name,
        this.currentCommand.category
      );
    }

    this.panel.dispose();
  }

  private async browseFile(inputName: string): Promise<void> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
    });
    if (result && result.length > 0) {
      this.panel.webview.postMessage({
        type: 'fileSelected',
        inputName: inputName,
        value: result[0].fsPath,
      });
    }
  }

  private async browseFolder(inputName: string): Promise<void> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (result && result.length > 0) {
      this.panel.webview.postMessage({
        type: 'folderSelected',
        inputName: inputName,
        value: result[0].fsPath,
      });
    }
  }

  private getHtml(extensionUri: vscode.Uri): string {
    const htmlPath = path.join(
      extensionUri.fsPath,
      'src',
      'webview',
      'form.html'
    );
    const cssPath = path.join(
      extensionUri.fsPath,
      'src',
      'webview',
      'form.css'
    );
    const jsPath = path.join(
      extensionUri.fsPath,
      'src',
      'webview',
      'form.js'
    );

    let html = fs.readFileSync(htmlPath, 'utf-8');
    const css = fs.readFileSync(cssPath, 'utf-8');
    const js = fs.readFileSync(jsPath, 'utf-8');
    const nonce = getNonce();

    html = html.replace('{{css}}', css);
    html = html.replace('{{js}}', js);
    html = html.replace(/{{nonce}}/g, nonce);

    return html;
  }

  dispose(): void {
    FormPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length > 0) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
