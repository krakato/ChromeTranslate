// Este archivo contiene el script de fondo que maneja los eventos de la extensión, 
// como la creación del menú contextual y la comunicación con el contenido de la página.

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateElement",
        title: "Traducir elemento",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translateElement") {
        chrome.tabs.sendMessage(tab.id, { action: "translate" });
    }
});