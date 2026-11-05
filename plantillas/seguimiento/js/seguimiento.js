/* ==========================================================================
   SEGUIMIENTO DE VACACIONES · COMPORTAMIENTO

   Este archivo no se toca: los datos están en seguimiento-datos.js.

   Hace cuatro cosas:
     · dibuja los cinco gráficos (Highcharts),
     · escribe las cifras de los tramos y de la línea del límite,
     · pinta y pagina la tabla "Saldo histórico por persona",
     · arma el modal que abren las tarjetas de tramo.

   Todo cuelga del contenedor .seg: no toca nada de la intranet fuera del
   bloque y no deja ningún escuchador suelto en el documento.

   Los colores y los tamaños de los gráficos NO están acá: se leen en tiempo
   de ejecución de las variables de css/seguimiento.css. Si cambia una
   variable, cambia el gráfico con ella.
   ========================================================================== */

(() => {
  "use strict";

  const RAIZ = document.querySelector(".seg");
  if (!RAIZ) return;

  const DATOS = window.SEGUIMIENTO;
  if (!DATOS) {
    console.warn("Seguimiento: falta js/seguimiento-datos.js o quedó un {{hueco}} sin reemplazar.");
    return;
  }

  const $ = (sel, caja = RAIZ) => caja.querySelector(sel);
  const $$ = (sel, caja = RAIZ) => Array.from(caja.querySelectorAll(sel));
  const cifra = (n) => n.toLocaleString("es-CL");

  /* ======================================================================
     DIÁLOGOS
     [data-abre="#id"] abre · [data-cierra] cierra. Solo dentro del bloque.
     ====================================================================== */

  RAIZ.addEventListener("click", (ev) => {
    const abre = ev.target.closest("[data-abre]");
    if (abre) {
      ev.preventDefault();
      $(abre.dataset.abre)?.showModal();
      return;
    }
    const cierra = ev.target.closest("[data-cierra]");
    if (cierra) {
      ev.preventDefault();
      cierra.closest("dialog")?.close();
    }
  });

  /* ======================================================================
     TABLAS

     Dos vistas del mismo arreglo DATOS.personas:
       · "Saldo histórico por persona", paginada.
       · El modal de un tramo, con buscador, orden y paginación.
     ====================================================================== */

  const PERSONAS = DATOS.personas || [];
  const AREAS = DATOS.areas || [];
  const GERENTES = DATOS.gerentes || [];

  const total = (p) => p[6].reduce((a, b) => a + b, 0);

  // La tabla solo abre dos años: el que corre —azul— y el que vence el 31-12
  // —rojo—. Lo anterior no se muestra, pero sigue contando en el total.
  const ANOS_VISIBLES = 2;

  const celda = (v, i) => {
    const estado = v === 0 ? "cero" : i === 0 ? "actual" : "vence";
    return `<td class="bi-tabla__num"><span class="bi-celda bi-celda--${estado}">${
      v === 0 ? "—" : cifra(v)
    }</span></td>`;
  };

  /* --- Saldo histórico por persona -------------------------------------- */

  const cuerpoPersonas = $("[data-personas-filas]");

  if (cuerpoPersonas) {
    const nota = $("[data-personas-nota]");
    const caja = $("[data-personas-caja]");
    const vacio = $("[data-personas-vacio]");
    const buscador = $("[data-personas-buscar]");
    const selTam = $("[data-personas-tam]");
    const botones = $$("[data-personas-pag]");

    // El buscador mira nombre, RUT, gerente y centro de costo a la vez. El
    // índice se arma una sola vez: son cientos de filas y se teclea letra a
    // letra.
    const indice = PERSONAS.map((p) =>
      `${p[1]} ${p[2]} ${p[3]} ${p[0]} ${GERENTES[p[5]]} ${AREAS[p[4]]}`.toLowerCase(),
    );

    let vista = PERSONAS;
    let pagina = 0;

    const paginasDe = (n) => Math.max(1, Math.ceil(n / Number(selTam.value)));

    const pinta = () => {
      const tam = Number(selTam.value);
      const paginas = paginasDe(vista.length);
      pagina = Math.min(pagina, paginas - 1);

      const desde = pagina * tam;
      const trozo = vista.slice(desde, desde + tam);
      const hayDatos = vista.length > 0;

      caja.hidden = !hayDatos;
      vacio.hidden = hayDatos;

      cuerpoPersonas.innerHTML = trozo
        .map(
          (p) => `<tr>
            <td>${p[1]} ${p[2]} ${p[3]}<span class="bi-sub">${p[0]}</span></td>
            <td style="text-align:left">${GERENTES[p[5]]}</td>
            <td style="text-align:left">${AREAS[p[4]]}</td>
            ${p[6].slice(0, ANOS_VISIBLES).map(celda).join("")}
            <td class="bi-tabla__num"><span class="bi-celda bi-celda--total">${cifra(
              total(p),
            )}</span></td>
          </tr>`,
        )
        .join("");

      nota.textContent = hayDatos
        ? `Mostrando ${desde + 1} a ${desde + trozo.length} de ${cifra(
            vista.length,
          )} colaboradores`
        : "Ningún colaborador coincide con la búsqueda";

      botones.forEach((b) => {
        b.disabled = !hayDatos
          ? true
          : b.dataset.personasPag === "-1"
            ? pagina === 0
            : pagina >= paginas - 1;
      });
    };

    buscador.addEventListener("input", () => {
      const q = buscador.value.trim().toLowerCase();
      vista = q === "" ? PERSONAS : PERSONAS.filter((_, i) => indice[i].includes(q));
      pagina = 0;
      pinta();
    });

    selTam.addEventListener("change", () => {
      pagina = 0;
      pinta();
    });

    botones.forEach((b) =>
      b.addEventListener("click", () => {
        const paginas = paginasDe(vista.length);
        pagina = Math.min(paginas - 1, Math.max(0, pagina + Number(b.dataset.personasPag)));
        pinta();
      }),
    );

    pinta();
  }

  /* --- Modal de un tramo ------------------------------------------------ */

  // NUEVO · el techo que persigue la empresa. Está solo acá: el día que
  // RRHH lo baje a 15, se cambia esta línea y se mueven las tarjetas, los
  // modales y la línea del límite.
  const LIMITE = 20;

  // Lo que a una persona le sobra por encima del límite
  const exceso = (t) => Math.max(0, t - LIMITE);

  // NUEVO · cortes nuevos, y "sobre" es el tramo que abre la línea del
  // límite. "hoy" no depende del saldo sino de quién está ausente en este
  // momento, así que ese dato no sale de acá.
  const TRAMOS = {
    alto: { sub: "Más de 31 días de vacaciones pendientes", filtra: (t) => t >= 31 },
    medio: { sub: "21 a 30 días de vacaciones pendientes", filtra: (t) => t >= 21 && t <= 30 },
    bajo: { sub: "0 a 20 días de vacaciones pendientes", filtra: (t) => t >= 1 && t <= LIMITE },
    sobre: {
      sub: `Colaboradores sobre el límite de ${LIMITE} días`,
      filtra: (t) => t > LIMITE,
    },
    hoy: {
      sub: "Colaboradores en vacaciones hoy",
      filtra: () => false,
      vacioTitulo: "Nadie está de vacaciones hoy",
      vacioTexto: "Cuando haya vacaciones en curso, acá aparece quién las está tomando.",
    },
  };

  /* NUEVO · las cifras de las tarjetas y de la línea del límite se calculan
     acá, desde "personas", y ya no son huecos del HTML: así la tarjeta y el
     modal que abre esa tarjeta no pueden decir cosas distintas.
     "hoy" se salta a propósito: ese número lo escribe {{tramo.hoy}}. */
  (function pintaTramos() {
    const saldos = PERSONAS.map(total);

    const escribe = (sel, n) => {
      const el = $(sel);
      if (el) el.textContent = cifra(n);
    };

    Object.keys(TRAMOS)
      .filter((clave) => clave !== "hoy")
      .forEach((clave) => {
        const grupo = saldos.filter(TRAMOS[clave].filtra);
        escribe(`[data-tramo-personas="${clave}"]`, grupo.length);
        escribe(
          `[data-tramo-exceso="${clave}"]`,
          grupo.reduce((a, t) => a + exceso(t), 0),
        );
      });

    const sobre = saldos.filter(TRAMOS.sobre.filtra);
    escribe("[data-exceso-personas]", sobre.length);
    escribe("[data-exceso-dias]", sobre.reduce((a, t) => a + exceso(t), 0));
  })();

  const modal = $("#seg-modal-tramo");

  if (modal) {
    const cuerpo = $("[data-modal-filas]", modal);
    const caja = $("[data-modal-caja]", modal);
    const vacio = $("[data-modal-vacio]", modal);
    const sub = $("[data-modal-sub]", modal);
    const notaModal = $("[data-modal-nota]", modal);
    const buscador = $("[data-modal-buscar]", modal);
    const selTam = $("[data-modal-tam]", modal);
    const pager = $(".c-pagination", modal);
    const ordenables = $$("[data-orden]", modal);

    // Fila plana, en el orden de las columnas del modal. NUEVO · la última
    // es el exceso sobre el límite.
    const plana = (p) => {
      const t = total(p);
      return [p[0], p[1], p[2], p[3], AREAS[p[4]], t, exceso(t)];
    };

    let base = [];   // el tramo elegido, ya aplanado
    let vista = [];  // lo que queda tras buscar y ordenar
    let pag = 0;
    let orden = 5;   // por defecto, por días de saldo
    let dir = -1;    // de mayor a menor
    let claveTramo = "bajo";

    const ordena = () => {
      vista.sort((a, b) => {
        const x = a[orden];
        const y = b[orden];
        const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "es");
        return cmp * dir;
      });
    };

    const filtra = () => {
      const q = buscador.value.trim().toLowerCase();
      vista = q
        ? base.filter((f) => f.slice(0, 5).join(" ").toLowerCase().includes(q))
        : base.slice();
      ordena();
      pag = 0;
    };

    const pinta = () => {
      const tam = Number(selTam.value);
      const paginas = Math.max(1, Math.ceil(vista.length / tam));
      pag = Math.min(pag, paginas - 1);
      const desde = pag * tam;
      const trozo = vista.slice(desde, desde + tam);

      const hayDatos = vista.length > 0;
      caja.hidden = !hayDatos;
      pager.hidden = !hayDatos;
      vacio.hidden = hayDatos;

      if (!hayDatos) {
        cuerpo.innerHTML = "";
        const t = TRAMOS[claveTramo];
        const buscando = buscador.value.trim() !== "";
        $("[data-modal-vacio-titulo]", vacio).textContent = buscando
          ? "Sin resultados"
          : t.vacioTitulo || "Sin colaboradores en este tramo";
        $("[data-modal-vacio-texto]", vacio).textContent = buscando
          ? "Prueba con otro nombre, RUT o área."
          : t.vacioTexto || "Ningún colaborador cae en este tramo de saldo.";
        return;
      }

      cuerpo.innerHTML = trozo
        .map((f) => {
          // NUEVO · quien pasa del límite va con el total en rojo y su
          // exceso al lado; el que no, con una raya.
          const pasado = f[6] > 0;
          const clase = pasado ? " bi-celda--pasado" : "";
          const sobra = pasado
            ? `<span class="bi-celda bi-celda--exceso">+${cifra(f[6])}</span>`
            : `<span class="bi-celda__nada">—</span>`;
          return `<tr>
            <td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td><td>${f[4]}</td>
            <td><span class="bi-celda bi-celda--total${clase}">${cifra(f[5])}</span></td>
            <td>${sobra}</td>
          </tr>`;
        })
        .join("");

      notaModal.textContent = `Mostrando ${desde + 1} a ${desde + trozo.length} de ${cifra(
        vista.length,
      )} registros`;
      $$("[data-modal-pag]", pager).forEach((b) => {
        b.disabled = b.dataset.modalPag === "-1" ? pag === 0 : pag >= paginas - 1;
      });
    };

    const abre = (clave) => {
      claveTramo = clave;
      const t = TRAMOS[clave];
      sub.textContent = t.sub;
      base = PERSONAS.filter((p) => t.filtra(total(p))).map(plana);
      buscador.value = "";
      // NUEVO · donde hay gente sobre el límite, lo primero que RRHH necesita
      // ver es a quién más le sobra; en los demás tramos ordena como siempre.
      orden = base.some((f) => f[6] > 0) ? 6 : 5;
      dir = -1;
      ordenables.forEach((b) => delete b.dataset.dir);
      $(`[data-orden="${orden}"]`, modal).dataset.dir = "desc";
      filtra();
      pinta();
    };

    // El <dialog> lo abre el escuchador de más arriba; acá solo se decide qué
    // va adentro, antes de que se muestre.
    $$("[data-tramo]").forEach((btn) =>
      btn.addEventListener("click", () => abre(btn.dataset.tramo), true),
    );

    buscador.addEventListener("input", () => {
      filtra();
      pinta();
    });

    selTam.addEventListener("change", () => {
      pag = 0;
      pinta();
    });

    $$("[data-modal-pag]", pager).forEach((b) =>
      b.addEventListener("click", () => {
        pag = Math.max(0, pag + Number(b.dataset.modalPag));
        pinta();
      }),
    );

    ordenables.forEach((b) =>
      b.addEventListener("click", () => {
        const col = Number(b.dataset.orden);
        dir = orden === col ? -dir : col >= 5 ? -1 : 1;
        orden = col;
        ordenables.forEach((o) => delete o.dataset.dir);
        b.dataset.dir = dir === 1 ? "asc" : "desc";
        ordena();
        pag = 0;
        pinta();
      }),
    );
  }

  /* ======================================================================
     GRÁFICOS
     ====================================================================== */

  if (typeof Highcharts === "undefined") {
    console.warn("Seguimiento: no se cargó Highcharts; el resto de la pantalla funciona igual.");
    return;
  }

  // Las variables se leen del bloque, no de :root: ahí es donde están
  // declaradas. La escala tipográfica va en rem y Highcharts necesita px.
  const estilos = getComputedStyle(RAIZ);
  const tok = (nombre) => estilos.getPropertyValue(nombre).trim();

  const BASE_PX = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const px = (nombre) => {
    const v = tok(nombre);
    return v.endsWith("rem") ? `${parseFloat(v) * BASE_PX}px` : v;
  };

  const COLOR = {
    vigente: tok("--c-corporate-600"),
    vence: tok("--c-warning-500"),
    anterior: tok("--c-error-500"),
    efectivo: tok("--c-success-600"),
    tinta: tok("--color-text-primary"),
    suave: tok("--color-text-heading"),
    tenue: tok("--color-text-secondary"),
    borde: tok("--color-divider"),
  };

  const FS_CHICO = px("--fs-xs");
  const PESO_BOLD = tok("--fw-bold");

  Highcharts.setOptions({
    lang: {
      loading: "Cargando…",
      noData: "Sin datos para los filtros elegidos",
      thousandsSep: ".",
      decimalPoint: ",",
      contextButtonTitle: "Exportar",
      downloadPNG: "Descargar PNG",
      downloadJPEG: "Descargar JPEG",
      downloadPDF: "Descargar PDF",
      downloadSVG: "Descargar SVG",
      printChart: "Imprimir",
      viewFullscreen: "Pantalla completa",
    },
    // Once series, once tonos, todos de las variables de la hoja
    colors: [
      tok("--c-corporate-600"), tok("--c-blue-support-600"), tok("--c-success-600"),
      tok("--c-warning-500"),   tok("--c-error-500"),        tok("--c-corporate-800"),
      tok("--c-neutral-500"),   tok("--c-success-700"),      tok("--c-warning-700"),
      tok("--c-error-700"),     tok("--c-blue-support-900"),
    ],
    chart: {
      backgroundColor: "transparent",
      style: { fontFamily: tok("--font-sans") },
      spacing: [8, 0, 8, 0],
    },
    title: { text: null },
    credits: { enabled: false },
    xAxis: {
      lineColor: COLOR.borde,
      tickColor: COLOR.borde,
      labels: { style: { color: COLOR.suave, fontSize: FS_CHICO } },
    },
    yAxis: {
      gridLineColor: COLOR.borde,
      gridLineDashStyle: "Dash",
      title: { text: null },
      labels: { style: { color: COLOR.tenue, fontSize: FS_CHICO } },
    },
    legend: {
      itemStyle: { color: COLOR.suave, fontWeight: tok("--fw-regular"), fontSize: FS_CHICO },
      itemHoverStyle: { color: COLOR.tinta },
    },
    tooltip: {
      backgroundColor: COLOR.tinta,
      borderWidth: 0,
      borderRadius: parseInt(tok("--radius-md"), 10),
      shadow: false,
      style: { color: tok("--color-text-inverse"), fontSize: FS_CHICO },
      // Fuera del gráfico: el de once series tapaba medio dibujo
      outside: true,
    },
    plotOptions: {
      series: { animation: { duration: 350 } },
      column: { borderWidth: 0, borderRadius: 3 },
      bar: { borderWidth: 0, borderRadius: 3 },
    },
    exporting: {
      buttons: { contextButton: { theme: { fill: "transparent" } } },
      filename: "vacaciones",
    },
    accessibility: { enabled: true },
  });

  const sufijoDias = { pointFormat: "<b>{point.y} días</b>" };

  // Los diez con más saldo salen de la misma lista de personas: el nombre de
  // pila y el apellido paterno bastan para la etiqueta.
  const TOP10 = PERSONAS.slice()
    .sort((a, b) => total(b) - total(a))
    .slice(0, 10)
    .map((p) => [`${p[1].split(" ")[0]} ${p[2]}`, total(p)]);

  Highcharts.chart("seg-g-top10", {
    chart: { type: "bar" },
    xAxis: { categories: TOP10.map((t) => t[0]) },
    yAxis: { labels: { format: "{value}" } },
    legend: { enabled: false },
    tooltip: sufijoDias,
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          style: { fontSize: FS_CHICO, fontWeight: PESO_BOLD, color: COLOR.suave, textOutline: "none" },
        },
      },
    },
    // Rojo y no corporativo: el tono corporativo está reservado al saldo
    // vigente y estas diez personas son justo lo contrario.
    series: [{ name: "Días de saldo", data: TOP10.map((t) => t[1]), color: COLOR.anterior }],
  });

  Highcharts.chart("seg-g-semanal", {
    chart: { type: "column" },
    xAxis: { categories: DATOS.semanal.semanas },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>{point.y} días</b><br>" },
    series: [
      { name: "Días aprobados", data: DATOS.semanal.aprobados, color: COLOR.efectivo },
      { name: "Días pendientes de aprobación", data: DATOS.semanal.pendientes, color: COLOR.vence },
    ],
  });

  // NUEVO · una línea por colaborador en vez del total de personas
  Highcharts.chart("seg-g-anteriores", {
    chart: { type: "line" },
    xAxis: { categories: DATOS.anteriores.semanas },
    yAxis: { labels: { format: "{value}" } },
    legend: { align: "center", verticalAlign: "bottom", maxHeight: 72 },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>{point.y} días</b><br>" },
    plotOptions: {
      series: {
        // Van todas en la misma franja de días: sin atenuar las demás al
        // pasar el cursor no se distinguen.
        states: { inactive: { opacity: 0.2 } },
        marker: { radius: 3 },
        dataLabels: {
          enabled: true,
          style: { fontSize: FS_CHICO, fontWeight: PESO_BOLD, color: COLOR.suave, textOutline: "none" },
          // Solo el último punto: rotular cada semana tapa el dibujo
          formatter() {
            return this.point.index === DATOS.anteriores.semanas.length - 1 ? this.y : null;
          },
        },
      },
    },
    series: DATOS.anteriores.series,
  });

  /* NUEVO · días tomados por mes. La ventana se mueve con el calendario: los
     últimos doce meses, con el de hoy al final. Por eso el backend manda un
     objeto con clave "AAAA-MM" y no una lista de doce: así el gráfico sigue
     bien aunque la página se abra el mes que viene. El último mes va
     incompleto —es el que se está viviendo— y el tooltip lo dice. */
  {
    const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const hoy = new Date();
    const tomados = DATOS.tomados || {};
    const meses = [];

    for (let i = 11; i >= 0; i--) {
      // Día 1: restar meses desde el día de hoy se pasa de largo en los
      // meses cortos (31 de marzo menos un mes cae en el 3 de marzo).
      const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
      meses.push({
        etiqueta: `${MESES[f.getMonth()]} ${f.getFullYear()}`,
        punto: { y: tomados[clave] ?? null, enCurso: i === 0 },
      });
    }

    Highcharts.chart("seg-g-tomados", {
      chart: { type: "column" },
      xAxis: { categories: meses.map((m) => m.etiqueta) },
      yAxis: { labels: { format: "{value}" } },
      legend: { enabled: false },
      tooltip: {
        pointFormatter() {
          return `<b>${this.y} días</b>${this.options.enCurso ? " · mes en curso" : ""}`;
        },
      },
      series: [{ name: "Días tomados", data: meses.map((m) => m.punto), color: COLOR.vigente }],
    });
  }

  Highcharts.chart("seg-g-gerentes", {
    chart: { type: "column" },
    xAxis: { categories: DATOS.saldoGerente.semanas },
    yAxis: { labels: { format: "{value}" } },
    legend: { align: "center", verticalAlign: "bottom", maxHeight: 72 },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>{point.y} días</b><br>" },
    plotOptions: {
      // Al pasar el cursor por una serie, las otras se atenúan: sin esto once
      // series superpuestas no se distinguen.
      series: {
        states: { inactive: { opacity: 0.2 } },
        groupPadding: 0.08,
        pointPadding: 0.02,
      },
    },
    series: DATOS.saldoGerente.series,
  });
})();
