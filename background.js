chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Translate Element",
    id: "translate",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "translate" });
});