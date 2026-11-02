// ============================================================================
// Cumpleaños — INTEGRACIÓN PENDIENTE CON LA BASE DE DATOS DEL EQUIPO.
//
// Una sola lista con tres tramos de tiempo (hoy · esta semana · este mes) en
// vez de dos listas sueltas. Lo que se gana: la tarjeta mide lo mismo con un
// equipo de 10 que con uno de 100, porque cada tramo muestra cuatro filas y
// el resto se abre con "+N más".
//
// Los tramos son ACUMULATIVOS desde hoy: "esta semana" son los próximos 7
// días contando hoy, y "este mes" los próximos 30. Así los números no hay que
// sumarlos de cabeza y el de la derecha siempre es el mayor.
//
// Para conectarlo a la base de datos real, el único punto que hay que tocar
// es fetchBirthdays(): reemplazar su cuerpo por la llamada real (fetch a una
// API REST, GraphQL, SDK del backend, etc.) que devuelva datos con la misma
// forma. El resto del archivo —tramos, filas, estado vacío, errores— ya está
// listo para consumir esa forma sin más cambios.
//
// Contrato esperado — fetchBirthdays() devuelve (o resuelve, si es async) un
// arreglo de personas, ya filtrado al equipo de quien mira y ordenado por
// fecha:
//   [
//     { nombre: "Juan Muñoz", fecha: "2026-11-02", cargo: "Desarrollo",
//       avatar: "https://…" },
//     …
//   ]
// - "fecha": el cumpleaños que viene, en ISO (YYYY-MM-DD), no la fecha de
//   nacimiento. El backend ya resuelve si cae este año o el próximo.
// - "cargo" y "avatar" son opcionales. Quien no tenga foto se pinta con el
//   robot de AVATAR_POR_DEFECTO, el mismo que usa el menú lateral.
//
// Si mañana quieren mostrar a toda la empresa y no solo al equipo, no hay que
// cambiar nada acá: basta con que el backend mande más gente. Los tramos y el
// "+N más" ya se encargan de que siga siendo legible.
// ============================================================================

