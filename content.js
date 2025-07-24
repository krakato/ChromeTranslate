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
  const tags = element.querySelectorAll('p, a, div, i, b, span, h1, h2, h3, h4, h5, h6');
  const elementsToTranslate = tags.length ? Array.from(tags) : [element];
  const promises = elementsToTranslate.map(async tag => {
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
      translateElementAndChildren(parent, shortLang);
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