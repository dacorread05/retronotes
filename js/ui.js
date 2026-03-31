/* =========================================================
   RetroNotes — ui.js
   Módulo de interfaz: diálogos, menús, reloj, exportar/importar,
   creador de ZIP sin dependencias externas.
   ========================================================= */

Object.assign(App, {

  // =========================================================
  // CONFIGURACIÓN DE UI
  // =========================================================

  /** Inicializa todos los eventos de la interfaz de usuario */
  setupUI() {
    // Cerrar menú contextual al hacer clic en cualquier parte
    document.addEventListener('click', () => {
      document.getElementById('contextMenu').classList.remove('active');
    });

    // Campo de búsqueda en el sidebar
    const campoBusqueda = document.getElementById('searchInput');
    if (campoBusqueda) {
      campoBusqueda.addEventListener('input', (e) => App.handleSearch(e.target.value));
      // Evitar que el clic en el campo propague y cierre menús
      campoBusqueda.addEventListener('click', (e) => e.stopPropagation());
    }

    // Input oculto para importar archivo .txt
    const inputTxt = document.getElementById('importTxtInput');
    if (inputTxt) {
      inputTxt.addEventListener('change', App.handleImportTxt);
    }

    // Input oculto para importar backup JSON
    const inputBackup = document.getElementById('importBackupInput');
    if (inputBackup) {
      inputBackup.addEventListener('change', App.handleImportBackup);
    }
  },

  // =========================================================
  // PANEL LATERAL (SIDEBAR)
  // =========================================================

  /** Alterna la visibilidad del panel lateral de notas */
  toggleSidebar() {
    if (window.innerWidth < 768) {
      // En móvil: abrir como drawer con overlay
      if (App.sidebarVisible) {
        App.closeMobileSidebar();
      } else {
        App.openMobileSidebar();
      }
    } else {
      // En escritorio: simplemente mostrar/ocultar
      App.sidebarVisible = !App.sidebarVisible;
      document.getElementById('sidebar').style.display =
        App.sidebarVisible ? 'flex' : 'none';
    }
  },

  // =========================================================
  // DIÁLOGO "ACERCA DE"
  // =========================================================

  showAbout() {
    document.getElementById('aboutDialog').classList.add('active');
    document.getElementById('aboutBtnOk').focus();
  },

  hideAbout() {
    document.getElementById('aboutDialog').classList.remove('active');
  },

  // =========================================================
  // DIÁLOGO DE ADVERTENCIA DE ALMACENAMIENTO
  // =========================================================

  showStorageWarning() {
    document.getElementById('storageWarningDialog').classList.add('active');
  },

  hideStorageWarning() {
    document.getElementById('storageWarningDialog').classList.remove('active');
  },

  // =========================================================
  // DESCARGA DE NOTA ACTUAL
  // =========================================================

  /** Descarga la nota activa como archivo .txt */
  downloadNote() {
    const nota = App.notes.find(n => n.id === App.currentNoteId);
    if (!nota) return;
    const blob = new Blob([nota.content], { type: 'text/plain;charset=utf-8' });
    App._descargarBlob(blob, `${App._sanitizarNombre(nota.title)}.txt`);
    App.setStatus('✓ Nota descargada');
    setTimeout(() => App.setStatus('Listo'), 2000);
  },

  // =========================================================
  // EXPORTAR TODAS LAS NOTAS COMO ZIP
  // =========================================================

  /** Exporta todas las notas como un archivo .zip */
  exportAllAsZip() {
    if (App.notes.length === 0) {
      App.setStatus('No hay notas para exportar');
      setTimeout(() => App.setStatus('Listo'), 2000);
      return;
    }

    // Preparar lista de archivos para el ZIP
    const archivos = App.notes.map(n => ({
      nombre:    `${App._sanitizarNombre(n.title)}.txt`,
      contenido: n.content
    }));

    // Manejar nombres duplicados (añadir sufijo numérico)
    const nombresUsados = {};
    archivos.forEach(a => {
      if (nombresUsados[a.nombre] !== undefined) {
        nombresUsados[a.nombre]++;
        const partes = a.nombre.split('.');
        const ext    = partes.pop();
        a.nombre = `${partes.join('.')}_${nombresUsados[a.nombre]}.${ext}`;
      } else {
        nombresUsados[a.nombre] = 0;
      }
    });

    // Generar ZIP y descargar
    const bytesZip = App._crearZip(archivos);
    const blob      = new Blob([bytesZip], { type: 'application/zip' });
    const fecha     = new Date().toISOString().split('T')[0];
    App._descargarBlob(blob, `retronotes_${fecha}.zip`);
    App.setStatus(`✓ ${App.notes.length} notas exportadas como ZIP`);
    setTimeout(() => App.setStatus('Listo'), 2500);
  },

  // =========================================================
  // IMPORTAR ARCHIVO .TXT
  // =========================================================

  /** Abre el selector de archivo para importar un .txt */
  importarTxt() {
    document.getElementById('importTxtInput').click();
  },

  /**
   * Procesa el archivo .txt importado y crea una nueva nota.
   * @param {Event} e - Evento change del input file
   */
  handleImportTxt(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (ev) => {
      const contenido = ev.target.result;
      const titulo    = archivo.name.replace(/\.txt$/i, '').substring(0, 40) || 'Nota importada';
      const nota      = App.createNote(titulo, contenido);
      App.selectNote(nota.id);
      App.setStatus(`✓ Importado: ${titulo}`);
      setTimeout(() => App.setStatus('Listo'), 2000);
    };
    lector.readAsText(archivo, 'UTF-8');
    e.target.value = ''; // Permitir reimportar el mismo archivo
  },

  // =========================================================
  // EXPORTAR BACKUP JSON
  // =========================================================

  /** Exporta todas las notas como archivo JSON de respaldo */
  exportarBackup() {
    const backup = {
      version:    '1.0',
      app:        'RetroNotes',
      exportDate: new Date().toISOString(),
      notes:      App.notes
    };
    const json  = JSON.stringify(backup, null, 2);
    const blob  = new Blob([json], { type: 'application/json;charset=utf-8' });
    const fecha = new Date().toISOString().split('T')[0];
    App._descargarBlob(blob, `retronotes_backup_${fecha}.json`);
    App.setStatus('✓ Backup exportado');
    setTimeout(() => App.setStatus('Listo'), 2000);
  },

  // =========================================================
  // IMPORTAR BACKUP JSON
  // =========================================================

  /** Abre el selector de archivo para importar un backup JSON */
  importarBackup() {
    document.getElementById('importBackupInput').click();
  },

  /**
   * Procesa el backup JSON e importa las notas (reemplaza las actuales).
   * @param {Event} e - Evento change del input file
   */
  handleImportBackup(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup.notes || !Array.isArray(backup.notes)) {
          throw new Error('Formato de backup inválido');
        }
        // Validar estructura mínima de cada nota
        const notasValidas = backup.notes.filter(n =>
          n.id && typeof n.title === 'string' && typeof n.content === 'string'
        );
        if (notasValidas.length === 0) throw new Error('No se encontraron notas válidas');

        App.notes = notasValidas;
        App.saveNotes();
        App.renderNotesList();
        if (App.notes.length > 0) App.selectNote(App.notes[0].id);

        App.setStatus(`✓ ${notasValidas.length} notas importadas desde backup`);
        setTimeout(() => App.setStatus('Listo'), 2500);
      } catch (err) {
        App.setStatus('✗ Error al importar: archivo inválido');
        setTimeout(() => App.setStatus('Listo'), 3000);
      }
    };
    lector.readAsText(archivo, 'UTF-8');
    e.target.value = '';
  },

  // =========================================================
  // UTILIDADES INTERNAS
  // =========================================================

  /**
   * Sanitiza un nombre para usarlo como nombre de archivo.
   * Elimina caracteres no permitidos.
   * @param {string} nombre
   * @returns {string}
   */
  _sanitizarNombre(nombre) {
    return String(nombre)
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .trim()
      .substring(0, 60) || 'nota';
  },

  /**
   * Descarga un Blob como archivo en el navegador.
   * @param {Blob}   blob     - Datos a descargar
   * @param {string} nombre   - Nombre del archivo
   */
  _descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // =========================================================
  // CREADOR DE ARCHIVOS ZIP (sin dependencias externas)
  // Implementa el formato ZIP con método de compresión "stored" (sin compresión)
  // según la especificación PKZIP (APPNOTE.TXT).
  // =========================================================

  /**
   * Crea un archivo ZIP con los archivos proporcionados.
   * @param {Array<{nombre: string, contenido: string}>} archivos
   * @returns {Uint8Array} Bytes del archivo ZIP
   */
  _crearZip(archivos) {
    const codificador = new TextEncoder();

    // Convierte número a entero de 2 bytes en little-endian
    function u16(n) {
      return [(n & 0xff), ((n >> 8) & 0xff)];
    }

    // Convierte número a entero de 4 bytes en little-endian
    function u32(n) {
      return [
        (n & 0xff),
        ((n >> 8)  & 0xff),
        ((n >> 16) & 0xff),
        ((n >> 24) & 0xff)
      ];
    }

    // Precalcular tabla CRC32 (algoritmo estándar)
    const tablaCRC = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      tablaCRC[i] = c;
    }

    // Calcula el CRC32 de un Uint8Array
    function calcularCRC32(datos) {
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < datos.length; i++) {
        crc = tablaCRC[(crc ^ datos[i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const entradasLocales   = []; // Un Uint8Array por archivo (encabezado + datos)
    const entradasCentral   = []; // Un Uint8Array por archivo (directorio central)
    let offsetActual = 0;         // Posición del archivo actual en el ZIP

    for (const archivo of archivos) {
      const nombreBytes  = codificador.encode(archivo.nombre);
      const datosBytes   = codificador.encode(archivo.contenido);
      const crc          = calcularCRC32(datosBytes);
      const tamano       = datosBytes.length;

      // --- Encabezado local del archivo (Local File Header) ---
      // Firma: PK\x03\x04
      const encabezadoLocalArr = [
        0x50, 0x4B, 0x03, 0x04,    // Firma
        0x14, 0x00,                  // Versión necesaria: 2.0
        0x00, 0x00,                  // Bits de uso general
        0x00, 0x00,                  // Método de compresión: stored
        0x00, 0x00,                  // Hora de última modificación
        0x00, 0x00,                  // Fecha de última modificación
        ...u32(crc),                 // CRC-32
        ...u32(tamano),              // Tamaño comprimido
        ...u32(tamano),              // Tamaño sin comprimir
        ...u16(nombreBytes.length),  // Longitud del nombre de archivo
        0x00, 0x00,                  // Longitud del campo extra
      ];

      // Combinar encabezado + nombre + datos en un solo Uint8Array
      const entradaLocal = new Uint8Array(
        encabezadoLocalArr.length + nombreBytes.length + datosBytes.length
      );
      entradaLocal.set(new Uint8Array(encabezadoLocalArr), 0);
      entradaLocal.set(nombreBytes, encabezadoLocalArr.length);
      entradaLocal.set(datosBytes, encabezadoLocalArr.length + nombreBytes.length);

      // --- Encabezado del directorio central (Central Directory Header) ---
      // Firma: PK\x01\x02
      const encabezadoCentralArr = [
        0x50, 0x4B, 0x01, 0x02,    // Firma
        0x14, 0x00,                  // Versión creada por
        0x14, 0x00,                  // Versión necesaria
        0x00, 0x00,                  // Bits de uso general
        0x00, 0x00,                  // Método de compresión: stored
        0x00, 0x00,                  // Hora de modificación
        0x00, 0x00,                  // Fecha de modificación
        ...u32(crc),
        ...u32(tamano),
        ...u32(tamano),
        ...u16(nombreBytes.length),  // Longitud del nombre
        0x00, 0x00,                  // Longitud campo extra
        0x00, 0x00,                  // Longitud del comentario
        0x00, 0x00,                  // Disco donde inicia
        0x00, 0x00,                  // Atributos internos
        0x00, 0x00, 0x00, 0x00,      // Atributos externos
        ...u32(offsetActual),        // Offset del encabezado local
      ];

      const entradaCentral = new Uint8Array(
        encabezadoCentralArr.length + nombreBytes.length
      );
      entradaCentral.set(new Uint8Array(encabezadoCentralArr), 0);
      entradaCentral.set(nombreBytes, encabezadoCentralArr.length);

      entradasLocales.push(entradaLocal);
      entradasCentral.push(entradaCentral);
      offsetActual += entradaLocal.length;
    }

    // Calcular tamaño y offset del directorio central
    const offsetDirCentral = offsetActual;
    const tamanoDirCentral = entradasCentral.reduce((s, e) => s + e.length, 0);

    // --- Fin del directorio central (End of Central Directory) ---
    // Firma: PK\x05\x06
    const finDirArr = [
      0x50, 0x4B, 0x05, 0x06,           // Firma
      0x00, 0x00,                         // Número de disco
      0x00, 0x00,                         // Disco con inicio del dir central
      ...u16(archivos.length),            // Entradas en este disco
      ...u16(archivos.length),            // Total de entradas
      ...u32(tamanoDirCentral),           // Tamaño del directorio central
      ...u32(offsetDirCentral),           // Offset del directorio central
      0x00, 0x00,                         // Longitud del comentario del ZIP
    ];
    const finDir = new Uint8Array(finDirArr);

    // Combinar todo en el Uint8Array final
    const tamanoTotal = entradasLocales.reduce((s, e) => s + e.length, 0) +
                        tamanoDirCentral + finDir.length;
    const resultado   = new Uint8Array(tamanoTotal);
    let posicion      = 0;

    for (const e of entradasLocales)  { resultado.set(e, posicion); posicion += e.length; }
    for (const e of entradasCentral)  { resultado.set(e, posicion); posicion += e.length; }
    resultado.set(finDir, posicion);

    return resultado;
  }

});
