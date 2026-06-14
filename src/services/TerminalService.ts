import * as vscode from 'vscode';

export class TerminalService {
  private terminal: vscode.Terminal | undefined;

  executeCommand(command: string): void {
    if (!this.terminal || this.terminal.exitStatus !== undefined) {
      this.terminal = vscode.window.createTerminal('Command Wizard');
    }
    this.terminal.show();
    this.terminal.sendText(command);
  }
}
