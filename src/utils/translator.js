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

export { translateText };