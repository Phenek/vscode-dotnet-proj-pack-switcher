export function listProjectsFromSln(text: string): string[] {
  const re = /Project\([^)]*\) = "[^"]+", "([^"]+\.csproj)"/gmi;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}
