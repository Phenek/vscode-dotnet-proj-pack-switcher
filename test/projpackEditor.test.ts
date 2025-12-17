import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';

suite('Projpack Editor', () => {
  test('command adds configuration to .vscode/projpack.json', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      // can't run this test without a workspace
      return;
    }

    const ws = workspaceFolders[0].uri.fsPath;
    const projpackDir = path.join(ws, '.vscode');
    const projpackPath = path.join(projpackDir, 'projpack.json');

    await fs.mkdir(projpackDir, { recursive: true });
    await fs.writeFile(projpackPath, '{}', 'utf8');

    const doc = await vscode.workspace.openTextDocument(projpackPath);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand('vscode-dotnet-proj-pack-switcher.projpack.addConfiguration');

    const newText = (await vscode.workspace.openTextDocument(projpackPath)).getText();
    const json = JSON.parse(newText);
    assert.ok(Array.isArray(json.configurations), 'configurations should be an array');
    assert.strictEqual(json.configurations.length, 1);
    assert.strictEqual(json.configurations[0].name, 'New configuration');
  });
});
