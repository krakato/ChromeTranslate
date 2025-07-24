// --- Utilidades de caché y traducción ---
const translationCache = {};

async function fetchTranslation(text, targetLanguage) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error en la traducción');
  const data = await response.json();
  return data[0][0][0];
}

async function translateText(text, targetLanguage) {
  const cacheKey = `${text}_${targetLanguage}`;
  if (translationCache[cacheKey]) return translationCache[cacheKey];
  try {
    const translated = await fetchTranslation(text, targetLanguage);
    translationCache[cacheKey] = translated;
    return translated;
  } catch (error) {
    console.error('Error:', error);
    return text;
  }
}

// --- Helpers para atributos y restauración ---
function setOriginalAttributes(el, text, html) {
  el.setAttribute('data-original-text', text);
  el.setAttribute('data-original-html', html);
}
function clearOriginalAttributes(el) {
  el.removeAttribute('data-original-text');
  el.removeAttribute('data-original-html');
  el.removeAttribute('data-translated');
}
function isTranslated(el) {
  return el.getAttribute('data-translated') === 'true';
}
function markTranslated(el) {
  el.setAttribute('data-translated', 'true');
}

// --- Botón de restaurar ---
function createRestoreButton(target) {
  if (target.querySelector('.restore-original-btn')) return;
  const btn = document.createElement('button');
  btn.textContent = '↩️';
  btn.title = 'Restaurar texto original';
  btn.className = 'restore-original-btn';
  Object.assign(btn.style, {
    marginLeft: '6px', fontSize: '12px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0', verticalAlign: 'middle'
  });
  btn.onclick = function(e) {
    e.stopPropagation();
    e.preventDefault();
    const originalHTML = target.getAttribute('data-original-html');
    if (originalHTML) {
      target.innerHTML = originalHTML;
      clearOriginalAttributes(target);
      btn.remove();
      target.removeEventListener('mouseenter', handleMouseEnterRestoreBtn);
      target.removeEventListener('mouseleave', handleMouseLeaveRestoreBtn);
    }
  };
  target.appendChild(btn);
}
function handleMouseEnterRestoreBtn(e) { createRestoreButton(e.currentTarget); }
function handleMouseLeaveRestoreBtn(e) {
  const btn = e.currentTarget.querySelector('.restore-original-btn');
  if (btn) btn.remove();
}

// --- Traducción de elementos ---
async function translateElementAndChildren(element, targetLanguage) {
  // Selecciona los tags relevantes dentro del elemento
  const tags = element.querySelectorAll('*');
  if (tags.length) {
    // Traducir todos los hijos relevantes
    const promises = Array.from(tags).map(async tag => {
      const originalText = tag.textContent;
      if (!originalText.trim() || isTranslated(tag)) return;
      tag.classList.add('translating-chrome-ext');
      setOriginalAttributes(tag, originalText, tag.innerHTML);
      const translated = await translateText(originalText, targetLanguage);
      tag.textContent = translated;
      markTranslated(tag);
      tag.classList.remove('translating-chrome-ext');
      tag.addEventListener('mouseenter', handleMouseEnterRestoreBtn);
      tag.addEventListener('mouseleave', handleMouseLeaveRestoreBtn);
    });
    await Promise.all(promises);
  } else if (element.innerText && element.innerText.trim()) {
    // Si no hay hijos relevantes, traducir el texto completo del elemento principal
    if (isTranslated(element)) return;
    element.classList.add('translating-chrome-ext');
    setOriginalAttributes(element, element.innerText, element.innerHTML);
    const translated = await translateText(element.innerText, targetLanguage);
    element.textContent = translated;
    markTranslated(element);
    element.classList.remove('translating-chrome-ext');
    element.addEventListener('mouseenter', handleMouseEnterRestoreBtn);
    element.addEventListener('mouseleave', handleMouseLeaveRestoreBtn);
  }
}

// --- Traducción recursiva de nodos de texto ---
async function translateTextNodesRecursively(element, targetLanguage) {
  // Función auxiliar recursiva
  async function translateNode(node) {
    if (node.nodeType === 3) { // Nodo de texto
      const originalText = node.textContent;
      if (originalText.trim() && node.parentElement) {
        // Guardar el original solo una vez por elemento
        if (!node.parentElement.hasAttribute('data-original-html')) {
          setOriginalAttributes(node.parentElement, node.parentElement.innerText, node.parentElement.innerHTML);
        }
        const translated = await translateText(originalText, targetLanguage);
        node.textContent = translated;
        // Marcar el padre como traducido y poner botón si no lo tiene
        if (!isTranslated(node.parentElement)) {
          markTranslated(node.parentElement);
          node.parentElement.addEventListener('mouseenter', handleMouseEnterRestoreBtn);
          node.parentElement.addEventListener('mouseleave', handleMouseLeaveRestoreBtn);
        }
      }
    } else if (node.nodeType === 1) { // Nodo elemento
      // Procesar todos los hijos de este elemento
      for (let i = 0; i < node.childNodes.length; i++) {
        await translateNode(node.childNodes[i]);
      }
    }
  }
  await translateNode(element);
  // Si el elemento raíz no tiene texto propio, limpiar atributos
  if (element.nodeType === 1) {
    const hasOwnText = Array.from(element.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasOwnText) {
      clearOriginalAttributes(element);
      element.removeEventListener('mouseenter', handleMouseEnterRestoreBtn);
      element.removeEventListener('mouseleave', handleMouseLeaveRestoreBtn);
      element.classList.remove('translating-chrome-ext');
      element.removeAttribute('data-translated');
    }
  }
  element.classList.remove('translating-chrome-ext');
}

// --- Gestión del último elemento bajo el cursor ---
let lastElementUnderCursor = null;
document.addEventListener('contextmenu', function(event) {
  lastElementUnderCursor = event.target;
});

// --- Listener de mensajes ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate" && lastElementUnderCursor) {
    try {
      const browserLanguage = chrome.i18n.getUILanguage();
      const shortLang = browserLanguage.split('-')[0];
      let parent = lastElementUnderCursor.closest('div, section, article') || lastElementUnderCursor;
      parent.classList.add('translating-chrome-ext');
      translateTextNodesRecursively(parent, shortLang);
    } catch (error) {
      console.error('Error al seleccionar el elemento:', error);
    }
  }
});

// --- CSS para indicador visual ---
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