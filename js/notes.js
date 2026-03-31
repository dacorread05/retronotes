/* =========================================================
   RetroNotes — notes.js
   Módulo de gestión de notas: CRUD completo y renderizado
   de la lista lateral con soporte de búsqueda.
   ========================================================= */

Object.assign(App, {

  // =========================================================
  // PERSISTENCIA
  // =========================================================

  /** Carga las notas desde localStorage */
  loadNotes() {
    try {
      const guardadas = localStorage.getItem('retronotes_data');
      App.notes = guardadas ? JSON.parse(guardadas) : [];
    } catch {
      App.notes = [];
    }
  },

  /** Guarda las notas en localStorage con manejo de cuota excedida */
  saveNotes() {
    try {
      localStorage.setItem('retronotes_data', JSON.stringify(App.notes));
    } catch (e) {
      // Detectar error de cuota de almacenamiento
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        App.showStorageWarning();
      }
    }
  },

  // =========================================================
  // CRUD DE NOTAS
  // =========================================================

  /**
   * Crea una nueva nota y la inserta al inicio de la lista.
   * @param {string} [title]   - Título inicial (opcional)
   * @param {string} [content] - Contenido inicial (opcional)
   * @returns {object} La nota creada
   */
  createNote(title, content) {
    const nota = {
      id:       Date.now().toString(),
      title:    title   || 'Sin título',
      content:  content || '',
      created:  new Date().toISOString(),
      modified: new Date().toISOString()
    };
    App.notes.unshift(nota);
    App.saveNotes();
    App.renderNotesList();
    return nota;
  },

  /**
   * Selecciona una nota para editar, cargando su contenido en el editor.
   * @param {string} id - ID de la nota a seleccionar
   */
  selectNote(id) {
    App.currentNoteId = id;
    const nota = App.notes.find(n => n.id === id);
    if (!nota) return;

    const editor = document.getElementById('editor');
    editor.value = nota.content;
    document.getElementById('windowTitle').textContent = `RetroNotes — ${nota.title}`;
    document.getElementById('mobileTitleText').textContent = nota.title;

    App.hasUnsavedChanges = false;
    App.renderNotesList();
    App.updateStatus();

    // En móvil: cerrar el sidebar después de seleccionar una nota
    if (window.innerWidth < 768 && App.sidebarVisible) {
      App.closeMobileSidebar();
    }
  },

  /**
   * Sincroniza el contenido del editor con la nota activa y guarda.
   * Se llama automáticamente 500ms después de que el usuario deja de escribir.
   */
  updateCurrentNote() {
    if (!App.currentNoteId) return;
    const nota = App.notes.find(n => n.id === App.currentNoteId);
    if (!nota) return;

    const contenido = document.getElementById('editor').value;
    nota.content  = contenido;
    nota.modified = new Date().toISOString();

    // Auto-título: primera línea no vacía (máx. 40 caracteres)
    const primeraLinea = contenido.split('\n')[0].trim();
    nota.title = primeraLinea.substring(0, 40) || 'Sin título';

    document.getElementById('windowTitle').textContent = `RetroNotes — ${nota.title}`;
    document.getElementById('mobileTitleText').textContent = nota.title;

    App.hasUnsavedChanges = false;
    App.saveNotes();
    App.renderNotesList();
  },

  /** Crea una nueva nota en blanco y la abre en el editor */
  newNote() {
    const nota = App.createNote();
    App.selectNote(nota.id);
    document.getElementById('editor').focus();
  },

  /** Guarda la nota actual manualmente y muestra confirmación */
  saveNote() {
    App.updateCurrentNote();
    App.setStatus('✓ Nota guardada');
    setTimeout(() => App.setStatus('Listo'), 2000);
  },

  // =========================================================
  // ELIMINACIÓN CON CONFIRMACIÓN
  // =========================================================

  /**
   * Muestra el diálogo de confirmación antes de eliminar una nota.
   * @param {string} id - ID de la nota a eliminar
   */
  requestDeleteNote(id) {
    App.pendingDeleteId = id;
    const nota = App.notes.find(n => n.id === id);
    const nombre = nota ? `"${nota.title}"` : 'esta nota';
    document.getElementById('deleteConfirmMsg').textContent =
      `¿Está seguro que desea eliminar ${nombre}?`;
    document.getElementById('deleteConfirmDialog').classList.add('active');
    // Enfocar el botón "No" por defecto (acción segura)
    setTimeout(() => document.getElementById('deleteBtnNo').focus(), 50);
  },

  /** El usuario confirmó la eliminación */
  confirmDeleteNote() {
    const id = App.pendingDeleteId;
    App.pendingDeleteId = null;
    document.getElementById('deleteConfirmDialog').classList.remove('active');
    if (!id) return;

    App.notes = App.notes.filter(n => n.id !== id);
    App.saveNotes();

    // Seleccionar la siguiente nota disponible o crear una nueva
    if (App.currentNoteId === id) {
      if (App.notes.length > 0) App.selectNote(App.notes[0].id);
      else App.newNote();
    }
    App.renderNotesList();
  },

  /** El usuario canceló la eliminación */
  cancelDeleteNote() {
    App.pendingDeleteId = null;
    document.getElementById('deleteConfirmDialog').classList.remove('active');
  },

  // =========================================================
  // RENDERIZADO DE LA LISTA
  // =========================================================

  /**
   * Renderiza la lista de notas en el sidebar, aplicando el filtro de búsqueda.
   * Las notas se muestran ordenadas por fecha de modificación (más reciente primero).
   */
  renderNotesList() {
    const lista = document.getElementById('notesList');
    const query = App.searchQuery.toLowerCase().trim();

    // Filtrar notas según la búsqueda activa
    const notasFiltradas = query
      ? App.notes.filter(n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query))
      : App.notes;

    // Mensaje cuando no hay resultados
    if (notasFiltradas.length === 0) {
      lista.innerHTML = `<div class="notes-empty-msg">${
        query ? 'Sin resultados para "' + App.escapeHtml(query) + '"' : 'No hay notas'
      }</div>`;
      return;
    }

    // Generar HTML de las entradas
    lista.innerHTML = notasFiltradas.map(n => `
      <div class="note-entry ${n.id === App.currentNoteId ? 'active' : ''}"
           onclick="App.selectNote('${n.id}')"
           onkeydown="if(event.key==='Enter'||event.key===' ')App.selectNote('${n.id}')"
           role="option"
           aria-selected="${n.id === App.currentNoteId}"
           tabindex="0">
        <div class="note-entry-header">
          <div class="note-title-text">📄 ${App.escapeHtml(n.title)}</div>
          <button class="note-delete-btn"
                  onclick="event.stopPropagation(); App.requestDeleteNote('${n.id}')"
                  aria-label="Eliminar ${App.escapeHtml(n.title)}"
                  title="Eliminar nota"
                  tabindex="-1">✕</button>
        </div>
        <div class="note-date">${App.formatDate(n.modified)}</div>
      </div>
    `).join('');
  },

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  /**
   * Actualiza el filtro de búsqueda y re-renderiza la lista.
   * @param {string} query - Texto a buscar
   */
  handleSearch(query) {
    App.searchQuery = query;
    App.renderNotesList();
  },

  // =========================================================
  // UTILIDADES
  // =========================================================

  /**
   * Escapa caracteres HTML especiales para prevenir XSS.
   * @param {string} str - Texto a escapar
   * @returns {string} Texto seguro para insertar como HTML
   */
  escapeHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  },

  /**
   * Formatea una fecha ISO para mostrarla en la interfaz.
   * @param {string} iso - Fecha en formato ISO 8601
   * @returns {string} Fecha formateada
   */
  formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-CO', {
      day:    '2-digit',
      month:  '2-digit',
      year:   '2-digit',
      hour:   '2-digit',
      minute: '2-digit'
    });
  }

});
