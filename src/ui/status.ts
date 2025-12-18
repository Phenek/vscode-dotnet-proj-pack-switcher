import * as vscode from 'vscode';
import * as path from 'path';
import { readProjpack } from '../config/projpack';
import { findCsprojFilesFromSolution } from '../utils/solutionUtils';

export function initStatusBar(context: vscode.ExtensionContext) {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(status);

  // register command shown when the status item is clicked
  context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.chooseMode', async () => {
    const pick = await vscode.window.showQuickPick(['Project Mode', 'Package Mode'], { placeHolder: 'Switch reference type for configured items' });
    if (!pick) { return; }
    if (pick === 'Project Mode') {
      await vscode.commands.executeCommand('vscode-dotnet-proj-pack-switcher.switchToProjectRef');
    } else {
      await vscode.commands.executeCommand('vscode-dotnet-proj-pack-switcher.switchToPackageRef');
    }
    // update status after a switch
    scheduleUpdate();
  }));

  status.command = 'vscode-dotnet-proj-pack-switcher.chooseMode';
  status.show();

  // watchers to keep the status updated when relevant files change
  const csprojWatcher = vscode.workspace.createFileSystemWatcher('**/*.csproj');
  const projpackWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode/projpack.json');
  context.subscriptions.push(csprojWatcher, projpackWatcher);

  csprojWatcher.onDidChange(() => scheduleUpdate());
  csprojWatcher.onDidCreate(() => scheduleUpdate());
  csprojWatcher.onDidDelete(() => scheduleUpdate());
  projpackWatcher.onDidChange(() => scheduleUpdate());
  projpackWatcher.onDidCreate(() => scheduleUpdate());
  projpackWatcher.onDidDelete(() => scheduleUpdate());

  // per-file watchers for csproj files returned by findCsprojFilesFromSolution
  const perFileWatchers = new Map<string, vscode.FileSystemWatcher>();

  function updateCsprojFileWatchers(wf: vscode.WorkspaceFolder, uris: vscode.Uri[]) {
    const wanted = new Set(uris.map(u => path.normalize(u.fsPath)));

    // remove watchers no longer needed
    for (const key of Array.from(perFileWatchers.keys())) {
      if (!wanted.has(key)) {
        const w = perFileWatchers.get(key);
        w?.dispose();
        perFileWatchers.delete(key);
      }
    }

    // add missing watchers
    for (const fsPath of wanted) {
      if (perFileWatchers.has(fsPath)) { continue; }
      const rel = path.relative(wf.uri.fsPath, fsPath);
      if (rel.startsWith('..')) { continue; } // safety: only watch inside workspace
      const pattern = new vscode.RelativePattern(wf, rel);
      const w = vscode.workspace.createFileSystemWatcher(pattern);
      w.onDidChange(() => scheduleUpdate());
      w.onDidCreate(() => scheduleUpdate());
      w.onDidDelete(() => scheduleUpdate());
      context.subscriptions.push(w);
      perFileWatchers.set(fsPath, w);
    }
  }

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.fileName.endsWith('.csproj') || doc.fileName.endsWith('projpack.json')) { scheduleUpdate(); }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeWorkspaceFolders(() => scheduleUpdate(), null, context.subscriptions);

  // debounce helper
  let timer: any = undefined;
  function scheduleUpdate(delay = 200) {
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(() => { updateStatus(); timer = undefined; }, delay);
  }

  // initial update
  scheduleUpdate(0);

  async function updateStatus() {
    status.tooltip = 'VS Code - .NET Proj/Pack Switcher: Click to switch reference type';
    status.text = 'ProjPack';
    try {
      const wf = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
      if (!wf) { status.text = '<Pack../>'; return; }

      const cfg = await readProjpack(wf);
      if (!cfg) { status.text = '<Pack../>'; return; }

      const enabled = (cfg.configurations || []).filter(c => (c as any).enabled);
      if (!enabled || enabled.length === 0) { status.text = '<Pack../>'; return; }

      const csprojUris = await findCsprojFilesFromSolution(wf, cfg.solutionPath);

      // ensure we watch the solution-related csproj files so status updates when they change
      updateCsprojFileWatchers(wf, csprojUris);

      const csprojContents = await Promise.all(csprojUris.map(async u => {
        try { const raw = await vscode.workspace.fs.readFile(u); return new TextDecoder().decode(raw); } catch { return ''; }
      }));

      // Compute per-config status (package / project / mixed / absent)
      let projectCount = 0, packageCount = 0, absentCount = 0, mixedCount = 0;

      for (const conf of enabled) {
        const pname = conf.packageName;
        const projPath = conf.projectPath || '';
        const csprojName = path.basename(projPath);

        let foundProject = false, foundPackage = false;
        for (const xml of csprojContents) {
          if (!xml) { continue; }
          if (csprojName && new RegExp(`<ProjectReference\\b[^>]*Include\\s*=\\s*["'][^"']*${escapeRegExp(csprojName)}[^"']*["']`, 'i').test(xml)) {
            foundProject = true;
          }
          if (pname && new RegExp(`<PackageReference\\b[^>]*Include\\s*=\\s*["']${escapeRegExp(pname)}["']`, 'i').test(xml)) {
            foundPackage = true;
          }
        }

        if (foundProject && !foundPackage) { 
          projectCount++; 
        }
        else if (foundPackage && !foundProject) { 
          packageCount++; 
        }
        else if (foundPackage && foundProject) { 
          mixedCount++; 
        }
        else { absentCount++; }
      }

      // Decide overall state with clear priority:
      // - if any config is mixed -> Mix
      // - else if any config is package-only -> Pack
      // - else if any config is project-only -> Proj
      // - otherwise default to Pack
      let state: 'pack' | 'proj' | 'mix' = 'pack';
      if (mixedCount > 0 || (packageCount > 0 && projectCount > 0)) { state = 'mix'; }
      else if (packageCount > 0) { state = 'pack'; }
      else if (projectCount > 0) { state = 'proj'; }
      else { state = 'pack'; }

      if (state === 'pack') { status.text = '<Pack../>'; }
      else if (state === 'proj') { status.text = '<Proj.../>'; }
      else { status.text = '<Mix..../>'; }

      status.tooltip += ` (${packageCount} package-only, ${projectCount} project-only, ${mixedCount} mixed, ${absentCount} absent)`;
    } catch (err) {
      status.text = '<Mix..../>';
      status.tooltip = `Error checking state: ${err}`;
    }
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

