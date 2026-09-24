import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist-web', { recursive: true, force: true });
await mkdir('dist-web/flickleaf/about', { recursive: true });
for (const file of ['index.html', 'site.css', 'about/index.html', '.htaccess']) await cp(`web/${file}`, `dist-web/flickleaf/${file}`);
await cp('public/icon.svg', 'dist-web/flickleaf/icon.svg');
await build({ entryPoints: ['web/app.js'], bundle: true, outfile: 'dist-web/flickleaf/app.js', format: 'iife', target: ['safari16.4', 'firefox142', 'chrome120'], loader: { '.css': 'text' }, legalComments: 'eof' });
