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
      const shortLang = browserLanguage.split('-')[0];

      // Busca el elemento padre (por ejemplo, el primer div, section o article)
      let parent = lastElementUnderCursor.closest('div, section, article');
      if (!parent) parent = lastElementUnderCursor; // Si no hay padre, usa el propio elemento

      // Selecciona los tags <p>, <a>, <div> dentro del padre
      const tags = parent.querySelectorAll('p, a, div, i, b, span, h1, h2, h3, h4, h5, h6');
      let promises = [];

      tags.forEach(tag => {
        const originalText = tag.textContent;
        if (originalText.trim()) {
          const promise = translateText(originalText, shortLang).then(translated => {
            tag.textContent = translated;
          });
          promises.push(promise);
        }
      });

      // Si no hay tags hijos, traduce el propio padre
      if (tags.length === 0 && parent.innerText.trim()) {
        translateText(parent.innerText, shortLang).then(translated => {
          parent.innerHTML = translated;
        });
      } else {
        Promise.all(promises).then(() => {
          // Opcional: acción tras traducir todos los hijos
        });
      }
    } catch (error) {
      console.error('Error al seleccionar el elemento:', error);
    }
  }
});