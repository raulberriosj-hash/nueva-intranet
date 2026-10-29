// ============================================================================
// Feriados legales de Chile.
//
// Los usan el home (la lista de «Próximos Festivos») y la pantalla de
// colaboradores en vacaciones, que marca los feriados en la línea de
// tiempo y los descuenta de los días hábiles. Por eso vive suelto y no
// dentro de ninguna de las dos.
//
// getChileHolidays(año) devuelve [{ date, name }] con los feriados
// irrenunciables y los móviles ya calculados (Pascua, San Pedro y San
// Pablo, Encuentro de Dos Mundos).
//
// renderHolidays() es lo del home: si no encuentra su lista, no hace nada.
// ============================================================================

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monthDay = h + l - 7 * m + 114;
  const month = Math.floor(monthDay / 31); // 3 = marzo, 4 = abril
  const day = (monthDay % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// San Pedro y San Pablo (29 de junio): si cae martes a viernes, se traslada
// al lunes anterior. Si cae sábado, domingo o lunes, se queda en el 29.
function getSanPedroYSanPablo(year) {
  const base = new Date(year, 5, 29);
  const weekday = base.getDay(); // 0=domingo ... 6=sábado
  if (weekday >= 2 && weekday <= 5) {
    return addDays(base, -(weekday - 1));
  }
  return base;
}

// Encuentro de Dos Mundos (12 de octubre): si cae martes a jueves, se
// traslada al lunes anterior; si cae viernes a domingo, al lunes siguiente.
function getEncuentroDeDosMundos(year) {
  const base = new Date(year, 9, 12);
  const weekday = base.getDay();
  if (weekday >= 2 && weekday <= 4) {
    return addDays(base, -(weekday - 1));
  }
  if (weekday === 5 || weekday === 6 || weekday === 0) {
    const daysToMonday = weekday === 0 ? 1 : 8 - weekday;
    return addDays(base, daysToMonday);
  }
  return base;
}

function getChileHolidays(year) {
  const easterSunday = getEasterSunday(year);
  return [
    { date: new Date(year, 0, 1), name: "Año Nuevo" },
    { date: addDays(easterSunday, -2), name: "Viernes Santo" },
    { date: addDays(easterSunday, -1), name: "Sábado Santo" },
    { date: new Date(year, 4, 1), name: "Día Nacional del Trabajo" },
    { date: new Date(year, 4, 21), name: "Día de las Glorias Navales" },
    {
      date: new Date(year, 5, 21),
      name: "Día Nacional de los Pueblos Indígenas",
    },
    { date: getSanPedroYSanPablo(year), name: "San Pedro y San Pablo" },
    { date: new Date(year, 6, 16), name: "Día de la Virgen del Carmen" },
    { date: new Date(year, 7, 15), name: "Asunción de la Virgen" },
    { date: new Date(year, 8, 18), name: "Independencia Nacional" },
    { date: new Date(year, 8, 19), name: "Día de las Glorias del Ejército" },
    { date: getEncuentroDeDosMundos(year), name: "Encuentro de Dos Mundos" },
    {
      date: new Date(year, 9, 31),
      name: "Día de las Iglesias Evangélicas y Protestantes",
    },
    { date: new Date(year, 10, 1), name: "Día de Todos los Santos" },
    { date: new Date(year, 11, 8), name: "Inmaculada Concepción" },
    { date: new Date(year, 11, 25), name: "Navidad" },
  ];
}

function getUpcomingHolidays(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const holidays = [currentYear, currentYear + 1, currentYear + 2]
    .flatMap(getChileHolidays)
    .filter((holiday) => holiday.date >= today)
    .sort((a, b) => a.date - b.date);

  return holidays.slice(0, count);
}

function formatHolidayDate(date) {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  return `${weekday}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
}

function renderHolidays() {
  const list = document.querySelector("[data-holidays-list]");
  if (!list) return;

  list.innerHTML = "";

  getUpcomingHolidays(10).forEach((holiday) => {
    const item = document.createElement("li");
    item.className = "s-inicio__fila";

    const person = document.createElement("span");
    person.className = "s-inicio__persona";

    const name = document.createElement("span");
    name.className = "s-inicio__nombre";
    name.textContent = holiday.name;
    person.appendChild(name);

    const date = document.createElement("span");
    date.className = "s-inicio__fecha";
    date.textContent = formatHolidayDate(holiday.date);

    item.appendChild(person);
    item.appendChild(date);
    list.appendChild(item);
  });
}

renderHolidays();
