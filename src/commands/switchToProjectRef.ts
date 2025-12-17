import * as vscode from 'vscode';
import * as path from 'path';
import { readProjpack } from '../config/projpack';
import { listProjectsFromSln } from '../parsers/slnParser';


async function findCsprojFilesFromSolution(root: vscode.WorkspaceFolder, solutionPath?: string): Promise<vscode.Uri[]> {
  if (solutionPath) {
    const sUri = vscode.Uri.joinPath(root.uri, solutionPath);
    try {
      const raw = await vscode.workspace.fs.readFile(sUri);
      const text = new TextDecoder().decode(raw);
      const projects = listProjectsFromSln(text);
      return projects.map(p => {
        const segments = p.split(/[\\/]/);
        return vscode.Uri.joinPath(root.uri, ...segments);
      });
    } catch (err) {
      return [];
    }
  }
  // fallback: find all csproj files in workspace root
  const matches = await vscode.workspace.findFiles('**/*.csproj', '**/bin/**');
  return matches;
}

export async function switchToProjectRef(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Open a workspace first');
    return;
  }
  const root = workspaceFolders[0];
  const cfg = await readProjpack(root);
  if (!cfg) {
    vscode.window.showErrorMessage('No configuration found. Create .vscode/projpack.json first.');
    return;
  }

  const csprojUris = await findCsprojFilesFromSolution(root, cfg.solutionPath);
  if (!csprojUris || csprojUris.length === 0) {
    vscode.window.showErrorMessage('No .csproj files found in workspace or solution.');
    return;
  }

  let processed = 0;
  for (const cUri of csprojUris) {
    try {
      const raw = await vscode.workspace.fs.readFile(cUri);
      const xml = new TextDecoder().decode(raw);
      // compute csproj dir and pass it so project paths can be made relative to the csproj file
      const csprojDir = path.dirname(cUri.fsPath);
      const updated = applySwitchToProject(xml, cfg.configurations, csprojDir, root.uri.fsPath);
      if (updated !== xml) {
        await vscode.workspace.fs.writeFile(cUri, new TextEncoder().encode(updated));
        processed++;
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to process ${cUri.path}: ${err}`);
    }
  }
  vscode.window.showInformationMessage(`Switch to Project Reference: processed ${processed} project(s).`);
}

export function registerSwitchToProjectRef(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.switchToProjectRef', switchToProjectRef));
}

// exported for unit testing
export function replacePackageWithProjectLine(xml: string, packageName: string, packageVersion: string, projectPath: string): string {
  // preserve newline style
  const newline = xml.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const normalizedPath = projectPath.replace(/\//g, '\\');

  // helper to extract attributes and inner Version if present
  function extractAttrs(attrText: string, inner?: string) {
    const includeMatch = attrText.match(/Include\s*=\s*['"]([^'"]+)['"]/);
    const versionAttr = attrText.match(/Version\s*=\s*['"]([^'"]+)['"]/i);
    const include = includeMatch ? includeMatch[1] : '';
    let version = versionAttr ? versionAttr[1] : '';
    if (!version && inner) {
      const innerVer = inner.match(/<Version>\s*([^<]+)\s*<\/Version>/i);
      if (innerVer) { version = innerVer[1]; }
    }
    return { include, version };
  }

  // replace expanded form first
  let out = xml.replace(/(^[ \t]*)<PackageReference\b([^>]*)>([\s\S]*?)<\/PackageReference>/gmi, (m, indent, attrs, inner) => {
    const { include, version } = extractAttrs(attrs, inner);
    if (include === packageName && version === packageVersion) {
      return `${indent}<ProjectReference Include="${normalizedPath}" />`;
    }
    return m;
  });

  // then replace self-closing form
  out = out.replace(/(^[ \t]*)<PackageReference\b([^>]*)\/?>/gmi, (m, indent, attrs) => {
    // skip if this was already replaced above (ProjectReference)
    if (m.trim().startsWith('<ProjectReference')) { return m; }
    const { include, version } = extractAttrs(attrs);
    if (include === packageName && version === packageVersion) {
      return `${indent}<ProjectReference Include="${normalizedPath}" />`;
    }
    return m;
  });

  return out;
}

export function applySwitchToProject(
  xml: string,
  configurations: Array<{ packageName: string; packageVersion?: string; projectPath?: string; enabled?: boolean }>,
  csprojDir?: string,
  rootFsPath?: string
): string {
  return configurations.reduce((acc, conf) => {
    if (!conf.enabled) { return acc; }
    if (!conf.packageName || !conf.projectPath || !conf.packageVersion) { return acc; }

    // if csprojDir and rootFsPath are provided, compute relative path from the csproj to the target project
    let projectPath = conf.projectPath!;
    if (csprojDir && rootFsPath) {
      const targetAbs = path.resolve(rootFsPath, conf.projectPath!);
      projectPath = path.relative(csprojDir, targetAbs);
    }

    return replacePackageWithProjectLine(acc, conf.packageName, conf.packageVersion!, projectPath);
  }, xml);
}
