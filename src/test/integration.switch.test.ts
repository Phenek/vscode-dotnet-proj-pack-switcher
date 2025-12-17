import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { parseCsproj, findPackageReferences, replacePackageWithProject } from '../parsers/csprojParser';

suite('integration - switch', () => {
  test('replace package with project in fixture', () => {
    const fixture = path.join(__dirname, 'fixtures', 'src', 'MyProj', 'MyProj.csproj');
    const xml = fs.readFileSync(fixture, 'utf8');
    const obj = parseCsproj(xml);
    const pkgs = findPackageReferences(obj);
    assert.strictEqual(pkgs.length, 1);
    replacePackageWithProject(obj, 'Project.Core.Test', '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj');
    const out = obj.Project.ItemGroup[0].ProjectReference;
    assert.ok(out && out.length === 1);
    assert.strictEqual(out[0]['@_Include'], '../../Project-Core/backend/Project.Core.Test/Project.Core.Test.csproj');
  });
});
