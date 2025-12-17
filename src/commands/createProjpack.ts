import * as vscode from 'vscode';
import * as path from 'path';

export async function createProjpackJson(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder is open. Open a folder to create .vscode/projpack.json.');
    return;
  }

  const root = workspaceFolders[0].uri;
  const vscodeFolder = vscode.Uri.joinPath(root, '.vscode');
  const projpackUri = vscode.Uri.joinPath(vscodeFolder, 'projpack.json');

  try {
    await vscode.workspace.fs.createDirectory(vscodeFolder);
    const initial = {
      solutionPath: '',
      configurations: [
        {
          packageName: 'Example.Package',
          packageVersion: '1.0.0',
          projectPath: 'path/to/project.csproj',
          enabled: true
        }
      ] as Array<Record<string, unknown>>
    };
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(projpackUri, encoder.encode(JSON.stringify(initial, null, 2)));
    const doc = await vscode.workspace.openTextDocument(projpackUri);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('.vscode/projpack.json created. Add configurations and save.');
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to create projpack.json: ${err}`);
  }
}

export function registerCreateProjpack(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.createProjpack', createProjpackJson));
}
