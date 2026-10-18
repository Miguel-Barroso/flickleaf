import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

// Chrome Web Store API v2: https://developer.chrome.com/docs/webstore/using-api
const ITEM_ID = 'eifchlcmjmhbkhdecfbfiedjgenajmnl';
const API = 'https://chromewebstore.googleapis.com';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const statusOnly = process.argv.includes('--status');
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const fail = message => { console.error(message); process.exit(1); };
const env = process.env;

// Credentials come from the environment only, never arguments or the repo:
// either a ready access token (for example from gcloud service-account
// impersonation) or an OAuth client plus refresh token exchanged here.
async function accessToken() {
  if (env.CWS_ACCESS_TOKEN) return env.CWS_ACCESS_TOKEN;
  if (!(env.CWS_CLIENT_ID && env.CWS_CLIENT_SECRET && env.CWS_REFRESH_TOKEN)) {
    fail('Set CWS_ACCESS_TOKEN, or CWS_CLIENT_ID, CWS_CLIENT_SECRET and CWS_REFRESH_TOKEN, in your own terminal (see docs/releasing.md).');
  }
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({
    client_id: env.CWS_CLIENT_ID, client_secret: env.CWS_CLIENT_SECRET, refresh_token: env.CWS_REFRESH_TOKEN, grant_type: 'refresh_token' }) });
  const body = await response.json();
  if (!response.ok) fail(`Google token exchange failed: ${body.error_description || body.error || response.status}`);
  return body.access_token;
}
async function call(token, path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok) fail(`Chrome Web Store API ${response.status} for ${path}: ${body.error?.message || text}`);
  return body;
}
const describe = status => {
  const revision = (label, value) => value ? `${label} ${value.state} (${(value.distributionChannels || []).map(c => c.crxVersion).join(', ') || 'no version'})` : `${label} none`;
  return [revision('published', status.publishedItemRevisionStatus), revision('submitted', status.submittedItemRevisionStatus),
    status.takenDown ? 'TAKEN DOWN' : '', status.warned ? 'WARNED: check the dashboard' : ''].filter(Boolean).join('; ');
};

if (!env.CWS_PUBLISHER_ID && !dryRun) fail('Set CWS_PUBLISHER_ID (Developer Dashboard → Publisher → Settings).');
const item = `/v2/publishers/${env.CWS_PUBLISHER_ID}/items/${ITEM_ID}`;
if (statusOnly) {
  console.log(`Chrome Web Store: ${describe(await call(await accessToken(), `${item}:fetchStatus`))}`);
  process.exit(0);
}

// Same release gates as Firefox: the uploaded package is built from the
// reviewed, tagged commit with nothing uncommitted.
execFileSync('node', ['scripts/check-release.mjs'], { stdio: 'inherit' });
if (git(['status', '--porcelain'])) fail('Commit or stash all changes first; the package must match the tagged release.');
let tag = '';
try { tag = git(['describe', '--exact-match', '--tags', 'HEAD']); } catch {}
if (tag !== `v${version}`) fail(`HEAD must be the reviewed commit tagged v${version} (found ${tag || 'no tag'}).`);
const token = dryRun ? '' : await accessToken();

execFileSync('npm', ['run', 'package:chrome'], { stdio: 'inherit' });
const zip = `artifacts/flickleaf-chrome-${version}.zip`;
if (dryRun) { console.log(`Dry run: would upload ${zip} to item ${ITEM_ID} and submit ${version} for review.`); process.exit(0); }

const before = await call(token, `${item}:fetchStatus`);
if (before.submittedItemRevisionStatus?.state === 'PENDING_REVIEW') fail(`A submission is already in review: ${describe(before)}. Cancel it in the dashboard first.`);

let upload = await call(token, `/upload${item}:upload`, { method: 'POST', body: await readFile(zip) });
for (let attempt = 0; ['IN_PROGRESS', 'UPLOAD_IN_PROGRESS'].includes(upload.uploadState) && attempt < 60; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  const status = await call(token, `${item}:fetchStatus`);
  upload = { ...upload, uploadState: status.lastAsyncUploadState };
}
if (upload.uploadState !== 'SUCCEEDED') fail(`Upload did not succeed (${upload.uploadState}). Nothing was submitted; check the dashboard.`);
if (upload.crxVersion && upload.crxVersion !== version) fail(`Store read version ${upload.crxVersion} from the package, expected ${version}. Nothing was submitted.`);

// Publishing submits for review with the listing's existing visibility; the
// item goes live automatically once approved.
const published = await call(token, `${item}:publish`, { method: 'POST' });
console.log(`Submitted ${version} for Chrome Web Store review (${published.state || 'submitted'}).`);
console.log(`Check later with \`npm run submit:chrome -- --status\`, or at https://chrome.google.com/webstore/devconsole`);
