console.log("🔄 Script popup.js cargado");

window.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM cargado - Iniciando script");
    
    const status = document.getElementById("status");
    const output = document.getElementById("output");
    const clearCookiesBtn = document.getElementById("clearCookiesBtn");
    
    if (!clearCookiesBtn) {
        console.error("❌ No se encontró el botón clearCookiesBtn");
        return;
    }

    // Funcionalidad para borrar cookies
    clearCookiesBtn.addEventListener("click", async () => {
        try {
            status.textContent = "🔄 Borrando cookies...";
            output.textContent = "Procesando...";
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                status.textContent = "❌ No se pueden borrar cookies en esta página";
                output.textContent = "Las cookies no se pueden borrar en páginas del navegador o extensiones.";
                return;
            }
            
            const url = new URL(tab.url);
            const domain = url.hostname;
            
            // Obtener todas las cookies del dominio
            const allCookies = await chrome.cookies.getAll({});
            const domainCookies = allCookies.filter(cookie => 
                cookie.domain.includes(domain) || domain.includes(cookie.domain.replace(/^\./, ''))
            );
            
            if (domainCookies.length === 0) {
                status.textContent = "ℹ️ No hay cookies para borrar";
                output.textContent = `No se encontraron cookies para el dominio: ${domain}`;
                return;
            }
            
            let deletedCount = 0;
            
            // Borrar cada cookie
            for (const cookie of domainCookies) {
                try {
                    const cookieUrl = `${url.protocol}//${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}`;
                    
                    const removeResult = await chrome.cookies.remove({
                        url: cookieUrl,
                        name: cookie.name,
                        storeId: cookie.storeId
                    });
                    
                    if (removeResult) {
                        deletedCount++;
                    }
                } catch (cookieError) {
                    console.error(`Error al eliminar cookie ${cookie.name}:`, cookieError);
                }
            }
            
            // Verificar cookies restantes
            const remainingCookies = await chrome.cookies.getAll({});
            const remainingDomainCookies = remainingCookies.filter(cookie => 
                cookie.domain.includes(domain) || domain.includes(cookie.domain.replace(/^\./, ''))
            );
            
            // Mostrar resultado
            status.textContent = `✅ Cookies borradas (${deletedCount}/${domainCookies.length})`;
            
            if (deletedCount > 0) {
                output.textContent = `✅ Se han borrado ${deletedCount} cookies del dominio: ${domain}`;
                
                if (remainingDomainCookies.length > 0) {
                    output.textContent += `\n⚠️ Aún quedan ${remainingDomainCookies.length} cookies.`;
                } else {
                    output.textContent += `\n🎉 ¡Todas las cookies del dominio han sido eliminadas!`;
                }
            } else {
                output.textContent = `❌ No se pudieron borrar las cookies del dominio: ${domain}`;
            }
            
            // Cambiar temporalmente el botón
            const originalText = clearCookiesBtn.textContent;
            clearCookiesBtn.textContent = "✅ Cookies Borradas";
            clearCookiesBtn.style.backgroundColor = "#00aa00";
            
            // Restaurar el botón después de 3 segundos
            setTimeout(() => {
                clearCookiesBtn.textContent = originalText;
                clearCookiesBtn.style.backgroundColor = "#ff4444";
            }, 3000);
            
        } catch (error) {
            console.error("Error al borrar cookies:", error);
            status.textContent = "❌ Error al borrar cookies";
            output.textContent = `Error: ${error.message}`;
        }
    });

    // Funcionalidad de traducción
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