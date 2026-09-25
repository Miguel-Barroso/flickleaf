import { copyPDFAssets } from './pdf-assets.mjs';
import { build } from 'esbuild';
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist-web', { recursive: true, force: true });
await mkdir('dist-web/flickleaf/about', { recursive: true });
for (const file of ['index.html', 'site.css', 'about/index.html', '.htaccess']) await cp(`web/${file}`, `dist-web/flickleaf/${file}`);
await cp('public/icon.svg', 'dist-web/flickleaf/icon.svg');
await build({ entryPoints: ['web/app.js'], bundle: true, outfile: 'dist-web/flickleaf/app.js', format: 'iife', target: ['safari16.4', 'firefox142', 'chrome120'], loader: { '.css': 'text' }, legalComments: 'eof' });

await copyPDFAssets('dist-web/flickleaf');
// Version asset URLs so a browser cache cannot retain a previous reader release.
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
for (const path of ['index.html', 'about/index.html']) {
  const file = `dist-web/flickleaf/${path}`;
  const html = await readFile(file, 'utf8');
  await writeFile(file, html.replaceAll('/flickleaf/app.js', `/flickleaf/app.js?v=${version}`).replaceAll('/flickleaf/site.css', `/flickleaf/site.css?v=${version}`));
}
