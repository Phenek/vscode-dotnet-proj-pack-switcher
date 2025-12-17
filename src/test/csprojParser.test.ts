import * as assert from 'assert';
import { parseCsproj, findPackageReferences, replacePackageWithProject, replaceProjectWithPackage } from '../parsers/csprojParser';

suite('csprojParser', () => {
  test('finds PackageReference entries', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Project.Core.Test" Version="1.2.27" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.1" />
  </ItemGroup>
</Project>`;
    const obj = parseCsproj(xml);
    const pkgs = findPackageReferences(obj);
    assert.strictEqual(pkgs.length, 2);
    assert.strictEqual(pkgs[0]['@_Include'], 'Project.Core.Test');
  });

  test('replaces PackageReference with ProjectReference', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="My.Package" Version="1.2.3" />
  </ItemGroup>
</Project>`;
    const obj = parseCsproj(xml);
    replacePackageWithProject(obj, 'My.Package', '../../src/My.Package/My.Package.csproj');
    const out = obj.Project.ItemGroup[0].ProjectReference;
    assert.ok(out && out.length === 1, 'ProjectReference added');
    assert.strictEqual(out[0]['@_Include'], '../../src/My.Package/My.Package.csproj');
  });

  test('replaces ProjectReference with PackageReference', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <ProjectReference Include="../../src/My.Package/My.Package.csproj" />
  </ItemGroup>
</Project>`;
    const obj = parseCsproj(xml);
    replaceProjectWithPackage(obj, 'My.Package', '2.0.0');
    const out = obj.Project.ItemGroup[0].PackageReference;
    assert.ok(out && out.length === 1, 'PackageReference added');
    assert.strictEqual(out[0]['@_Include'], 'My.Package');
    assert.strictEqual(out[0]['@_Version'], '2.0.0');
  });
});
