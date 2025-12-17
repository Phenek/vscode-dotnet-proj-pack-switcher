import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export type PackageReference = {
  '@_Include': string;
  '@_Version'?: string;
};

export function parseCsproj(xml: string): any {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  return parser.parse(xml);
}

export function buildCsproj(obj: any): string {
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  return builder.build(obj);
}

export function findPackageReferences(obj: any): Array<PackageReference> {
  const items: Array<PackageReference> = [];
  const project = obj.Project || obj;
  let itemGroups: any = project.ItemGroup || [];
  if (!Array.isArray(itemGroups)) { itemGroups = [itemGroups]; }
  for (const ig of itemGroups) {
    if (!ig || typeof ig !== 'object') { continue; }
    if (ig.PackageReference) {
      if (Array.isArray(ig.PackageReference)) {
        items.push(...ig.PackageReference);
      } else {
        items.push(ig.PackageReference);
      }
    }
  }
  return items;
}

export function replacePackageWithProject(obj: any, packageName: string, projectPath: string) {
  const project = obj.Project || obj;
  let itemGroups: any = project.ItemGroup || [];
  if (!Array.isArray(itemGroups)) { itemGroups = [itemGroups]; }
  let added = false;
  for (const ig of itemGroups) {
    if (!ig || typeof ig !== 'object') { continue; }
    if (ig.PackageReference) {
      if (Array.isArray(ig.PackageReference)) {
        ig.PackageReference = ig.PackageReference.filter((pr: any) => pr['@_Include'] !== packageName);
        if (ig.PackageReference.length === 0) { delete ig.PackageReference; }
      } else if (ig.PackageReference['@_Include'] === packageName) {
        delete ig.PackageReference;
      }
    }
    if (!ig.ProjectReference) { ig.ProjectReference = []; }
    else if (!Array.isArray(ig.ProjectReference)) { ig.ProjectReference = [ig.ProjectReference]; }
    // add project reference
    ig.ProjectReference.push({ '@_Include': projectPath });
    added = true;
  }
  if (!added) {
    // no existing valid ItemGroup to use; create one
    if (!project.ItemGroup || typeof project.ItemGroup === 'string') { project.ItemGroup = []; }
    if (!Array.isArray(project.ItemGroup)) { project.ItemGroup = [project.ItemGroup]; }
    project.ItemGroup.push({ ProjectReference: [{ '@_Include': projectPath }] });
  }
}

export function replaceProjectWithPackage(obj: any, packageName: string, version?: string) {
  const project = obj.Project || obj;
  let itemGroups: any = project.ItemGroup || [];
  if (!Array.isArray(itemGroups)) { itemGroups = [itemGroups]; }
  let added = false;
  for (const ig of itemGroups) {
    if (!ig || typeof ig !== 'object') { continue; }
    if (ig.ProjectReference) {
      if (Array.isArray(ig.ProjectReference)) {
        ig.ProjectReference = ig.ProjectReference.filter((pr: any) => {
          // Basic heuristic: project filename contains package name
          return !(pr['@_Include'] && pr['@_Include'].includes(packageName));
        });
        if (ig.ProjectReference.length === 0) { delete ig.ProjectReference; }
      } else if (ig.ProjectReference['@_Include'] && ig.ProjectReference['@_Include'].includes(packageName)) {
        delete ig.ProjectReference;
      }
    }
    if (!ig.PackageReference) { ig.PackageReference = []; }
    else if (!Array.isArray(ig.PackageReference)) { ig.PackageReference = [ig.PackageReference]; }

    const pkg: any = { '@_Include': packageName };
    if (version) { pkg['@_Version'] = version; }
    ig.PackageReference.push(pkg);
    added = true;
  }
  if (!added) {
    if (!project.ItemGroup || typeof project.ItemGroup === 'string') { project.ItemGroup = []; }
    if (!Array.isArray(project.ItemGroup)) { project.ItemGroup = [project.ItemGroup]; }
    const pkg: any = { '@_Include': packageName };
    if (version) { pkg['@_Version'] = version; }
    project.ItemGroup.push({ PackageReference: [pkg] });
  }
}
