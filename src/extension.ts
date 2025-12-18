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

	// Register VS Code - .NET Proj/Pack Switcher commands and UI
	import('./commands/addConfiguration').then(mod => mod.registerAddConfiguration(context));
	import('./commands/createProjpack').then(mod => mod.registerCreateProjpack(context));
	import('./commands/switchToProjectRef').then(mod => mod.registerSwitchToProjectRef(context));
	import('./commands/switchToPackageRef').then(mod => mod.registerSwitchToPackageRef(context));
	import('./ui/status').then(mod => mod.initStatusBar(context));

}

// This method is called when your extension is deactivated
export function deactivate() { }
