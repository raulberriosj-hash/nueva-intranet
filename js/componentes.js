/* ==========================================================================
   COMPONENTES · Mis Vacaciones

   RESUELVE
     Desplegables (abrir, cerrar, elegir, teclado) · calendario · diálogos ·
     plegado del sidebar.

   ENGANCHES QUE NECESITA EN EL MARCADO
     Desplegable   .c-select > botón con aria-haspopup + .c-popover[hidden]
                   con <ul class="c-select__list"> de <li class="c-select__option">.
                   El valor visible va en [data-valor] dentro del botón.
     Calendario    igual, pero el popover lleva
                   <div class="c-calendar" data-calendario></div>
     Diálogos      [data-abre="#id"] para abrir · [data-cierra] para cerrar
     Sidebar       lo pinta y lo pliega js/sidebar.js, no este archivo
     Grupo         [data-grupo="clave"] pliega las filas con [data-grupo-de="clave"]

     El marcado completo está en plantillas/mis-vacaciones.html.

   ATRIBUTOS DEL CALENDARIO
     data-valor      fecha elegida en ISO (YYYY-MM-DD). Vacío = sin elegir.
     data-min        "hoy" o una fecha ISO. Bloquea lo anterior.
     data-min-de     selector de otro campo: el mínimo pasa a ser su valor
                     más un día (así el regreso no cae antes de la salida).
     data-rango-ini  tramo a teñir, en ISO. Lo pone la aplicación.
     data-rango-fin
     data-mes-visible lo escribe el componente. No tocar.

   EVENTOS  (burbujean desde el disparador)
     campo:cambio   detail = { valor, texto }
     fecha:cambio   detail = { valor, fecha }

     document.addEventListener('fecha:cambio', e => {
       if (e.target.id === 'campo-salida') recalcularDias();
     });
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

  /* ======================================================================
     FECHAS
     ====================================================================== */

  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const DOW = ["L", "M", "M", "J", "V", "S", "D"]; // la semana parte el lunes
  const MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const MES_CORTO = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];

  function hoy() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** "2026-08-10" → Date local (sin desfase de zona horaria) */
  function desdeISO(txt) {
    if (!txt) return null;
    const [a, m, d] = txt.split("-").map(Number);
    if (!a || !m || !d) return null;
    return new Date(a, m - 1, d);
  }

  const aISO = (d) =>
    d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      : "";

  /** "Lun, 10 agosto 2026" — el formato que usa el diseño */
  const formatoLargo = (d) =>
    `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;

  /** "20—24 JUL" · "28 DIC — 06 ENE" · "02 AGO" */
  function formatoRango(ini, fin) {
    if (!ini || !fin) return "";
    if (+ini === +fin) return `${ini.getDate()} ${MES_CORTO[ini.getMonth()]}`;
    if (ini.getMonth() === fin.getMonth())
      return `${ini.getDate()}—${fin.getDate()} ${MES_CORTO[ini.getMonth()]}`;
    return `${ini.getDate()} ${MES_CORTO[ini.getMonth()]} — ${fin.getDate()} ${MES_CORTO[fin.getMonth()]}`;
  }

  const sumarDias = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  /**
   * Días hábiles entre la salida y el día ANTERIOR al regreso.
   * El día de regreso es el día en que se vuelve a trabajar, así que no
   * cuenta: salida lunes 10 y regreso lunes 17 da 5.
   *
   *
   */
  function diasHabiles(salida, regreso) {
    if (!salida || !regreso || regreso <= salida) return null;
    let n = 0;
    for (let d = new Date(salida); d < regreso; d = sumarDias(d, 1)) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) n++;
    }
    return n;
  }

  /* ======================================================================
     DESPLEGABLES
     ====================================================================== */

  let abierto = null; // el .c-select abierto, o null

  const popoverDe = (caja) => $(".c-popover", caja);
  const disparadorDe = (caja) => $("[aria-haspopup]", caja);

  function cerrar() {
    if (!abierto) return;
    popoverDe(abierto).hidden = true;
    disparadorDe(abierto).setAttribute("aria-expanded", "false");
    $$(".c-select__option.is-activa", abierto).forEach((o) =>
      o.classList.remove("is-activa"),
    );
    abierto = null;
  }

  function abrir(caja) {
    if (abierto === caja) {
      cerrar();
      return;
    }
    cerrar();

    const pop = popoverDe(caja);
    const cal = $("[data-calendario]", caja);
    if (cal) pintarCalendario(cal);

    pop.hidden = false;
    disparadorDe(caja).setAttribute("aria-expanded", "true");
    abierto = caja;

    // Si no cabe, se ancla al otro borde o se abre hacia arriba
    pop.classList.remove("c-popover--fin", "c-popover--arriba");
    const r = pop.getBoundingClientRect();
    if (r.right > innerWidth - 8) pop.classList.add("c-popover--fin");
    if (r.bottom > innerHeight - 8) pop.classList.add("c-popover--arriba");

    const foco =
      $('.c-select__option[aria-selected="true"]', pop) ||
      $('.c-calendar__day[aria-pressed="true"]', pop) ||
      $(".c-select__option", pop);
    if (foco) {
      foco.classList.add("is-activa");
      foco.focus({ preventScroll: true });
    }
  }

  function elegirOpcion(li) {
    const caja = li.closest(".c-select");
    const disparador = disparadorDe(caja);

    $$(".c-select__option", caja).forEach((o) =>
      o.setAttribute("aria-selected", "false"),
    );
    li.setAttribute("aria-selected", "true");

    const destino = $("[data-valor]", disparador);
    if (destino) {
      destino.textContent = li.textContent.trim();
      destino.classList.remove("c-field__value--placeholder");
    }

    cerrar();
    disparador.focus();

    disparador.dispatchEvent(
      new CustomEvent("campo:cambio", {
        bubbles: true,
        detail: {
          valor: li.dataset.valor ?? li.textContent.trim(),
          texto: li.textContent.trim(),
        },
      }),
    );
  }

  /* ======================================================================
     CALENDARIO
     ====================================================================== */

  function minimoDe(cal) {
    const ref = cal.dataset.minDe;
    if (ref) {
      const nodo = $(ref);
      const otro = nodo?.matches("[data-calendario]")
        ? nodo
        : $("[data-calendario]", nodo ?? document);
      const base = desdeISO(otro?.dataset.valor);
      if (base) return sumarDias(base, 1);
    }
    if (cal.dataset.min === "hoy") return hoy();
    return desdeISO(cal.dataset.min) ?? null;
  }

  function pintarCalendario(cal) {
    const elegido = desdeISO(cal.dataset.valor);
    const minimo = minimoDe(cal);
    const mes =
      desdeISO(cal.dataset.mesVisible) ||
      new Date(
        (elegido ?? hoy()).getFullYear(),
        (elegido ?? hoy()).getMonth(),
        1,
      );
    cal.dataset.mesVisible = aISO(mes);

    // Rango a teñir: lo marca quien use el componente
    const rangoIni = desdeISO(cal.dataset.rangoIni);
    const rangoFin = desdeISO(cal.dataset.rangoFin);

    const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const offset =
      (new Date(mes.getFullYear(), mes.getMonth(), 1).getDay() + 6) % 7;

    const celdas = [];
    for (let i = 0; i < offset; i++)
      celdas.push(
        '<span class="c-calendar__day c-calendar__day--fuera"></span>',
      );

    for (let n = 1; n <= dias; n++) {
      const f = new Date(mes.getFullYear(), mes.getMonth(), n);
      const clases = ["c-calendar__day"];
      if (+f === +hoy()) clases.push("c-calendar__day--hoy");
      if (rangoIni && rangoFin && f > rangoIni && f < rangoFin)
        clases.push("c-calendar__day--rango");
      celdas.push(
        `<button type="button" class="${clases.join(" ")}" data-dia="${aISO(f)}"` +
          `${minimo && f < minimo ? " disabled" : ""}` +
          ` aria-pressed="${elegido && +f === +elegido}">${n}</button>`,
      );
    }

    cal.innerHTML = `
      <div class="c-calendar__head">
        <button class="c-iconbtn c-iconbtn--sm" type="button" data-mes="-1" aria-label="Mes anterior">
          <svg class="c-icon" aria-hidden="true"><use href="#i-chevron-left"/></svg>
        </button>
        <span class="c-calendar__month">${MESES[mes.getMonth()]} ${mes.getFullYear()}</span>
        <button class="c-iconbtn c-iconbtn--sm" type="button" data-mes="1" aria-label="Mes siguiente">
          <svg class="c-icon" aria-hidden="true"><use href="#i-chevron-right"/></svg>
        </button>
      </div>
      <div class="c-calendar__grid">
        ${DOW.map((l) => `<span class="c-calendar__dow">${l}</span>`).join("")}
        ${celdas.join("")}
      </div>`;
  }

  function elegirDia(btn) {
    const cal = btn.closest("[data-calendario]");
    const caja = btn.closest(".c-select");
    const fecha = desdeISO(btn.dataset.dia);
    const disparador = disparadorDe(caja);

    cal.dataset.valor = btn.dataset.dia;

    const destino = $("[data-valor]", disparador);
    if (destino) {
      destino.textContent = formatoLargo(fecha);
      destino.classList.remove("c-field__value--placeholder");
    }

    cerrar();
    disparador.focus();

    disparador.dispatchEvent(
      new CustomEvent("fecha:cambio", {
        bubbles: true,
        detail: { valor: btn.dataset.dia, fecha },
      }),
    );
  }

  /* ======================================================================
     ESCUCHAS
     ====================================================================== */

  document.addEventListener("click", (ev) => {
    // --- diálogos
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
      return;
    }

    // --- filas de grupo plegables
    const grupo = ev.target.closest("[data-grupo]");
    if (grupo) {
      const abierto = grupo.getAttribute("aria-expanded") !== "true";
      grupo.setAttribute("aria-expanded", String(abierto));
      document
        .querySelectorAll(`[data-grupo-de="${grupo.dataset.grupo}"]`)
        .forEach((fila) => {
          fila.hidden = !abierto;
        });
      return;
    }

    // El plegado del sidebar se fue a js/sidebar.js, que es quien pinta el
    // menú. Si se maneja también acá el clic se cuenta dos veces y no pasa
    // nada al pulsar.

    // --- navegación de mes
    const mes = ev.target.closest("[data-mes]");
    if (mes) {
      ev.stopPropagation();
      const cal = mes.closest("[data-calendario]");
      const actual = desdeISO(cal.dataset.mesVisible) ?? hoy();
      cal.dataset.mesVisible = aISO(
        new Date(
          actual.getFullYear(),
          actual.getMonth() + Number(mes.dataset.mes),
          1,
        ),
      );
      pintarCalendario(cal);
      return;
    }

    // --- día del calendario
    const dia = ev.target.closest("[data-dia]");
    if (dia && !dia.disabled) {
      ev.stopPropagation();
      elegirDia(dia);
      return;
    }

    // --- opción de la lista
    const opcion = ev.target.closest(".c-select__option");
    if (opcion) {
      ev.stopPropagation();
      elegirOpcion(opcion);
      return;
    }

    // --- disparador del desplegable
    const disparador = ev.target.closest(".c-select [aria-haspopup]");
    if (disparador) {
      ev.stopPropagation();
      abrir(disparador.closest(".c-select"));
      return;
    }

    // --- clic fuera
    cerrar();
  });

  // Clic en el velo de un <dialog> (el propio elemento, no su contenido)
  document.addEventListener("click", (ev) => {
    if (ev.target instanceof HTMLDialogElement) ev.target.close();
  });

  document.addEventListener("keydown", (ev) => {
    if (!abierto) return;

    if (ev.key === "Escape") {
      ev.preventDefault();
      const d = disparadorDe(abierto);
      cerrar();
      d.focus();
      return;
    }

    const opciones = $$(".c-select__option", abierto);
    if (!opciones.length) return;

    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const i = opciones.findIndex((o) => o.classList.contains("is-activa"));
      const sig =
        ev.key === "ArrowDown"
          ? Math.min(i + 1, opciones.length - 1)
          : Math.max(i - 1, 0);
      opciones.forEach((o) => o.classList.remove("is-activa"));
      opciones[sig].classList.add("is-activa");
      opciones[sig].focus({ preventScroll: true });
      opciones[sig].scrollIntoView({ block: "nearest" });
    }

    if (ev.key === "Enter" || ev.key === " ") {
      const activa = $(".c-select__option.is-activa", abierto);
      if (activa) {
        ev.preventDefault();
        elegirOpcion(activa);
      }
    }
  });

  /* ======================================================================
     API
     Por si hace falta llamar algo a mano desde el código de la aplicación.
     ====================================================================== */

  window.Componentes = {
    cerrarDesplegables: cerrar,
    pintarCalendario,
    fecha: {
      hoy,
      desdeISO,
      aISO,
      sumarDias,
      formatoLargo,
      formatoRango,
      diasHabiles,
    },
  };
})();
