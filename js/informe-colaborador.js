/* ==========================================================================
   SALDOS DE VACACIONES

   Pinta la tabla, el buscador, el filtro y la paginación.

   PERSONAS son datos de muestra: 64 colaboradores inventados. Al conectar
   el backend se cambia esa constante por la respuesta del servicio, con la
   misma forma:

     { nombre, rut, ingreso, tomados, generados, sistema, real }

   `real` es el saldo que calcula el informe y `sistema` el que trae el ERP.
   La diferencia entre los dos es el motivo de esta pantalla, así que se
   calcula acá y no viene dada.

   La versión sin datos, con {{placeholders}}, está en
   plantillas/informe-colaborador.html.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     DATOS DE MUESTRA · DESECHABLE
     ====================================================================== */

  const PERSONAS = [
    { nombre: "Catalina Alberto Palma Barrera", rut: 8973481, ingreso: "2000-09-22", tomados: 367.99, generados: 378.51, sistema: 3.89, real: 10.52 },
    { nombre: "Felipe Isabel Navarrete Pizarro", rut: 8268530, ingreso: "2024-02-13", tomados: 13.56, generados: 38.38, sistema: 24.82, real: 24.82 },
    { nombre: "Mario Andrés Reyes Sandoval", rut: 10086254, ingreso: "2011-09-07", tomados: 79.49, generados: 215.66, sistema: 136.17, real: 136.17 },
    { nombre: "Carolina Antonio Quiroz Espinoza", rut: 7340146, ingreso: "2003-09-10", tomados: 278.53, generados: 355.42, sistema: 76.89, real: 76.89 },
    { nombre: "Tomás Felipe Cáceres Arriagada", rut: 19852668, ingreso: "2012-04-02", tomados: 105.77, generados: 217.24, sistema: 111.47, real: 111.47 },
    { nombre: "Hernán Paz Fuentealba Arriagada", rut: 10826377, ingreso: "2006-04-21", tomados: 243.83, generados: 314.1, sistema: 0.74, real: 70.27 },
    { nombre: "Álvaro Soledad Alvarado Ormeño", rut: 7390552, ingreso: "2002-03-09", tomados: 163.31, generados: 352.66, sistema: 189.35, real: 189.35 },
    { nombre: "Ignacio Alberto Soto Paredes", rut: 11829158, ingreso: "2015-06-18", tomados: 98.96, generados: 160.53, sistema: 4.16, real: 61.57 },
    { nombre: "Josefa Andrés Paredes Tapia", rut: 11656791, ingreso: "2005-11-28", tomados: 285.11, generados: 328.28, sistema: 0.32, real: 43.17 },
    { nombre: "Víctor Carolina Cárdenas Figueroa", rut: 11709969, ingreso: "2001-06-05", tomados: 132.48, generados: 372.76, sistema: 240.28, real: 240.28 },
    { nombre: "Víctor Javier Cortés Garrido", rut: 6925965, ingreso: "2011-08-09", tomados: 92.46, generados: 229.91, sistema: 137.45, real: 137.45 },
    { nombre: "Álvaro José Tapia Gallardo", rut: 19642989, ingreso: "2019-02-16", tomados: 64.81, generados: 112.33, sistema: 43.16, real: 47.52 },
    { nombre: "Josefa Ignacio González Mella", rut: 15969118, ingreso: "2018-07-13", tomados: 50.37, generados: 111.45, sistema: 91.19, real: 61.08 },
    { nombre: "Ignacio Esteban Vergara Maldonado", rut: 6607814, ingreso: "2004-04-05", tomados: 203.04, generados: 342.29, sistema: 151.59, real: 139.25 },
    { nombre: "Carolina Paz Valenzuela Muñoz", rut: 18997036, ingreso: "2017-08-01", tomados: 101.3, generados: 150.39, sistema: 49.09, real: 49.09 },
    { nombre: "Víctor Soledad Carrasco Cárdenas", rut: 20191664, ingreso: "2012-09-07", tomados: 191.41, generados: 208.12, sistema: 4.89, real: 16.71 },
    { nombre: "Tomás Belén Reyes Leiva", rut: 13180860, ingreso: "2004-11-21", tomados: 246.38, generados: 322.94, sistema: 123.25, real: 76.56 },
    { nombre: "Nicolás Paz Maldonado Palma", rut: 7518183, ingreso: "1999-05-26", tomados: 274.52, generados: 406.15, sistema: 131.63, real: 131.63 },
    { nombre: "Antonia Isabel Sandoval Cortés", rut: 7132131, ingreso: "2024-12-06", tomados: 16.08, generados: 40.63, sistema: 24.55, real: 24.55 },
    { nombre: "Jaime Carolina Toledo Quiroz", rut: 13030457, ingreso: "2016-07-15", tomados: 95.86, generados: 151.92, sistema: 56.06, real: 56.06 },
    { nombre: "Nicolás Carolina Toledo Maldonado", rut: 10493031, ingreso: "2017-04-22", tomados: 47.21, generados: 129.24, sistema: 82.03, real: 82.03 },
    { nombre: "Francisca Ignacio Tapia González", rut: 17674451, ingreso: "2005-09-28", tomados: 282.19, generados: 307.36, sistema: 1.43, real: 25.17 },
    { nombre: "Nicolás Carolina Fuenzalida Soto", rut: 14438022, ingreso: "2015-07-02", tomados: 115.02, generados: 162.2, sistema: 47.18, real: 47.18 },
    { nombre: "Nicolás Javier Peña Urrutia", rut: 16979460, ingreso: "1998-09-24", tomados: 228.55, generados: 417.71, sistema: 189.16, real: 189.16 },
    { nombre: "Jaime Soledad Melo Espinoza", rut: 20200986, ingreso: "2017-06-24", tomados: 97.21, generados: 141.23, sistema: 44.02, real: 44.02 },
    { nombre: "Daniela Eduardo Sepúlveda Garrido", rut: 19432984, ingreso: "2022-10-16", tomados: 50.56, generados: 76.67, sistema: 0.62, real: 26.11 },
    { nombre: "Marcelo Antonio Leiva Maldonado", rut: 16922271, ingreso: "2015-11-04", tomados: 114.0, generados: 177.24, sistema: 2.26, real: 63.24 },
    { nombre: "Felipe Elena Soto Bustamante", rut: 15412646, ingreso: "1998-10-06", tomados: 404.04, generados: 412.77, sistema: 11.87, real: 8.73 },
    { nombre: "Patricio Andrés Peña Pizarro", rut: 7234641, ingreso: "2005-04-16", tomados: 195.98, generados: 321.62, sistema: 125.64, real: 125.64 },
    { nombre: "Trinidad Felipe Cáceres Paredes", rut: 17398177, ingreso: "2024-06-09", tomados: 10.66, generados: 21.88, sistema: 11.22, real: 11.22 },
    { nombre: "Cristián Andrés Gallardo Olivares", rut: 10636750, ingreso: "2010-05-18", tomados: 234.34, generados: 242.63, sistema: 76.35, real: 8.29 },
    { nombre: "Marcelo Javier Cáceres Gallardo", rut: 8969138, ingreso: "2007-02-04", tomados: 170.88, generados: 290.61, sistema: 138.35, real: 119.73 },
    { nombre: "Patricio José Jaramillo Rojas", rut: 20746597, ingreso: "1999-06-17", tomados: 186.98, generados: 411.18, sistema: 303.7, real: 224.2 },
    { nombre: "Mauricio Andrés Maldonado Navarrete", rut: 15581149, ingreso: "2022-12-25", tomados: 64.17, generados: 74.77, sistema: 10.6, real: 10.6 },
    { nombre: "Rodrigo Carolina Peña González", rut: 8018424, ingreso: "2003-09-20", tomados: 196.27, generados: 341.72, sistema: 183.16, real: 145.45 },
    { nombre: "Óscar Alberto Arriagada Tapia", rut: 20087523, ingreso: "1996-09-08", tomados: 444.39, generados: 467.96, sistema: 29.29, real: 23.57 },
    { nombre: "Hernán Alberto Rojas Espinoza", rut: 11127584, ingreso: "2014-09-02", tomados: 88.71, generados: 196.15, sistema: 107.44, real: 107.44 },
    { nombre: "Andrés Alberto Leiva Urrutia", rut: 13322486, ingreso: "2017-12-25", tomados: 97.34, generados: 142.09, sistema: 91.54, real: 44.75 },
    { nombre: "Jaime Belén Carrasco Fuenzalida", rut: 11920684, ingreso: "2015-12-01", tomados: 110.71, generados: 165.96, sistema: 55.25, real: 55.25 },
    { nombre: "Sebastián Elena Cárdenas Palma", rut: 13339780, ingreso: "1998-12-21", tomados: 296.77, generados: 421.48, sistema: 124.71, real: 124.71 },
    { nombre: "Víctor Antonio Palma Pizarro", rut: 12636685, ingreso: "2021-06-23", tomados: 41.05, generados: 76.59, sistema: 35.54, real: 35.54 },
    { nombre: "Gonzalo Paz Paredes Maldonado", rut: 6668975, ingreso: "2010-12-12", tomados: 103.36, generados: 256.23, sistema: 152.87, real: 152.87 },
    { nombre: "Rodrigo Andrés Peña Muñoz", rut: 11164395, ingreso: "2016-06-18", tomados: 109.2, generados: 157.87, sistema: 48.67, real: 48.67 },
    { nombre: "Felipe Fernanda Cortés Reyes", rut: 7975372, ingreso: "2015-07-03", tomados: 127.5, generados: 155.55, sistema: 28.05, real: 28.05 },
    { nombre: "Camila Paz Contreras Cortés", rut: 11621216, ingreso: "2015-07-03", tomados: 117.89, generados: 166.19, sistema: 5.85, real: 48.3 },
    { nombre: "Tomás Ignacio Fuentealba Vergara", rut: 14439411, ingreso: "2000-09-23", tomados: 251.41, generados: 399.01, sistema: 223.53, real: 147.6 },
    { nombre: "Fernanda Esteban Arriagada Soto", rut: 6902106, ingreso: "2004-05-28", tomados: 245.28, generados: 339.25, sistema: 93.97, real: 93.97 },
    { nombre: "Sebastián Soledad Sepúlveda Contreras", rut: 8767647, ingreso: "2008-03-14", tomados: 241.48, generados: 281.74, sistema: 2.14, real: 40.26 },
    { nombre: "Carolina Elena Palma Rojas", rut: 16847981, ingreso: "1997-11-05", tomados: 396.66, generados: 431.05, sistema: 34.39, real: 34.39 },
    { nombre: "Mauricio Alberto Soto Barrera", rut: 16344847, ingreso: "2020-08-10", tomados: 81.35, generados: 84.14, sistema: 2.79, real: 2.79 },
    { nombre: "Isidora Paz González Leiva", rut: 6922332, ingreso: "2007-03-11", tomados: 158.44, generados: 284.5, sistema: 126.06, real: 126.06 },
    { nombre: "Esteban Soledad Peña Garrido", rut: 15357976, ingreso: "2015-10-28", tomados: 118.53, generados: 160.12, sistema: 41.59, real: 41.59 },
    { nombre: "Javiera Elena Alarcón Olivares", rut: 8501877, ingreso: "2001-09-21", tomados: 323.48, generados: 366.35, sistema: 42.87, real: 42.87 },
    { nombre: "Cristián Soledad Melo Palma", rut: 7641951, ingreso: "2018-02-23", tomados: 56.72, generados: 135.1, sistema: 78.38, real: 78.38 },
    { nombre: "Ignacio Isabel Maldonado Urrutia", rut: 11810851, ingreso: "2009-03-18", tomados: 101.07, generados: 264.21, sistema: 163.14, real: 163.14 },
    { nombre: "Hernán Antonio Urrutia Peña", rut: 14746121, ingreso: "2000-02-12", tomados: 341.9, generados: 402.82, sistema: 114.45, real: 60.92 },
    { nombre: "Carolina Alberto Riquelme Tapia", rut: 16979179, ingreso: "1996-05-27", tomados: 209.74, generados: 454.04, sistema: 279.18, real: 244.3 },
    { nombre: "Sebastián Belén Espinoza Carrasco", rut: 9495538, ingreso: "2000-07-01", tomados: 214.44, generados: 381.26, sistema: 166.82, real: 166.82 },
    { nombre: "Claudio Alejandro Fuenzalida González", rut: 15034138, ingreso: "1996-10-06", tomados: 224.92, generados: 464.19, sistema: 239.27, real: 239.27 },
    { nombre: "Magdalena Elena Soto Jaramillo", rut: 16406961, ingreso: "2025-04-13", tomados: 12.95, generados: 17.11, sistema: 1.28, real: 4.16 },
    { nombre: "Daniela Javier Alvarado Toledo", rut: 20071106, ingreso: "2008-06-15", tomados: 250.4, generados: 267.01, sistema: 16.61, real: 16.61 },
    { nombre: "Magdalena Fernanda Fuenzalida Cáceres", rut: 20014101, ingreso: "1999-03-23", tomados: 366.22, generados: 410.51, sistema: 44.29, real: 44.29 },
    { nombre: "Javiera José Melo Villablanca", rut: 19286062, ingreso: "2008-01-24", tomados: 127.88, generados: 282.02, sistema: 154.14, real: 154.14 },
    { nombre: "Felipe Fernanda Palma Toledo", rut: 16350745, ingreso: "2022-11-04", tomados: 45.35, generados: 49.13, sistema: 3.78, real: 3.78 },
  ];

  /* ======================================================================
     ESTADO
     ====================================================================== */

  const POR_PAGINA = 20;
  let filtro = "todas";
  let busqueda = "";
  let pagina = 0;

  const FILAS = PERSONAS.map((p) => ({
    ...p,
    diferencia: Number((p.sistema - p.real).toFixed(2)),
  }));

  /* ======================================================================
     FORMATO
     ====================================================================== */

  function cifra(n) {
    return n.toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function rut(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function sinTildes(texto) {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  /* ======================================================================
     QUÉ SE VE
     ====================================================================== */

  function visibles() {
    return FILAS.filter((f) => {
      if (filtro === "con" && f.diferencia === 0) return false;
      if (filtro === "sin" && f.diferencia !== 0) return false;
      if (!busqueda) return true;
      return sinTildes(f.nombre).includes(busqueda) || String(f.rut).includes(busqueda);
    });
  }

  function etiquetaDiferencia(d) {
    if (d === 0) return `<span class="s-saldos__cuadra">0,00</span>`;
    const clase = d < 0 ? "c-tag--rechazado" : "c-tag--pendiente";
    const signo = d < 0 ? "−" : "+";
    return `<span class="c-tag ${clase}">${signo}${cifra(Math.abs(d))}</span>`;
  }

  function pinta() {
    const cuerpo = document.querySelector("[data-filas]");
    const vacio = document.querySelector("[data-vacio]");
    if (!cuerpo) return;

    const lista = visibles();
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    pagina = Math.min(Math.max(pagina, 0), paginas - 1);
    const trozo = lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

    cuerpo.innerHTML = trozo
      .map(
        (f, i) => `
        <tr class="c-table__row" data-fila="${pagina * POR_PAGINA + i}">
          <td data-col="Persona">
            <span class="c-persona__nombre">${f.nombre}</span>
          </td>
          <td data-col="RUT">${rut(f.rut)}</td>
          <td data-col="Ingreso">${f.ingreso}</td>
          <td class="s-saldos__num" data-col="Días tomados">${cifra(f.tomados)}</td>
          <td class="s-saldos__num" data-col="Días generados">${cifra(f.generados)}</td>
          <td class="s-saldos__num" data-col="Saldo sistema">${cifra(f.sistema)}</td>
          <td class="s-saldos__num s-saldos__num--fuerte" data-col="Saldo real">${cifra(f.real)}</td>
          <td class="s-saldos__num" data-col="Diferencia">${etiquetaDiferencia(f.diferencia)}</td>
          <td class="s-saldos__detalle" data-col="Detalle">
            <div class="c-acciones c-acciones--fin">
              <button class="c-btn c-btn--neutro" type="button" data-abre="#drawer-informe"
                      aria-label="Ver informe de ${f.nombre}">Ver</button>
            </div>
          </td>
        </tr>`,
      )
      .join("");

    vacio.hidden = lista.length > 0;
    pintaPaginacion(lista.length, paginas);
    pintaResumen();
  }

  function pintaPaginacion(total, paginas) {
    const nav = document.querySelector("[data-paginacion]");
    const nota = document.querySelector("[data-paginacion-nota]");
    if (!nav) return;

    nav.hidden = total === 0;
    if (nav.hidden) return;

    const desde = pagina * POR_PAGINA + 1;
    const hasta = Math.min((pagina + 1) * POR_PAGINA, total);
    nota.textContent = `Mostrando ${desde} a ${hasta} de ${total} personas`;
    nav.querySelector('[data-pag="-1"]').disabled = pagina === 0;
    nav.querySelector('[data-pag="1"]').disabled = pagina >= paginas - 1;
  }

  // El indicador cuenta sobre el total, no sobre lo que se está viendo: es
  // el tamaño del problema, no el de la página.
  function pintaResumen() {
    const destino = document.querySelector("[data-stat-diferencia]");
    if (destino) destino.textContent = FILAS.filter((f) => f.diferencia !== 0).length;
  }

  /* ======================================================================
     EL CAJÓN DEL DETALLE
     Es una muestra de diseño: el contenido no cambia, pero al menos la
     cabecera dice a quién abriste.
     ====================================================================== */

  function conectaDrawer() {
    const drawer = document.querySelector("#drawer-informe");
    if (!drawer) return;

    document.addEventListener("click", (e) => {
      const fila = e.target.closest("[data-fila]");
      if (!fila) return;
      const persona = FILAS[Number(fila.dataset.fila)];
      if (!persona) return;
      drawer.querySelector("[data-drawer-nombre]").textContent = persona.nombre;
      drawer.querySelector("[data-drawer-rut]").textContent = `RUT ${rut(persona.rut)}`;
      drawer.querySelector("[data-drawer-pos]").textContent =
        `${Number(fila.dataset.fila) + 1} de ${FILAS.length}`;
    });
  }

  /* ======================================================================
     ARRANQUE
     ====================================================================== */

  document.querySelector("[data-buscar]")?.addEventListener("input", (e) => {
    busqueda = sinTildes(e.target.value.trim());
    pagina = 0;
    pinta();
  });

  document.querySelectorAll("[data-filtro]").forEach((boton) => {
    boton.addEventListener("click", () => {
      filtro = boton.dataset.filtro;
      pagina = 0;
      document.querySelectorAll("[data-filtro]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === boton));
      });
      pinta();
    });
  });

  document.querySelectorAll("[data-pag]").forEach((boton) => {
    boton.addEventListener("click", () => {
      pagina += Number(boton.dataset.pag);
      pinta();
      document.querySelector(".c-table").scrollIntoView({ block: "start" });
    });
  });

  conectaDrawer();
  pinta();
})();
