/* ==========================================================================
   SIDEBAR · componente compartido

   Una sola copia del menú para todas las pantallas. Antes cada HTML llevaba
   su propio <aside> y había que tocarlos uno por uno; ahora la pantalla solo
   pone el hueco y carga este archivo:

     <div data-sidebar-slot></div>
     ...
     <script src="js/sidebar.js" defer></script>

   La página activa se marca con un atributo en el <body>:

     <body data-pagina="vacaciones">

   El valor tiene que coincidir con la `id` de alguna entrada del árbol de
   más abajo. Si no coincide ninguna, no se marca nada y no pasa nada.

   CÓMO SE CAMBIA EL MENÚ
   Se toca MENU y nada más. Cada entrada:

     { id, texto, icono, href }                    enlace suelto
     { label: "Jefatura", items: [ ... ] }         sección con su rótulo
     { id, texto, icono, hijos: [ ... ] }          grupo desplegable

   `icono` es el nombre de un símbolo de assets/icons/_sprite-nav.svg sin el
   prefijo `nav-`. `href: null` es una pantalla que todavía no existe: se
   dibuja apagada y no se puede clicar.

   AL IMPLEMENTAR
   Esto es una maqueta sin compilador, así que el menú se pinta con JS. En
   la intranet de verdad lo normal es que sea un parcial del lado del
   servidor o un componente del framework que se use; lo que importa es el
   marcado que sale de acá, que es el que está documentado en el CSS
   (css/sistema/05-sidebar.css).
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     EL MENÚ
     ====================================================================== */

  const MENU = [
    {
      items: [
        { id: "inicio", texto: "Inicio", icono: "home", href: "index.html" },
        { id: "perfil", texto: "Mi Perfil", icono: "user", href: null },
        {
          id: "vacaciones",
          texto: "Vacaciones",
          icono: "maleta",
          href: "mis-vacaciones.html",
        },
      ],
    },
    {
      label: "Jefatura",
      items: [
        {
          id: "equipo",
          texto: "Vacaciones de tu equipo",
          icono: "users",
          hijos: [
            {
              id: "aprobaciones",
              texto: "Solicitudes",
              icono: "inbox",
              href: "aprobaciones.html",
            },
            {
              id: "seguimiento",
              texto: "Seguimiento",
              icono: "chart",
              href: "panel-rrhh.html",
            },
            {
              id: "en-vacaciones",
              texto: "Colaboradores en vacaciones",
              icono: "sun",
              href: null,
            },
          ],
        },
      ],
    },
    {
      label: "RRHH",
      items: [
        {
          id: "informe",
          texto: "Informe por colaborador",
          icono: "person-check",
          href: "informe-colaborador.html",
        },
      ],
    },
    {
      label: "Tickets",
      items: [
        {
          id: "nueva-solicitud",
          texto: "Nueva solicitud",
          icono: "ticket",
          hijos: areasDeTicket("nueva"),
        },
        {
          id: "mis-solicitudes",
          texto: "Mis solicitudes",
          icono: "list",
          hijos: areasDeTicket("mias"),
        },
        {
          id: "gestion",
          texto: "Gestión",
          icono: "settings",
          hijos: areasDeTicket("gestion"),
        },
      ],
    },
  ];

  // Los tres grupos de tickets tienen las mismas cuatro áreas. Ninguna está
  // diseñada todavía, así que van sin href.
  function areasDeTicket(prefijo) {
    return [
      { id: prefijo + "-soporte", texto: "Soporte", icono: "headset", href: null },
      { id: prefijo + "-desarrollo", texto: "Desarrollo", icono: "code", href: null },
      { id: prefijo + "-infra", texto: "Infraestructura", icono: "server", href: null },
      { id: prefijo + "-rrhh", texto: "RRHH", icono: "users", href: null },
    ];
  }

  const USUARIO = {
    organizacion: "Inelcom",
    nombre: "Raúl Gabriel Berríos Jofré",
    avatar: "assets/img/avatar-placeholder.png",
  };

  /* ======================================================================
     RUTAS

     El componente se puede cargar desde la raíz o desde plantillas/, así
     que las rutas se resuelven contra la ubicación de este propio archivo
     y no contra la de la página.
     ====================================================================== */

  const miSrc = document.currentScript && document.currentScript.src;
  const RAIZ = miSrc ? new URL("../", miSrc).href : "./";
  const ruta = (r) => (r ? new URL(r, RAIZ).href : null);

  /* ======================================================================
     MARCADO
     ====================================================================== */

  const esc = (t) =>
    String(t).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  const icono = (nombre, clases = "") =>
    `<svg class="c-icon ${clases}" aria-hidden="true"><use href="#nav-${nombre}" /></svg>`;

  // Un enlace. Sin href se dibuja como <span> apagado: es una pantalla que
  // todavía no está diseñada y no queremos que parezca clicable.
  function enlace(item, activa, extra = "") {
    const esActiva = item.id === activa;
    const etiqueta = `${icono(item.icono, item.icono === "maleta" ? "c-icon--maleta" : "")}
        <span class="c-navlink__label">${esc(item.texto)}</span>
        <span class="u-visually-hidden">${esc(item.texto)}</span>`;

    // data-tip es lo que muestra el globo cuando la barra está plegada.
    const tip = ` data-tip="${esc(item.texto)}"`;

    if (!item.href) {
      return `<span class="c-navlink c-navlink--pendiente"${tip} ${extra}
        title="Pantalla todavía no diseñada">${etiqueta}</span>`;
    }
    return `<a class="c-navlink" href="${esc(ruta(item.href))}"${
      esActiva ? ' aria-current="page"' : ""
    }${tip} ${extra}>${etiqueta}</a>`;
  }

  // Un grupo desplegable: el botón y, colgando, sus hijos con la línea en
  // árbol que dibuja el CSS.
  function grupo(item, activa) {
    const abierto = item.hijos.some((h) => h.id === activa);
    const idLista = `nav-grupo-${item.id}`;

    const hijos = item.hijos
      .map((h) => `<li class="c-navgroup__hijo">${enlace(h, activa)}</li>`)
      .join("");

    // --activo es "acá está la página que estás viendo"; --abierto es solo
    // si está desplegado, que el usuario puede cambiar a mano.
    return `<div class="c-navgroup${abierto ? " c-navgroup--abierto c-navgroup--activo" : ""}">
      <button class="c-navlink c-navgroup__toggle" type="button"
              data-navgroup="${item.id}" data-tip="${esc(item.texto)}"
              aria-expanded="${abierto}" aria-controls="${idLista}">
        ${icono(item.icono)}
        <span class="c-navlink__label">${esc(item.texto)}</span>
        <span class="u-visually-hidden">${esc(item.texto)}</span>
        ${icono("chevron-down", "c-icon--sm c-navgroup__chevron")}
      </button>
      <ul class="c-navgroup__hijos" id="${idLista}">${hijos}</ul>
    </div>`;
  }

  // id → entrada del menú, para poder armar el flotante de un grupo sin
  // volver a recorrer MENU.
  const GRUPOS = {};
  MENU.forEach((sec) =>
    sec.items.forEach((item) => {
      if (item.hijos) GRUPOS[item.id] = item;
    }),
  );

  function seccion(sec, activa) {
    const cuerpo = sec.items
      .map((item) => (item.hijos ? grupo(item, activa) : enlace(item, activa)))
      .join("");

    const rotulo = sec.label
      ? `<p class="c-sidebar__label">${esc(sec.label)}</p>`
      : "";

    return `<hr class="c-divider c-divider--thick c-sidebar__divider" />
      <div class="c-sidebar__seccion">${rotulo}
        <nav class="c-sidebar__nav"${
          sec.label ? ` aria-label="${esc(sec.label)}"` : ' aria-label="Principal"'
        }>${cuerpo}</nav>
      </div>`;
  }

  function marcado(activa) {
    // El contenido va en una caja aparte con su propio scroll. Si el scroll
    // estuviera en el <aside>, el botón de plegar —que sobresale 15px por
    // la derecha— provocaría una barra horizontal y quedaría recortado.
    return `<aside class="c-sidebar" id="sidebar" aria-label="Navegación principal">
      <div class="c-sidebar__scroll">
      <div class="c-sidebar__profile">
        <img class="c-avatar c-avatar--lg" src="${esc(ruta(USUARIO.avatar))}" alt="" />
        <span class="c-sidebar__identity">
          <span class="c-sidebar__org">${esc(USUARIO.organizacion)}</span>
          <span class="c-sidebar__user">${esc(USUARIO.nombre)}</span>
        </span>
      </div>

      ${MENU.map((sec) => seccion(sec, activa)).join("")}

      <hr class="c-divider c-divider--thick c-sidebar__divider" />

      <div class="c-sidebar__footer">
        <a class="c-navlink c-navlink--logout" href="#">
          ${icono("log-out")}
          <span class="c-navlink__label">Cerrar Sesión</span>
          <span class="u-visually-hidden">Cerrar sesión</span>
        </a>
      </div>

      </div>

      <button class="c-sidebar__toggle" type="button" data-sidebar
              aria-expanded="false" aria-controls="sidebar"
              aria-label="Desplegar navegación">
        ${icono("chevron-down", "c-icon--sm")}
      </button>
    </aside>`;
  }

  /* ======================================================================
     MONTAJE
     ====================================================================== */

  const hueco = document.querySelector("[data-sidebar-slot]");
  if (!hueco) return;

  /* --- Los iconos -------------------------------------------------------
     El sprite va DENTRO de este archivo a propósito. Antes se cargaba con
     fetch desde assets/icons/_sprite-nav.svg, y al abrir la página con doble
     clic (file://) el navegador lo bloquea: el menú salía sin un solo icono.
     Acá el componente es un archivo y funciona en cualquier sitio.

     La copia editable sigue en assets/icons/_sprite-nav.svg, que es la que
     hay que tocar para agregar o cambiar un icono; después se pega acá. Es
     la misma relación que _sprite.svg tiene con los sprites que cada
     pantalla lleva dentro de su HTML.

     Entra ANTES que el menú: si los <use> se dibujan apuntando a símbolos
     que todavía no están, no todos los navegadores los resuelven después. */

  const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
     style="position:absolute;width:0;height:0;overflow:hidden">
