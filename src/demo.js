import { extract } from './extract.js';
import { openReader } from './reader.js';
let session;
document.querySelector('#open').addEventListener('click', () => { if (!session) session = openReader(extract(document), () => { session = null; }); });
if (new URLSearchParams(location.search).has('reader')) document.querySelector('#open').click();
