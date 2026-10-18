import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
await mkdir('safari-build', { recursive: true });
execFileSync('xcrun', ['safari-web-extension-converter', 'dist-safari', '--project-location', 'safari-build', '--app-name', 'Flickleaf', '--bundle-identifier', 'com.miguelbarroso.flickleaf', '--objc', '--copy-resources', '--no-open', '--no-prompt', '--force'], { stdio: 'inherit' });
const project = 'safari-build/Flickleaf/Flickleaf.xcodeproj/project.pbxproj';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(project, (await readFile(project, 'utf8'))
  .replace(/IPHONEOS_DEPLOYMENT_TARGET = [\d.]+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 18.4;')
  .replace(/MACOSX_DEPLOYMENT_TARGET = [\d.]+;/g, 'MACOSX_DEPLOYMENT_TARGET = 15.4;')
  .replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${version};`)
  // The converter leaves app targets without a copyright; set one name everywhere.
  .replace(/\n\s*INFOPLIST_KEY_NSHumanReadableCopyright = "[^"]*";/g, '')
  .replace(/GENERATE_INFOPLIST_FILE = YES;/g, 'GENERATE_INFOPLIST_FILE = YES;\n\t\t\t\tINFOPLIST_KEY_NSHumanReadableCopyright = "© 2026 Miguel Barroso";'));
await copyFile('README.md', 'safari-build/Flickleaf/README.md');
await copyFile('LICENSE', 'safari-build/Flickleaf/LICENSE');
await mkdir('artifacts', { recursive: true });
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', 'safari-build/Flickleaf', `artifacts/flickleaf-safari-${version}-xcode.zip`]);
// The converter regenerates the project, so signing comes from the local
// environment and is applied after zipping: the shared package stays unsigned.
const team = process.env.FLICKLEAF_APPLE_TEAM;
if (team) {
  if (!/^[A-Z0-9]{10}$/.test(team)) throw new Error(`FLICKLEAF_APPLE_TEAM must be a 10-character Team ID, not ${team}`);
  await writeFile(project, (await readFile(project, 'utf8')).replace(/CODE_SIGN_STYLE = Automatic;/g, `CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ${team};`));
}
console.log(team ? `Open safari-build/Flickleaf/Flickleaf.xcodeproj to install on a Mac or iPhone; signing uses team ${team}.`
  : 'Open safari-build/Flickleaf/Flickleaf.xcodeproj to sign and install on a Mac or iPhone, or set FLICKLEAF_APPLE_TEAM before packaging.');
