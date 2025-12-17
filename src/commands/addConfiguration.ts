import * as vscode from 'vscode';

export function registerAddConfiguration(context: vscode.ExtensionContext) {
    // Command to add configuration to .vscode/projpack.json (works when file open or focused)
    const disposable = vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.projpack.addConfiguration', async () => {
        const ed = vscode.window.activeTextEditor;
        if (!ed || !ed.document.uri.fsPath.endsWith('.vscode/projpack.json')) {
            vscode.window.showWarningMessage('Open .vscode/projpack.json to add a configuration.');
            return;
        }
        try {
            const doc = ed.document;
            const text = doc.getText();
            const json = text ? JSON.parse(text) : {};
            if (!Array.isArray(json.configurations)) { json.configurations = []; }
            json.configurations.push({
                packageName: 'Example.Package.Test',
                packageVersion: '1.0.0',
                projectPath: 'path/to/project.csproj',
                enabled: false
            });

            const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(text.length));
            const edit = new vscode.WorkspaceEdit();
            edit.replace(doc.uri, fullRange, JSON.stringify(json, null, 2));
            await vscode.workspace.applyEdit(edit);
            await doc.save();
            vscode.window.showInformationMessage('Configuration added.');
        } catch (err) {
            vscode.window.showErrorMessage(String(err));
        }
    });
    context.subscriptions.push(disposable);
}
