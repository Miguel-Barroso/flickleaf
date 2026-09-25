import { extension } from './extension-api.js';
const error = document.querySelector('#error');
const buttons = [...document.querySelectorAll('button')];
async function run(action) {
  error.textContent = '';
  buttons.forEach(button => { button.disabled = true; });
  try { await action(); window.close(); }
  catch { error.textContent = 'This page cannot be opened. Allow Flickleaf access in Safari, or use Paste text / Open PDF.'; }
  finally { buttons.forEach(button => { button.disabled = false; }); }
}
document.querySelector('#read-page').addEventListener('click', () => run(async () => {
  const [tab] = await extension.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) throw new Error('No active tab');
  await extension.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
}));
document.querySelector('#open-paste').addEventListener('click', () => run(() =>
  extension.tabs.create({ url: extension.runtime.getURL('paste.html') })
));
