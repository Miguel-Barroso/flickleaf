import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rm, mkdir } from 'node:fs/promises';

// Archives the iOS and macOS apps and uploads both to App Store Connect with
// Xcode's signed-in account and automatic App Store signing.
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const team = process.env.FLICKLEAF_APPLE_TEAM;
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const fail = message => { console.error(message); process.exit(1); };

execFileSync('node', ['scripts/check-release.mjs'], { stdio: 'inherit' });
if (!/^[A-Z0-9]{10}$/.test(team || '')) fail('Set FLICKLEAF_APPLE_TEAM to your 10-character Apple Team ID.');
if (git(['status', '--porcelain'])) fail('Commit or stash all changes first; the upload must match committed source.');
// The container app (safari/app, package-safari.mjs) may change after a tag;
// the extension itself must be exactly the reviewed release.
try { execFileSync('git', ['diff', '--quiet', `v${version}`, 'HEAD', '--', 'src', 'public', 'safari/public', 'build.mjs', 'package-lock.json']); }
catch { fail(`Extension source differs from tag v${version}; release a new version instead.`); }

execFileSync('npm', ['run', 'package:safari'], { stdio: 'inherit', env: { ...process.env, FLICKLEAF_APPLE_TEAM: team } });
// Xcode's IPA step needs Apple's rsync; Homebrew's newer rsync breaks it.
const env = { ...process.env, PATH: '/usr/bin:/bin:/usr/sbin:/sbin' };
const out = 'artifacts/app-store';
await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
const options = `${out}/ExportOptions.plist`;
await writeFile(options, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>${dryRun ? 'export' : 'upload'}</string>
<key>signingStyle</key><string>automatic</string>
<key>teamID</key><string>${team}</string>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
`);
for (const platform of ['iOS', 'macOS']) {
  const archive = `${out}/Flickleaf-${platform}.xcarchive`;
  execFileSync('xcodebuild', ['-project', 'safari-build/Flickleaf/Flickleaf.xcodeproj', '-scheme', `Flickleaf (${platform})`,
    '-configuration', 'Release', '-destination', `generic/platform=${platform}`, '-archivePath', archive,
    '-allowProvisioningUpdates', '-quiet', 'archive'], { stdio: 'inherit', env });
  execFileSync('xcodebuild', ['-exportArchive', '-archivePath', archive, '-exportPath', `${out}/${platform}`,
    '-exportOptionsPlist', options, '-allowProvisioningUpdates'], { stdio: ['ignore', 'ignore', 'inherit'], env });
  console.log(dryRun ? `Dry run: exported a store-signed ${platform} build to ${out}/${platform}.` : `Uploaded ${platform} ${version} to App Store Connect.`);
}
if (!dryRun) console.log('Builds appear in App Store Connect → TestFlight after processing (usually 5–30 minutes).');
