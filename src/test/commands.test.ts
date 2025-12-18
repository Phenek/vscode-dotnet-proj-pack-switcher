import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { replacePackageWithProjectLine, applySwitchToProject } from '../commands/switchToProjectRef';
import { replaceProjectWithPackageLine, applySwitchToPackage } from '../commands/switchToPackageRef';

suite('commands - exact line replacements', () => {
  test('replacePackageWithProjectLine replaces exact package line with project reference', () => {
    const xml = '<ItemGroup>\n  <PackageReference Include="Project.Core.Test" Version="1.2.27" />\n</ItemGroup>';
    const out = replacePackageWithProjectLine(xml, 'Project.Core.Test', '1.2.27', '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj');
    // projectPath should be normalized to backslashes in the Include attribute
    assert.ok(out.indexOf('<ProjectReference Include="..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj"') !== -1);
    assert.strictEqual(out.indexOf('PackageReference'), -1);
  });

  test('replaceProjectWithPackageLine replaces exact project line with package reference including version', () => {
    const xml = '<ItemGroup>\n  <ProjectReference Include="../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj" />\n</ItemGroup>';
    const out = replaceProjectWithPackageLine(xml, '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj', 'Project.Core.Test', '1.2.27');
    assert.ok(out.indexOf('<PackageReference Include="Project.Core.Test" Version="1.2.27" />') !== -1);
    assert.strictEqual(out.indexOf('ProjectReference'), -1);
  });

  test('replaceProjectWithPackageLine matches backslash project path', () => {
    const xml = '<ItemGroup>\n  <ProjectReference Include="..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj" />\n</ItemGroup>';
    const out = replaceProjectWithPackageLine(xml, '..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj', 'Project.Core.Test', '1.2.27');
    assert.ok(out.indexOf('<PackageReference Include="Project.Core.Test" Version="1.2.27" />') !== -1);
    assert.strictEqual(out.indexOf('ProjectReference'), -1);
  });
  test('replaceProjectWithPackageLine matches ProjectReference with additional attributes and different order', () => {
    const xml1 = '<ItemGroup>\n  <ProjectReference Condition="$(Configuration) == Debug" Include="..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj" PrivateAssets="All" />\n</ItemGroup>';
    const out1 = replaceProjectWithPackageLine(xml1, '..\\\\..\\\\..\\\\Project-Core\\\\backend\\\\Project.Core.Test\\\\Project.Core.Test.csproj', 'Project.Core.Test', '1.2.27');
    assert.ok(out1.indexOf('<PackageReference Include="Project.Core.Test" Version="1.2.27" />') !== -1);
    assert.strictEqual(out1.indexOf('ProjectReference'), -1);

    const xml2 = '<ItemGroup>\\n  <ProjectReference PrivateAssets="All" Include="..\\\\..\\\\..\\\\Project-Core\\\\backend\\\\Project.Core.Test\\\\Project.Core.Test.csproj">\\n    <SomeChild/>\\n  </ProjectReference>\\n</ItemGroup>';
    const out2 = replaceProjectWithPackageLine(xml2, '..\\\\..\\\\..\\\\Project-Core\\\\backend\\\\Project.Core.Test\\\\Project.Core.Test.csproj', 'Project.Core.Test');
    assert.ok(out2.indexOf('<PackageReference Include="Project.Core.Test"') !== -1);
    assert.strictEqual(out2.indexOf('ProjectReference'), -1);
  });
  test('integration: fixture -> project ref -> package ref roundtrip', () => {
    const fixture = path.join(__dirname, 'fixtures', 'src', 'MyProj', 'MyProj.csproj');
    const xml = fs.readFileSync(fixture, 'utf8');
    const cfg = [{
      packageName: 'Project.Core.Test',
      packageVersion: '1.2.27',
      projectPath: '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj',
      enabled: true
    }];

    const swapped = applySwitchToProject(xml, cfg);
    assert.ok(swapped.indexOf('ProjectReference') !== -1, 'expected ProjectReference after switching to project');
    assert.strictEqual(swapped.indexOf('PackageReference'), -1, 'expected no PackageReference after switching to project');

    const back = applySwitchToPackage(swapped, cfg);
    assert.ok(back.indexOf('PackageReference') !== -1, 'expected PackageReference after switching back to package');
    assert.strictEqual(back.indexOf('ProjectReference'), -1, 'expected no ProjectReference after switching back to package');
  });

  test('auto-prefix ../ when csproj is in subfolder and projectPath is root-relative', () => {
    const fixture = path.join(__dirname, 'fixtures', 'src', 'MyProj', 'MyProj.csproj');
    const xml = fs.readFileSync(fixture, 'utf8');
    const cfg = [{
      packageName: 'Project.Core.Test',
      packageVersion: '1.2.27',
      projectPath: 'Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj',
      enabled: true
    }];
    const rootFsPath = path.join(__dirname, '..', '..');
    const swapped = applySwitchToProject(xml, cfg, path.dirname(fixture), rootFsPath);
    const expectedRel = path.relative(path.dirname(fixture), path.resolve(rootFsPath, cfg[0].projectPath)).replace(/\//g, '\\');
    assert.ok(swapped.indexOf(`<ProjectReference Include="${expectedRel}"`) !== -1);
    assert.strictEqual(swapped.indexOf('<PackageReference Include="Project.Core.Test"'), -1);
  });

  test('replaceProjectWithPackageLine handles expanded ProjectReference with nested elements', () => {
    const xml = '<ItemGroup>\n  <ProjectReference Include="..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj">\n    <HintPath>lib\\some.dll</HintPath>\n  </ProjectReference>\n</ItemGroup>';
    const out = replaceProjectWithPackageLine(xml, '..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj', 'Project.Core.Test', '1.2.27');
    assert.ok(out.indexOf('<PackageReference Include="Project.Core.Test" Version="1.2.27" />') !== -1);
    assert.strictEqual(out.indexOf('ProjectReference'), -1);
  });

  test('preserve indentation and newline for self-closing PackageReference -> ProjectReference', () => {
    const xml = '<ItemGroup>\n    <PackageReference Include="X.Y" Version="1.0.0" />\n</ItemGroup>';
    const out = replacePackageWithProjectLine(xml, 'X.Y', '1.0.0', '..\\path\\to\\X.Y.csproj');
    // should contain same indentation and backslashes normalized
    assert.ok(out.indexOf('\n    <ProjectReference Include="..\\path\\to\\X.Y.csproj" />\n') !== -1);
    assert.strictEqual(out.indexOf('PackageReference'), -1);
  });

  test('preserve CRLF newline when replacing expanded ProjectReference', () => {
    const xml = '<ItemGroup>\r\n    <ProjectReference Include="..\\lib\\Dep.csproj">\r\n      <HintPath>lib\\dep.dll</HintPath>\r\n    </ProjectReference>\r\n</ItemGroup>';
    const out = replaceProjectWithPackageLine(xml, '..\\lib\\Dep.csproj', 'Dep.Package', '2.0.0');
    // replacement should use CRLF and keep indentation
    assert.ok(out.indexOf('\r\n    <PackageReference Include="Dep.Package" Version="2.0.0" />\r\n') !== -1);
    assert.strictEqual(out.indexOf('ProjectReference'), -1);
  });

  test('convert multi ProjectReference: one matches configuration -> becomes PackageReference, other remains ProjectReference', () => {
    const xml = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
        <RootNamespace>Project.Core.Test</RootNamespace>
        <AssemblyName>Project.Core.Test</AssemblyName>
    </PropertyGroup>
    <ItemGroup>
        <PackageReference Include="Microsoft.CSharp" Version="4.7.0" />
    </ItemGroup>
    <ItemGroup>
        <ProjectReference Include="..\\..\\..\\Project-Core\\backend\\Project.Core.Test\\Project.Core.Test.csproj" />
        <ProjectReference Include="..\\Project.Core.Infrastructure\\Project.Core.Infrastructure.csproj" />
    </ItemGroup>
</Project>`;

    const cfg = [{
      packageName: 'Project.Core.Test',
      packageVersion: '1.2.27',
      projectPath: '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj',
      enabled: true
    }];

    const out = applySwitchToPackage(xml, cfg);
    assert.ok(out.indexOf('<PackageReference Include="Project.Core.Test" Version="1.2.27" />') !== -1);
    // other project reference should remain
    assert.ok(out.indexOf('Project.Core.Infrastructure.csproj') !== -1);
    // original ProjectReference to Core.Test should be gone
    assert.strictEqual(out.indexOf('Project.Core.Test.csproj" />'), -1);
  });

  test('reverse: PackageReference becomes ProjectReference with normalized backslashes', () => {
    const xml = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
    </PropertyGroup>
    <ItemGroup>
        <PackageReference Include="Microsoft.CSharp" Version="4.7.0" />
    </ItemGroup>
    <ItemGroup>
        <PackageReference Include="Project.Core.Test" Version="1.2.27" />
        <ProjectReference Include="..\\Project.Core.Infrastructure\\Project.Core.Infrastructure.csproj" />
    </ItemGroup>
</Project>`;

    const cfg = [{
      packageName: 'Project.Core.Test',
      packageVersion: '1.2.27',
      projectPath: '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj',
      enabled: true
    }];

    const out = applySwitchToProject(xml, cfg);
    // ProjectReference Include should be normalized to backslashes
    assert.ok(out.indexOf('ProjectReference') !== -1);
    assert.ok(out.indexOf('Project.Core.Test.csproj') !== -1);
    // PackageReference entry should be removed
    assert.strictEqual(out.indexOf('<PackageReference Include="Project.Core.Test"'), -1);
  });

  test('addProjectToSolution invokes dotnet add when project missing', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called: any = null;
    await (async () => {
      await (require('../commands/switchToProjectRef') as any).addProjectToSolution(fixtures, 'sample.sln', 'src/NewProj/NewProj.csproj', async (cmd: string, args: string[]) => { called = { cmd, args }; });
    })();
    assert.ok(called, 'expected exec to be called');
    assert.strictEqual(called.cmd, 'dotnet');
    assert.strictEqual(called.args[0], 'sln');
    // last two args should be ['add', 'path relative to solution']
    assert.strictEqual(called.args[called.args.length - 2], 'add');
  });

  test('addProjectToSolution does nothing when project already present', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called = false;
    await (require('../commands/switchToProjectRef') as any).addProjectToSolution(fixtures, 'sample.sln', 'src/MyProj/MyProj.csproj', async () => { called = true; });
    assert.strictEqual(called, false);
  });

  test('addProjectToSolution passes --solution-folder when provided', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called: any = null;
    await (require('../commands/switchToProjectRef') as any).addProjectToSolution(fixtures, 'sample.sln', 'src/NewProj/NewProj.csproj', async (cmd: string, args: string[]) => { called = { cmd, args }; }, 'MyFolder');
    assert.ok(called, 'expected exec to be called');
    assert.strictEqual(called.cmd, 'dotnet');
    assert.ok(called.args.indexOf('--solution-folder') !== -1, 'expected --solution-folder in args');
    assert.ok(called.args.indexOf('MyFolder') !== -1, 'expected folder name in args');
  });

  test('addProjectToSolution does not include --solution-folder when not provided', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called: any = null;
    await (require('../commands/switchToProjectRef') as any).addProjectToSolution(fixtures, 'sample.sln', 'src/NewProj/NewProj.csproj', async (cmd: string, args: string[]) => { called = { cmd, args }; });
    assert.ok(called, 'expected exec to be called');
    assert.strictEqual(called.cmd, 'dotnet');
    assert.strictEqual(called.args.indexOf('--solution-folder'), -1, 'did not expect --solution-folder in args');
  });

  test('removeProjectFromSolution invokes dotnet remove when project present', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called: any = null;
    await (require('../commands/switchToPackageRef') as any).removeProjectFromSolution(fixtures, 'sample.sln', 'src/MyProj/MyProj.csproj', async (cmd: string, args: string[]) => { called = { cmd, args }; });
    assert.ok(called, 'expected exec to be called');
    assert.strictEqual(called.cmd, 'dotnet');
    assert.strictEqual(called.args[0], 'sln');
    assert.strictEqual(called.args[called.args.length - 2], 'remove');
  });

  test('removeProjectFromSolution does nothing when project missing', async () => {
    const fixtures = path.join(__dirname, 'fixtures');
    let called = false;
    await (require('../commands/switchToPackageRef') as any).removeProjectFromSolution(fixtures, 'sample.sln', 'src/Nope/Nope.csproj', async () => { called = true; });
    assert.strictEqual(called, false);
  });

  test('shouldRemoveProjectFromSolution respects PersistRefInSln (PascalCase)', () => {
    const conf = { PersistRefInSln: true };
    const shouldRemove = (require('../commands/switchToPackageRef') as any).shouldRemoveProjectFromSolution(conf);
    assert.strictEqual(shouldRemove, false);
  });

  test('shouldRemoveProjectFromSolution respects persistRefInSln (camelCase)', () => {
    const conf = { persistRefInSln: true };
    const shouldRemove = (require('../commands/switchToPackageRef') as any).shouldRemoveProjectFromSolution(conf);
    assert.strictEqual(shouldRemove, false);
  });
});
