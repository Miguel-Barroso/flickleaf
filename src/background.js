import { extension } from './extension-api.js';
const menus = extension.menus ?? extension.contextMenus;
const openPaste = () => extension.tabs.create({ url: extension.runtime.getURL('paste.html') });
extension.runtime.onInstalled.addListener(async () => {
  await menus.removeAll();
  menus.create({ id: 'paste-text', title: 'Paste text into Flickleaf', contexts: ['action'] });
});
menus.onClicked.addListener(info => { if (info.menuItemId === 'paste-text') openPaste(); });
extension.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'open-paste' || sender.id !== extension.runtime.id) return;
  openPaste().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
  return true; // Keep the response channel open in both Firefox and Chrome.
});
extension.action.onClicked.addListener(async (tab) => {
  try {
    await extension.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (error) {
    // Protected pages cannot accept the reader; offer the standalone paste view.
    await openPaste();
    console.warn('Flickleaf could not open this page:', error.message);
  }
});
