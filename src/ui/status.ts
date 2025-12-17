import * as vscode from 'vscode';

export function initStatusBar(context: vscode.ExtensionContext) {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.text = 'ProjPack';
  status.tooltip = 'VS Code - .NET Proj/Pack Switcher: Click to switch reference type';
  status.command = 'workbench.action.showCommands';
  status.show();
  context.subscriptions.push(status);
}
