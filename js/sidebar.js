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

    if (!item.href) {
      return `<span class="c-navlink c-navlink--pendiente" ${extra}
        title="Pantalla todavía no diseñada">${etiqueta}</span>`;
    }
    return `<a class="c-navlink" href="${esc(ruta(item.href))}"${
      esActiva ? ' aria-current="page"' : ""
    } ${extra}>${etiqueta}</a>`;
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
              data-navgroup aria-expanded="${abierto}" aria-controls="${idLista}">
        ${icono(item.icono)}
        <span class="c-navlink__label">${esc(item.texto)}</span>
        <span class="u-visually-hidden">${esc(item.texto)}</span>
        ${icono("chevron-down", "c-icon--sm c-navgroup__chevron")}
      </button>
      <ul class="c-navgroup__hijos" id="${idLista}">${hijos}</ul>
    </div>`;
  }

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
    return `<aside class="c-sidebar" id="sidebar" aria-label="Navegación principal">
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

  // El sprite va aparte para poder verlo y editarlo como SVG, y entra ANTES
  // que el menú: si los <use> se dibujan apuntando a símbolos que todavía no
  // están, no todos los navegadores los resuelven después.
  //
  // Abriendo la página con doble clic (file://) el navegador bloquea este
  // fetch; por eso el README pide servirlas por HTTP. Si falla, el menú se
  // pinta igual: se queda sin iconos, pero navega.
  fetch(ruta("assets/icons/_sprite-nav.svg"))
    .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
    .then((svg) => document.body.insertAdjacentHTML("afterbegin", svg))
    .catch(() =>
      console.warn(
        "sidebar.js: no se pudo cargar el sprite de iconos. Sirve la carpeta por HTTP (python3 -m http.server).",
      ),
    )
    .then(monta);

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
    });

    /* --- Grupos desplegables -------------------------------------------- */

    barra.querySelectorAll("[data-navgroup]").forEach((boton) => {
      boton.addEventListener("click", () => {
        // Plegado no hay sitio para los hijos: el clic lo que hace es abrir
        // el menú, y el grupo queda desplegado.
        if (!barra.classList.contains("c-sidebar--expanded")) {
          pinta(true);
          recuerda(true);
        }
        const caja = boton.closest(".c-navgroup");
        const abierto = caja.classList.toggle("c-navgroup--abierto");
        boton.setAttribute("aria-expanded", String(abierto));
      });
    });
  }
})();
