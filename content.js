import { translateText } from './utils/translator.js';

document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    
    const targetElement = event.target;

    if (targetElement && targetElement.innerText) {
        const menu = document.createElement('div');
        menu.style.position = 'absolute';
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid black';
        menu.style.zIndex = '1000';
        menu.innerText = 'Traducir elemento';
        
        menu.addEventListener('click', async function() {
            const originalText = targetElement.innerText;
            const translatedText = await translateText(originalText, 'es'); // 'es' para español
            targetElement.innerText = translatedText;
            document.body.removeChild(menu);
        });

        document.body.appendChild(menu);

        document.addEventListener('click', function() {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, { once: true });
    }
});