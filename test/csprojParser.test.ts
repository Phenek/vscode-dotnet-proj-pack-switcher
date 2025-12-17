import * as assert from 'assert';
import { parseCsproj, replacePackageWithProject, replaceProjectWithPackage, buildCsproj, findPackageReferences } from '../src/parsers/csprojParser';

suite('csproj Parser', () => {
  test('handles empty/self-closing ItemGroup when replacing package with project', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup />
</Project>`;
    const obj = parseCsproj(xml);

    // should not throw
    replacePackageWithProject(obj, 'My.Package', '../MyProject/MyProject.csproj');

    // resulting object should include a ProjectReference
    const pr = findPackageReferences(obj);
    // no package references expected
    assert.ok(Array.isArray(obj.Project.ItemGroup));
    const added = obj.Project.ItemGroup.some((ig: any) => {
      return ig.ProjectReference && ig.ProjectReference.some((r: any) => r['@_Include'] === '../MyProject/MyProject.csproj');
    });
    assert.ok(added, 'project reference was added');
  });

  test('handles empty/self-closing ItemGroup when replacing project with package', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup />
</Project>`;
    const obj = parseCsproj(xml);

    // should not throw
    replaceProjectWithPackage(obj, 'My.Package', '1.2.3');

    // ensure a PackageReference was added
    const added = obj.Project.ItemGroup.some((ig: any) => {
      return ig.PackageReference && ig.PackageReference.some((r: any) => r['@_Include'] === 'My.Package');
    });
    assert.ok(added, 'package reference was added');
  });
});
