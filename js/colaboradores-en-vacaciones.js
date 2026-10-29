/* ==========================================================================
   COLABORADORES EN VACACIONES

   Pinta las dos mitades de la pantalla —la línea de tiempo y la tabla— a
   partir de un mismo conjunto de tramos aprobados.

   QUÉ HAY QUE CAMBIAR AL CONECTAR EL BACKEND
   Solo EQUIPO y TRAMOS, que son datos de muestra. El resto del archivo ya
   consume la forma final:

     EQUIPO: [{ id, nombre, cargo }]
     TRAMOS: [{ persona: id, desde: Date, hasta: Date, reemplazo }]

   En la intranet de verdad el backend manda las fechas en ISO
   ("2026-11-03") y acá bastaría con `new Date(...)`. Acá se generan como
   días contados desde hoy para que la maqueta nunca se vea vacía ni
   caduque: si la abres en marzo, las vacaciones también son de marzo.

   Solo entran tramos APROBADOS. Los pendientes viven en aprobaciones.html
   y los ya terminados, en el panel de seguimiento.

   Los feriados salen de js/festivos-chile.js, el mismo archivo que usa la
   lista del home. Si no está cargado, los días hábiles se cuentan solo de
   lunes a viernes y el calendario no los marca.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     DATOS DE MUESTRA · DESECHABLE
     ====================================================================== */

  const EQUIPO = [
    { id: "camila", nombre: "Camila Arriagada", cargo: "Analista de procesos" },
    { id: "ignacio", nombre: "Ignacio Fuentealba", cargo: "Desarrollo" },
    { id: "valentina", nombre: "Valentina Rojas", cargo: "Diseño" },
    { id: "matias", nombre: "Matías Cárdenas", cargo: "Soporte TI" },
    { id: "francisca", nombre: "Francisca Oyarzún", cargo: "Administración" },
    { id: "rodrigo", nombre: "Rodrigo Villablanca", cargo: "Jefatura de proyecto" },
    { id: "antonia", nombre: "Antonia Méndez", cargo: "Recursos Humanos" },
    { id: "sebastian", nombre: "Sebastián Garrido", cargo: "Infraestructura" },
  ];

  // `desde` y `hasta` son días contados desde hoy. Ver la cabecera.
  const TRAMOS_MUESTRA = [
    { persona: "sebastian", desde: -14, hasta: -8, reemplazo: "Matías Cárdenas" },
    { persona: "camila", desde: -6, hasta: 2, reemplazo: "Rodrigo Villablanca" },
    { persona: "matias", desde: -2, hasta: 5, reemplazo: "Sebastián Garrido" },
    { persona: "valentina", desde: 1, hasta: 12, reemplazo: "Antonia Méndez" },
    { persona: "ignacio", desde: 4, hasta: 8, reemplazo: "Sebastián Garrido" },
    { persona: "francisca", desde: 9, hasta: 23, reemplazo: "Antonia Méndez" },
    { persona: "rodrigo", desde: 15, hasta: 19, reemplazo: "Camila Arriagada" },
    { persona: "antonia", desde: 26, hasta: 40, reemplazo: "Francisca Oyarzún" },
    { persona: "camila", desde: 30, hasta: 34, reemplazo: "Ignacio Fuentealba" },
  ];

  /* ======================================================================
     FECHAS
     ====================================================================== */

  const MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  // Inicial del día, para la cabecera de la línea de tiempo.
  const INICIALES_DIA = ["D", "L", "M", "M", "J", "V", "S"];

  const HOY = new Date();
  HOY.setHours(0, 0, 0, 0);

  function suma(fecha, dias) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    return d;
  }

  function clave(fecha) {
    return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
  }

  function mismoDia(a, b) {
    return clave(a) === clave(b);
  }

  function largo(fecha) {
    return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
  }

  /* --- Feriados, de js/festivos-chile.js -------------------------------- */

  const FERIADOS = new Map();
  if (typeof getChileHolidays === "function") {
    const año = HOY.getFullYear();
    [año - 1, año, año + 1].forEach((a) => {
      getChileHolidays(a).forEach((f) => FERIADOS.set(clave(f.date), f.name));
    });
  }

  function esFinde(fecha) {
    const d = fecha.getDay();
    return d === 0 || d === 6;
  }

  // Hábil es de lunes a viernes y que no sea feriado. El sábado no cuenta:
  // el artículo 69 del Código del Trabajo lo da por inhábil para vacaciones.
  function esHabil(fecha) {
    return !esFinde(fecha) && !FERIADOS.has(clave(fecha));
  }

  function diasHabiles(desde, hasta) {
    let n = 0;
    for (let d = new Date(desde); d <= hasta; d = suma(d, 1)) {
      if (esHabil(d)) n += 1;
    }
    return n;
  }

  /* ======================================================================
     LOS TRAMOS, YA CON FECHAS
     ====================================================================== */

  const PERSONA = new Map(EQUIPO.map((p) => [p.id, p]));

  const TRAMOS = TRAMOS_MUESTRA.map((t, i) => {
    const desde = suma(HOY, t.desde);
    const hasta = suma(HOY, t.hasta);
    return {
      id: `tramo-${i}`,
      persona: PERSONA.get(t.persona),
      desde,
      hasta,
      reemplazo: t.reemplazo,
      habiles: diasHabiles(desde, hasta),
      enCurso: desde <= HOY && HOY <= hasta,
    };
  }).sort((a, b) => a.desde - b.desde);

  function iniciales(nombre) {
    return nombre
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  /* ======================================================================
     FILTRO Y PAGINACIÓN

     Con un equipo chico sobran los dos; con cincuenta personas, no. El
     buscador filtra las dos vistas a la vez —la línea de tiempo y la
     tabla— para que no muestren cosas distintas, y la tabla pagina de a
     diez: o paginación o scroll, nunca las dos.
     ====================================================================== */

  const POR_PAGINA = 10;
  let filtro = "";
  let pagina = 0;

  function sinTildes(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function coincide(persona) {
    if (!filtro) return true;
    return sinTildes(`${persona.nombre} ${persona.cargo}`).includes(filtro);
  }

  function avisaVacio(caja, hayFiltro) {
    caja.querySelector(".c-empty__title").textContent = hayFiltro
      ? "Nadie coincide con la búsqueda"
      : caja.dataset.titulo;
    caja.querySelector(".c-empty__text").textContent = hayFiltro
      ? "Prueba con otro nombre o limpia el buscador."
      : caja.dataset.texto;
  }

  /* ======================================================================
     LÍNEA DE TIEMPO
     ====================================================================== */

  // Mes que se está mirando. Siempre el día 1, para no arrastrar horas.
  let mes = new Date(HOY.getFullYear(), HOY.getMonth(), 1);

  function pintaCalendario() {
    const grilla = document.querySelector("[data-timeline]");
    const rotulo = document.querySelector("[data-timeline-mes]");
    const vacio = document.querySelector("[data-timeline-vacio]");
    if (!grilla) return;

    const año = mes.getFullYear();
    const numero = mes.getMonth();
    const dias = new Date(año, numero + 1, 0).getDate();
    const primero = new Date(año, numero, 1);
    const ultimo = new Date(año, numero, dias);

    const nombreMes = MESES[numero];
    rotulo.textContent = `${nombreMes[0].toUpperCase()}${nombreMes.slice(1)} de ${año}`;
    grilla.style.setProperty("--dias", dias);
    grilla.innerHTML = "";

    /* --- Cabecera: los días del mes ------------------------------------ */

    const cabecera = document.createElement("div");
    cabecera.className = "s-envac__fila s-envac__fila--cabecera";
    cabecera.appendChild(celdaPersona("Colaborador", null, "s-envac__rotulo"));

    const pistaCabecera = document.createElement("div");
    pistaCabecera.className = "s-envac__pista";
    for (let i = 1; i <= dias; i += 1) {
      const fecha = new Date(año, numero, i);
      const dia = document.createElement("span");
      dia.className = "s-envac__dia" + clasesDeDia(fecha);
      const feriado = FERIADOS.get(clave(fecha));
      if (feriado) dia.title = feriado;
      dia.innerHTML =
        `<span class="s-envac__diaSemana">${INICIALES_DIA[fecha.getDay()]}</span>` +
        `<span class="s-envac__diaNumero">${i}</span>`;
      pistaCabecera.appendChild(dia);
    }
    cabecera.appendChild(pistaCabecera);
    grilla.appendChild(cabecera);

    /* --- Una fila por persona con vacaciones en el mes ----------------- */

    const delMes = TRAMOS.filter(
      (t) => t.desde <= ultimo && t.hasta >= primero && coincide(t.persona),
    );
    const porPersona = new Map();
    delMes.forEach((t) => {
      if (!porPersona.has(t.persona.id)) porPersona.set(t.persona.id, []);
      porPersona.get(t.persona.id).push(t);
    });

    vacio.hidden = porPersona.size > 0;
    grilla.hidden = porPersona.size === 0;
    if (!vacio.hidden) avisaVacio(vacio, Boolean(filtro));

    porPersona.forEach((tramos, id) => {
      const persona = PERSONA.get(id);
      const fila = document.createElement("div");
      fila.className = "s-envac__fila";
      fila.appendChild(celdaPersona(persona.nombre, persona.cargo));

      const pista = document.createElement("div");
      pista.className = "s-envac__pista";

      for (let i = 1; i <= dias; i += 1) {
        const celda = document.createElement("span");
        celda.className = "s-envac__celda" + clasesDeDia(new Date(año, numero, i));
        pista.appendChild(celda);
      }

      tramos.forEach((t) => pista.appendChild(barra(t, primero, ultimo, dias)));
      fila.appendChild(pista);
      grilla.appendChild(fila);
    });
  }

  function clasesDeDia(fecha) {
    // Clases de estado que comparten la cabecera (.s-envac__dia) y las
    // celdas de cada fila (.s-envac__celda).
    let c = "";
    if (esFinde(fecha)) c += " s-envac__finde";
    if (FERIADOS.has(clave(fecha))) c += " s-envac__feriado";
    if (mismoDia(fecha, HOY)) c += " s-envac__hoy";
    return c;
  }

  function celdaPersona(nombre, cargo, clase) {
    const celda = document.createElement("div");
    celda.className = clase || "s-envac__persona";
    if (clase) {
      celda.textContent = nombre;
      return celda;
    }
    celda.innerHTML =
      `<span class="c-persona">` +
      `<span class="c-avatar c-avatar--iniciales" aria-hidden="true">${iniciales(nombre)}</span>` +
      `<span class="c-persona__datos">` +
      `<span class="c-persona__nombre">${nombre}</span>` +
      `<span class="c-persona__cargo">${cargo}</span>` +
      `</span></span>`;
    return celda;
  }

  // La barra se recorta al mes que se está mirando; si el tramo sigue más
  // allá, ese lado pierde el redondeo para que se lea que continúa.
  function barra(tramo, primero, ultimo, dias) {
    const inicio = tramo.desde < primero ? primero : tramo.desde;
    const fin = tramo.hasta > ultimo ? ultimo : tramo.hasta;
    const largoEnDias = Math.round((fin - inicio) / 86400000) + 1;

    const el = document.createElement("span");
    el.className = "s-envac__barra";
    if (tramo.enCurso) el.classList.add("s-envac__barra--curso");
    if (tramo.desde < primero) el.classList.add("s-envac__barra--sigueIzq");
    if (tramo.hasta > ultimo) el.classList.add("s-envac__barra--sigueDer");

    el.style.left = `calc(100% / ${dias} * ${inicio.getDate() - 1})`;
    el.style.width = `calc(100% / ${dias} * ${largoEnDias})`;
    el.title =
      `${tramo.persona.nombre}: ${largo(tramo.desde)} a ${largo(tramo.hasta)} · ` +
      `${tramo.habiles} días hábiles`;
    el.innerHTML = `<span class="s-envac__barraTexto">${tramo.habiles} días</span>`;
    return el;
  }

  /* ======================================================================
     TABLA · en curso y próximas
     ====================================================================== */

  function pintaTabla() {
    const cuerpo = document.querySelector("[data-tabla]");
    const vacio = document.querySelector("[data-tabla-vacia]");
    if (!cuerpo) return;

    // En curso primero, y después lo que viene por fecha de salida.
    const todas = TRAMOS.filter((t) => t.hasta >= HOY && coincide(t.persona)).sort(
      (a, b) => Number(b.enCurso) - Number(a.enCurso) || a.desde - b.desde,
    );

    const paginas = Math.max(1, Math.ceil(todas.length / POR_PAGINA));
    pagina = Math.min(Math.max(pagina, 0), paginas - 1);
    const filas = todas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

    cuerpo.innerHTML = "";
    vacio.hidden = todas.length > 0;
    if (!vacio.hidden) avisaVacio(vacio, Boolean(filtro));
    pintaPaginacion(todas.length, paginas);

    filas.forEach((t) => {
      const fila = document.createElement("tr");
      fila.className = "c-table__row";
      fila.innerHTML =
        `<td data-col="Colaborador">` +
        `<span class="c-persona">` +
        `<span class="c-avatar c-avatar--md c-avatar--iniciales" aria-hidden="true">${iniciales(t.persona.nombre)}</span>` +
        `<span class="c-persona__datos">` +
        `<span class="c-persona__nombre">${t.persona.nombre}</span>` +
        `<span class="c-persona__cargo">${t.persona.cargo}</span>` +
        `</span></span></td>` +
        `<td class="c-table__rango" data-col="Desde">${largo(t.desde)}</td>` +
        `<td class="c-table__rango" data-col="Hasta">${largo(t.hasta)}</td>` +
        `<td class="c-table__dias" data-col="Días hábiles">${t.habiles}</td>` +
        `<td class="c-table__aprobador" data-col="Reemplazo">${t.reemplazo}</td>` +
        `<td class="c-table__estado" data-col="Estado">${etiqueta(t)}</td>`;
      cuerpo.appendChild(fila);
    });
  }

  function pintaPaginacion(total, paginas) {
    const nav = document.querySelector("[data-paginacion]");
    const nota = document.querySelector("[data-paginacion-nota]");
    if (!nav) return;

    // Con una sola página la paginación estorba: no se muestra.
    nav.hidden = total <= POR_PAGINA;
    if (nav.hidden) return;

    const desde = pagina * POR_PAGINA + 1;
    const hasta = Math.min((pagina + 1) * POR_PAGINA, total);
    nota.textContent = `Mostrando ${desde} a ${hasta} de ${total} tramos`;
    nav.querySelector('[data-pag="-1"]').disabled = pagina === 0;
    nav.querySelector('[data-pag="1"]').disabled = pagina >= paginas - 1;
  }

  function etiqueta(tramo) {
    if (tramo.enCurso) {
      const faltan = Math.round((tramo.hasta - HOY) / 86400000);
      const texto = faltan === 0 ? "vuelve mañana" : `vuelve en ${faltan + 1} días`;
      return `<span class="c-tag c-tag--curso">Fuera hoy</span>` +
        `<span class="s-envac__meta">${texto}</span>`;
    }
    const faltan = Math.round((tramo.desde - HOY) / 86400000);
    const texto = faltan === 1 ? "se va mañana" : `se va en ${faltan} días`;
    return `<span class="c-tag c-tag--proxima">Programada</span>` +
      `<span class="s-envac__meta">${texto}</span>`;
  }

  /* ======================================================================
     RESUMEN DE LA CABECERA
     ====================================================================== */

  function pintaResumen() {
    // Las dos cuentan personas, no tramos: quien tenga dos tramos por
    // delante sigue siendo una persona con vacaciones programadas.
    const enCurso = new Set(TRAMOS.filter((t) => t.enCurso).map((t) => t.persona.id));
    const programadas = new Set(
      TRAMOS.filter((t) => t.desde > HOY).map((t) => t.persona.id),
    );

    const fuera = document.querySelector("[data-stat-fuera]");
    const proximos = document.querySelector("[data-stat-programadas]");
    if (fuera) fuera.textContent = enCurso.size;
    if (proximos) proximos.textContent = programadas.size;
  }

  /* ======================================================================
     ARRANQUE
     ====================================================================== */

  function pinta() {
    pintaCalendario();
    pintaTabla();
    pintaResumen();
  }

  document.querySelector("[data-buscar]")?.addEventListener("input", (e) => {
    filtro = sinTildes(e.target.value.trim());
    pagina = 0;
    pinta();
  });

  document.querySelectorAll("[data-pag]").forEach((boton) => {
    boton.addEventListener("click", () => {
      pagina += Number(boton.dataset.pag);
      pintaTabla();
    });
  });

  document.querySelector("[data-mes-anterior]")?.addEventListener("click", () => {
    mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1);
    pintaCalendario();
  });

  document.querySelector("[data-mes-siguiente]")?.addEventListener("click", () => {
    mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
    pintaCalendario();
  });

  document.querySelector("[data-mes-hoy]")?.addEventListener("click", () => {
    mes = new Date(HOY.getFullYear(), HOY.getMonth(), 1);
    pintaCalendario();
  });

  pinta();
})();
