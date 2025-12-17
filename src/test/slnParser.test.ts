import * as assert from 'assert';
import { listProjectsFromSln } from '../parsers/slnParser';

suite('slnParser', () => {
  test('finds csproj paths in sample sln', () => {
    const text = `Microsoft Visual Studio Solution File, Format Version 12.00
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "MyProj", "src/MyProj/MyProj.csproj", "{GUID}"
Project("{...}") = "Lib", "lib/Lib.csproj", "{GUID}"
EndProject`;
    const res = listProjectsFromSln(text);
    assert.strictEqual(res.length, 2);
    assert.ok(res.includes('src/MyProj/MyProj.csproj'));
    assert.ok(res.includes('lib/Lib.csproj'));
  });
});
