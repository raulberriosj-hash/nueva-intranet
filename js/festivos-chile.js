// ============================================================================
// Feriados legales de Chile.
//
// Los usan el home (la lista de «Próximos Festivos») y la pantalla de
// colaboradores en vacaciones, que marca los feriados en la línea de
// tiempo y los descuenta de los días hábiles. Por eso vive suelto y no
// dentro de ninguna de las dos.
//
// getChileHolidays(año) devuelve [{ date, name, irrenunciable }] con los feriados
// irrenunciables y los móviles ya calculados (Pascua, San Pedro y San
// Pablo, Encuentro de Dos Mundos).
//
// renderHolidays() es lo del home: pinta el destacado, las cuatro líneas de
// la tarjeta y la tabla del modal. Si no encuentra su lista, no hace nada.
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

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun",
                     "jul", "ago", "sep", "oct", "nov", "dic"];

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
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
    { date: new Date(year, 0, 1), name: "Año Nuevo", irrenunciable: true },
    { date: addDays(easterSunday, -2), name: "Viernes Santo" },
    { date: addDays(easterSunday, -1), name: "Sábado Santo" },
    {
      date: new Date(year, 4, 1),
      name: "Día Nacional del Trabajo",
      irrenunciable: true,
    },
    { date: new Date(year, 4, 21), name: "Día de las Glorias Navales" },
    {
      date: new Date(year, 5, 21),
      name: "Día Nacional de los Pueblos Indígenas",
    },
    { date: getSanPedroYSanPablo(year), name: "San Pedro y San Pablo" },
    { date: new Date(year, 6, 16), name: "Día de la Virgen del Carmen" },
    { date: new Date(year, 7, 15), name: "Asunción de la Virgen" },
    {
      date: new Date(year, 8, 18),
      name: "Independencia Nacional",
      irrenunciable: true,
    },
    {
      date: new Date(year, 8, 19),
      name: "Día de las Glorias del Ejército",
      irrenunciable: true,
    },
    { date: getEncuentroDeDosMundos(year), name: "Encuentro de Dos Mundos" },
    {
      date: new Date(year, 9, 31),
      name: "Día de las Iglesias Evangélicas y Protestantes",
    },
    { date: new Date(year, 10, 1), name: "Día de Todos los Santos" },
    { date: new Date(year, 11, 8), name: "Inmaculada Concepción" },
    { date: new Date(year, 11, 25), name: "Navidad", irrenunciable: true },
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

// Cuántos feriados asoman en la tarjeta —sin contar el destacado, que va
// aparte— y cuántos entran en la tabla del modal que abre el "+ Ver más".
const FESTIVOS_VISIBLES = 4;
const FESTIVOS_MODAL = 12;

function filaFestivo(holiday) {
  const item = document.createElement("li");
  item.className = "s-inicio__festivo";

  const fecha = document.createElement("span");
  fecha.className = "s-inicio__festivoFecha";
  fecha.textContent = `${holiday.date.getDate()} ${
    MONTH_SHORT[holiday.date.getMonth()]
  } ${holiday.date.getFullYear()}`;

  const nombre = document.createElement("span");
  nombre.className = "s-inicio__festivoNombre";
  nombre.textContent = holiday.name;

  // Los irrenunciables llevan la marca al lado: son los que no se pueden
  // trabajar, así que cambian los planes de más gente.
  if (holiday.irrenunciable) {
    const marca = document.createElement("span");
    marca.className = "s-inicio__festivoMarca";
    marca.textContent = "· Irrenunciable";
    nombre.appendChild(marca);
  }

  const dia = document.createElement("span");
  dia.className = "s-inicio__festivoDia";
  dia.textContent = WEEKDAY_SHORT[holiday.date.getDay()];

  item.append(fecha, nombre, dia);
  return item;
}