<symbol id="nav-home" viewBox="0 0 24 24" fill="none">
    <g>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.67773C11.0863 2.67773 10.1901 2.92808 9.40875 3.40159L4.40875 6.43159C3.67349 6.87714 3.06552 7.50477 2.64358 8.25383C2.22165 9.00289 1.99999 9.8481 2 10.7078V16.9998C2 18.3259 2.52678 19.5977 3.46447 20.5354C4.40215 21.473 5.67392 21.9998 7 21.9998H17C18.3261 21.9998 19.5978 21.473 20.5355 20.5354C21.4732 19.5977 22 18.3259 22 16.9998V10.7068C21.9998 9.8473 21.778 9.00212 21.3561 8.25329C20.9342 7.50446 20.3263 6.87704 19.5913 6.4316L14.5913 3.4016C13.8099 2.92809 12.9137 2.67773 12 2.67773ZM10.4453 5.11204C10.9141 4.82794 11.4518 4.67773 12 4.67773C12.5482 4.67773 13.0859 4.82794 13.5547 5.11204L18.5547 8.14204C18.9958 8.40931 19.3605 8.78577 19.6137 9.23507C19.8668 9.6843 19.9998 10.1912 20 10.7068V16.9998C20 17.7955 19.6839 18.5585 19.1213 19.1211C18.5587 19.6838 17.7956 19.9998 17 19.9998H16V16.9998C16 15.939 15.5786 14.9215 14.8284 14.1714C14.0783 13.4212 13.0609 12.9998 12 12.9998C10.9391 12.9998 9.92172 13.4212 9.17157 14.1714C8.42143 14.9215 8 15.939 8 16.9998V19.9998H7C6.20435 19.9998 5.44129 19.6838 4.87868 19.1211C4.31607 18.5585 4 17.7955 4 16.9998V10.7078C3.99999 10.192 4.13299 9.68483 4.38615 9.23539C4.63931 8.78595 5.00409 8.40938 5.44525 8.14205L10.4453 5.11204ZM13.4142 15.5856C13.7893 15.9607 14 16.4694 14 16.9998V19.9998H10V16.9998C10 16.4694 10.2107 15.9607 10.5858 15.5856C10.9609 15.2105 11.4696 14.9998 12 14.9998C12.5304 14.9998 13.0391 15.2105 13.4142 15.5856Z" fill="currentColor"/>
    </g>
  </symbol>
  <symbol id="nav-user" viewBox="0 0 24 24" fill="none">
    <g>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C10.6739 3 9.40215 3.52678 8.46447 4.46447C7.52678 5.40215 7 6.67392 7 8C7 9.32608 7.52678 10.5979 8.46447 11.5355C8.53043 11.6015 8.59804 11.6654 8.66721 11.7273C7.81069 12.1198 7.02217 12.6641 6.34314 13.3431C4.84285 14.8434 4 16.8783 4 19V20C4 20.5523 4.44771 21 5 21C5.55228 21 6 20.5523 6 20V19C6 17.4087 6.63214 15.8826 7.75736 14.7574C8.88258 13.6321 10.4087 13 12 13C13.5913 13 15.1174 13.6321 16.2426 14.7574C17.3679 15.8826 18 17.4087 18 19V20C18 20.5523 18.4477 21 19 21C19.5523 21 20 20.5523 20 20V19C20 16.8783 19.1571 14.8434 17.6569 13.3431C16.9778 12.6641 16.1893 12.1198 15.3328 11.7273C15.402 11.6654 15.4696 11.6015 15.5355 11.5355C16.4732 10.5979 17 9.32608 17 8C17 6.67392 16.4732 5.40215 15.5355 4.46447C14.5979 3.52678 13.3261 3 12 3ZM9.87868 5.87868C10.4413 5.31607 11.2043 5 12 5C12.7956 5 13.5587 5.31607 14.1213 5.87868C14.6839 6.44129 15 7.20435 15 8C15 8.79565 14.6839 9.55871 14.1213 10.1213C13.5587 10.6839 12.7956 11 12 11C11.2043 11 10.4413 10.6839 9.87868 10.1213C9.31607 9.55871 9 8.79565 9 8C9 7.20435 9.31607 6.44129 9.87868 5.87868Z" fill="currentColor"/>
    </g>
  </symbol>
  <symbol id="nav-maleta" viewBox="0 0 22.5 36" fill="none">
    <g>
    <path d="M6.75 11.25C7.04837 11.25 7.33452 11.3685 7.54549 11.5795C7.75647 11.7905 7.875 12.0766 7.875 12.375V28.125C7.875 28.4234 7.75647 28.7095 7.54549 28.9205C7.33452 29.1315 7.04837 29.25 6.75 29.25C6.45163 29.25 6.16548 29.1315 5.95451 28.9205C5.74353 28.7095 5.625 28.4234 5.625 28.125V12.375C5.625 12.0766 5.74353 11.7905 5.95451 11.5795C6.16548 11.3685 6.45163 11.25 6.75 11.25ZM11.25 11.25C11.5484 11.25 11.8345 11.3685 12.0455 11.5795C12.2565 11.7905 12.375 12.0766 12.375 12.375V28.125C12.375 28.4234 12.2565 28.7095 12.0455 28.9205C11.8345 29.1315 11.5484 29.25 11.25 29.25C10.9516 29.25 10.6655 29.1315 10.4545 28.9205C10.2435 28.7095 10.125 28.4234 10.125 28.125V12.375C10.125 12.0766 10.2435 11.7905 10.4545 11.5795C10.6655 11.3685 10.9516 11.25 11.25 11.25ZM15.75 11.25C16.0484 11.25 16.3345 11.3685 16.5455 11.5795C16.7565 11.7905 16.875 12.0766 16.875 12.375V28.125C16.875 28.4234 16.7565 28.7095 16.5455 28.9205C16.3345 29.1315 16.0484 29.25 15.75 29.25C15.4516 29.25 15.1655 29.1315 14.9545 28.9205C14.7435 28.7095 14.625 28.4234 14.625 28.125V12.375C14.625 12.0766 14.7435 11.7905 14.9545 11.5795C15.1655 11.3685 15.4516 11.25 15.75 11.25Z" fill="currentColor"/>
    <path d="M7.875 0C7.57663 0 7.29048 0.118526 7.07951 0.329505C6.86853 0.540483 6.75 0.826631 6.75 1.125V6.75H4.5C3.30653 6.75 2.16193 7.22411 1.31802 8.06802C0.474106 8.91193 9.80561e-08 10.0565 9.80561e-08 11.25V29.25C-0.000167649 30.0537 0.214893 30.8427 0.622835 31.5351C1.03078 32.2276 1.61671 32.7981 2.31975 33.1875C2.23526 33.52 2.2277 33.8674 2.29764 34.2033C2.36759 34.5392 2.5132 34.8547 2.7234 35.1259C2.93361 35.3971 3.20287 35.6167 3.51072 35.7682C3.81857 35.9197 4.15691 35.9989 4.5 36C5.09674 36 5.66903 35.7629 6.09099 35.341C6.51295 34.919 6.75 34.3467 6.75 33.75H15.75C15.7509 34.0688 15.8196 34.3838 15.9515 34.6741C16.0834 34.9644 16.2755 35.2233 16.5151 35.4338C16.7546 35.6442 17.0361 35.8013 17.341 35.8947C17.6459 35.9881 17.9671 36.0156 18.2834 35.9754C18.5997 35.9353 18.9039 35.8283 19.1757 35.6617C19.4476 35.4951 19.6809 35.2726 19.8602 35.009C20.0396 34.7454 20.1609 34.4467 20.2161 34.1327C20.2712 33.8186 20.259 33.4965 20.1802 33.1875C20.8833 32.7981 21.4692 32.2276 21.8772 31.5351C22.2851 30.8427 22.5002 30.0537 22.5 29.25V11.25C22.5 10.0565 22.0259 8.91193 21.182 8.06802C20.3381 7.22411 19.1935 6.75 18 6.75H15.75V1.125C15.75 0.826631 15.6315 0.540483 15.4205 0.329505C15.2095 0.118526 14.9234 0 14.625 0L7.875 0ZM13.5 6.75H9V2.25H13.5V6.75ZM20.25 29.25C20.25 29.8467 20.0129 30.419 19.591 30.841C19.169 31.2629 18.5967 31.5 18 31.5H4.5C3.90326 31.5 3.33097 31.2629 2.90901 30.841C2.48705 30.419 2.25 29.8467 2.25 29.25V11.25C2.25 10.6533 2.48705 10.081 2.90901 9.65901C3.33097 9.23705 3.90326 9 4.5 9H18C18.5967 9 19.169 9.23705 19.591 9.65901C20.0129 10.081 20.25 10.6533 20.25 11.25V29.25Z" fill="currentColor"/>
    </g>
  </symbol>
  <symbol id="nav-log-out" viewBox="0 0 20 20" fill="none">
    <g>
    <g>
    <path d="M5.83333 1.66667C5.17029 1.66667 4.53441 1.93006 4.06557 2.3989C3.59673 2.86774 3.33333 3.50363 3.33333 4.16667V15.8333C3.33333 16.4964 3.59673 17.1323 4.06557 17.6011C4.53441 18.0699 5.17029 18.3333 5.83333 18.3333H14.1667C14.8297 18.3333 15.4656 18.0699 15.9344 17.6011C16.4033 17.1323 16.6667 16.4964 16.6667 15.8333V15C16.6667 14.5398 16.2936 14.1667 15.8333 14.1667C15.3731 14.1667 15 14.5398 15 15V15.8333C15 16.0543 14.9122 16.2663 14.7559 16.4226C14.5996 16.5789 14.3877 16.6667 14.1667 16.6667H5.83333C5.61232 16.6667 5.40036 16.5789 5.24408 16.4226C5.0878 16.2663 5 16.0543 5 15.8333V4.16667C5 3.94565 5.0878 3.73369 5.24408 3.57741C5.40036 3.42113 5.61232 3.33333 5.83333 3.33333H14.1667C14.3877 3.33333 14.5996 3.42113 14.7559 3.57741C14.9122 3.73369 15 3.94565 15 4.16667V5C15 5.46024 15.3731 5.83333 15.8333 5.83333C16.2936 5.83333 16.6667 5.46024 16.6667 5V4.16667C16.6667 3.50362 16.4033 2.86774 15.9344 2.3989C15.4656 1.93006 14.8297 1.66667 14.1667 1.66667H5.83333Z" fill="currentColor"/>
    <path d="M13.9226 6.91074C13.5972 6.58531 13.0695 6.58531 12.7441 6.91074C12.4186 7.23618 12.4186 7.76382 12.7441 8.08926L13.8215 9.16667H10C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333H13.8215L12.7441 11.9107C12.4186 12.2362 12.4186 12.7638 12.7441 13.0893C13.0695 13.4147 13.5972 13.4147 13.9226 13.0893L16.4226 10.5893C16.748 10.2638 16.748 9.73618 16.4226 9.41074L13.9226 6.91074Z" fill="currentColor"/>
    </g>
    </g>
  </symbol>
  <symbol id="nav-person-check" viewBox="0 0 18 18" fill="none">
    <g>
    <path d="M1.4994 15.75C1.49934 14.5953 1.83253 13.4651 2.45899 12.495C3.08544 11.5249 3.97855 10.7562 5.03113 10.2811C6.08371 9.80606 7.25104 9.64478 8.39302 9.81665C9.535 9.98853 10.6031 10.4863 11.4692 11.2501M12.0002 14.2497L13.5004 15.7497L16.5006 12.7497M11.2502 5.99991C11.2502 8.07093 9.57111 9.74982 7.49988 9.74982C5.42865 9.74982 3.74958 8.07093 3.74958 5.99991C3.74958 3.92889 5.42865 2.25 7.49988 2.25C9.57111 2.25 11.2502 3.92889 11.2502 5.99991Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </g>
  </symbol>
  <symbol id="nav-chevron-down" viewBox="0 0 16 16" fill="none">
    <g id="chevron-down">
    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </g>
  </symbol>
  <symbol id="nav-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </symbol>
  <symbol id="nav-inbox" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </symbol>
  <symbol id="nav-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </symbol>
  <symbol id="nav-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </symbol>
  <symbol id="nav-ticket" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>
  </symbol>
  <symbol id="nav-headset" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>
  </symbol>
  <symbol id="nav-code" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>
  </symbol>
  <symbol id="nav-server" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>
  </symbol>
  <symbol id="nav-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>
  </symbol>
  <symbol id="nav-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
  </symbol>
