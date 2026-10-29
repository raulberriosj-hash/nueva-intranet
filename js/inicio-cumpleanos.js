// ============================================================================
// Cumpleaños — INTEGRACIÓN PENDIENTE CON LA BASE DE DATOS DEL EQUIPO.
//
// Esta sección hoy pinta datos de ejemplo (MOCK_BIRTHDAYS) para poder
// visualizar el diseño. Para conectarla a la base de datos real, el único
// punto que hay que tocar es fetchBirthdays(): reemplazar su cuerpo por la
// llamada real (fetch a una API REST, GraphQL, SDK del backend, etc.) que
// devuelva datos con la misma forma. El resto del archivo (render, estado
// vacío, manejo de errores) ya está listo para consumir esa forma de datos
// sin más cambios.
//
// Contrato esperado — fetchBirthdays() debe devolver (o resolver, si es
// async) un objeto:
//   {
//     today: [{ name: "Juan Muñoz", date: "20 de Enero" }, ...],
//     team:  [{ name: "Josefa Pino", date: "20 de Enero" }, ...],
//   }
// - "today": cumpleaños de toda la empresa que caen hoy.
// - "team": cumpleaños del equipo del usuario (puede incluir próximas fechas,
//   no solo las de hoy).
// - "avatar": la foto de perfil de la persona. Es opcional: quien no tenga
//   foto se pinta con el robot de AVATAR_POR_DEFECTO, el mismo que usa el
//   menú lateral.
// - Ambas listas deben venir ya filtradas/ordenadas por el backend; este
//   script solo se encarga de pintarlas en el DOM.
// ============================================================================

const MOCK_BIRTHDAYS = {
  today: [
    { name: "Juan Muñoz", date: "20 de Enero" },
    { name: "Daniela Torres", date: "20 de Enero" },
    { name: "Mario Tapia", date: "20 de Enero" },
  ],
  team: [
    { name: "Josefa Pino", date: "20 de Enero" },
    { name: "Matías Tobar", date: "20 de Enero" },
  ],
};

// Quien no trae foto de perfil se pinta con este robot, igual que en el
// menú lateral (js/sidebar.js, USUARIO.avatar).
const AVATAR_POR_DEFECTO = "assets/img/avatar-placeholder.png";

// TODO(backend): reemplazar por la llamada real, por ejemplo:
//   async function fetchBirthdays() {
//     const res = await fetch("/api/birthdays");
//     if (!res.ok) throw new Error("No se pudo cargar cumpleaños");
//     return res.json();
//   }
async function fetchBirthdays() {
  return MOCK_BIRTHDAYS;
}

function renderBirthdayList(listElement, birthdays, emptyMessage) {
  if (!listElement) return;

  listElement.innerHTML = "";

  if (!birthdays || birthdays.length === 0) {
    const empty = document.createElement("li");
    empty.className = "s-inicio__fila s-inicio__fila--vacia";
    empty.textContent = emptyMessage;
    listElement.appendChild(empty);
    return;
  }

  birthdays.forEach((person) => {
    const item = document.createElement("li");
    item.className = "s-inicio__fila";

    const personEl = document.createElement("span");
    personEl.className = "s-inicio__persona";

    const avatar = document.createElement("img");
    avatar.className = "c-avatar";
    avatar.src = person.avatar || AVATAR_POR_DEFECTO;
    avatar.alt = "";
    personEl.appendChild(avatar);

    const name = document.createElement("span");
    name.className = "s-inicio__nombre";
    name.textContent = person.name;
    personEl.appendChild(name);

    item.appendChild(personEl);

    if (person.date) {
      const date = document.createElement("span");
      date.className = "s-inicio__fecha";
      date.textContent = person.date;
      item.appendChild(date);
    }

    listElement.appendChild(item);
  });
}

async function initBirthdays() {
  const todayList = document.querySelector("[data-birthdays-today]");
  const teamList = document.querySelector("[data-birthdays-team]");

  try {
    const { today, team } = await fetchBirthdays();
    renderBirthdayList(todayList, today, "No hay cumpleaños hoy.");
    renderBirthdayList(teamList, team, "Sin cumpleaños próximos en tu equipo.");
  } catch (error) {
    renderBirthdayList(todayList, [], "No se pudieron cargar los cumpleaños.");
    renderBirthdayList(teamList, [], "No se pudieron cargar los cumpleaños.");
    console.error("Error al cargar cumpleaños:", error);
  }
}

initBirthdays();
