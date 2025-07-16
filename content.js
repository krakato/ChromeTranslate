let lastElementUnderCursor = null;

document.addEventListener('contextmenu', function(event) {
    lastElementUnderCursor = event.target;
});

function translateText(text, targetLanguage) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la traducción');
            }
            return response.json();
        })
        .then(data => {
            // El texto traducido está en data[0][0][0]
            return data[0][0][0];
        })
        .catch(error => {
            console.error('Error:', error);
            return text; // Retorna el texto original en caso de error
        });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate" && lastElementUnderCursor) {
    try {
      const browserLanguage = chrome.i18n.getUILanguage();
      const shortLang = browserLanguage.split('-')[0]; // "es" si es "es-ES"
      // Verifica si el elemento tiene texto
      if (lastElementUnderCursor && lastElementUnderCursor.innerText) {
        const originalText = lastElementUnderCursor.innerText;
        translateText(originalText, shortLang).then(translated => {
          lastElementUnderCursor.innerText = translated;
        }).catch(error => {
          console.error('Error al traducir:', error);
        });
      }
    } catch (error) {
      console.error('Error al seleccionar el elemento:', error);
    }
  }
});