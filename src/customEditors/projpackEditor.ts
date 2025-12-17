import * as vscode from 'vscode';

export class ProjpackEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext) {
    const provider = new ProjpackEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ProjpackEditor.viewType,
      provider,
      { supportsMultipleEditorsPerDocument: false }
    );
    context.subscriptions.push(providerRegistration);
  }

  private static readonly viewType = 'vscode-dotnet-proj-pack-switcher.projpackEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };

    // Setup initial content in the webview
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Send initial document text
    const updateWebview = () => {
      webviewPanel.webview.postMessage({ type: 'init', text: document.getText() });
    };

    // Respond to messages from the webview
    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.command === 'addConfiguration') {
        await this.addConfigurationToDocument(document);
        updateWebview();
      }
    });

    // Update when the document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Initial sync
    updateWebview();
  }

  private async addConfigurationToDocument(document: vscode.TextDocument) {
    try {
      const text = document.getText();
      const json = text ? JSON.parse(text) : {};
      if (!Array.isArray(json.configurations)) json.configurations = [];
      json.configurations.push({ name: 'New configuration' });

      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, JSON.stringify(json, null, 2));
      await vscode.workspace.applyEdit(edit);
      await document.save();
      vscode.window.showInformationMessage('Configuration added.');
    } catch (err) {
      vscode.window.showErrorMessage(String(err));
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    // Simple UI: show file content and a floating blue button bottom-right
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: var(--vscode-editor-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); margin:0; padding:1rem; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
    .button { position: fixed; right: 20px; bottom: 20px; background: #007acc; color: white; border: none; padding: 12px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .button:active { transform: translateY(1px); }
  </style>
</head>
<body>
  <pre id="content">Loading…</pre>
  <button class="button" id="add">+ Add configuration</button>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const content = document.getElementById('content');
    const btn = document.getElementById('add');
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg?.type === 'init') {
        content.textContent = msg.text || '';
      }
    });
    btn.addEventListener('click', () => {
      vscode.postMessage({ command: 'addConfiguration' });
    });
  </script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

export function registerProjpackEditor(context: vscode.ExtensionContext) {
  ProjpackEditor.register(context);
}