// El archivo entero va dentro de una función anónima: el home carga cuatro
// scripts sueltos y así ninguno pisa un nombre de otro.
(() => {
  "use strict";

  // Quien no trae foto de perfil se pinta con este robot, igual que en el
  // menú lateral (js/sidebar.js, USUARIO.avatar).
  const AVATAR_POR_DEFECTO = "assets/img/avatar-placeholder.png";

  // Cuántas filas se ven antes del "+N más"
  const FILAS_VISIBLES = 4;

  // Cuántos avatares se apilan en el bloque de hoy antes del "+N"
  const AVATARES_VISIBLES = 4;

  // Cuántos de la semana asoman debajo del saludo de hoy. El resto está a un
  // clic, en el tramo de al lado.
  const FILAS_PROXIMAS = 2;

  const TRAMOS = {
    hoy: { dias: 0, vacio: "Hoy no cumple nadie de tu equipo." },
    semana: { dias: 7, vacio: "Sin cumpleaños en tu equipo esta semana." },
    mes: { dias: 30, vacio: "Sin cumpleaños en tu equipo este mes." },
  };

  // --- Datos de muestra ------------------------------------------------------
  // Van como días de distancia desde hoy y no como fechas fijas, para que la
  // maqueta no envejezca. El backend manda fechas ISO de verdad.
  const MOCK_EQUIPO = [
    { nombre: "Juan Muñoz", cargo: "Infraestructura", dias: 0 },
    { nombre: "Daniela Torres", cargo: "Desarrollo", dias: 0 },
    { nombre: "Mario Tapia", cargo: "Operaciones", dias: 0 },
    { nombre: "Josefa Pino", cargo: "Desarrollo", dias: 1 },
    { nombre: "Matías Tobar", cargo: "COE", dias: 3 },
    { nombre: "Camila Reyes", cargo: "Administración", dias: 4 },
    { nombre: "Esteban Fuentes", cargo: "TI", dias: 6 },
    { nombre: "Valentina Rojas", cargo: "Desarrollo", dias: 7 },
    { nombre: "Ignacio Soto", cargo: "Gestores", dias: 9 },
    { nombre: "Pía Contreras", cargo: "COE", dias: 11 },
    { nombre: "Rodrigo Vega", cargo: "Implantación", dias: 12 },
    { nombre: "Antonia Lagos", cargo: "Desarrollo", dias: 14 },
    { nombre: "Felipe Carrasco", cargo: "Infraestructura", dias: 16 },
    { nombre: "Catalina Núñez", cargo: "Administración", dias: 18 },
    { nombre: "Tomás Aravena", cargo: "ONNet", dias: 19 },
    { nombre: "Fernanda Silva", cargo: "Bucle", dias: 21 },
    { nombre: "Andrés Molina", cargo: "TI", dias: 23 },
    { nombre: "Javiera Peña", cargo: "Desarrollo", dias: 24 },
    { nombre: "Cristóbal Herrera", cargo: "Gestores", dias: 26 },
    { nombre: "Isidora Bravo", cargo: "COE", dias: 27 },
    { nombre: "Sebastián Muñoz", cargo: "Operaciones", dias: 28 },
    { nombre: "Trinidad Orellana", cargo: "Implantación", dias: 29 },
  ];

  // TODO(backend): reemplazar por la llamada real, por ejemplo:
  //   async function fetchBirthdays() {
  //     const res = await fetch("/api/cumpleanos");
  //     if (!res.ok) throw new Error("No se pudo cargar cumpleaños");
  //     return res.json();
  //   }
  async function fetchBirthdays() {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return MOCK_EQUIPO.map((p) => {
      const f = new Date(base);
      f.setDate(f.getDate() + p.dias);
      const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(
        f.getDate(),
      ).padStart(2, "0")}`;
      return { nombre: p.nombre, cargo: p.cargo, fecha: iso };
    });
  }

  /* ========================================================================
     FECHAS
     ======================================================================== */

  const DIA_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun",
                     "jul", "ago", "sep", "oct", "nov", "dic"];

  function hoy() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function desdeISO(texto) {
    const [a, m, d] = String(texto).split("-").map(Number);
    return new Date(a, m - 1, d);
  }

  const diasHasta = (fecha) => Math.round((fecha - hoy()) / 86400000);

  // Dentro de la semana el día de la semana ubica mejor que el número; más
  // allá, el número y el mes.
  function etiquetaFecha(fecha) {
    const d = diasHasta(fecha);
    if (d === 0) return "hoy";
    if (d === 1) return "mañana";
    if (d <= 7) return `${DIA_CORTO[fecha.getDay()]} ${fecha.getDate()}`;
    return `${fecha.getDate()} ${MES_CORTO[fecha.getMonth()]}`;
  }

  /* ========================================================================
     PINTADO
     ======================================================================== */

  function avatarDe(persona) {
    const img = document.createElement("img");
    img.className = "c-avatar c-avatar--md";
    img.src = persona.avatar || AVATAR_POR_DEFECTO;
    img.alt = "";
    return img;
  }

  // "Juan, Daniela y Mario" · "Juan, Daniela y 4 más"
  function enumera(personas) {
    const nombres = personas.map((p) => p.nombre.split(" ")[0]);
    if (nombres.length === 1) return nombres[0];
    if (nombres.length <= 3) return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
    return `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
  }

  function pintaVacio(caja, texto, proxima) {
    const p = document.createElement("p");
    p.className = "s-inicio__vacio";
    p.textContent = texto;
    caja.appendChild(p);

    if (proxima) {
      const nota = document.createElement("p");
      nota.className = "s-inicio__vacioNota";
      nota.textContent = `El próximo es ${proxima.nombre.split(" ")[0]}, ${etiquetaFecha(
        desdeISO(proxima.fecha),
      )}.`;
      caja.appendChild(nota);
    }
  }

  // El bloque de hoy: avatares apilados, una frase y el botón de saludar. No es
  // una lista porque celebrar no es consultar.
  function pintaHoy(caja, personas) {
    const bloque = document.createElement("div");
    bloque.className = "s-inicio__hoy";

    const pila = document.createElement("span");
    pila.className = "s-inicio__avatares";
    personas.slice(0, AVATARES_VISIBLES).forEach((p) => pila.appendChild(avatarDe(p)));
    if (personas.length > AVATARES_VISIBLES) {
      const resto = document.createElement("span");
      resto.className = "c-avatar c-avatar--md s-inicio__avataresResto";
      resto.textContent = `+${personas.length - AVATARES_VISIBLES}`;
      pila.appendChild(resto);
    }
    bloque.appendChild(pila);

    const texto = document.createElement("p");
    texto.className = "s-inicio__hoyTexto";
    texto.innerHTML = `<strong>${enumera(personas)}</strong> ${
      personas.length === 1 ? "cumple años hoy" : "cumplen años hoy"
    }`;
    bloque.appendChild(texto);

    // TODO(backend): enganchar con el correo o con Teams
    const saludar = document.createElement("button");
    saludar.className = "c-btn c-btn--neutro";
    saludar.type = "button";
    saludar.textContent = "Saludar";
    bloque.appendChild(saludar);

    caja.appendChild(bloque);
  }

  function filaDe(persona, compacta = false) {
    const fecha = desdeISO(persona.fecha);
    const item = document.createElement("li");
    item.className = "s-inicio__fila";

    const quien = document.createElement("span");
    quien.className = "s-inicio__persona";
    quien.appendChild(avatarDe(persona));

    const datos = document.createElement("span");
    datos.className = "s-inicio__datos";

    const nombre = document.createElement("span");
    nombre.className = "s-inicio__nombre";
    nombre.textContent = persona.nombre;
    datos.appendChild(nombre);

    if (persona.cargo && !compacta) {
      const cargo = document.createElement("span");
      cargo.className = "s-inicio__cargo";
      cargo.textContent = persona.cargo;
      datos.appendChild(cargo);
    }

    quien.appendChild(datos);
    item.appendChild(quien);

    const cuando = document.createElement("span");
    cuando.className = "s-inicio__fecha";
    if (diasHasta(fecha) === 0) cuando.classList.add("s-inicio__fecha--hoy");
    cuando.textContent = etiquetaFecha(fecha);
    item.appendChild(cuando);

    return item;
  }

  function pintaLista(caja, personas, tope = FILAS_VISIBLES, compacta = false) {
    const lista = document.createElement("ul");
    lista.className = "s-inicio__lista";
    personas.forEach((p) => lista.appendChild(filaDe(p, compacta)));
    caja.appendChild(lista);

    if (personas.length <= tope) return;

    // Lo que sobra se esconde hasta que lo pidan: con 100 personas en el equipo
    // esta tarjeta se comería la home.
    const ocultas = Array.from(lista.children).slice(tope);
    ocultas.forEach((f) => (f.hidden = true));

    const mas = document.createElement("button");
    mas.className = "s-inicio__mas";
    mas.type = "button";
    mas.setAttribute("aria-expanded", "false");
    mas.textContent = `+${ocultas.length} más`;
    mas.addEventListener("click", () => {
      const abierto = mas.getAttribute("aria-expanded") === "true";
      ocultas.forEach((f) => (f.hidden = abierto));
      mas.setAttribute("aria-expanded", String(!abierto));
      mas.textContent = abierto ? `+${ocultas.length} más` : "Ver menos";
    });
    caja.appendChild(mas);
  }

  /* ========================================================================
     ARMADO
     ======================================================================== */

  async function initBirthdays() {
    const panel = document.querySelector("[data-cumple-panel]");
    const botones = Array.from(document.querySelectorAll("[data-tramo]"));
    if (!panel || !botones.length) return;

    let personas = [];

    try {
      personas = await fetchBirthdays();
    } catch (error) {
      pintaVacio(panel, "No se pudieron cargar los cumpleaños.");
      console.error("Error al cargar cumpleaños:", error);
      return;
    }

    personas = personas
      .map((p) => ({ ...p, _fecha: desdeISO(p.fecha) }))
      .sort((a, b) => a._fecha - b._fecha);

    const del = (tramo) =>
      personas.filter((p) => {
        const d = diasHasta(p._fecha);
        return d >= 0 && d <= TRAMOS[tramo].dias;
      });

    botones.forEach((b) => {
      const cuenta = document.querySelector(`[data-cuenta="${b.dataset.tramo}"]`);
      if (cuenta) cuenta.textContent = del(b.dataset.tramo).length;
    });

    const pinta = (tramo) => {
      panel.innerHTML = "";
      botones.forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.tramo === tramo)),
      );

      const gente = del(tramo);
      if (!gente.length) {
        pintaVacio(panel, TRAMOS[tramo].vacio, personas[0]);
        return;
      }
      if (tramo !== "hoy") {
        pintaLista(panel, gente);
        return;
      }

      pintaHoy(panel, gente);

      // Debajo del saludo, lo que viene: si no, el tramo de hoy queda con un
      // hueco y la tarjeta se ve a medio llenar.
      const semana = del("semana").filter((p) => diasHasta(p._fecha) > 0);
      if (!semana.length) return;

      const rotulo = document.createElement("p");
      rotulo.className = "s-inicio__rotulo";
      rotulo.textContent = "Esta semana";
      panel.appendChild(rotulo);
      // Sin el cargo: son un apunte al margen y así el panel mide lo mismo
      // que en los otros tramos, que es lo que evita que la tarjeta salte.
      pintaLista(panel, semana.slice(0, FILAS_PROXIMAS), FILAS_PROXIMAS, true);
    };

    botones.forEach((b) => b.addEventListener("click", () => pinta(b.dataset.tramo)));

    // Abre en el primer tramo que tenga gente: si hoy no cumple nadie, lo útil
    // es lo que viene, no un cartel de vacío.
    pinta(["hoy", "semana", "mes"].find((t) => del(t).length) || "hoy");
  }

  initBirthdays();
})();
