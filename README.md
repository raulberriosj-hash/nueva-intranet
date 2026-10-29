# Intranet Inelcom · rediseño

Maquetas estáticas del rediseño de la intranet de Inelcom Chile. Son HTML y CSS
a mano, sin framework ni proceso de build: se abren en el navegador tal cual.

No es una aplicación. Es el entregable de diseño que el equipo de desarrollo usa
como referencia de marcado, estilos y comportamiento.

## Pantallas

| Archivo | Pantalla | Estado |
|---|---|---|
| [`index.html`](index.html) | Home de la intranet | Al día |
| [`mis-vacaciones.html`](mis-vacaciones.html) | Solicitud de vacaciones del colaborador | Al día |
| [`aprobaciones.html`](aprobaciones.html) | Solicitudes del equipo (jefatura) | Al día |
| [`informe-colaborador.html`](informe-colaborador.html) | Informe por colaborador (RRHH) | Al día · ya viene con `{{placeholders}}` |
| [`panel-rrhh.html`](panel-rrhh.html) | Panel de seguimiento de vacaciones (RRHH) | Al día |

## Cómo verlas

Lo más cómodo es servirlas por HTTP, que es como van a vivir de verdad:

```bash
python3 -m http.server 8000
```

Y entrar a <http://localhost:8000>. Abrirlas con doble clic también funciona:
ninguna pantalla depende de pedir archivos al servidor.

## Estructura

```
.
├── index.html                  home
├── mis-vacaciones.html         pantallas, una por archivo, en la raíz
├── aprobaciones.html
├── informe-colaborador.html
├── panel-rrhh.html
│
├── plantillas/                 versiones sin datos, para los devs
│   └── mis-vacaciones.html
│
├── css/
│   ├── sistema/                el sistema de diseño, compartido
│   │   ├── 01-tokens.css         variables: color, tipografía, espacio, radios
│   │   ├── 02-base.css           reset y elementos base
│   │   ├── 03-layout.css         armazón de página (.l-*)
│   │   ├── 04-components.css     componentes (.c-*)
│   │   └── 05-sidebar.css        el menú lateral
│   └── pantallas/              lo propio de cada pantalla
│       ├── inicio.css
│       ├── mis-vacaciones.css
│       ├── aprobaciones.css
│       ├── informe-colaborador.css
│       └── panel-rrhh.css
│
├── js/
│   ├── sidebar.js              EL MENÚ · una sola copia para todas
│   ├── componentes.js          comportamiento declarativo compartido
│   ├── mis-vacaciones.js       interacciones del prototipo
│   ├── panel-rrhh.js           gráficos y tablas del panel
│   ├── panel-rrhh-datos.js     datos de muestra · DESECHABLE
│   ├── inicio-carrusel.js      el carrusel de anuncios del home
│   ├── inicio-cumpleanos.js    cumpleaños · PENDIENTE DE BACKEND
│   └── inicio-festivos.js      festivos legales de Chile
│
└── assets/
    ├── icons/                  SVG sueltos y los dos sprites editables
    ├── img/
    └── home/                   imágenes del home
```

## El sistema de diseño

Las cuatro pantallas de vacaciones comparten `css/sistema/`, que se carga
siempre en orden y después el CSS de la pantalla:

```html
<link rel="stylesheet" href="css/sistema/01-tokens.css" />
<link rel="stylesheet" href="css/sistema/02-base.css" />
<link rel="stylesheet" href="css/sistema/03-layout.css" />
<link rel="stylesheet" href="css/sistema/04-components.css" />
<link rel="stylesheet" href="css/sistema/05-sidebar.css" />
<link rel="stylesheet" href="css/pantallas/mis-vacaciones.css" />
```

