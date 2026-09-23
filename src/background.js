const openPaste = () => browser.tabs.create({ url: browser.runtime.getURL('paste.html') });
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({ id: 'paste-text', title: 'Paste text into Flickleaf', contexts: ['action'] });
});
browser.menus.onClicked.addListener(info => { if (info.menuItemId === 'paste-text') openPaste(); });
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'open-paste' && sender.id === browser.runtime.id) return openPaste().then(() => true);
});
browser.action.onClicked.addListener(async (tab) => {
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (error) {
    // Protected pages cannot accept the reader; offer the standalone paste view.
    await openPaste();
    console.warn('Flickleaf could not open this page:', error.message);
  }
});
