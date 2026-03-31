/* =========================================================
   RetroNotes — app.js
   Punto de entrada principal y estado global de la aplicación.
   Define el espacio de nombres App y orquesta la inicialización.
   ========================================================= */

// Espacio de nombres global compartido por todos los módulos
const App = {

  // --- Estado de la aplicación ---
  notes:             [],     // Lista de notas cargadas
  currentNoteId:     null,   // ID de la nota activa en el editor
  sidebarVisible:    true,   // ¿El panel lateral está visible?
  wordWrap:          true,   // ¿El ajuste de línea está activo?
  hasUnsavedChanges: false,  // ¿Hay cambios pendientes de auto-guardar?
  searchQuery:       '',     // Consulta de búsqueda actual
  pendingDeleteId:   null,   // ID de nota esperando confirmación de eliminación

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================
  init() {
    // Registrar Service Worker para capacidades PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg  => console.log('[RetroNotes] SW registrado en:', reg.scope))
        .catch(err => console.warn('[RetroNotes] SW no registrado:', err));
    }

    // Cargar notas guardadas en localStorage
    App.loadNotes();

    // Si no hay notas, mostrar la nota de bienvenida
    if (App.notes.length === 0) {
      App.createNote(
        'Bienvenido a RetroNotes',
        '¡Hola! 👋\n\nEsta es tu app de notas personal con estilo retro Windows 95.\n\nCaracterísticas:\n• Guarda notas automáticamente cada 500ms\n• Descarga tus notas como .txt (Ctrl+D)\n• Exporta todas las notas como .zip\n• Importa archivos .txt existentes\n• Backup y restauración en JSON\n• Funciona 100% offline (PWA)\n• Estilo clásico Windows 95\n\n¡Empieza a escribir!'
      );
    }

    // Seleccionar la primera nota de la lista
    App.selectNote(App.notes[0].id);

    // Inicializar módulos
    App.setupEditor();   // Editor de texto y auto-guardado
    App.setupUI();       // Menús, diálogos, eventos de UI
    App.setupKeyboard(); // Atajos de teclado globales

    // Avisar al navegador si hay cambios sin guardar al cerrar la pestaña
    window.addEventListener('beforeunload', (e) => {
      if (App.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Adaptar layout al tamaño de pantalla inicial
    App.handleResize();
    window.addEventListener('resize', App.handleResize);
  },

  // =========================================================
  // ATAJOS DE TECLADO GLOBALES
  // =========================================================
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 's': e.preventDefault(); App.saveNote();    break;
          case 'n': e.preventDefault(); App.newNote();     break;
          case 'd': e.preventDefault(); App.downloadNote(); break;
        }
      }

      // Escape: cerrar diálogos y menú contextual
      if (e.key === 'Escape') {
        document.querySelectorAll('.dialog-overlay.active')
          .forEach(d => d.classList.remove('active'));
        document.getElementById('contextMenu').classList.remove('active');
        // En móvil, cerrar sidebar si está abierto
        if (window.innerWidth < 768 && App.sidebarVisible) {
          App.closeMobileSidebar();
        }
      }
    });
  },

  // =========================================================
  // RESPONSIVE: adaptar layout según tamaño de pantalla
  // =========================================================
  handleResize() {
    const isMobile = window.innerWidth < 768;
    const sidebar  = document.getElementById('sidebar');

    if (isMobile) {
      // En móvil: sidebar como drawer — cerrar si no estaba abierto
      if (!App.sidebarVisible) {
        sidebar.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay').classList.remove('active');
      }
    } else {
      // En escritorio: sidebar inline, visible según preferencia
      sidebar.classList.remove('mobile-open');
      document.getElementById('sidebarOverlay').classList.remove('active');
      sidebar.style.display = App.sidebarVisible ? 'flex' : 'none';
    }
  },

  // Abrir sidebar en modo móvil (como drawer)
  openMobileSidebar() {
    App.sidebarVisible = true;
    document.getElementById('sidebar').classList.add('mobile-open');
    document.getElementById('sidebarOverlay').classList.add('active');
  },

  // Cerrar sidebar en modo móvil
  closeMobileSidebar() {
    App.sidebarVisible = false;
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }
};

// Inicializar la aplicación cuando el DOM esté completamente cargado.
// Para este momento, todos los módulos (notes.js, editor.js, etc.)
// ya han extendido el objeto App con sus métodos.
document.addEventListener('DOMContentLoaded', () => App.init());
