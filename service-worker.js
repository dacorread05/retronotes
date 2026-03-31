/* =========================================================
   RetroNotes — service-worker.js
   Service Worker para funcionalidad PWA offline.
   Estrategia: Cache-first con actualización en background.
   ========================================================= */

const VERSION_CACHE  = 'v1.0.0';
const NOMBRE_CACHE   = `retronotes-${VERSION_CACHE}`;

// Lista de assets a pre-cachear durante la instalación
const ASSETS_PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/notes.js',
  './js/editor.js',
  './js/ui.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/favicon.svg',
];

// URLs de Google Fonts a cachear (se intentan en instalación, pueden fallar sin internet)
const FONTS_PRECACHE = [
  'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
];

// =========================================================
// EVENTO: INSTALL
// Pre-cachear todos los assets de la app
// =========================================================
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then(async (cache) => {
      console.log('[SW] Pre-cacheando assets de la app...');

      // Cachear assets locales (siempre deben existir)
      await cache.addAll(ASSETS_PRECACHE);
      console.log('[SW] Assets locales cacheados correctamente.');

      // Intentar cachear fuentes (pueden fallar sin conexión)
      for (const url of FONTS_PRECACHE) {
        try {
          await cache.add(new Request(url, { mode: 'cors' }));
          console.log('[SW] Fuente cacheada:', url);
        } catch (err) {
          console.warn('[SW] No se pudo cachear fuente (sin conexión):', url);
        }
      }
    })
  );

  // Activar el nuevo SW inmediatamente sin esperar a que cierren las pestañas
  self.skipWaiting();
});

// =========================================================
// EVENTO: ACTIVATE
// Eliminar versiones antiguas del cache
// =========================================================
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then(claves => {
      const cachesAntiguos = claves.filter(
        clave => clave.startsWith('retronotes-') && clave !== NOMBRE_CACHE
      );
      return Promise.all(
        cachesAntiguos.map(clave => {
          console.log('[SW] Eliminando cache antigua:', clave);
          return caches.delete(clave);
        })
      );
    })
  );

  // Tomar control de todas las pestañas abiertas inmediatamente
  self.clients.claim();
});

// =========================================================
// EVENTO: FETCH
// Estrategia: Cache-first con stale-while-revalidate para assets locales
// =========================================================
self.addEventListener('fetch', (evento) => {
  // Solo manejar peticiones GET
  if (evento.request.method !== 'GET') return;

  // Ignorar peticiones de extensiones del navegador o devtools
  const url = new URL(evento.request.url);
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

  evento.respondWith(manejarFetch(evento.request));
});

/**
 * Lógica principal de fetch con cache-first.
 * Para assets locales: devuelve desde cache y actualiza en background.
 * Para fuentes externas: cache-first sin actualización en background.
 * @param {Request} solicitud
 * @returns {Promise<Response>}
 */
async function manejarFetch(solicitud) {
  const cache = await caches.open(NOMBRE_CACHE);

  // Buscar en el cache primero
  const respuestaCache = await cache.match(solicitud);

  if (respuestaCache) {
    // Servir desde cache inmediatamente
    const esFuenteExterna = solicitud.url.includes('googleapis') ||
                             solicitud.url.includes('gstatic');

    // Para assets locales: actualizar cache en background (stale-while-revalidate)
    if (!esFuenteExterna) {
      fetch(solicitud).then(respuestaRed => {
        if (respuestaRed && respuestaRed.ok) {
          cache.put(solicitud, respuestaRed.clone());
        }
      }).catch(() => {
        // Sin conexión: usar la versión cacheada (ya la estamos sirviendo)
      });
    }

    return respuestaCache;
  }

  // No está en cache: obtener de la red y cachear
  try {
    const respuestaRed = await fetch(solicitud);

    if (respuestaRed && respuestaRed.ok) {
      // Cachear la respuesta para uso futuro offline
      cache.put(solicitud, respuestaRed.clone());
    }

    return respuestaRed;
  } catch (err) {
    // Sin red y sin cache: devolver página principal como fallback para HTML
    const aceptaHTML = solicitud.headers.get('accept') &&
                       solicitud.headers.get('accept').includes('text/html');
    if (aceptaHTML) {
      const paginaFallback = await cache.match('./index.html');
      if (paginaFallback) return paginaFallback;
    }

    // Sin fallback disponible
    return new Response('Sin conexión', {
      status:     503,
      statusText: 'Service Unavailable',
      headers:    { 'Content-Type': 'text/plain' }
    });
  }
}