// La fila de la tabla del modal: la fecha entera, el nombre y si es de los
// que no se pueden trabajar.
function filaTablaFestivo(holiday) {
  // La clase y los data-col son lo que necesita .c-table para plegarse en
  // teléfono: bajo 768 cada fila pasa a bloque y cada celda muestra ahí su
  // encabezado.
  const fila = document.createElement("tr");
  fila.className = "c-table__row";

  const dia = document.createElement("td");
  dia.dataset.col = "Día";
  dia.textContent = `${WEEKDAY_NAMES[holiday.date.getDay()]}, ${String(
    holiday.date.getDate(),
  ).padStart(2, "0")} de ${
    MONTH_NAMES[holiday.date.getMonth()]
  } ${holiday.date.getFullYear()}`;

  const nombre = document.createElement("td");
  nombre.dataset.col = "Festividad";
  nombre.textContent = holiday.name;

  const tipo = document.createElement("td");
  tipo.dataset.col = "Tipo";
  tipo.className = "s-inicio__tipoFeriado";
  if (holiday.irrenunciable) {
    tipo.classList.add("s-inicio__tipoFeriado--irrenunciable");
    tipo.textContent = "Irrenunciable";
  } else {
    tipo.textContent = "Festivo";
  }

  fila.append(dia, nombre, tipo);
  return fila;
}

function renderHolidays() {
  const destacado = document.querySelector("[data-holiday-next]");
  const list = document.querySelector("[data-holidays-list]");
  if (!destacado || !list) return;

  const proximos = getUpcomingHolidays(FESTIVOS_MODAL);
  if (!proximos.length) return;

  // --- El que viene: va solo y en grande, porque es el único con el que se
  // hacen planes. Sin cuenta regresiva: la fecha y el día de la semana dicen
  // lo que hay que saber.
  const [primero, ...resto] = proximos;

  destacado.innerHTML = "";
  const caja = document.createElement("div");
  caja.className = "s-inicio__proximo";

  const chip = document.createElement("span");
  chip.className = "s-inicio__proximoChip";
  const dia = document.createElement("span");
  dia.className = "s-inicio__proximoDia";
  dia.textContent = primero.date.getDate();
  const mes = document.createElement("span");
  mes.className = "s-inicio__proximoMes";
  mes.textContent = MONTH_SHORT[primero.date.getMonth()];
  chip.appendChild(dia);
  chip.appendChild(mes);
  caja.appendChild(chip);

  const datos = document.createElement("span");
  datos.className = "s-inicio__proximoDatos";
  const nombre = document.createElement("span");
  nombre.className = "s-inicio__proximoNombre";
  nombre.textContent = primero.name;
  const semana = document.createElement("span");
  semana.className = "s-inicio__proximoSemana";
  semana.textContent = WEEKDAY_NAMES[primero.date.getDay()];
  datos.appendChild(nombre);
  datos.appendChild(semana);
  caja.appendChild(datos);

  destacado.appendChild(caja);

  // --- Los demás, en una línea cada uno: están para saber que existen, no
  // para mirarlos. Solo asoman cuatro; el resto está en el modal.
  list.innerHTML = "";
  resto
    .slice(0, FESTIVOS_VISIBLES)
    .forEach((holiday) => list.appendChild(filaFestivo(holiday)));

  // --- La lista completa vive en el modal. El "+ Ver más" lo abre con
  // [data-abre], que es lo que escucha js/componentes.js.
  const tabla = document.querySelector("[data-holidays-tabla]");
  if (tabla) {
    tabla.innerHTML = "";
    proximos.forEach((holiday) => tabla.appendChild(filaTablaFestivo(holiday)));
  }

  const seccion = list.closest("section");
  if (!seccion) return;

  const anterior = seccion.querySelector("[data-holidays-mas]");
  if (anterior) anterior.remove();

  if (!tabla || resto.length <= FESTIVOS_VISIBLES) return;

  const mas = document.createElement("button");
  mas.className = "s-inicio__mas";
  mas.type = "button";
  mas.dataset.holidaysMas = "";
  mas.dataset.abre = "#modal-feriados";
  mas.textContent = "+ Ver más";
  seccion.appendChild(mas);
}

renderHolidays();
