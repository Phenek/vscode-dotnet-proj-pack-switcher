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
    // If projpack.json already exists, warn and do not overwrite
    try {
      await vscode.workspace.fs.stat(projpackUri);
      vscode.window.showWarningMessage('.vscode/projpack.json already exists.');
      return;
    } catch {
      // File not found — continue to create it
    }

    await vscode.workspace.fs.createDirectory(vscodeFolder);
    const initial = {
      solutionPath: '',
      configurations: [
        {
          packageName: 'Example.Package.Test',
          packageVersion: '1.0.0',
          projectPath: 'path/to/project.csproj',
          PersistRefInSln: false,
          SlnFolder: 'Libraries',
          enabled: false
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
