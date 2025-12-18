/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
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
    }
    else {
        output.appendLine('No workspace folders in this host');
    }
    output.show(true);
    context.subscriptions.push(output);
    // Also show a brief notification to guide the user
    vscode.window.showInformationMessage('VS Code - .NET Proj/Pack Switcher activated — check Output (VS Code - .NET Proj/Pack Switcher) or Developer Tools console for diagnostics.');
    // Register VS Code - .NET Proj/Pack Switcher commands and UI
    Promise.resolve().then(() => __importStar(__webpack_require__(2))).then(mod => mod.registerAddConfiguration(context));
    Promise.resolve().then(() => __importStar(__webpack_require__(3))).then(mod => mod.registerCreateProjpack(context));
    Promise.resolve().then(() => __importStar(__webpack_require__(4))).then(mod => mod.registerSwitchToProjectRef(context));
    Promise.resolve().then(() => __importStar(__webpack_require__(11))).then(mod => mod.registerSwitchToPackageRef(context));
    Promise.resolve().then(() => __importStar(__webpack_require__(12))).then(mod => mod.initStatusBar(context));
    // Register custom editor for .vscode/projpack.json
    Promise.resolve().then(() => __importStar(__webpack_require__(13))).then(mod => mod.registerProjpackEditor(context));
}
// This method is called when your extension is deactivated
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerAddConfiguration = registerAddConfiguration;
const vscode = __importStar(__webpack_require__(1));
function registerAddConfiguration(context) {
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
            if (!Array.isArray(json.configurations)) {
                json.configurations = [];
            }
            json.configurations.push({
                packageName: 'Example.Package.Test',
                packageVersion: '1.0.0',
                projectPath: 'path/to/project.csproj',
                PersistRefInSln: false,
                SlnFolder: 'Libraries',
                enabled: false
            });
            const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(text.length));
            const edit = new vscode.WorkspaceEdit();
            edit.replace(doc.uri, fullRange, JSON.stringify(json, null, 2));
            await vscode.workspace.applyEdit(edit);
            await doc.save();
            vscode.window.showInformationMessage('Configuration added.');
        }
        catch (err) {
            vscode.window.showErrorMessage(String(err));
        }
    });
    context.subscriptions.push(disposable);
}


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createProjpackJson = createProjpackJson;
exports.registerCreateProjpack = registerCreateProjpack;
const vscode = __importStar(__webpack_require__(1));
async function createProjpackJson() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder is open. Open a folder to create .vscode/projpack.json.');
        return;
    }
    const root = workspaceFolders[0].uri;
    const vscodeFolder = vscode.Uri.joinPath(root, '.vscode');
    const projpackUri = vscode.Uri.joinPath(vscodeFolder, 'projpack.json');
    try {
        // If projpack.json already exists, warn and do not overwrite
        try {
            await vscode.workspace.fs.stat(projpackUri);
            vscode.window.showWarningMessage('.vscode/projpack.json already exists.');
            return;
        }
        catch {
            // File not found — continue to create it
        }
        await vscode.workspace.fs.createDirectory(vscodeFolder);
        const initial = {
            solutionPath: '',
            configurations: [
                {
                    packageName: 'Example.Package.Test',
                    packageVersion: '1.0.0',
                    projectPath: 'path/to/project.csproj',
                    PersistRefInSln: false,
                    SlnFolder: 'Libraries',
                    enabled: false
                }
            ]
        };
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(projpackUri, encoder.encode(JSON.stringify(initial, null, 2)));
        const doc = await vscode.workspace.openTextDocument(projpackUri);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('.vscode/projpack.json created. Add configurations and save.');
    }
    catch (err) {
        vscode.window.showErrorMessage(`Failed to create projpack.json: ${err}`);
    }
}
function registerCreateProjpack(context) {
    context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.createProjpack', createProjpackJson));
}


