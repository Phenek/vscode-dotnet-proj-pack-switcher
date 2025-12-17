const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const path = require('path');

function replaceProjectWithPackageLine(xml, projectPath, packageName, packageVersion) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '', format: true, indentBy: '  ' });
  const parsed = parser.parse(xml);
  if (!parsed) return xml;
  const csprojName = path.basename(projectPath);
  let itemGroups = parsed.ItemGroup;
  if (!itemGroups && parsed.Project && parsed.Project.ItemGroup) itemGroups = parsed.Project.ItemGroup;
  if (!itemGroups) return xml;
  itemGroups = Array.isArray(itemGroups) ? itemGroups : [itemGroups];
  for (const ig of itemGroups) {
    if (!ig.ProjectReference) continue;
    const projRefs = Array.isArray(ig.ProjectReference) ? ig.ProjectReference : [ig.ProjectReference];
    for (let i = 0; i < projRefs.length; i++) {
      const pr = projRefs[i];
      const include = pr.Include || pr['@_Include'] || '';
      if (include && include.indexOf(csprojName) !== -1) {
        const pkgRef = { Include: packageName };
        if (packageVersion) pkgRef.Version = packageVersion;
        projRefs[i] = pkgRef;
      }
    }
    ig.PackageReference = projRefs.map(p => {
      const obj = { Include: p.Include };
      if (p.Version) obj.Version = p.Version;
      return obj;
    });
    delete ig.ProjectReference;
  }
  return builder.build(parsed);
}

function applySwitchToPackage(xml, configurations) {
  return configurations.reduce((acc, conf) => {
    if (!conf.enabled) return acc;
    if (!conf.packageName || !conf.projectPath) return acc;
    return replaceProjectWithPackageLine(acc, conf.projectPath, conf.packageName, conf.packageVersion);
  }, xml);
}

function replacePackageWithProjectLine(xml, packageName, packageVersion, projectPath) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '', format: true, indentBy: '  ' });
  const parsed = parser.parse(xml);
  if (!parsed) return xml;
  let itemGroups = parsed.ItemGroup;
  if (!itemGroups && parsed.Project && parsed.Project.ItemGroup) itemGroups = parsed.Project.ItemGroup;
  if (!itemGroups) return xml;
  itemGroups = Array.isArray(itemGroups) ? itemGroups : [itemGroups];
  for (const ig of itemGroups) {
    if (!ig.PackageReference) continue;
    const pkgRefs = Array.isArray(ig.PackageReference) ? ig.PackageReference : [ig.PackageReference];
    const newPkgRefs = [];
    const newProjRefs = [];
    for (const pr of pkgRefs) {
      const include = pr.Include || pr['@_Include'] || '';
      const version = pr.Version || pr['@_Version'] || '';
      if (include === packageName && version === packageVersion) {
        newProjRefs.push({ Include: projectPath.replace(/\//g, '\\') });
      } else {
        newPkgRefs.push(pr);
      }
    }
    if (newProjRefs.length) ig.ProjectReference = newProjRefs;
    if (newPkgRefs.length) ig.PackageReference = newPkgRefs;
    else delete ig.PackageReference;
  }
  return builder.build(parsed);
}

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

console.log('Original:\n', xml);
const out = applySwitchToPackage(xml, cfg);
console.log('\nAfter applySwitchToPackage:\n', out);

const afterBack = applySwitchToProject(out, cfg);
console.log('\nAfter applySwitchToProject (back):\n', afterBack);
