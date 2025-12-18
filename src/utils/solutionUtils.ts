import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import { listProjectsFromSln } from '../parsers/slnParser';

const execFileAsync = util.promisify(execFile);

export type ExecFn = (cmd: string, args: string[]) => Promise<void>;

/**
 * Return all .csproj files referenced by the solution if solutionPath is provided,
 * otherwise fall back to workspace-wide search. Shows a warning if the solution
 * can't be read. (Was previously duplicated in two commands.)
 */
export async function findCsprojFilesFromSolution(root: vscode.WorkspaceFolder, solutionPath?: string): Promise<vscode.Uri[]> {
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
      vscode.window.showWarningMessage(`Could not read solution '${solutionPath}': ${err}`);
      return [];
    }
  }
  // fallback: find all csproj files in workspace root
  const matches = await vscode.workspace.findFiles('**/*.csproj', '**/bin/**');
  return matches;
}

/**
 * Add project to solution, using absolute path. Throws when the project file is missing.
 * Shows warnings on failures while invoking dotnet but rethrows the error so callers
 * can decide how to handle it.
 */
export async function addProjectToSolution(rootFsPath: string, solutionPath: string | undefined, projectPath: string, execFn?: ExecFn, slnFolder?: string): Promise<void> {
  if (!solutionPath) { return; }
  const slnAbs = path.resolve(rootFsPath, solutionPath);
  try {
    const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(slnAbs));
    const text = new TextDecoder().decode(raw);

    // compute project path relative to solution dir and absolute path to the project
    const projectAbs = path.resolve(rootFsPath, projectPath);
    const projectRel = path.relative(path.dirname(slnAbs), projectAbs).replace(/\\/g, '/');
    const filename = path.basename(projectAbs);

    // if already referenced in sln, do nothing
    if (text.indexOf(filename) !== -1 || text.indexOf(projectRel) !== -1) { return; }

    // verify project file exists to give a clearer error early
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(projectAbs));
    } catch (err) {
      vscode.window.showWarningMessage(`Project file not found: ${projectAbs}`);
      throw new Error(`Project file not found: ${projectAbs}`);
    }

    // ensure dotnet runs with solution folder as cwd so relative paths resolve correctly
    const run = execFn ?? (async (c, a) => { await execFileAsync(c, a, { cwd: path.dirname(slnAbs) }); });
    // use absolute path for the project to avoid relative path resolution issues
    const args = ['sln', slnAbs, 'add', projectAbs];
    if (slnFolder) {
      args.push('--solution-folder', slnFolder);
    }

    try {
      await run('dotnet', args);
      vscode.window.showInformationMessage(`Added project ${projectRel} to solution ${solutionPath}`);
    } catch (err) {
      vscode.window.showWarningMessage(`Failed to add project ${projectRel} to solution ${solutionPath}: ${err}`);
      throw err;
    }
  } catch (err) {
    // bubble up after warning where appropriate
    throw err;
  }
}

/**
 * Remove project from solution. If the project is not present in the solution file,
 * nothing is done. Failures invoking dotnet are warned about and rethrown.
 */
export async function removeProjectFromSolution(rootFsPath: string, solutionPath: string | undefined, projectPath: string, execFn?: ExecFn): Promise<void> {
  if (!solutionPath) { return; }
  const slnAbs = path.resolve(rootFsPath, solutionPath);
  try {
    const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(slnAbs));
    const text = new TextDecoder().decode(raw);

    const projectAbs = path.resolve(rootFsPath, projectPath);
    const projectRel = path.relative(path.dirname(slnAbs), projectAbs).replace(/\\/g, '/');
    const filename = path.basename(projectAbs);

    // if not present, nothing to do
    if (text.indexOf(filename) === -1 && text.indexOf(projectRel) === -1) { return; }

    // If project file exists, prefer using absolute path; otherwise fall back to relative path
    const run = execFn ?? (async (c, a) => { await execFileAsync(c, a, { cwd: path.dirname(slnAbs) }); });

    // Try to stat the project file to verify existence
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(projectAbs));
      // use absolute path to remove
      try {
        await run('dotnet', ['sln', slnAbs, 'remove', projectAbs]);
      } catch (err) {
        // fallback to relative path if absolute removal failed
        try {
          await run('dotnet', ['sln', slnAbs, 'remove', projectRel]);
        } catch (err2) {
          vscode.window.showWarningMessage(`Failed to remove project ${projectRel} from solution ${solutionPath}: ${err2}`);
          throw err2;
        }
      }
    } catch (statErr) {
      // project file missing on disk — attempt remove with relative path
      try {
        await run('dotnet', ['sln', slnAbs, 'remove', projectRel]);
      } catch (err) {
        vscode.window.showWarningMessage(`Failed to remove project ${projectRel} from solution ${solutionPath}: ${err}`);
        throw err;
      }
    }

    vscode.window.showInformationMessage(`Removed project ${projectRel} from solution ${solutionPath}`);
  } catch (err) {
    throw err;
  }
}
