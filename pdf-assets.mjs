import { cp, mkdir } from 'node:fs/promises';
export async function copyPDFAssets(outdir) {
  const base = 'node_modules/pdfjs-dist';
  await mkdir(`${outdir}/pdfjs`, { recursive: true });
  for (const name of ['pdf.mjs', 'pdf.worker.mjs']) await cp(`${base}/legacy/build/${name}`, `${outdir}/pdfjs/${name}`);
  for (const name of ['cmaps', 'standard_fonts']) await cp(`${base}/${name}`, `${outdir}/pdfjs/${name}`, { recursive: true });
  await cp(`${base}/LICENSE`, `${outdir}/pdfjs/LICENSE`);
}
