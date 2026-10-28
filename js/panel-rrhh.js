/* ==========================================================================
   PANEL DE VACACIONES · CONFIGURACIÓN DE GRÁFICOS · sobre los tokens de la
   intranet

   Highcharts. Los datos están arriba en constantes y los gráficos abajo:
   para enchufar el backend se reemplazan las constantes y nada más.

   Ningún gráfico lleva título propio: lo pone la cabecera de su tarjeta en
   el HTML, para que no quede repetido.

   Los colores y la tipografía NO están acá: se leen de 01-tokens.css en
   tiempo de ejecución. Si cambia un token, cambia el gráfico con él.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     DOS VERSIONES EN UN MISMO ARCHIVO  ·  andamio, se borra al decidir

     Las tablas abren solo 2026 y 2025 en las dos; lo que cambia es si ese
     corte alcanza o no al gráfico de periodos:

       panel-rrhh.html              → A · solo las tablas
       panel-rrhh.html?corte=panel  → B · también el gráfico

     En la B las seis barras pasan a tres: 2026, 2025 y "2024 y anteriores",
     que junta los 5.644 días que ya no se abren por año. El total no se
     mueve en ninguna de las dos: sigue siendo el saldo acumulado real.

     Cuando elijas una, esta constante y el `if` de más abajo se borran.
     ====================================================================== */

  const CORTE_PANEL = new URLSearchParams(location.search).get("corte") === "panel";

  /* ======================================================================
     DATOS  ·  reemplazar por la respuesta del backend
     ====================================================================== */

  // Saldo por periodo de devengo. Vigente = año en curso, vence = el
  // anterior, que se pierde el 31-12.
  const PERIODOS = [
    { name: "2026", y: 41, estado: "vigente" },
    { name: "2025", y: 3572, estado: "vence" },
    { name: "2024", y: 3895, estado: "anterior" },
    { name: "2023", y: 1278, estado: "anterior" },
    { name: "2022", y: 351, estado: "anterior" },
    { name: "2021", y: 120, estado: "anterior" },
  ];

  // Versión B: los años cerrados se juntan en una sola barra, para que las
  // tres sigan sumando los 9.257 días del indicador.
  const PERIODOS_VISTA = CORTE_PANEL
    ? [
        PERIODOS[0],
        PERIODOS[1],
        {
          name: "2024 y anteriores",
          y: PERIODOS.slice(2).reduce((suma, p) => suma + p.y, 0),
          estado: "anterior",
        },
      ]
    : PERIODOS;

  const ANTERIORES = {
    semanas: ["Sem 31", "Sem 32", "Sem 33", "Sem 34", "Sem 35", "Sem 36", "Sem 37", "Sem 38"],
    personas: [231, 236, 240, 243, 249, 252, 258, 264],
  };

  const SEMANAL = {
    semanas: ["12/01", "19/01", "26/01", "02/02", "09/02", "16/02", "23/02", "02/03"],
    aprobados: [86, 132, 104, 151, 118, 176, 140, 158],
    pendientes: [12, 19, 14, 23, 16, 31, 27, 36],
  };

  // Saldo total por gerente, una serie por gerente y un punto por semana. El
  // último punto de cada serie es el total de la tabla de más abajo.
  const SALDO_GERENTE = {
    semanas: ["Sem 35", "Sem 36", "Sem 37", "Sem 38"],
    series: [
      { name: "Rodrigo Alberto Vergara Cáceres", data: [4439, 4425, 4412, 4399] },
      { name: "Valentina Soledad Carrasco Pinto", data: [2694, 2686, 2678, 2670] },
      { name: "Marcelo Iván Bustos Rojas", data: [808, 806, 803, 801] },
      { name: "Patricio Hernán Cortés Lagos", data: [588, 586, 585, 583] },
      { name: "Ricardo Andrés Salgado Villalobos", data: [339, 338, 337, 336] },
      { name: "Sebastián Ignacio Quiroz Fuentes", data: [157, 157, 156, 156] },
      { name: "Fernanda Isabel Olivares Riquelme", data: [112, 112, 111, 111] },
      { name: "Álvaro Esteban Nicolás Vera Soto", data: [74, 73, 73, 73] },
      { name: "Tomás Eduardo Maldonado Paredes", data: [68, 67, 67, 67] },
      { name: "Óscar Durán Espinoza", data: [31, 31, 31, 31] },
      { name: "10982345", data: [30, 30, 30, 30] }
    ],
  };

  // Las diez personas con más saldo salen del mismo arreglo que las tablas
  const TOP10 = PERSONAS.slice(0, 10).map((p) => [
    `${p[1].split(" ")[0]} ${p[2]}`,
    p[6].reduce((a, b) => a + b, 0),
  ]);

  /* ======================================================================
     TEMA
     ====================================================================== */

  // Los colores y los tamaños salen de 01-tokens.css, no de hex repetidos
  // acá. La escala tipográfica de la intranet está en rem, así que se
  // convierte a px: Highcharts los escribe como estilo en línea del SVG.
  const raiz = getComputedStyle(document.documentElement);
  const tok = (nombre) => raiz.getPropertyValue(nombre).trim();

  const BASE_PX = parseFloat(raiz.fontSize) || 16;
  const px = (nombre) => {
    const v = tok(nombre);
    return v.endsWith("rem") ? `${parseFloat(v) * BASE_PX}px` : v;
  };

  const COLOR = {
    vigente: tok("--c-corporate-600"),
    vence: tok("--c-warning-500"),
    anterior: tok("--c-error-500"),
    efectivo: tok("--c-success-600"),
    transito: tok("--c-blue-600"),
    tinta: tok("--color-text-primary"),
    suave: tok("--color-text-heading"),
    tenue: tok("--color-text-secondary"),
    borde: tok("--color-divider"),
    superficie: tok("--color-surface"),
  };

  const FUENTE = tok("--font-sans");
  const PESO_BOLD = tok("--fw-bold");

  // 11 px: el escalón de nota del sistema, el mismo de .c-pagination__note
  const FS_CHICO = px("--fs-xs");

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
    // Once series, once tonos, todos del archivo de tokens
    colors: [
      tok("--c-corporate-600"), tok("--c-blue-600"),    tok("--c-success-600"),
      tok("--c-warning-500"),   tok("--c-error-500"),   tok("--c-corporate-800"),
      tok("--c-neutral-500"),   tok("--c-success-700"), tok("--c-warning-700"),
      tok("--c-error-700"),     tok("--c-blue-900"),
    ],
    chart: {
      backgroundColor: "transparent",
      style: { fontFamily: FUENTE },
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
      borderRadius: parseInt(tok("--radius-sm"), 10),
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

  /* ======================================================================
     GRÁFICOS
     ====================================================================== */

  // El color de cada barra lo decide la antigüedad, no el orden de la serie
  const tonoPeriodo = {
    vigente: COLOR.vigente,
    vence: COLOR.vence,
    anterior: COLOR.anterior,
  };

  Highcharts.chart("g-periodos", {
    chart: { type: "column" },
    xAxis: { categories: PERIODOS_VISTA.map((p) => p.name) },
    yAxis: { labels: { format: "{value}" } },
    legend: { enabled: false },
    tooltip: { ...sufijoDias, headerFormat: "<span>Periodo {point.key}</span><br>" },
    series: [
      {
        name: "Días de saldo",
        data: PERIODOS_VISTA.map((p) => ({ y: p.y, color: tonoPeriodo[p.estado] })),
      },
    ],
  });

  Highcharts.chart("g-anteriores", {
    chart: { type: "areaspline" },
    xAxis: { categories: ANTERIORES.semanas },
    legend: { enabled: false },
    tooltip: { pointFormat: "<b>{point.y} personas</b>" },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.12,
        lineWidth: 2,
        marker: { radius: 3 },
      },
    },
    series: [{ name: "Colaboradores", data: ANTERIORES.personas, color: COLOR.anterior }],
  });

  Highcharts.chart("g-top10", {
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
    // Rojo y no corporativo: el tono corporativo está reservado a "vigente" y
    // estas diez personas son justo lo contrario.
    series: [{ name: "Días de saldo", data: TOP10.map((t) => t[1]), color: COLOR.anterior }],
  });

  Highcharts.chart("g-semanal", {
    chart: { type: "column" },
    xAxis: { categories: SEMANAL.semanas },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>{point.y} días</b><br>" },
    series: [
      { name: "Días aprobados", data: SEMANAL.aprobados, color: COLOR.efectivo },
      { name: "Días pendientes de aprobación", data: SEMANAL.pendientes, color: COLOR.vence },
    ],
  });

  Highcharts.chart("g-gerentes", {
    chart: { type: "column" },
    xAxis: { categories: SALDO_GERENTE.semanas },
    yAxis: { labels: { format: "{value}" } },
    legend: { align: "center", verticalAlign: "bottom", maxHeight: 72 },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>{point.y} días</b><br>" },
    plotOptions: {
      // Al pasar el cursor por una serie, las otras diez se atenúan: sin esto
      // once series superpuestas no se distinguen.
      series: {
        states: { inactive: { opacity: 0.2 } },
        groupPadding: 0.08,
        pointPadding: 0.02,
      },
    },
    series: SALDO_GERENTE.series,
  });
  /* ======================================================================
     TABLAS

     Dos vistas del mismo arreglo PERSONAS, que vive en
     panel-rrhh-datos.js:

       · "Saldo histórico por persona", paginada de 10 en 10.
       · El modal de un tramo, con buscador, orden y paginación.

     La tabla de gerencias no pasa por acá: son once filas y van escritas en
     el HTML, sin paginar.
     ====================================================================== */

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const total = (p) => p[6].reduce((a, b) => a + b, 0);
  const cifra = (n) => n.toLocaleString("es-CL");

  // Las tablas solo abren dos años: el que corre —azul— y el que vence el
  // 31-12 —rojo—. Lo de 2024 hacia atrás no se muestra, pero sigue contando
  // en la columna de total.
  const ANOS_VISIBLES = 2;

  const celda = (v, i) => {
    const estado = v === 0 ? "cero" : i === 0 ? "actual" : "vence";
    return `<td class="bi-tabla__num"><span class="bi-celda bi-celda--${estado}">${
      v === 0 ? "—" : cifra(v)
    }</span></td>`;
  };

  /* --- Saldo histórico por persona ------------------------------------- */

  const cuerpoPersonas = $("[data-personas-filas]");

  if (cuerpoPersonas) {
    const nota = $("[data-personas-nota]");
    const caja = $("[data-personas-caja]");
    const vacio = $("[data-personas-vacio]");
    const buscador = $("[data-personas-buscar]");
    const selTam = $("[data-personas-tam]");
    const botones = document.querySelectorAll("[data-personas-pag]");

    // El buscador mira nombre, RUT, gerente y centro de costo a la vez. El
    // índice se arma una sola vez: son 609 filas y se teclea letra a letra.
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

  // Los cortes son los mismos que muestran las cuatro tarjetas. "hoy" no
  // depende del saldo sino de quién está de vacaciones en este momento, así
  // que en la maqueta va vacío.
  const TRAMOS = {
    alto: { sub: "Más de 31 días de vacaciones pendientes", filtra: (t) => t >= 31 },
    medio: { sub: "16 a 30 días de vacaciones pendientes", filtra: (t) => t >= 16 && t <= 30 },
    bajo: { sub: "0 a 15 días de vacaciones pendientes", filtra: (t) => t >= 1 && t <= 15 },
    hoy: {
      sub: "Colaboradores en vacaciones hoy",
      filtra: () => false,
      vacioTitulo: "Nadie está de vacaciones hoy",
      vacioTexto: "Cuando haya vacaciones en curso, acá aparece quién las está tomando.",
    },
  };

  const modal = $("#modal-tramo");

  if (modal) {
    const cuerpo = $("[data-modal-filas]", modal);
    const caja = $("[data-modal-caja]", modal);
    const vacio = $("[data-modal-vacio]", modal);
    const sub = $("[data-modal-sub]", modal);
    const notaModal = $("[data-modal-nota]", modal);
    const buscador = $("[data-modal-buscar]", modal);
    const selTam = $("[data-modal-tam]", modal);
    const pager = $(".c-pagination", modal);
    const ordenables = modal.querySelectorAll("[data-orden]");

    // Fila plana, en el orden de las columnas del modal
    const plana = (p) => [p[0], p[1], p[2], p[3], AREAS[p[4]], total(p)];

    let base = [];      // el tramo elegido, ya aplanado
    let vista = [];     // lo que queda tras buscar y ordenar
    let pag = 0;
    let orden = 5;      // por defecto, por días de saldo
    let dir = -1;       // de mayor a menor
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
        .map(
          (f) => `<tr>
            <td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td><td>${f[4]}</td>
            <td><span class="bi-celda bi-celda--total">${cifra(f[5])}</span></td>
          </tr>`,
        )
        .join("");

      notaModal.textContent = `Mostrando ${desde + 1} a ${desde + trozo.length} de ${cifra(
        vista.length,
      )} registros`;
      pager.querySelectorAll("[data-modal-pag]").forEach((b) => {
        b.disabled = b.dataset.modalPag === "-1" ? pag === 0 : pag >= paginas - 1;
      });
    };

    const abre = (clave) => {
      claveTramo = clave;
      const t = TRAMOS[clave];
      sub.textContent = t.sub;
      base = PERSONAS.filter((p) => t.filtra(total(p))).map(plana);
      buscador.value = "";
      orden = 5;
      dir = -1;
      ordenables.forEach((b) => delete b.dataset.dir);
      modal.querySelector('[data-orden="5"]').dataset.dir = "desc";
      filtra();
      pinta();
    };

    // componentes.js ya abre el <dialog> con [data-abre]; acá solo se decide
    // qué va adentro, antes de que se muestre.
    document.querySelectorAll("[data-tramo]").forEach((btn) =>
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

    pager.querySelectorAll("[data-modal-pag]").forEach((b) =>
      b.addEventListener("click", () => {
        pag = Math.max(0, pag + Number(b.dataset.modalPag));
        pinta();
      }),
    );

    ordenables.forEach((b) =>
      b.addEventListener("click", () => {
        const col = Number(b.dataset.orden);
        dir = orden === col ? -dir : col === 5 ? -1 : 1;
        orden = col;
        ordenables.forEach((o) => delete o.dataset.dir);
        b.dataset.dir = dir === 1 ? "asc" : "desc";
        ordena();
        pag = 0;
        pinta();
      }),
    );
  }
})();