`01-tokens.css` sale de las **variables** del archivo de Figma
[Design System inelcom](https://www.figma.com/design/v0IxFJxFoUWsXnlqkvCkW9/Design-System-inelcom),
no de sus estilos: 76 colores, 13 espacios, 6 radios y 29 de tipografía.

**Es el único archivo del repositorio que declara un valor.** Todas las demás
hojas —las del sistema, las de pantalla y las del home— componen con sus
variables. Si una hoja necesita un valor que no está, el sitio donde agregarlo
es el archivo de Figma, no la hoja.

El archivo tiene dos capas. Una pantalla usa la segunda:

| | |
|---|---|
| Primitivas | el valor tal como está en Figma, con el mismo nombre: `corporate/500` → `--c-corporate-500` |
| Semánticas | para qué sirve: `--color-bg-page`, `--color-text-primary`, `--color-tag-ok-bg` |

Al final hay un tercer bloque, marcado como **fuera del Design System**: anchos
de sidebar y de modal, tamaños de icono, sombras, foco y transiciones, que
Figma no publica como variables.

Nomenclatura BEM con prefijo por capa: `l-` armazón, `c-` componente,
`u-` utilidad, `s-` pantalla. El panel usa su propio espacio, `bi-`.

**Las cinco pantallas usan el mismo sistema.** El home era de julio y traía
sus propias clases; su marcado ya está migrado: `.app` → `.l-app`,
`.page-content` → `.l-body`, `.card` → `.c-card`, `.section-header` →
`.c-card__title`, `.icon` → `.c-icon`, y así. Lo que ninguna otra pantalla
tiene —el hero, los accesos rápidos, el carrusel, las listas de cumpleaños y
festivos, los botones de ticket y los banners— vive en
`css/pantallas/inicio.css` con el prefijo `s-`, igual que el resto de las
hojas de pantalla.

## El menú

Hay una sola copia del menú y la usan las cinco pantallas. Antes cada HTML
llevaba su propio `<aside>` y había que tocarlos uno por uno.

Una pantalla lo monta así:

```html
<body data-pagina="vacaciones">
  ...
  <div data-sidebar-slot></div>
  ...
  <script src="js/sidebar.js" defer></script>
```

`data-pagina` dice cuál de las entradas se marca como actual. Si está dentro
de un grupo, el grupo se abre solo.

**Para cambiar el menú se toca `MENU`, arriba de `js/sidebar.js`, y nada
más.** Cada entrada es un enlace suelto, una sección con su rótulo o un grupo
desplegable; las que todavía no tienen pantalla van con `href: null` y se
dibujan apagadas, para que se vea el alcance del menú sin fingir que llevan a
alguna parte.

Los iconos van **dentro de `js/sidebar.js`**, con prefijo `nav-` para no chocar
con el sprite `i-` que cada pantalla trae inline. La copia editable está en
`assets/icons/_sprite-nav.svg`: es la que hay que tocar para agregar o cambiar
un icono, y después se pega en el JS. Es la misma relación que `_sprite.svg`
tiene con los sprites que cada HTML lleva dentro.

Que el menú se pinte con JS es una decisión de la maqueta, que no tiene
compilador. En la intranet de verdad lo normal sería un parcial del servidor o
un componente del framework; lo que hay que respetar es el marcado que sale de
ahí, que es el que está documentado en `css/sistema/05-sidebar.css`.

## Las plantillas

`plantillas/` guarda la versión de cada pantalla **sin datos de ejemplo y sin el
JS del prototipo**: el marcado limpio, que es lo que el desarrollador necesita
copiar. No se enlazan desde ninguna pantalla —no aparecen al navegar el
prototipo— pero están en el repositorio para quien las busque.

Por ahora solo existe la de Mis Vacaciones. La idea es que cada pantalla con
datos acabe teniendo la suya.

## Datos de ejemplo

**Ninguna persona que aparece en estas pantallas existe.** Los nombres, los RUT
y los saldos son inventados; este repositorio es público y no lleva datos de
nadie. Cualquier parecido con un nombre real es casualidad de usar nombres
chilenos corrientes.

`js/panel-rrhh-datos.js` son 609 colaboradores generados. Los nombres y los RUT
salen de un generador, pero los saldos están calibrados para que las columnas
por año y los tramos cuadren con las cifras del informe real:

| | 2026 | 2025 | 2024 | 2023 | 2022 | 2021 | Total |
|---|---|---|---|---|---|---|---|
| Días | 41 | 3.572 | 3.895 | 1.278 | 351 | 120 | **9.257** |

Y los tramos: 60 personas con más de 31 días, 164 entre 16 y 30, 385 entre 1 y
15. Ningún reparto supera los 15 días por año, que es el tope del artículo 67
del Código del Trabajo.

**Ese archivo se borra entero** cuando el panel se conecte al backend.

## El panel de RRHH

`panel-rrhh.html` trae de momento dos versiones del corte por año, para decidir
cuál queda:

- `panel-rrhh.html` → las tablas abren 2026 y 2025; los gráficos siguen enteros
- `panel-rrhh.html?corte=panel` → el gráfico de periodos también se corta

Es un andamio temporal. Cuando se elija una, se borran la constante
`CORTE_PANEL` y el parámetro de la URL.

Los gráficos son [Highcharts](https://www.highcharts.com/) 11.4.8, desde CDN.
**Es de licencia comercial**: hay que confirmarlo con TI antes de usarlo en
producción.

## Lo que no calzaba con el sistema

Al ajustar las pantallas al Design System hubo cinco tamaños de letra, un
radio y un espacio que las pantallas usaban y el sistema no publica. Se
resolvieron ajustando la pantalla al sistema, no al revés:

| | Estaba | Quedó |
|---|---|---|
| Rótulos en caja alta | 10 px | 12 px (`--fs-xs`) |
| Notas y badges | 11 px | 12 px (`--fs-xs`) |
| Valor de campo | 13 px | 14 px (`--fs-sm`) |
| Título de página | 28 px | 30 px (`--fs-3xl`) |
| Cifra de balance | 40 px | 36 px (`--fs-4xl`) |
| Tarjetas y modales | radio 12 | radio 16 (`--radius-lg`) |
| Un espacio suelto | 14 px | 16 px (`--space-4`) |

También los pesos: el sistema llega a 700, así que lo que estaba en 800 y 900
bajó a 700.

Si alguno de estos escalones debería existir, se agrega al archivo de Figma y
se vuelve a generar `01-tokens.css`.

## Pendientes

- [ ] Decidir el corte por año del panel y borrar el andamio
- [ ] Confirmar la licencia de Highcharts con TI
- [ ] Un gerente aparece como RUT (`10982345`): le falta el nombre en el maestro
- [ ] Diseñar la navegación completa en teléfono: abajo solo caben los
      enlaces sueltos, y las secciones con grupos no aparecen
- [ ] Pantallas de Mi Perfil, Colaboradores en vacaciones y los tres grupos
      de Tickets, que en el menú están pero todavía no existen
- [ ] Plantillas sin datos del resto de las pantallas
