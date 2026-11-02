// ============================================================================
// Cumpleaños — INTEGRACIÓN PENDIENTE CON LA BASE DE DATOS DEL EQUIPO.
//
// La tarjeta tiene dos partes. Arriba, los de hoy: la mascota, la fecha y una
// pastilla por persona, que es lo que se mira. Abajo, los próximos siete días
// en una lista de tres filas, con el resto detrás de un "+ Ver N más". Así la
// tarjeta mide lo mismo con un equipo de 10 que con uno de 100.
//
// Para conectarlo a la base de datos real, el único punto que hay que tocar
// es fetchBirthdays(): reemplazar su cuerpo por la llamada real (fetch a una
// API REST, GraphQL, SDK del backend, etc.) que devuelva datos con la misma
// forma. El resto del archivo —filas, estados vacíos, errores— ya está listo
// para consumir esa forma sin más cambios.
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
// cambiar nada acá: basta con que el backend mande más gente. La lista corta
// y el "+ Ver N más" ya se encargan de que siga siendo legible.
// ============================================================================

// El archivo entero va dentro de una función anónima: el home carga cuatro
// scripts sueltos y así ninguno pisa un nombre de otro.
(() => {
  "use strict";

  // Quien no trae foto de perfil se pinta con este robot, igual que en el
  // menú lateral (js/sidebar.js, USUARIO.avatar).
  const AVATAR_POR_DEFECTO = "assets/img/avatar-placeholder.png";

  // La mascota del bloque de hoy. Va pegada al borde de abajo de la caja.
  const MASCOTA = "assets/home/img-cumpleanos.png";

  // Hasta dónde llega la lista de abajo y cuántas filas se ven antes del
  // "+ Ver N más"
  const DIAS_PROXIMOS = 7;
  const FILAS_VISIBLES = 3;

  // --- Datos de muestra ------------------------------------------------------
  // Van como días de distancia desde hoy y no como fechas fijas, para que la
  // maqueta no envejezca. El backend manda fechas ISO de verdad.
  const MOCK_EQUIPO = [
    { nombre: "Juan Muñoz", cargo: "Infraestructura", dias: 0 },
    { nombre: "Daniela Torres", cargo: "Desarrollo", dias: 0 },
    { nombre: "Mario Tapia", cargo: "Operaciones", dias: 0 },
    { nombre: "Macarena Parra", cargo: "COE", dias: 1 },
    { nombre: "Josefa del Pino", cargo: "COE", dias: 2 },
    { nombre: "Antonia Soto", cargo: "Desarrollo", dias: 3 },
    { nombre: "Matías Tobar", cargo: "COE", dias: 4 },
    { nombre: "Camila Reyes", cargo: "Administración", dias: 5 },
    { nombre: "Esteban Fuentes", cargo: "TI", dias: 6 },
    { nombre: "Valentina Rojas", cargo: "Desarrollo", dias: 7 },
    { nombre: "Ignacio Soto", cargo: "Gestores", dias: 9 },
    { nombre: "Pía Contreras", cargo: "COE", dias: 11 },
    { nombre: "Rodrigo Vega", cargo: "Implantación", dias: 12 },
    { nombre: "Antonia Lagos", cargo: "Desarrollo", dias: 14 },
    { nombre: "Felipe Carrasco", cargo: "Infraestructura", dias: 16 },
    { nombre: "Catalina Núñez", cargo: "Administración", dias: 18 },
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

  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                 "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre",
                 "Diciembre"];

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

  const fechaLarga = (fecha) => `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;

  /* ========================================================================
     PINTADO
     ======================================================================== */

  function avatarDe(persona, clase = "c-avatar") {
    const img = document.createElement("img");
    img.className = clase;
    img.src = persona.avatar || AVATAR_POR_DEFECTO;
    img.alt = "";
    return img;
  }

  // El bloque de hoy no es una lista: celebrar no es consultar. La mascota, la
  // fecha y los nombres en pastillas, que es lo que se mira para saludar.
  function pintaHoy(caja, personas) {
    caja.innerHTML = "";

    const bloque = document.createElement("div");
    bloque.className = "s-inicio__hoy";

    const ilus = document.createElement("img");
    ilus.className = "s-inicio__hoyIlus";
    ilus.src = MASCOTA;
    ilus.alt = "";
    bloque.appendChild(ilus);

    const datos = document.createElement("div");
    datos.className = "s-inicio__hoyDatos";

    const titulo = document.createElement("p");
    titulo.className = "s-inicio__hoyTitulo";
    const rotulo = document.createElement("strong");
    rotulo.textContent = personas.length ? "Cumpleaños Hoy" : "Hoy no cumple nadie";
    const cuando = document.createElement("span");
    cuando.className = "s-inicio__hoyFecha";
    cuando.textContent = fechaLarga(hoy());
    titulo.append(rotulo, cuando);
    datos.appendChild(titulo);

    if (personas.length) {
      const lista = document.createElement("ul");
      lista.className = "s-inicio__personas";
      personas.forEach((p) => {
        const item = document.createElement("li");
        item.className = "s-inicio__pastilla";
        item.appendChild(avatarDe(p));
        const nombre = document.createElement("span");
        nombre.textContent = p.nombre;
        item.appendChild(nombre);
        lista.appendChild(item);
      });
      datos.appendChild(lista);
    }

    bloque.appendChild(datos);
    caja.appendChild(bloque);
  }

  function filaDe(persona) {
    const item = document.createElement("li");
    item.className = "s-inicio__fila";

    const quien = document.createElement("span");
    quien.className = "s-inicio__persona";
    quien.appendChild(avatarDe(persona, "c-avatar c-avatar--md"));

    const datos = document.createElement("span");
    datos.className = "s-inicio__datos";

    const nombre = document.createElement("span");
    nombre.className = "s-inicio__nombre";
    nombre.textContent = persona.nombre;
    datos.appendChild(nombre);

    if (persona.cargo) {
      const cargo = document.createElement("span");
      cargo.className = "s-inicio__cargo";
      cargo.textContent = persona.cargo;
      datos.appendChild(cargo);
    }

    quien.appendChild(datos);
    item.appendChild(quien);

    const cuando = document.createElement("span");
    cuando.className = "s-inicio__fecha";
    cuando.textContent = fechaLarga(persona._fecha);
    item.appendChild(cuando);

    return item;
  }

  function pintaProximos(caja, personas) {
    caja.innerHTML = "";

    if (!personas.length) {
      const vacio = document.createElement("p");
      vacio.className = "s-inicio__vacio";
      vacio.textContent = "Sin cumpleaños en los próximos 7 días.";
      caja.appendChild(vacio);
      return;
    }

    const lista = document.createElement("ul");
    lista.className = "s-inicio__lista";
    personas.forEach((p) => lista.appendChild(filaDe(p)));
    caja.appendChild(lista);

    if (personas.length <= FILAS_VISIBLES) return;

    // Lo que sobra se esconde hasta que lo pidan: con 100 personas en el equipo
    // esta tarjeta se comería la home.
    const ocultas = Array.from(lista.children).slice(FILAS_VISIBLES);
    ocultas.forEach((f) => (f.hidden = true));

    const mas = document.createElement("button");
    mas.className = "s-inicio__mas";
    mas.type = "button";
    mas.setAttribute("aria-expanded", "false");
    mas.textContent = `+ Ver ${ocultas.length} más`;
    mas.addEventListener("click", () => {
      const abierto = mas.getAttribute("aria-expanded") === "true";
      ocultas.forEach((f) => (f.hidden = abierto));
      mas.setAttribute("aria-expanded", String(!abierto));
      mas.textContent = abierto ? `+ Ver ${ocultas.length} más` : "Ver menos";
    });
    caja.appendChild(mas);
  }

  /* ========================================================================
     ARMADO
     ======================================================================== */

  async function initBirthdays() {
    const cajaHoy = document.querySelector("[data-cumple-hoy]");
    const panel = document.querySelector("[data-cumple-panel]");
    if (!cajaHoy || !panel) return;

    let personas = [];

    try {
      personas = await fetchBirthdays();
    } catch (error) {
      panel.innerHTML = "";
      const aviso = document.createElement("p");
      aviso.className = "s-inicio__vacio";
      aviso.textContent = "No se pudieron cargar los cumpleaños.";
      panel.appendChild(aviso);
      console.error("Error al cargar cumpleaños:", error);
      return;
    }

    personas = personas
      .map((p) => ({ ...p, _fecha: desdeISO(p.fecha) }))
      .sort((a, b) => a._fecha - b._fecha);

    const deHoy = personas.filter((p) => diasHasta(p._fecha) === 0);
    const proximos = personas.filter((p) => {
      const d = diasHasta(p._fecha);
      return d > 0 && d <= DIAS_PROXIMOS;
    });

    pintaHoy(cajaHoy, deHoy);
    pintaProximos(panel, proximos);
  }

  initBirthdays();
})();
