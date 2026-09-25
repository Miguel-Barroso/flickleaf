import { extension } from './extension-api.js';
extension.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'open-paste' || sender.id !== extension.runtime.id) return;
  extension.tabs.create({ url: extension.runtime.getURL('paste.html') }).then(
    () => sendResponse({ ok: true }), () => sendResponse({ ok: false })
  );
  return true;
});
