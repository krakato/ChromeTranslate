chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Translate Element",
    id: "translate",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        chrome.runtime.sendMessage({ action: "translate" });
      }
    });
  }
});