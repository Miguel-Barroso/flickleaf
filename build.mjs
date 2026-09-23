import { build, context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
const options = { entryPoints: ["src/content.js", "src/background.js", "src/demo.js"], bundle: true, outdir: "dist", format: "iife", target: ["firefox140"], loader: { ".css": "text" }, legalComments: "eof" };
if (process.argv.includes("--serve")) {
  const ctx = await context(options);
  await ctx.watch();
  await ctx.serve({ servedir: "dist", host: "127.0.0.1", port: 4173 });
  console.log("Flickleaf playground: http://127.0.0.1:4173/demo.html");
} else { await build(options); }
