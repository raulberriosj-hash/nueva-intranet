# Intranet Inelcom · rediseño

Maquetas estáticas del rediseño de la intranet de Inelcom Chile. Son HTML y CSS
a mano, sin framework ni proceso de build: se abren en el navegador tal cual.

No es una aplicación. Es el entregable de diseño que el equipo de desarrollo usa
como referencia de marcado, estilos y comportamiento.

## Pantallas

| Archivo | Pantalla | Estado |
|---|---|---|
| [`index.html`](index.html) | Home de la intranet | Sistema de CSS antiguo, pendiente de migrar |
| [`mis-vacaciones.html`](mis-vacaciones.html) | Solicitud de vacaciones del colaborador | Al día |
| [`aprobaciones.html`](aprobaciones.html) | Solicitudes del equipo (jefatura) | Al día |
| [`informe-colaborador.html`](informe-colaborador.html) | Informe por colaborador (RRHH) | Al día · ya viene con `{{placeholders}}` |
| [`panel-rrhh.html`](panel-rrhh.html) | Panel de seguimiento de vacaciones (RRHH) | Al día |

## Cómo verlas

Hay que servirlas por HTTP. Abrir el archivo con doble clic (`file://`) deja los
gráficos y el sprite de iconos a medias.

```bash
python3 -m http.server 8000
```

Y entrar a <http://localhost:8000>.

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
│   │   └── 04-components.css     componentes (.c-*)
│   ├── pantallas/              lo propio de cada pantalla
│   │   ├── mis-vacaciones.css
│   │   ├── aprobaciones.css
│   │   ├── informe-colaborador.css
│   │   └── panel-rrhh.css
│   └── legacy-home/            el CSS viejo, solo lo usa index.html
│
├── js/
│   ├── componentes.js          comportamiento declarativo compartido
│   ├── mis-vacaciones.js       interacciones del prototipo
│   ├── panel-rrhh.js           gráficos y tablas del panel
│   ├── panel-rrhh-datos.js     datos de muestra · DESECHABLE
│   └── legacy-home/            JS viejo, solo lo usa index.html
│
└── assets/
    ├── icons/                  SVG sueltos y el sprite
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
<link rel="stylesheet" href="css/pantallas/mis-vacaciones.css" />
```

Los colores y tamaños salen siempre de `01-tokens.css`. El CSS de pantalla no
declara valores propios: solo compone con las variables. Si hace falta un valor
que el sistema no publica, va declarado arriba del archivo con el comentario
`PENDIENTE DE TOKENIZAR` y una nota de dónde salió.

Nomenclatura BEM con prefijo por capa: `l-` armazón, `c-` componente,
`u-` utilidad, `s-` pantalla. El panel usa su propio espacio, `bi-`.

**El home va aparte.** `index.html` es de julio y trae su propio
`tokens.css` / `components.css` / `screen.css`, anteriores al sistema de arriba.
Funciona, pero no comparte variables con el resto. Migrarlo está pendiente y no
es un cambio menor: la pantalla va a cambiar de aspecto.

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

## Pendientes

- [ ] Migrar el home al sistema de `css/sistema/`
- [ ] Decidir el corte por año del panel y borrar el andamio
- [ ] Confirmar la licencia de Highcharts con TI
- [ ] Un gerente aparece como RUT (`10982345`): le falta el nombre en el maestro
- [ ] Enlazar las pantallas entre sí para poder navegar el prototipo completo
- [ ] Plantillas sin datos del resto de las pantallas
