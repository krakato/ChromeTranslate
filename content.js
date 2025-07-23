let lastElementUnderCursor = null;

document.addEventListener('contextmenu', function(event) {
    lastElementUnderCursor = event.target;
});

const translationCache = {};

// Cambiado a función async
async function translateText(text, targetLanguage) {
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la traducción');
        const data = await response.json();
        const translated = data[0][0][0];
        translationCache[cacheKey] = translated;
        return translated;
    } catch (error) {
        console.error('Error:', error);
        return text;
    }
}
//Escucha mensajes enviados desde el popup, content script o background script de la extensión de Chrome.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate" && lastElementUnderCursor) {
    try {
      const browserLanguage = chrome.i18n.getUILanguage();
      const shortLang = browserLanguage.split('-')[0];

      // Busca el elemento padre (por ejemplo, el primer div, section o article) hacia arriba del elemento bajo el cursor
      let parent = lastElementUnderCursor.closest('div, section, article');
      if (!parent) parent = lastElementUnderCursor; // Si no hay padre, usa el propio elemento

      // Selecciona los tags <p>, <a>, <div> dentro del padre
      const tags = parent.querySelectorAll('p, a, div, i, b, span, h1, h2, h3, h4, h5, h6');
      let promises = [];

      tags.forEach(tag => {
        const originalText = tag.textContent;
        if (originalText.trim()) {
          tag.classList.add('translating-chrome-ext'); // Indicador visual
          // Guardar el texto original en un atributo
          tag.setAttribute('data-original-text', originalText);
          tag.setAttribute('data-original-html', tag.innerHTML);
          if (tag.getAttribute('data-translated') === 'true') {
            tag.classList.remove('translating-chrome-ext'); // Quitar indicador
            return;
          }
          const promise = translateText(originalText, shortLang).then(translated => {
            tag.textContent = translated;
            tag.setAttribute('data-translated', 'true');
            tag.classList.remove('translating-chrome-ext'); // Quitar indicador
            // Agregar botón de restaurar al pasar el mouse
            tag.addEventListener('mouseenter', showRestoreButton);
            tag.addEventListener('mouseleave', hideRestoreButton);
          });
          promises.push(promise);
        }
      });

      // Si no hay tags hijos, traduce el propio padre
      if (tags.length === 0 && parent.innerText.trim()) {
        if (parent.getAttribute('data-translated') === 'true') {
          return;
        }
        parent.classList.add('translating-chrome-ext'); // Indicador visual
        parent.setAttribute('data-original-text', parent.innerText);
        parent.setAttribute('data-original-html', parent.innerHTML);
        translateText(parent.innerText, shortLang).then(translated => {
          parent.textContent = translated; // Usar textContent en vez de innerHTML
          parent.setAttribute('data-translated', 'true');
          parent.classList.remove('translating-chrome-ext'); // Quitar indicador
          parent.addEventListener('mouseenter', showRestoreButton);
          parent.addEventListener('mouseleave', hideRestoreButton);
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

// Función para mostrar el botón de restaurar
function showRestoreButton(event) {
  const actTarget = event.currentTarget;
  if (actTarget.querySelector('.restore-original-btn')) return; // Ya existe
  const btnOrigin = document.createElement('button');
  btnOrigin.textContent = '↩️';
  btnOrigin.title = 'Restaurar texto original';
  btnOrigin.className = 'restore-original-btn';
  btnOrigin.style.marginLeft = '6px';
  btnOrigin.style.fontSize = '12px';
  btnOrigin.style.cursor = 'pointer';
  btnOrigin.style.background = 'transparent';
  btnOrigin.style.border = 'none';
  btnOrigin.style.padding = '0';
  btnOrigin.style.verticalAlign = 'middle';
  btnOrigin.onclick = function(e) {
    e.stopPropagation();
    e.preventDefault();
    const originalText = actTarget.getAttribute('data-original-text');
    const originalHTML = actTarget.getAttribute('data-original-html');
    if (originalHTML) {
      actTarget.innerHTML = originalHTML;
      actTarget.removeAttribute('data-original-text');
      actTarget.removeAttribute('data-original-html');
      actTarget.removeAttribute('data-translated');
      btnOrigin.remove();
      actTarget.removeEventListener('mouseenter', showRestoreButton);
      actTarget.removeEventListener('mouseleave', hideRestoreButton);
    }
  };
  actTarget.appendChild(btnOrigin);
}

// Función para ocultar el botón de restaurar
function hideRestoreButton(event) {
  const evenTarget = event.currentTarget;
  const btnRestaur = evenTarget.querySelector('.restore-original-btn');
  if (btnRestaur) btnRestaur.remove();
}

// Agrega el CSS para el indicador visual de traducción
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .translating-chrome-ext {
      background-color: #fff3b0 !important;
      border: 2px solid #e0c141ff !important;
      border-radius: 4px !important;
      opacity: 0.7 !important;
      transition: background-color 0.3s, opacity 0.3s;
    }
  `;
  document.head.appendChild(style);
})();