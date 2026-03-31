/* =========================================================
   RetroNotes — editor.js
   Módulo del editor de texto: auto-guardado, barra de estado,
   menú contextual y opciones de visualización.
   ========================================================= */

Object.assign(App, {

  // =========================================================
  // CONFIGURACIÓN DEL EDITOR
  // =========================================================

  /** Configura todos los eventos del área de texto */
  setupEditor() {
    const editor = document.getElementById('editor');
    let timerAutoGuardado; // Temporizador para el auto-guardado

    // Auto-guardado: 500ms después de la última pulsación de tecla
    editor.addEventListener('input', () => {
      App.hasUnsavedChanges = true;
      clearTimeout(timerAutoGuardado);
      timerAutoGuardado = setTimeout(() => App.updateCurrentNote(), 500);
      App.updateStatus();
    });

    // Actualizar barra de estado al mover el cursor
    editor.addEventListener('keyup',  App.updateStatus);
    editor.addEventListener('click',  App.updateStatus);
    editor.addEventListener('select', App.updateStatus);

    // Menú contextual retro al hacer clic derecho
    editor.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menu = document.getElementById('contextMenu');
      // Posicionar sin salir de la pantalla
      const x = Math.min(e.clientX, window.innerWidth  - 170);
      const y = Math.min(e.clientY, window.innerHeight - 120);
      menu.style.left = x + 'px';
      menu.style.top  = y + 'px';
      menu.classList.add('active');
    });

    // Actualizar estado inicial
    App.updateStatus();
  },

  // =========================================================
  // BARRA DE ESTADO
  // =========================================================

  /** Actualiza todos los paneles de la barra de estado */
  updateStatus() {
    const editor = document.getElementById('editor');
    const valor  = editor.value;
    const pos    = editor.selectionStart;

    // --- Posición del cursor (Línea, Columna) ---
    const lineasHastaCursor = valor.substring(0, pos).split('\n');
    const linea  = lineasHastaCursor.length;
    const columna = lineasHastaCursor[lineasHastaCursor.length - 1].length + 1;
    document.getElementById('statusPos').textContent = `Ln ${linea}, Col ${columna}`;

    // --- Contador de caracteres y palabras ---
    const numChars  = valor.length;
    const numPalab  = valor.trim() === '' ? 0 : valor.trim().split(/\s+/).length;
    document.getElementById('statusChars').textContent =
      `${numChars} car · ${numPalab} pal`;

    // --- Timestamp de última modificación ---
    if (App.currentNoteId) {
      const nota = App.notes.find(n => n.id === App.currentNoteId);
      if (nota) {
        document.getElementById('statusModified').textContent =
          `Mod: ${App.formatDate(nota.modified)}`;
      }
    }
  },

  /**
   * Establece el texto del panel de estado principal.
   * @param {string} texto - Mensaje a mostrar
   */
  setStatus(texto) {
    document.getElementById('statusText').textContent = texto;
  },

  // =========================================================
  // ACCIONES DE EDICIÓN
  // =========================================================

  /** Selecciona todo el texto del editor */
  selectAll() {
    document.getElementById('editor').select();
  },

  /**
   * Alterna el ajuste de línea (word wrap) del editor.
   * Cuando está desactivado, se muestra scroll horizontal.
   */
  toggleWordWrap() {
    App.wordWrap = !App.wordWrap;
    const editor = document.getElementById('editor');
    editor.style.whiteSpace  = App.wordWrap ? 'pre-wrap' : 'pre';
    editor.style.overflowX   = App.wordWrap ? 'hidden'   : 'auto';
    App.setStatus(App.wordWrap ? 'Ajuste de línea: activado' : 'Ajuste de línea: desactivado');
    setTimeout(() => App.setStatus('Listo'), 2000);
  }

});
