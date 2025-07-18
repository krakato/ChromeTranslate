window.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("status");
    const output = document.getElementById("output");

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const [{ result: selectedText }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        });

        const text = selectedText.trim();
        if (!text) {
            status.textContent = "No hay texto seleccionado.";
            return;
        }
        const browserLanguage = chrome.i18n.getUILanguage();
        const targetLanguage = browserLanguage.split('-')[0];
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        const translatedText = data[0].map(part => part[0]).join("");

        await navigator.clipboard.writeText(translatedText);

        status.textContent = "Translated End...:";
        output.textContent = translatedText;
    } catch (error) {
        console.error("Error:", error);
        status.textContent = "Error al traducir o copiar.";
    }
});