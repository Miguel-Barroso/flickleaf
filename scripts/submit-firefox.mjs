import { execFileSync } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const fail = message => { console.error(message); process.exit(1); };

execFileSync('node', ['scripts/check-release.mjs'], { stdio: 'inherit' });
// Mozilla reviews the uploaded source archive against the uploaded package.
// The archive comes from HEAD and the package from the working tree, so the
// tree must be clean and HEAD must be the reviewed, tagged release commit.
if (git(['status', '--porcelain'])) fail('Commit or stash all changes first; the source archive must match the built package.');
let tag = '';
try { tag = git(['describe', '--exact-match', '--tags', 'HEAD']); } catch {}
if (tag !== `v${version}`) fail(`HEAD must be the reviewed commit tagged v${version} (found ${tag || 'no tag'}).`);
// web-ext reads WEB_EXT_API_KEY / WEB_EXT_API_SECRET itself; never pass
// credentials as arguments, where other local processes could read them.
if (!dryRun && !(process.env.WEB_EXT_API_KEY && process.env.WEB_EXT_API_SECRET)) {
  fail('Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET (JWT issuer and secret from https://addons.mozilla.org/developers/addon/api/key/) in your own terminal.');
}

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
await mkdir('artifacts', { recursive: true });
const source = `artifacts/flickleaf-source-${version}.zip`;
execFileSync('git', ['archive', '--format=zip', '--prefix=flickleaf-source/', `--output=${source}`, 'HEAD']);

// --approval-timeout 0 returns after upload and AMO validation; human review
// takes days and is tracked on the Developer Hub, not by this script.
const args = ['web-ext', 'sign', '--source-dir', 'dist', '--artifacts-dir', 'artifacts',
  '--channel', 'listed', '--approval-timeout', '0', '--upload-source-code', source, '--no-input'];
if (dryRun) { console.log(`Dry run: would submit ${version} with npx ${args.join(' ')}`); process.exit(0); }
execFileSync('npx', args, { stdio: 'inherit' });
console.log(`Submitted ${version} for listed review with source. Add release notes and track status at https://addons.mozilla.org/developers/addons`);
