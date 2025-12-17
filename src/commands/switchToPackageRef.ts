import * as vscode from 'vscode';
import { readProjpack } from '../config/projpack';
import { listProjectsFromSln } from '../parsers/slnParser';

import * as path from 'path';

function pathToPattern(p: string): string {
  return p.split(/[\\/]/).map(seg => seg.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('[\\\\/]');
}

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

export async function switchToPackageRef(): Promise<void> {
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
      const updated = applySwitchToPackage(xml, cfg.configurations);
      if (updated !== xml) {
        await vscode.workspace.fs.writeFile(cUri, new TextEncoder().encode(updated));
        processed++;
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to process ${cUri.path}: ${err}`);
    }
  }
  vscode.window.showInformationMessage(`Switch to Package Reference: processed ${processed} project(s).`);
}

export function registerSwitchToPackageRef(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.switchToPackageRef', switchToPackageRef));
}

// exported for unit testing
export function replaceProjectWithPackageLine(xml: string, projectPath: string, packageName: string, packageVersion?: string): string {
  const newline = xml.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const csprojName = path.basename(projectPath);
  const pkgInclude = (name: string, version?: string) => version ? `<PackageReference Include="${name}" Version="${version}" />` : `<PackageReference Include="${name}" />`;

  // match expanded ProjectReference
  let out = xml.replace(/(^[ \t]*)<ProjectReference\b([^>]*)>([\s\S]*?)<\/ProjectReference>/gmi, (m, indent, attrs, inner) => {
    const includeMatch = attrs.match(/Include\s*=\s*['"]([^'"]+)['"]/);
    const include = includeMatch ? includeMatch[1] : '';
    if (include && include.indexOf(csprojName) !== -1) {
      return `${indent}${pkgInclude(packageName, packageVersion)}`;
    }
    return m;
  });

  // match self-closing ProjectReference
  out = out.replace(/(^[ \t]*)<ProjectReference\b([^>]*)\/?\>/gmi, (m, indent, attrs) => {
    // if already replaced above, skip
    if (m.trim().startsWith('<PackageReference')) { return m; }
    const includeMatch = attrs.match(/Include\s*=\s*['"]([^'"]+)['"]/);
    const include = includeMatch ? includeMatch[1] : '';
    if (include && include.indexOf(csprojName) !== -1) {
      return `${indent}${pkgInclude(packageName, packageVersion)}`;
    }
    return m;
  });

  return out;
}

export function applySwitchToPackage(xml: string, configurations: Array<{ packageName: string; packageVersion?: string; projectPath?: string; enabled?: boolean }>): string {
  return configurations.reduce((acc, conf) => {
    if (!conf.enabled) { return acc; }
    if (!conf.packageName || !conf.projectPath) { return acc; }
    return replaceProjectWithPackageLine(acc, conf.projectPath!, conf.packageName, conf.packageVersion);
  }, xml);
}
