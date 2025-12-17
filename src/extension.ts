// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-dotnet-proj-pack-switcher" is now active!');
	console.log('[VS Code - .NET Proj/Pack Switcher] activate called');

	// Diagnostic output: write argv and opened workspace folders to an Output channel
	const output = vscode.window.createOutputChannel('VS Code - .NET Proj/Pack Switcher');
	output.appendLine(`process.argv: ${process.argv.join(' ')}`);
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		output.appendLine('Workspace folders:');
		for (const wf of vscode.workspace.workspaceFolders) {
			output.appendLine(` - ${wf.uri.toString()}`);
		}
	} else {
		output.appendLine('No workspace folders in this host');
	}
	output.show(true);
	context.subscriptions.push(output);

	// Also show a brief notification to guide the user
	vscode.window.showInformationMessage('VS Code - .NET Proj/Pack Switcher activated — check Output (VS Code - .NET Proj/Pack Switcher) or Developer Tools console for diagnostics.');

	// Register existing sample command
	const disposable = vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from VS Code - .NET Proj/Pack Switcher!');
	});
	context.subscriptions.push(disposable);

	// Command to add configuration to projpack.json (works when file open or focused)
	const addConfigCmd = vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.projpack.addConfiguration', async () => {
		const ed = vscode.window.activeTextEditor;
		if (!ed || !ed.document.uri.fsPath.endsWith('.vscode/projpack.json')) {
			vscode.window.showWarningMessage('Open .vscode/projpack.json to add a configuration.');
			return;
		}
		try {
			const doc = ed.document;
			const text = doc.getText();
			const json = text ? JSON.parse(text) : {};
			if (!Array.isArray(json.configurations)) json.configurations = [];
			json.configurations.push({ name: 'New configuration' });

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
	context.subscriptions.push(addConfigCmd);

	// Register VS Code - .NET Proj/Pack Switcher commands and UI
	import('./commands/createProjpack').then(mod => mod.registerCreateProjpack(context));
	import('./commands/switchToProjectRef').then(mod => mod.registerSwitchToProjectRef(context));
	import('./commands/switchToPackageRef').then(mod => mod.registerSwitchToPackageRef(context));
	import('./ui/status').then(mod => mod.initStatusBar(context));
	// Register custom editor for .vscode/projpack.json
	import('./customEditors/projpackEditor').then(mod => mod.registerProjpackEditor(context));

}

// This method is called when your extension is deactivated
export function deactivate() {}
