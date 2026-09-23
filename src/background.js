browser.action.onClicked.addListener(async (tab) => {
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await browser.action.setBadgeText({ tabId: tab.id, text: "" });
  } catch (error) {
    await browser.action.setBadgeText({ tabId: tab.id, text: "!" });
    await browser.action.setTitle({ tabId: tab.id, title: "This page cannot be opened in Flickleaf. Try a regular article webpage." });
    console.warn("Flickleaf could not open this page:", error.message);
  }
});
