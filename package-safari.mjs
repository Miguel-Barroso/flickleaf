import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
await mkdir('safari-build', { recursive: true });
execFileSync('xcrun', ['safari-web-extension-converter', 'dist-safari', '--project-location', 'safari-build', '--app-name', 'Flickleaf', '--bundle-identifier', 'com.miguelbarroso.flickleaf', '--objc', '--copy-resources', '--no-open', '--no-prompt', '--force'], { stdio: 'inherit' });
// Xcode 27.2's converter writes the JSON-style project.xcproj ("KEY": "value",);
// earlier Xcodes write project.pbxproj (KEY = value;). Build settings are one
// line each in both, so the same edits apply to either.
const json = existsSync('safari-build/Flickleaf/Flickleaf.xcodeproj/project.xcproj');
const project = `safari-build/Flickleaf/Flickleaf.xcodeproj/project.${json ? 'xcproj' : 'pbxproj'}`;
const setting = key => new RegExp(json ? `(\\n\\s*)"${key}": "[^"\\n]*",` : `(\\n\\s*)${key} = [^;\\n]*;`, 'g');
const line = (key, value) => json ? `"${key}": ${JSON.stringify(value)},` : `${key} = ${/^[\w.]+$/.test(value) ? value : JSON.stringify(value)};`;
const set = (text, key, value) => text.replace(setting(key), (_, indent) => indent + line(key, value));
const after = (text, key, settings) => text.replace(setting(key), (match, indent) => match + Object.entries(settings).map(([name, value]) => indent + line(name, value)).join(''));
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
let text = await readFile(project, 'utf8');
text = set(set(set(text, 'IPHONEOS_DEPLOYMENT_TARGET', '18.4'), 'MACOSX_DEPLOYMENT_TARGET', '15.4'), 'MARKETING_VERSION', version);
// App Store uploads need a build number that rises with the version (0.10.0 → 1000).
text = set(text, 'CURRENT_PROJECT_VERSION', String(version.split('.').reduce((sum, part) => sum * 100 + Number(part), 0)));
// The converter leaves app targets without a copyright; set one name everywhere,
// with no export-compliance prompt and a Mac App Store category.
text = after(text.replace(setting('INFOPLIST_KEY_NSHumanReadableCopyright'), ''), 'GENERATE_INFOPLIST_FILE', {
  INFOPLIST_KEY_NSHumanReadableCopyright: '© 2026 Miguel Barroso',
  INFOPLIST_KEY_ITSAppUsesNonExemptEncryption: 'NO',
  INFOPLIST_KEY_LSApplicationCategoryType: 'public.app-category.productivity',
});
await writeFile(project, text);
// The converter's template app page and upscaled icons are replaced with
// Flickleaf's setup screen and icons rendered from public/icon.svg.
const app = 'safari-build/Flickleaf/Shared (App)';
await copyFile('safari/app/Main.html', `${app}/Resources/Base.lproj/Main.html`);
for (const file of ['Style.css', 'Script.js', 'Icon.png']) await copyFile(`safari/app/${file}`, `${app}/Resources/${file}`);
const icons = `${app}/Assets.xcassets/AppIcon.appiconset`;
await copyFile('safari/app/icons/ios-1024.png', `${icons}/universal-icon-1024@1x.png`);
for (const size of [16, 32, 128, 256, 512]) {
  await copyFile(`safari/app/icons/mac-${size}.png`, `${icons}/mac-icon-${size}@1x.png`);
  await copyFile(`safari/app/icons/mac-${size * 2}.png`, `${icons}/mac-icon-${size}@2x.png`);
}
await copyFile('README.md', 'safari-build/Flickleaf/README.md');
await copyFile('LICENSE', 'safari-build/Flickleaf/LICENSE');
await mkdir('artifacts', { recursive: true });
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', 'safari-build/Flickleaf', `artifacts/flickleaf-safari-${version}-xcode.zip`]);
// The converter regenerates the project, so signing comes from the local
// environment and is applied after zipping: the shared package stays unsigned.
const team = process.env.FLICKLEAF_APPLE_TEAM;
if (team) {
  if (!/^[A-Z0-9]{10}$/.test(team)) throw new Error(`FLICKLEAF_APPLE_TEAM must be a 10-character Team ID, not ${team}`);
  await writeFile(project, after(await readFile(project, 'utf8'), 'CODE_SIGN_STYLE', { DEVELOPMENT_TEAM: team }));
}
console.log(team ? `Open safari-build/Flickleaf/Flickleaf.xcodeproj to install on a Mac or iPhone; signing uses team ${team}.`
  : 'Open safari-build/Flickleaf/Flickleaf.xcodeproj to sign and install on a Mac or iPhone, or set FLICKLEAF_APPLE_TEAM before packaging.');