/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.removeProjectFromSolution = exports.addProjectToSolution = void 0;
exports.switchToProjectRef = switchToProjectRef;
exports.registerSwitchToProjectRef = registerSwitchToProjectRef;
exports.replacePackageWithProjectLine = replacePackageWithProjectLine;
exports.applySwitchToProject = applySwitchToProject;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(5));
const projpack_1 = __webpack_require__(6);
const solutionUtils_1 = __webpack_require__(7);
async function switchToProjectRef() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Open a workspace first');
        return;
    }
    const root = workspaceFolders[0];
    const cfg = await (0, projpack_1.readProjpack)(root);
    if (!cfg) {
        vscode.window.showErrorMessage('No configuration found. Create .vscode/projpack.json first.');
        return;
    }
    const csprojUris = await (0, solutionUtils_1.findCsprojFilesFromSolution)(root, cfg.solutionPath);
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
                // ensure projects referenced by the replacement are present in the solution
                if (cfg.solutionPath) {
                    for (const conf of cfg.configurations) {
                        if (!conf.enabled || !conf.projectPath || !conf.packageName || !conf.packageVersion) {
                            continue;
                        }
                        try {
                            const slnFolder = conf.SlnFolder ?? conf.slnFolder;
                            // pass undefined for execFn (optional) and provide slnFolder as 5th arg
                            await (0, solutionUtils_1.addProjectToSolution)(root.uri.fsPath, cfg.solutionPath, conf.projectPath, undefined, slnFolder);
                        }
                        catch (err) {
                            vscode.window.showErrorMessage(`Failed to add project to solution: ${err}`);
                        }
                    }
                }
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to process ${cUri.path}: ${err}`);
        }
    }
    vscode.window.showInformationMessage(`Switch to Project Reference: processed ${processed} project(s).`);
}
var solutionUtils_2 = __webpack_require__(7);
Object.defineProperty(exports, "addProjectToSolution", ({ enumerable: true, get: function () { return solutionUtils_2.addProjectToSolution; } }));
Object.defineProperty(exports, "removeProjectFromSolution", ({ enumerable: true, get: function () { return solutionUtils_2.removeProjectFromSolution; } }));
function registerSwitchToProjectRef(context) {
    context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.switchToProjectRef', switchToProjectRef));
}
// exported for unit testing
function replacePackageWithProjectLine(xml, packageName, packageVersion, projectPath) {
    // preserve newline style
    const newline = xml.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
    const normalizedPath = projectPath.replace(/\//g, '\\');
    // helper to extract attributes and inner Version if present
    function extractAttrs(attrText, inner) {
        const includeMatch = attrText.match(/Include\s*=\s*['"]([^'"]+)['"]/);
        const versionAttr = attrText.match(/Version\s*=\s*['"]([^'"]+)['"]/i);
        const include = includeMatch ? includeMatch[1] : '';
        let version = versionAttr ? versionAttr[1] : '';
        if (!version && inner) {
            const innerVer = inner.match(/<Version>\s*([^<]+)\s*<\/Version>/i);
            if (innerVer) {
                version = innerVer[1];
            }
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
        if (m.trim().startsWith('<ProjectReference')) {
            return m;
        }
        const { include, version } = extractAttrs(attrs);
        if (include === packageName && version === packageVersion) {
            return `${indent}<ProjectReference Include="${normalizedPath}" />`;
        }
        return m;
    });
    return out;
}
function applySwitchToProject(xml, configurations, csprojDir, rootFsPath) {
    return configurations.reduce((acc, conf) => {
        if (!conf.enabled) {
            return acc;
        }
        if (!conf.packageName || !conf.projectPath || !conf.packageVersion) {
            return acc;
        }
        // if csprojDir and rootFsPath are provided, compute relative path from the csproj to the target project
        let projectPath = conf.projectPath;
        if (csprojDir && rootFsPath) {
            const targetAbs = path.resolve(rootFsPath, conf.projectPath);
            projectPath = path.relative(csprojDir, targetAbs);
        }
        return replacePackageWithProjectLine(acc, conf.packageName, conf.packageVersion, projectPath);
    }, xml);
}


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readProjpack = readProjpack;
exports.writeProjpack = writeProjpack;
const vscode = __importStar(__webpack_require__(1));
async function readProjpack(root) {
    const projpackUri = vscode.Uri.joinPath(root.uri, '.vscode', 'projpack.json');
    try {
        const raw = await vscode.workspace.fs.readFile(projpackUri);
        const text = new TextDecoder().decode(raw);
        const parsed = JSON.parse(text);
        return parsed;
    }
    catch (err) {
        return null;
    }
}
async function writeProjpack(root, config) {
    const projpackUri = vscode.Uri.joinPath(root.uri, '.vscode', 'projpack.json');
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(projpackUri, encoder.encode(JSON.stringify(config, null, 2)));
}


/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findCsprojFilesFromSolution = findCsprojFilesFromSolution;
exports.addProjectToSolution = addProjectToSolution;
exports.removeProjectFromSolution = removeProjectFromSolution;
const vscode = __importStar(__webpack_require__(1));
const child_process_1 = __webpack_require__(8);
const util = __importStar(__webpack_require__(9));
const path = __importStar(__webpack_require__(5));
const slnParser_1 = __webpack_require__(10);
const execFileAsync = util.promisify(child_process_1.execFile);
/**
 * Return all .csproj files referenced by the solution if solutionPath is provided,
 * otherwise fall back to workspace-wide search. Shows a warning if the solution
 * can't be read. (Was previously duplicated in two commands.)
 */
async function findCsprojFilesFromSolution(root, solutionPath) {
    if (solutionPath) {
        const sUri = vscode.Uri.joinPath(root.uri, solutionPath);
        try {
            const raw = await vscode.workspace.fs.readFile(sUri);
            const text = new TextDecoder().decode(raw);
            const projects = (0, slnParser_1.listProjectsFromSln)(text);
            return projects.map(p => {
                const segments = p.split(/[\\/]/);
                return vscode.Uri.joinPath(root.uri, ...segments);
            });
        }
        catch (err) {
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
async function addProjectToSolution(rootFsPath, solutionPath, projectPath, execFn, slnFolder) {
    if (!solutionPath) {
        return;
    }
    const slnAbs = path.resolve(rootFsPath, solutionPath);
    try {
        const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(slnAbs));
        const text = new TextDecoder().decode(raw);
        // compute project path relative to solution dir and absolute path to the project
        const projectAbs = path.resolve(rootFsPath, projectPath);
        const projectRel = path.relative(path.dirname(slnAbs), projectAbs).replace(/\\/g, '/');
        const filename = path.basename(projectAbs);
        // if already referenced in sln, do nothing
        if (text.indexOf(filename) !== -1 || text.indexOf(projectRel) !== -1) {
            return;
        }
        // verify project file exists to give a clearer error early
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(projectAbs));
        }
        catch (err) {
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
        }
        catch (err) {
            vscode.window.showWarningMessage(`Failed to add project ${projectRel} to solution ${solutionPath}: ${err}`);
            throw err;
        }
    }
    catch (err) {
        // bubble up after warning where appropriate
        throw err;
    }
}
/**
 * Remove project from solution. If the project is not present in the solution file,
 * nothing is done. Failures invoking dotnet are warned about and rethrown.
 */
async function removeProjectFromSolution(rootFsPath, solutionPath, projectPath, execFn) {
    if (!solutionPath) {
        return;
    }
    const slnAbs = path.resolve(rootFsPath, solutionPath);
    try {
        const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(slnAbs));
        const text = new TextDecoder().decode(raw);
        const projectAbs = path.resolve(rootFsPath, projectPath);
        const projectRel = path.relative(path.dirname(slnAbs), projectAbs).replace(/\\/g, '/');
        const filename = path.basename(projectAbs);
        // if not present, nothing to do
        if (text.indexOf(filename) === -1 && text.indexOf(projectRel) === -1) {
            return;
        }
        // If project file exists, prefer using absolute path; otherwise fall back to relative path
        const run = execFn ?? (async (c, a) => { await execFileAsync(c, a, { cwd: path.dirname(slnAbs) }); });
        // Try to stat the project file to verify existence
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(projectAbs));
            // use absolute path to remove
            try {
                await run('dotnet', ['sln', slnAbs, 'remove', projectAbs]);
            }
            catch (err) {
                // fallback to relative path if absolute removal failed
                try {
                    await run('dotnet', ['sln', slnAbs, 'remove', projectRel]);
                }
                catch (err2) {
                    vscode.window.showWarningMessage(`Failed to remove project ${projectRel} from solution ${solutionPath}: ${err2}`);
                    throw err2;
                }
            }
        }
        catch (statErr) {
            // project file missing on disk — attempt remove with relative path
            try {
                await run('dotnet', ['sln', slnAbs, 'remove', projectRel]);
            }
            catch (err) {
                vscode.window.showWarningMessage(`Failed to remove project ${projectRel} from solution ${solutionPath}: ${err}`);
                throw err;
            }
        }
        vscode.window.showInformationMessage(`Removed project ${projectRel} from solution ${solutionPath}`);
    }
    catch (err) {
        throw err;
    }
}


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.listProjectsFromSln = listProjectsFromSln;
function listProjectsFromSln(text) {
    const re = /Project\([^)]*\) = "[^"]+", "([^"]+\.csproj)"/gmi;
    const matches = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        matches.push(m[1]);
    }
    return matches;
}


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.removeProjectFromSolution = void 0;
exports.switchToPackageRef = switchToPackageRef;
exports.registerSwitchToPackageRef = registerSwitchToPackageRef;
exports.replaceProjectWithPackageLine = replaceProjectWithPackageLine;
exports.applySwitchToPackage = applySwitchToPackage;
exports.shouldRemoveProjectFromSolution = shouldRemoveProjectFromSolution;
const vscode = __importStar(__webpack_require__(1));
const projpack_1 = __webpack_require__(6);
const solutionUtils_1 = __webpack_require__(7);
const path = __importStar(__webpack_require__(5));
function pathToPattern(p) {
    return p.split(/[\\/]/).map(seg => seg.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('[\\\\/]');
}
// findCsprojFilesFromSolution moved to `src/utils/solutionUtils.ts` (keeps behavior and adds warnings on failure)
async function switchToPackageRef() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Open a workspace first');
        return;
    }
    const root = workspaceFolders[0];
    const cfg = await (0, projpack_1.readProjpack)(root);
    if (!cfg) {
        vscode.window.showErrorMessage('No configuration found. Create .vscode/projpack.json first.');
        return;
    }
    const csprojUris = await (0, solutionUtils_1.findCsprojFilesFromSolution)(root, cfg.solutionPath);
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
                // if solution is configured, remove projects corresponding to replaced items from the solution
                if (cfg.solutionPath) {
                    for (const conf of cfg.configurations) {
                        if (!conf.enabled || !conf.projectPath || !conf.packageName) {
                            continue;
                        }
                        // respect PersistRefInSln configuration (support PascalCase and camelCase)
                        const persist = conf.PersistRefInSln ?? conf.persistRefInSln ?? false;
                        if (persist) {
                            continue;
                        }
                        try {
                            await (0, solutionUtils_1.removeProjectFromSolution)(root.uri.fsPath, cfg.solutionPath, conf.projectPath);
                        }
                        catch (err) {
                            vscode.window.showErrorMessage(`Failed to remove project from solution: ${err}`);
                        }
                    }
                }
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to process ${cUri.path}: ${err}`);
        }
    }
    vscode.window.showInformationMessage(`Switch to Package Reference: processed ${processed} project(s).`);
}
function registerSwitchToPackageRef(context) {
    context.subscriptions.push(vscode.commands.registerCommand('vscode-dotnet-proj-pack-switcher.switchToPackageRef', switchToPackageRef));
}
// exported for unit testing
function replaceProjectWithPackageLine(xml, projectPath, packageName, packageVersion) {
    const newline = xml.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
    const csprojName = path.basename(projectPath);
    const pkgInclude = (name, version) => version ? `<PackageReference Include="${name}" Version="${version}" />` : `<PackageReference Include="${name}" />`;
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
        if (m.trim().startsWith('<PackageReference')) {
            return m;
        }
        const includeMatch = attrs.match(/Include\s*=\s*['"]([^'"]+)['"]/);
        const include = includeMatch ? includeMatch[1] : '';
        if (include && include.indexOf(csprojName) !== -1) {
            return `${indent}${pkgInclude(packageName, packageVersion)}`;
        }
        return m;
    });
    return out;
}
function applySwitchToPackage(xml, configurations) {
    return configurations.reduce((acc, conf) => {
        if (!conf.enabled) {
            return acc;
        }
        if (!conf.packageName || !conf.projectPath) {
            return acc;
        }
        return replaceProjectWithPackageLine(acc, conf.projectPath, conf.packageName, conf.packageVersion);
    }, xml);
}
// exported helper used by switchToPackageRef to decide whether to remove the project from the solution
function shouldRemoveProjectFromSolution(conf) {
    return !(conf.PersistRefInSln ?? conf.persistRefInSln ?? false);
}
var solutionUtils_2 = __webpack_require__(7);
Object.defineProperty(exports, "removeProjectFromSolution", ({ enumerable: true, get: function () { return solutionUtils_2.removeProjectFromSolution; } }));


