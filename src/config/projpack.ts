import * as vscode from 'vscode';

export type ProjPackConfig = {
  solutionPath: string;
  configurations: Array<{
    packageName: string;
    packageVersion?: string;
    projectPath?: string;
    enabled?: boolean;
    // new options
    PersistRefInSln?: boolean; // when true, do not remove project from solution when switching back to package refs
    SlnFolder?: string; // optional solution folder to add the project into
  }>;
};

export async function readProjpack(root: vscode.WorkspaceFolder): Promise<ProjPackConfig | null> {
  const projpackUri = vscode.Uri.joinPath(root.uri, '.vscode', 'projpack.json');
  try {
    const raw = await vscode.workspace.fs.readFile(projpackUri);
    const text = new TextDecoder().decode(raw);
    const parsed = JSON.parse(text) as ProjPackConfig;
    return parsed;
  } catch (err) {
    return null;
  }
}

export async function writeProjpack(root: vscode.WorkspaceFolder, config: ProjPackConfig): Promise<void> {
  const projpackUri = vscode.Uri.joinPath(root.uri, '.vscode', 'projpack.json');
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(projpackUri, encoder.encode(JSON.stringify(config, null, 2)));
}
