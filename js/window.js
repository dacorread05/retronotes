/* =========================================================
   RetroNotes — window.js
   Módulo de controles de ventana: arrastre, minimizar,
   maximizar, cerrar y restaurar.
   ========================================================= */

Object.assign(App, {

  // =========================================================
  // ARRASTRE DE VENTANA
  // =========================================================

  /** Configura el arrastre de la ventana mediante la barra de título */
  setupDrag() {
    const barraTitle = document.getElementById('titleBar');
    const ventana    = document.getElementById('mainWindow');
    let arrastrando = false;
    let offsetX, offsetY;

    // Iniciar arrastre al presionar la barra de título
    barraTitle.addEventListener('mousedown', (e) => {
      // No arrastrar si se hace clic en los botones o si está maximizada/mobile
      if (e.target.closest('.title-btn') || App.isMaximized || window.innerWidth < 768) return;
      arrastrando = true;
      offsetX = e.clientX - ventana.offsetLeft;
      offsetY = e.clientY - ventana.offsetTop;
      barraTitle.style.cursor = 'grabbing';
      e.preventDefault(); // Evitar selección de texto al arrastrar
    });

    // Mover la ventana mientras se arrastra
    document.addEventListener('mousemove', (e) => {
      if (!arrastrando) return;
      ventana.style.left = (e.clientX - offsetX) + 'px';
      ventana.style.top  = (e.clientY - offsetY) + 'px';
    });

    // Finalizar arrastre al soltar el ratón
    document.addEventListener('mouseup', () => {
      arrastrando = false;
      barraTitle.style.cursor = 'grab';
    });

    // Doble clic en la barra de título = maximizar/restaurar
    barraTitle.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.title-btn')) App.toggleMaximize();
    });
  },

  // =========================================================
  // CONTROLES DE VENTANA
  // =========================================================

  /** Minimiza la ventana (la oculta, muestra como inactiva en la barra de tareas) */
  minimizeWindow() {
    document.getElementById('mainWindow').style.display = 'none';
    document.getElementById('taskbarApp').classList.remove('active');
  },

  /** Restaura la ventana desde la barra de tareas */
  restoreWindow() {
    document.getElementById('mainWindow').style.display = 'flex';
    document.getElementById('taskbarApp').classList.add('active');
    document.getElementById('editor').focus();
  },

  /** Alterna entre ventana normal y maximizada */
  toggleMaximize() {
    // No maximizar en modo móvil (ya es pantalla completa)
    if (window.innerWidth < 768) return;

    App.isMaximized = !App.isMaximized;
    document.getElementById('mainWindow').classList.toggle('maximized', App.isMaximized);

    // Cambiar el ícono del botón de maximizar
    const btnMaximizar = document.getElementById('btnMaximizar');
    if (btnMaximizar) {
      btnMaximizar.textContent = App.isMaximized ? '❐' : '☐';
      btnMaximizar.title = App.isMaximized ? 'Restaurar' : 'Maximizar';
    }
  },

  /**
   * Cierra la ventana. Si hay cambios sin guardar, muestra confirmación.
   * Si no hay cambios, guarda y cierra directamente.
   */
  closeWindow() {
    if (App.hasUnsavedChanges) {
      // Mostrar diálogo de confirmación para cambios no guardados
      App.showCloseConfirm();
      return;
    }
    // Guardar por si acaso y cerrar
    App.saveNote();
    App._ocultarVentana();
  },

  /** Oculta físicamente la ventana y actualiza la barra de tareas */
  _ocultarVentana() {
    document.getElementById('mainWindow').style.display = 'none';
    document.getElementById('taskbarApp').style.display = 'none';
  },

  /** Abre (o muestra) la ventana principal */
  openWindow() {
    const ventana     = document.getElementById('mainWindow');
    const taskbarApp  = document.getElementById('taskbarApp');
    ventana.style.display    = 'flex';
    taskbarApp.style.display = 'flex';
    taskbarApp.classList.add('active');
    document.getElementById('editor').focus();
  }

});
