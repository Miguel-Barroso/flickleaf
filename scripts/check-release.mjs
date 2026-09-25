import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const pkg = await readJSON('package.json');
const lock = await readJSON('package-lock.json');
const manifest = await readJSON('public/manifest.json');
assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'Use a three-part numeric release version');
assert.equal(manifest.version, pkg.version, 'Extension and package versions must match');
assert.equal(lock.version, pkg.version, 'Lockfile version must match');
assert.equal(lock.packages[''].version, pkg.version, 'Lockfile root version must match');
if (process.argv.includes('--tag')) {
  const tag = `v${pkg.version}`;
  assert.equal(process.env.GITHUB_REF, `refs/tags/${tag}`, 'Run release workflow on the matching version tag');
  const commit = ref => execFileSync('git', ['rev-parse', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
  assert.equal(commit(tag), commit('HEAD'), 'Tag must identify the packaged checkout');
}
console.log(`Release versions agree: ${pkg.version}`);
