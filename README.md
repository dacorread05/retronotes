# RetroNotes

Tu bloc de notas personal con estética retro Windows 95, construido como **PWA (Progressive Web App)** instalable.

## Características

- **Estética Win95**: bordes raised/sunken, barra de título con gradiente azul, scrollbars clásicas, efecto CRT scanline
- **Fuentes**: Pixelify Sans (UI) + IBM Plex Mono (editor)
- **Auto-guardado**: cada 500ms mientras escribes
- **Múltiples notas**: panel lateral con lista y búsqueda en tiempo real
- **Confirmación al eliminar**: diálogo retro de confirmación antes de borrar
- **Barra de estado completa**: línea/columna, caracteres, palabras y timestamp de modificación
- **Exportar**: nota actual como `.txt`, todas las notas como `.zip`, backup completo como `.json`
- **Importar**: archivos `.txt` como nueva nota, backup `.json` para restaurar todas las notas
- **Ventana arrastrable**: arrastra por la barra de título
- **Minimizar / Maximizar / Cerrar** con confirmación de cambios sin guardar
- **Menú contextual**: clic derecho en el editor
- **Atajos de teclado**: `Ctrl+N` nueva nota, `Ctrl+S` guardar, `Ctrl+D` descargar
- **PWA instalable**: funciona 100% offline tras la primera carga
- **Responsive**: modo móvil con sidebar drawer y ventana a pantalla completa

## Estructura del proyecto

```
retronotes/
├── index.html          # HTML principal
├── manifest.json       # Manifiesto PWA
├── service-worker.js   # Cache-first para uso offline
├── css/
│   └── styles.css      # Todos los estilos (Win95 + responsive)
├── js/
│   ├── app.js          # Inicialización y estado global
│   ├── notes.js        # CRUD de notas y búsqueda
│   ├── editor.js       # Lógica del editor y barra de estado
│   ├── window.js       # Arrastrar, minimizar, maximizar, cerrar
│   └── ui.js           # Diálogos, exportar/importar, ZIP nativo
├── icons/
│   ├── icon-192.svg    # Ícono PWA 192×192
│   ├── icon-512.svg    # Ícono PWA 512×512
│   └── favicon.svg     # Favicon para el navegador
└── README.md
```

## Cómo usar

### Opción 1: Servidor estático simple (recomendado para PWA)

```bash
# Con Python
python -m http.server 8080

# Con Node.js (npx serve)
npx serve .

# Con PHP
php -S localhost:8080
```

Luego abre `http://localhost:8080` en tu navegador.

### Opción 2: Abrir directamente

Abre `index.html` directamente en el navegador.
> **Nota**: El Service Worker no funcionará con `file://`. Para PWA completa usa un servidor.

### Instalación como PWA

1. Abre la app en Chrome/Edge con un servidor HTTP
2. Aparecerá el botón de instalación en la barra de direcciones (🖥️)
3. Haz clic en "Instalar" y la app se añadirá a tu escritorio/pantalla de inicio

## Atajos de teclado

| Atajo        | Acción                    |
|-------------|---------------------------|
| `Ctrl+N`    | Nueva nota                |
| `Ctrl+S`    | Guardar nota              |
| `Ctrl+D`    | Descargar nota como .txt  |
| `Escape`    | Cerrar diálogos abiertos  |

## Almacenamiento

Todas las notas se guardan en `localStorage` del navegador. Para hacer backup:

1. Menú **Archivo → Exportar backup JSON...** — guarda todas las notas en un archivo `.json`
2. Menú **Archivo → Importar backup JSON...** — restaura las notas desde ese archivo

## Tecnologías

- **Vanilla HTML/CSS/JS** — sin frameworks ni bundlers
- **localStorage** — persistencia local sin servidores
- **Service Worker** — caché offline con estrategia cache-first
- **Web App Manifest** — instalación como PWA
- **FileReader API** — importar archivos
- **Blob API + URL.createObjectURL** — exportar archivos
- **ZIP nativo** — creador de ZIP implementado sin dependencias (formato PKZIP stored)
