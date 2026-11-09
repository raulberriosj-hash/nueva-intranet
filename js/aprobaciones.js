/* ==========================================================================
   SOLICITUDES DEL EQUIPO · SALDO DE LOS COLABORADORES

   Pinta las cuatro tarjetas de tramo, la línea del límite y el modal que
   abren. Es el mismo criterio del panel de RRHH —js/panel-rrhh.js— pero
   acotado a los colaboradores de una jefatura.

   Los datos están arriba en EQUIPO: para enchufar el backend se reemplaza
   esa constante y nada más.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     DATOS

     Una fila por colaborador a cargo:
       [nombre, área, [días por periodo, del más nuevo al más viejo], hoy]

     "hoy" es si está de vacaciones en este momento. No sale del saldo: una
     persona puede estar fuera y tener días pendientes igual.

     En producción las filas llegan en window.EQUIPO —ver la plantilla—. El
     arreglo de acá abajo es solo para que la maqueta se vea con datos.
     ====================================================================== */

  const MUESTRA = [
    ["María Fernanda Valenzuela", "Operaciones", [0, 4, 15, 15], false],
    ["Ignacio Mella Peñaloza", "Operaciones", [0, 1, 15, 15], false],
    ["Andrés Silva", "Infraestructura", [2, 10, 15, 0], false],
    ["Juan Pablo Ramos", "Desarrollo", [8, 15, 0, 0], false],
    ["Daniela Soto", "Diseño", [3, 15, 0, 0], false],
    ["Camila Pérez", "Desarrollo", [12, 0, 0, 0], false],
    ["Raúl Berríos", "Diseño", [9, 0, 0, 0], false],
    ["Paula Riquelme", "Infraestructura", [6, 0, 0, 0], false],
    ["Tomás Vergara", "Desarrollo", [0, 0, 0, 0], true],
  ];

  const EQUIPO = window.EQUIPO || MUESTRA;

  /* ======================================================================
     TRAMOS
     ====================================================================== */

  // El techo que persigue la empresa, el mismo del panel de RRHH
  const LIMITE = 20;

  const total = (p) => p[2].reduce((a, b) => a + b, 0);
  const exceso = (t) => Math.max(0, t - LIMITE);
  const cifra = (n) => n.toLocaleString("es-CL");

  const TRAMOS = {
    alto: {
      sub: "Más de 31 días de vacaciones pendientes",
      filtra: (p) => total(p) >= 31,
    },
    medio: {
      sub: "21 a 30 días de vacaciones pendientes",
      filtra: (p) => total(p) >= 21 && total(p) <= 30,
    },
    bajo: {
      sub: "0 a 20 días de vacaciones pendientes",
      filtra: (p) => total(p) >= 1 && total(p) <= LIMITE,
    },
    sobre: {
      sub: `Colaboradores sobre el límite de ${LIMITE} días`,
      filtra: (p) => total(p) > LIMITE,
      vacioTitulo: "Nadie pasa del límite",
      vacioTexto: "Todo tu equipo está dentro de los 20 días.",
    },
    hoy: {
      sub: "Colaboradores en vacaciones hoy",
      filtra: (p) => p[3],
      vacioTitulo: "Nadie está de vacaciones hoy",
      vacioTexto: "Cuando haya vacaciones en curso, acá aparece quién las está tomando.",
    },
  };

  /* Las cifras de las tarjetas se calculan desde EQUIPO y no van escritas en
     el HTML: así la tarjeta y la lista que abre no pueden contradecirse. */

  const escribe = (sel, n) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = cifra(n);
  };

  Object.keys(TRAMOS).forEach((clave) => {
    const grupo = EQUIPO.filter(TRAMOS[clave].filtra);
    escribe(`[data-tramo-personas="${clave}"]`, grupo.length);
    escribe(
      `[data-tramo-exceso="${clave}"]`,
      grupo.reduce((a, p) => a + exceso(total(p)), 0),
    );
  });

  const sobre = EQUIPO.filter(TRAMOS.sobre.filtra);
  escribe("[data-exceso-personas]", sobre.length);
  escribe("[data-exceso-dias]", sobre.reduce((a, p) => a + exceso(total(p)), 0));

  /* ======================================================================
     MODAL DEL TRAMO
     Sin buscador ni paginación: son unas pocas personas y caben de una vez.
     ====================================================================== */

  const modal = document.querySelector("#modal-equipo");
  if (!modal) return;

  const $ = (sel) => modal.querySelector(sel);
  const sub = $("[data-equipo-sub]");
  const tabla = $("[data-equipo-caja]");
  const cuerpo = $("[data-equipo-filas]");
  const vacio = $("[data-equipo-vacio]");

  // Las iniciales del avatar salen del nombre, como en la tabla de arriba
  const iniciales = (nombre) =>
    nombre
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("");

  const fila = (p) => {
    const t = total(p);
    const sobra = exceso(t);
    return `<tr class="c-table__row">
      <td data-col="Colaborador">
        <span class="c-persona">
          <span class="c-avatar c-avatar--md c-avatar--iniciales" aria-hidden="true">${iniciales(
            p[0],
          )}</span>
          <span class="c-persona__datos">
            <span class="c-persona__nombre">${p[0]}</span>
            <span class="c-persona__cargo">${p[1]}</span>
          </span>
        </span>
      </td>
      <td class="c-table__dias" data-col="Días de saldo">${cifra(t)} días</td>
      <td class="c-table__dias" data-col="Sobre el límite">${
        sobra > 0
          ? `<span class="s-aprob__exceso">+${cifra(sobra)}</span>`
          : `<span class="s-aprob__nada">—</span>`
      }</td>
    </tr>`;
  };

  const abre = (clave) => {
    const tramo = TRAMOS[clave];
    // Primero el que más arrastra: es lo que una jefatura necesita ver
    const gente = EQUIPO.filter(tramo.filtra).sort((a, b) => total(b) - total(a));

    sub.textContent = tramo.sub;
    tabla.hidden = gente.length === 0;
    vacio.hidden = gente.length > 0;

    if (gente.length === 0) {
      cuerpo.innerHTML = "";
      $("[data-equipo-vacio-titulo]").textContent =
        tramo.vacioTitulo || "Sin colaboradores en este tramo";
      $("[data-equipo-vacio-texto]").textContent =
        tramo.vacioTexto || "Ninguno de tus colaboradores cae en este tramo de saldo.";
      return;
    }

    cuerpo.innerHTML = gente.map(fila).join("");
  };

  // El <dialog> lo abre js/componentes.js; acá solo se decide qué va adentro,
  // antes de que se muestre.
  document.querySelectorAll("[data-tramo]").forEach((btn) =>
    btn.addEventListener("click", () => abre(btn.dataset.tramo), true),
  );
})();
