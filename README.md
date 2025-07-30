# Translate

## Descripción
•	La extensión "Translate" permite traducir el texto de elementos HTML en una página web al pasar el puntero sobre ellos y hacer clic derecho. Utiliza la API de Google Translate para realizar las traducciones y reemplaza el texto original en el elemento HTML con la traducción.
•	También traduce texto seleccionado en la página y después pulsar el icono de la extensión
•	La extensión ofrece un botón para eliminar las cookies de la pestaña actual, no borra caché 


## Estructura del Proyecto
El proyecto está organizado de la siguiente manera:

```
ChromeTranslate
├── ChromeTranslate
|   ├── images
│   ├── background.js        # Script de fondo que maneja eventos y el menú contextual.
│   ├── content.js          # Inyecta en las páginas web y reemplaza el texto con la traducción.
│   ├── popup
│   │   └── popup.js        # Lógica del popup de la extensión (opcional).   
│   │   └── popup.html       # popup.html de la extensión (opcional).   
│   └── manifest.json        # Configuración de la extensión de Chrome.
└── README.md                # Documentación del proyecto.
```

## Instalación
1. Clona este repositorio en tu máquina local.
2. Abre Google Chrome y navega a `chrome://extensions/`.
3. Activa el "Modo de desarrollador" en la esquina superior derecha.
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta `chrome-translate-extension/src`.

## Uso
1. Navega a cualquier página web.
2. Sitúa el cursor sobre el texto que deseas traducir.
3. Haz clic derecho y selecciona "Traducir elemento" en el menú contextual.
4. El texto del elemento HTML se reemplazará con su traducción.
5. La traducción se puede revertir con el boton azul ↩️ que aparece cuando pasas el mouse sobre el texto traducido.
6. Selecciona texto en la pestaña actual y tradúcelo directamente pulsando el icono de la extensión la traducción aparece en el mismo popup
7. También se muestra un botón para eliminar las cookies de la pestaña actual al abrir el popup sin tener texto seleccionado

## Contribuciones
Las contribuciones son bienvenidas. Si deseas mejorar esta extensión, por favor abre un issue o envía un pull request.

## Licencia
Este proyecto está bajo la Licencia Copyleft (GPL). Goldfinger