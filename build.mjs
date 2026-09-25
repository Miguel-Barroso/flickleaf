import { copyPDFAssets } from './pdf-assets.mjs';
import { build, context } from "esbuild";
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
const chrome = process.argv.includes("--chrome");
const outdir = chrome ? "dist-chrome" : "dist";
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await cp("public", outdir, { recursive: true });
await copyPDFAssets(outdir);
if (chrome) {
  const manifest = JSON.parse(await readFile('public/manifest.json', 'utf8'));
  delete manifest.browser_specific_settings;
  manifest.minimum_chrome_version = '120';
  manifest.permissions = manifest.permissions.map(permission => permission === 'menus' ? 'contextMenus' : permission);
  manifest.background = { service_worker: 'background.js' };
  manifest.icons = Object.fromEntries([16, 32, 48, 128].map(size => [size, `icons/icon-${size}.png`]));
  manifest.action.default_icon = manifest.icons;
  await writeFile(`${outdir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
}
const options = { entryPoints: ["src/content.js", "src/background.js", "src/demo.js", "src/paste.js"], bundle: true, outdir, format: "iife", target: [chrome ? "chrome120" : "firefox142"], loader: { ".css": "text" }, legalComments: "eof" };
if (process.argv.includes("--serve")) {
  const ctx = await context(options);
  await ctx.watch();
  await ctx.serve({ servedir: outdir, host: "127.0.0.1", port: 4173 });
  console.log("Flickleaf playground: http://127.0.0.1:4173/demo.html");
} else { await build(options); }
