/* ==========================================================================
   PROTOTIPO · Mis Vacaciones
   NO ES PARTE DEL ENTREGABLE. Solo lo carga prototipo.html.

   Acá vive lo que es propio de esta maqueta: los datos de prueba, los
   escenarios (que se eligen por URL, ver el final del archivo) y la lógica
   de negocio de la pantalla: contador de días, filtros y paginación.

   El comportamiento de los componentes —desplegables, calendario, diálogos,
   sidebar— NO está acá: está en js/componentes.js, que sí se puede llevar a
   producción. Este archivo solo escucha los eventos que aquel emite.
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const F  = window.Componentes.fecha;

  /* ----------------------------------------------------------------------
     DATOS DE PRUEBA
     ---------------------------------------------------------------------- */

  const ESTADOS = {
    aprobado:  { etiqueta: 'Aprobado'  },
    rechazado: { etiqueta: 'Rechazado' },
    pendiente: { etiqueta: 'Pendiente' },
  };

  // Rangos variados a propósito: un solo día, cruce de año, nombres largos.
  // [rango, días, aprobador]
  const RANGOS = [
    ['15 de Enero - 20 de Enero 2026',             6, 'Daniela Soto'],
    ['02 de Agosto 2025',                          1, 'Andrés Silva'],
    ['28 de Diciembre 2025 - 06 de Enero 2026',   10, 'Daniela Soto'],
    ['15 de Marzo - 16 de Marzo 2025',             2, 'Andrés Silva'],
    ['01 de Febrero - 12 de Febrero 2025',         9, 'Daniela Soto'],
    ['30 de Abril 2025',                           1, 'Andrés Silva'],
    ['11 de Septiembre - 15 de Septiembre 2025',   5, 'Daniela Soto'],
    ['22 de Octubre - 03 de Noviembre 2025',       9, 'María Fernanda Valenzuela Echeverría'],
    ['07 de Junio - 09 de Junio 2025',             3, 'Daniela Soto'],
    ['18 de Mayo - 19 de Mayo 2025',               2, 'Andrés Silva'],
    ['25 de Noviembre - 29 de Noviembre 2025',     5, 'Daniela Soto'],
    ['03 de Enero - 07 de Enero 2025',             5, 'Daniela Soto'],
  ];

  const SECUENCIA = ['pendiente', 'aprobado', 'aprobado', 'rechazado',
                     'aprobado', 'rechazado', 'aprobado', 'aprobado',
                     'aprobado', 'aprobado', 'rechazado', 'aprobado'];

  const solicitudes = n => Array.from({ length: n }, (_, i) => {
    const [rango, dias, aprobador] = RANGOS[i % RANGOS.length];
    const estado = SECUENCIA[i % SECUENCIA.length];
    // Una solicitud pendiente todavía no tiene quién la resolvió
    return { id: i + 1, estado, rango, dias,
             aprobador: estado === 'pendiente' ? '—' : aprobador };
  });

  const PERSONAS = ['Juan Pablo Ramos', 'Daniela Soto', 'Andrés Silva',
                    'Camila Pérez', 'María Fernanda Valenzuela Echeverría'];

  const COMENTARIOS = [
    'Dejo las pruebas cerradas y Juan Pablo cubrirá el seguimiento del lunes.',
    '',
    'Viaje familiar ya comprometido. Dejo el traspaso documentado en Confluence, ' +
    'con los accesos al tablero y el contacto del proveedor por si hay que ' +
    'escalar algo mientras no estoy.',
  ];

  const d = n => F.sumarDias(F.hoy(), n);

  const ESCENARIOS = {
    normal: {
      nombre: 'Normal', detalle: '12 solicitudes · saldo 10',
      balance: { historico: 68, disponibles: 10, pendientes: 2 },
      solicitudes: solicitudes(12),
      form: { salida: d(14), regreso: d(21), persona: 0, comentario: 0 },
    },
    pocas: {
      nombre: 'Pocas solicitudes', detalle: '3 solicitudes · rejilla a medio llenar',
      balance: { historico: 12, disponibles: 7, pendientes: 0 },
      solicitudes: solicitudes(3),
      form: { salida: d(7), regreso: d(12), persona: 1, comentario: 0 },
    },
    vacio: {
      nombre: 'Sin solicitudes', detalle: 'historial sin ninguna fila',
      balance: { historico: 0, disponibles: 15, pendientes: 0 },
      solicitudes: [],
      form: { salida: null, regreso: null, persona: null, comentario: 1 },
    },
    sinSaldo: {
      nombre: 'Saldo agotado', detalle: '0 días disponibles',
      balance: { historico: 94, disponibles: 0, pendientes: 4 },
      solicitudes: solicitudes(8),
      form: { salida: d(30), regreso: d(37), persona: 0, comentario: 0 },
    },
    excede: {
      nombre: 'Excede el saldo', detalle: 'pide más días de los que tiene',
      balance: { historico: 68, disponibles: 3, pendientes: 2 },
      solicitudes: solicitudes(12),
      form: { salida: d(10), regreso: d(31), persona: 2, comentario: 0 },
    },
    textosLargos: {
      nombre: 'Textos largos', detalle: 'nombres y comentarios que desbordan',
      balance: { historico: 148, disponibles: 23, pendientes: 11 },
      solicitudes: solicitudes(12),
      form: { salida: d(45), regreso: d(60), persona: 4, comentario: 2 },
    },
  };

  const OPCIONES_FILTRO = {
    orden:  ['Más recientes', 'Más antiguas', 'Más días'],
    rango:  ['Todos', 'Este año', 'Últimos 6 meses'],
    estado: ['Todos', 'Aprobadas', 'Pendientes', 'Rechazadas'],
  };

  const POR_PAGINA = 8;

  /* ----------------------------------------------------------------------
     ESTADO
     ---------------------------------------------------------------------- */

  const st = {
    escenario: 'normal',
    salida: null, regreso: null, persona: null, comentario: 0,
    filtro: { orden: 0, rango: 0, estado: 0 },
    pagina: 0,
  };

  const actual = () => ESCENARIOS[st.escenario];

  function cargarEscenario(clave) {
    st.escenario = clave;
    const f = ESCENARIOS[clave].form;
    st.salida = f.salida; st.regreso = f.regreso;
    st.persona = f.persona; st.comentario = f.comentario;
    st.filtro = { orden: 0, rango: 0, estado: 0 };
    st.pagina = 0;
  }

  /* ----------------------------------------------------------------------
     RENDER
     ---------------------------------------------------------------------- */

  const dosDigitos = n => String(n).padStart(2, '0');

  function pintarValor(clave, texto, placeholder) {
    const nodo = $(`#campo-${clave} [data-valor]`);
    nodo.textContent = texto ?? placeholder;
    nodo.classList.toggle('c-field__value--placeholder', texto == null);
  }

  /** Vuelca una lista de opciones dentro del popover de un desplegable.
      El abrir/cerrar/elegir lo maneja componentes.js por delegación. */
  function pintarOpciones(clave, opciones, elegida) {
    const ul = $(`#pop-${clave} .c-select__list`);
    ul.innerHTML = opciones.map((texto, i) =>
      `<li class="c-select__option" role="option" tabindex="-1"` +
      ` data-valor="${i}" aria-selected="${i === elegida}">${texto}</li>`).join('');
  }

  function sincronizarCalendarios() {
    const cs = $('#sel-salida [data-calendario]');
    const cr = $('#sel-regreso [data-calendario]');
    cs.dataset.valor = F.aISO(st.salida);
    cr.dataset.valor = F.aISO(st.regreso);
    // Tiñe el tramo entre salida y regreso en los dos meses
    [cs, cr].forEach(c => {
      c.dataset.rangoIni = F.aISO(st.salida);
      c.dataset.rangoFin = F.aISO(st.regreso);
      delete c.dataset.mesVisible;   // que se reposicione en el mes de la fecha elegida
    });
  }

  function pintarBalance() {
    const b = actual().balance;
    // El tile de total histórico se quitó del diseño, pero el dato sigue en
    // los escenarios por si vuelve: se pinta solo si el nodo existe.
    const poner = (sel, valor) => {
      const n = $(sel);
      if (n) n.textContent = dosDigitos(valor);
    };
    poner('[data-total-historico]', b.historico);
    poner('[data-disponibles]',     b.disponibles);
    poner('[data-pendientes]',      b.pendientes);
  }

  function pintarIdentidad() {
    if (!$('#sidebar')) return;
    $('[data-org]').textContent = 'Inelcom';
    $('[data-usuario]').textContent = st.escenario === 'textosLargos'
      ? 'María Fernanda Valenzuela Echeverría'
      : 'Raúl Gabriel Berríos Jofré';
  }

  /* --- Lógica de negocio: contador de días -------------------------------
     Esto es lo que NO va en componentes.js. El componente avisa que la
     fecha cambió; qué significa eso lo decide la pantalla.               */

  function pintarContador() {
    const pedidos     = F.diasHabiles(st.salida, st.regreso);
    const disponibles = actual().balance.disponibles;
    const badge = $('#badge-dias');
    const aviso = $('#aviso-saldo');
    const btn   = $('#btn-enviar');

    badge.className = 'c-badge';

    if (pedidos == null) {
      badge.textContent = 'días a utilizar';
      aviso.hidden = true;
      btn.disabled = true;
      return;
    }

    // Un rango que cae entero en fin de semana no tiene días que descontar:
    // vale como error, no como solicitud de cero días.
    if (pedidos === 0) {
      badge.classList.add('c-badge--wrong');
      badge.textContent = 'sin días hábiles';
      aviso.hidden = false;
      $('span', aviso).textContent =
        'El rango elegido no incluye ningún día hábil. Revisa las fechas.';
      btn.disabled = true;
      return;
    }

    badge.textContent = `${pedidos} días a utilizar`;

    if (pedidos > disponibles) {
      badge.classList.add('c-badge--wrong');
      aviso.hidden = false;
      $('span', aviso).textContent =
        `Estás pidiendo ${pedidos} días hábiles y tienes ${disponibles} disponibles.`;
      btn.disabled = true;
    } else {
      badge.classList.add('c-badge--right');
      aviso.hidden = true;
      btn.disabled = false;
    }
  }

  function pintarFormulario() {
    pintarValor('salida',  st.salida  && F.formatoLargo(st.salida),  'Selecciona una fecha');
    pintarValor('regreso', st.regreso && F.formatoLargo(st.regreso), 'Selecciona una fecha');
    pintarValor('reemplazo', st.persona == null ? null : PERSONAS[st.persona],
                'Selecciona una persona');
    $('#comentario').value = COMENTARIOS[st.comentario];

    pintarOpciones('reemplazo', PERSONAS, st.persona);
    sincronizarCalendarios();
    pintarContador();
  }

  function pintarFiltros() {
    Object.entries(OPCIONES_FILTRO).forEach(([clave, opciones]) => {
      pintarValor(clave, opciones[st.filtro[clave]], '—');
      pintarOpciones(clave, opciones, st.filtro[clave]);
    });
  }

  function filtradas() {
    let lista = [...actual().solicitudes];

    const porEstado = OPCIONES_FILTRO.estado[st.filtro.estado];
    if (porEstado !== 'Todos') {
      const clave = { Aprobadas: 'aprobado', Pendientes: 'pendiente',
                      Rechazadas: 'rechazado' }[porEstado];
      lista = lista.filter(s => s.estado === clave);
    }

    const porRango = OPCIONES_FILTRO.rango[st.filtro.rango];
    if (porRango === 'Este año')             lista = lista.filter(s => s.id % 2 === 1);
    else if (porRango === 'Últimos 6 meses') lista = lista.filter(s => s.id <= 4);

    const orden = OPCIONES_FILTRO.orden[st.filtro.orden];
    if (orden === 'Más antiguas') lista.reverse();
    else if (orden === 'Más días') lista.sort((a, b) => b.dias - a.dias);

    return lista;
  }

  function vacio({ icono, titulo, texto, compacto }) {
    const maleta = icono === 'maleta' ? ' c-icon--maleta' : '';
    return `
      <div class="c-empty${compacto ? ' c-empty--compact' : ''}">
        <span class="c-empty__bubble">
          <svg class="c-icon${maleta}" aria-hidden="true"><use href="#i-${icono}"/></svg>
        </span>
        <p class="c-empty__title">${titulo}</p>
        <p class="c-empty__text">${texto}</p>
      </div>`;
  }

  function pintarHistorial() {
    const grid  = $('#historial');
    const tabla = $('#tabla');
    const hueco = $('#historial-vacio');
    const nota  = $('[data-nota-historial]');
    const nav   = $('.c-pagination__nav');
    const todas = actual().solicitudes;
    const lista = filtradas();

    grid.textContent = '';
    hueco.textContent = '';
    tabla.hidden = false;

    if (todas.length === 0) {
      nota.textContent = 'Sin solicitudes';
      nav.hidden = true;
      tabla.hidden = true;
      hueco.innerHTML = vacio({
        icono: 'maleta',
        titulo: 'Todavía no tienes solicitudes',
        texto: 'Cuando ingreses tu primera solicitud de vacaciones aparecerá ' +
               'acá, con su estado y el detalle de los días.',
      });
      return;
    }

    if (lista.length === 0) {
      nota.textContent = `Mostrando 0 de ${todas.length} solicitudes`;
      nav.hidden = true;
      tabla.hidden = true;
      hueco.innerHTML = vacio({
        icono: 'search',
        titulo: 'Ninguna solicitud con estos filtros',
        texto: 'Prueba ampliando el rango de fechas o el estado.',
        compacto: true,
      });
      return;
    }

    const paginas = Math.ceil(lista.length / POR_PAGINA);
    st.pagina = Math.min(st.pagina, paginas - 1);
    const desde  = st.pagina * POR_PAGINA;
    const pagina = lista.slice(desde, desde + POR_PAGINA);

    nav.hidden = paginas <= 1;
    $('#pag-anterior').disabled  = st.pagina === 0;
    $('#pag-siguiente').disabled = st.pagina >= paginas - 1;
    nota.textContent = `Mostrando ${pagina.length} de ${lista.length} solicitudes`;

    const molde = $('#tpl-row');
    pagina.forEach(sol => {
      const nodo = molde.content.cloneNode(true);
      const fila = $('.c-table__row', nodo);
      const info = ESTADOS[sol.estado];

      fila.classList.add(`c-table__row--${sol.estado}`);

      $('[data-rango]', nodo).textContent = sol.rango;
      $('.c-table__dias', nodo).textContent = `${sol.dias} días`;
      $('.c-table__aprobador', nodo).textContent = sol.aprobador;

      const etiqueta = $('.c-tag', nodo);
      etiqueta.classList.add(`c-tag--${sol.estado}`);
      etiqueta.textContent = info.etiqueta;

      // La fila entera abre el drawer: el enlace del rango está estirado
      // sobre ella con un ::after, así que basta escucharlo a él.
      $('.c-table__link', nodo).addEventListener('click', ev => {
        ev.preventDefault();
        abrirDetalle(sol);
      });

      grid.append(nodo);
    });
  }

  function pintar() {
    pintarIdentidad();
    pintarBalance();
    pintarFormulario();
    pintarFiltros();
    pintarHistorial();
  }

  /* ----------------------------------------------------------------------
     DRAWER Y MODAL
     El abrir/cerrar lo hace componentes.js; acá solo se rellenan.
     ---------------------------------------------------------------------- */

  function rellenar(prefijo) {
    const guion = '—';
    $(`[data-${prefijo}-salida]`).textContent    = st.salida  ? F.formatoLargo(st.salida)  : guion;
    $(`[data-${prefijo}-regreso]`).textContent   = st.regreso ? F.formatoLargo(st.regreso) : guion;
    $(`[data-${prefijo}-reemplazo]`).textContent = st.persona == null ? guion : PERSONAS[st.persona];
    $(`[data-${prefijo}-comentario]`).textContent = COMENTARIOS[st.comentario] || 'Sin comentario';
  }

  function abrirDetalle(s) {
    const info = ESTADOS[s.estado];
    const chip = $('[data-detalle-estado]');
    chip.className = `c-status c-status--${s.estado}`;
    chip.textContent = info.etiqueta;
    $('[data-detalle-rango]').textContent = s.rango;

    const badge = $('[data-detalle-badge]');
    badge.className = 'c-badge c-badge--wrong';
    badge.textContent = `${s.dias} días solicitados`;

    rellenar('detalle');
    $('#drawer-detalle').showModal();
  }

  /* ----------------------------------------------------------------------
     ESCUCHAS · así se conecta una pantalla a componentes.js
     ---------------------------------------------------------------------- */

  document.addEventListener('fecha:cambio', ev => {
    const id = ev.target.id;
    if (id === 'campo-salida') {
      st.salida = ev.detail.fecha;
      // Si el regreso quedó antes de la salida, se corre
      if (st.regreso && st.regreso <= st.salida) st.regreso = F.sumarDias(st.salida, 1);
    }
    if (id === 'campo-regreso') st.regreso = ev.detail.fecha;
    pintarFormulario();
  });

  document.addEventListener('campo:cambio', ev => {
    const id = ev.target.id;
    const i  = Number(ev.detail.valor);
    if (id === 'campo-reemplazo') { st.persona = i; pintarFormulario(); return; }
    if (['campo-orden', 'campo-rango', 'campo-estado'].includes(id)) {
      st.filtro[id.replace('campo-', '')] = i;
      st.pagina = 0;
      pintarFiltros();
      pintarHistorial();
    }
  });

  $('#form-solicitud').addEventListener('submit', ev => {
    ev.preventDefault();
    const pedidos = F.diasHabiles(st.salida, st.regreso);
    $('[data-confirma-badge]').textContent = `${pedidos} días a utilizar`;
    rellenar('confirma');
    $('#modal-confirmacion').showModal();
  });

  $('#pag-anterior').addEventListener('click',  () => { st.pagina--; pintarHistorial(); });
  $('#pag-siguiente').addEventListener('click', () => { st.pagina++; pintarHistorial(); });

  function leerURL() {
    const q = new URLSearchParams(location.search);

    const escenario = q.get('escenario');
    if (escenario && ESCENARIOS[escenario]) cargarEscenario(escenario);
    else cargarEscenario('normal');

    const sb = q.get('sidebar');
    const aside = $('#sidebar');
    if (sb === 'no') aside?.remove();
    else if (sb === 'expandido') {
      aside?.classList.add('c-sidebar--expanded');
      $('#sidebar-toggle')?.setAttribute('aria-expanded', 'true');
    }
  }

  /* ---------------------------------------------------------------------- */

  leerURL();
  pintar();
})();