/***/ }),
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initStatusBar = initStatusBar;
const vscode = __importStar(__webpack_require__(1));
function initStatusBar(context) {
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    status.text = 'ProjPack';
    status.tooltip = 'VS Code - .NET Proj/Pack Switcher: Click to switch reference type';
    status.command = 'workbench.action.showCommands';
    status.show();
    context.subscriptions.push(status);
}


/***/ }),
/* 13 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjpackEditor = void 0;
exports.registerProjpackEditor = registerProjpackEditor;
const vscode = __importStar(__webpack_require__(1));
class ProjpackEditor {
    context;
    static register(context) {
        const provider = new ProjpackEditor(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(ProjpackEditor.viewType, provider, { supportsMultipleEditorsPerDocument: false });
        context.subscriptions.push(providerRegistration);
    }
    static viewType = 'vscode-dotnet-proj-pack-switcher.projpackEditor';
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
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
    async addConfigurationToDocument(document) {
        try {
            const text = document.getText();
            const json = text ? JSON.parse(text) : {};
            if (!Array.isArray(json.configurations)) {
                json.configurations = [];
            }
            json.configurations.push({ name: 'New configuration' });
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, JSON.stringify(json, null, 2));
            await vscode.workspace.applyEdit(edit);
            await document.save();
            vscode.window.showInformationMessage('Configuration added.');
        }
        catch (err) {
            vscode.window.showErrorMessage(String(err));
        }
    }
    getHtmlForWebview(webview) {
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
exports.ProjpackEditor = ProjpackEditor;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function registerProjpackEditor(context) {
    ProjpackEditor.register(context);
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map