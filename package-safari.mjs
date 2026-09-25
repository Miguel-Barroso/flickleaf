import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
await mkdir('safari-build', { recursive: true });
execFileSync('xcrun', ['safari-web-extension-converter', 'dist-safari', '--project-location', 'safari-build', '--app-name', 'Flickleaf', '--bundle-identifier', 'com.miguelbarroso.flickleaf', '--objc', '--copy-resources', '--no-open', '--no-prompt', '--force'], { stdio: 'inherit' });
const project = 'safari-build/Flickleaf/Flickleaf.xcodeproj/project.pbxproj';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(project, (await readFile(project, 'utf8'))
  .replace(/IPHONEOS_DEPLOYMENT_TARGET = [\d.]+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 18.4;')
  .replace(/MACOSX_DEPLOYMENT_TARGET = [\d.]+;/g, 'MACOSX_DEPLOYMENT_TARGET = 15.4;')
  .replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${version};`));
await copyFile('README.md', 'safari-build/Flickleaf/README.md');
await mkdir('artifacts', { recursive: true });
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', 'safari-build/Flickleaf', `artifacts/flickleaf-safari-${version}-xcode.zip`]);
console.log('Open safari-build/Flickleaf/Flickleaf.xcodeproj to sign and install on a Mac or iPhone.');