</svg>`;

  function monta() {
    const activa = document.body.dataset.pagina || "";
    hueco.outerHTML = marcado(activa);
    conecta(document.getElementById("sidebar"));
  }

  /* --- Plegar y desplegar ----------------------------------------------
     El estado se recuerda entre pantallas: si no, al navegar se volvía a
     plegar y había que abrirlo otra vez en cada página. */

  const LLAVE = "intranet:sidebar-expandido";

  function conecta(barra) {
    const toggle = barra.querySelector("[data-sidebar]");

    const pinta = (expandido) => {
      barra.classList.toggle("c-sidebar--expanded", expandido);
      toggle.setAttribute("aria-expanded", String(expandido));
      toggle.setAttribute(
        "aria-label",
        expandido ? "Plegar navegación" : "Desplegar navegación",
      );
    };

    const recuerda = (expandido) => {
      try {
        localStorage.setItem(LLAVE, expandido ? "1" : "0");
      } catch (e) {
        /* da igual: es una comodidad, no un dato */
      }
    };

    let guardado = null;
    try {
      guardado = localStorage.getItem(LLAVE);
    } catch (e) {
      /* modo privado o cookies bloqueadas: se queda plegado */
    }
    pinta(guardado === "1");

    toggle.addEventListener("click", () => {
      const ahora = !barra.classList.contains("c-sidebar--expanded");
      pinta(ahora);
      recuerda(ahora);
      cierra();
    });

    /* --- Grupos desplegables -------------------------------------------- */

    barra.querySelectorAll("[data-navgroup]").forEach((boton) => {
      boton.addEventListener("click", () => {
        // Plegado no hay sitio para los hijos: en vez de abrir la barra
        // entera, se fija el menú flotante y se puede elegir desde ahí.
        if (!barra.classList.contains("c-sidebar--expanded")) {
          flota(boton, true);
          return;
        }
        const caja = boton.closest(".c-navgroup");
        const abierto = caja.classList.toggle("c-navgroup--abierto");
        boton.setAttribute("aria-expanded", String(abierto));
      });
    });

    conectaFlotante(barra);
  }

  /* ======================================================================
     CAPA FLOTANTE · globos y submenús de la barra plegada

     Vive colgada del <body> y no del <aside>: dentro de la barra la
     recortaría su propio scroll, y el requisito es justo que no se corte
     ni contra la barra ni contra el contenido.
     ====================================================================== */

  const capa = document.createElement("div");
  capa.className = "c-navfloat";
  capa.hidden = true;
  document.body.appendChild(capa);

  let anclaActual = null;
  let fijado = false;
  let cierreDiferido = null;

  function cierra() {
    clearTimeout(cierreDiferido);
    capa.hidden = true;
    capa.innerHTML = "";
    if (anclaActual) anclaActual.classList.remove("c-navlink--flotando");
    anclaActual = null;
    fijado = false;
  }

  // `fija` es el clic: el menú se queda hasta que se pulse fuera.
  function flota(ancla, fija = false) {
    const barra = document.getElementById("sidebar");
    if (!barra || barra.classList.contains("c-sidebar--expanded")) return;
    if (window.innerWidth < 768) return; // en teléfono la barra es de abajo

    const grupo = GRUPOS[ancla.dataset.navgroup];

    if (anclaActual === ancla && !capa.hidden) {
      if (fija) fijado = true;
      return;
    }

    clearTimeout(cierreDiferido);
    if (anclaActual) anclaActual.classList.remove("c-navlink--flotando");
    anclaActual = ancla;
    fijado = fija;
    ancla.classList.add("c-navlink--flotando");

    if (grupo) {
      capa.className = "c-navfloat c-navfloat--menu";
      capa.innerHTML =
        `<p class="c-navfloat__titulo">${esc(grupo.texto)}</p>` +
        grupo.hijos.map((h) => enlace(h, paginaActiva())).join("");
    } else {
      capa.className = "c-navfloat c-navfloat--tip";
      capa.textContent = ancla.dataset.tip || "";
    }

    capa.hidden = false;
    coloca(ancla, barra);
  }

  function coloca(ancla, barra) {
    const a = ancla.getBoundingClientRect();
    const b = barra.getBoundingClientRect();
    const c = capa.getBoundingClientRect();
    const aire = 8;

    capa.style.left = `${b.right + aire}px`;

    // Un globo se centra con el icono; un submenú arranca a su altura.
    let top = capa.classList.contains("c-navfloat--tip")
      ? a.top + a.height / 2 - c.height / 2
      : a.top;

    const limite = window.innerHeight - c.height - aire;
    capa.style.top = `${Math.max(aire, Math.min(top, limite))}px`;
  }

  function paginaActiva() {
    return document.body.dataset.pagina || "";
  }

  function conectaFlotante(barra) {
    barra.querySelectorAll("[data-tip]").forEach((ancla) => {
      ancla.addEventListener("mouseenter", () => flota(ancla));
      ancla.addEventListener("focus", () => flota(ancla));
      ancla.addEventListener("mouseleave", () => {
        if (fijado) return;
        cierreDiferido = setTimeout(cierra, 120);
      });
    });

    // Al entrar en el propio menú no se cierra: hay que poder elegir.
    capa.addEventListener("mouseenter", () => clearTimeout(cierreDiferido));
    capa.addEventListener("mouseleave", () => {
      if (!fijado) cierra();
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") cierra();
    });

    document.addEventListener("click", (ev) => {
      if (!fijado) return;
      if (capa.contains(ev.target) || (anclaActual && anclaActual.contains(ev.target))) return;
      cierra();
    });

    // Cualquier cosa que mueva el ancla deja el menú donde no corresponde.
    window.addEventListener("resize", cierra);
    window.addEventListener("scroll", cierra, true);
  }

  /* ======================================================================
     ARRANQUE
     Lo último: así todo lo de arriba —LLAVE incluida— ya está definido.
     ====================================================================== */

  document.body.insertAdjacentHTML("afterbegin", SPRITE);
  monta();
})();
