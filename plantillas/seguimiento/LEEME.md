# Seguimiento de vacaciones · plantilla para integrar

Esta carpeta es la pantalla de seguimiento lista para montarla **dentro de la
intranet que ya existe**. No es una página aparte: es un bloque que se pega
donde vaya el contenido, con su propio CSS para que no se pise con nada.

```
seguimiento/
├── LEEME.md                  este archivo
├── seguimiento.html          el bloque, con los huecos {{marcados}}
├── css/
│   └── seguimiento.css       todo el estilo de la pantalla, en un archivo
└── js/
    ├── seguimiento-datos.js  ← lo llena el backend · es el único que se toca
    └── seguimiento.js        gráficos, tabla y modal · no se toca
```

## Cómo se monta

1. **El CSS**, en el `<head>` de la página:
   `<link rel="stylesheet" href=".../seguimiento.css">`
2. **El HTML**: copiar todo lo que está entre las marcas `░░ INICIO DEL
   BLOQUE ░░` y `░░ FIN DEL BLOQUE ░░` de `seguimiento.html`, y pegarlo donde
   va el contenido de la pantalla.
3. **Los scripts**, al final del `<body>` y en este orden: las tres líneas de
   Highcharts, después `seguimiento-datos.js` y después `seguimiento.js`.
   Todos con `defer`.

El menú lateral, la cabecera y el título de la pantalla los pone la intranet.
Por eso no vienen en el bloque: duplicarlos sería pelear con lo que ya hay.

## Por qué no se pisa con la intranet

Todo el bloque cuelga de un contenedor con la clase `.seg`, y **cada regla del
CSS empieza por ahí**. Eso corta por los dos lados:

- Nada de este CSS sale del bloque. Ni el reset, ni la tipografía, ni los
  colores tocan una línea del resto de la intranet.
- Dentro del bloque, estas reglas pesan más que las generales de la intranet,
  así que una regla suelta como `.card { border: 10px solid rojo }` no se le
  cuela. Probado contra una página con estilos propios a propósito.
- Las variables de color y tamaño van declaradas en `.seg`, no en `:root`.
- Los `id` del HTML y los del sprite de iconos llevan prefijo `seg-`.

Si `seg` ya existe en la intranet, se renombra con un buscar y reemplazar en
tres sitios: este CSS, la clase del `<div>` en el HTML y la constante `RAIZ`
de `js/seguimiento.js`.

## Los huecos

Lo que va entre `{{llaves}}` lo reemplaza el motor de plantillas. Lo que se
repite va entre `<!-- REPEAT -->` y `<!-- /REPEAT -->`: queda una sola fila de
ejemplo y el backend la multiplica.

### En el HTML

| Hueco | Qué es |
| --- | --- |
| `filtros.desde` · `filtros.hasta` | fechas del rango consultado |
| `centro.id` · `centro.nombre` | opciones del centro de costo (REPEAT) |
| `gerente.id` · `gerente.nombre` | opciones del gerente de servicio (REPEAT) |
| `kpi.saldoTotal` | días acumulados de toda la empresa |
| `kpi.periodosAnteriores` | días de periodos ya cerrados |
| `kpi.pendientes` | días sin tomar ni programar |
| `kpi.programadas` | días ya aprobados a futuro |
| `tramo.alto` · `tramo.medio` · `tramo.bajo` | colaboradores en cada tramo |
| `tramo.hoy` | colaboradores de vacaciones hoy |
| `anio.vigente` · `anio.vence` | los dos años que abren las tablas |
| `total.*` | la fila de totales de la tabla de gerencias |
| `fila.*` | una fila por gerente de servicio (REPEAT) |
| `pie.gerentes` · `pie.colaboradores` | el conteo del pie de esa tabla |

### En el JS

`js/seguimiento-datos.js` tiene un hueco por bloque de datos, cada uno con la
forma exacta y un ejemplo al lado: los cuatro gráficos, los centros de costo,
los gerentes y la lista de colaboradores con saldo.

Esos huecos se reemplazan por JSON, sin comillas alrededor —como un
`json_encode`—. Si alguno queda sin reemplazar el archivo no es JavaScript
válido y la pantalla no dibuja: es a propósito, para que no salga a medias.

## Dos cosas que conviene saber

**Las columnas de año no suman el total, y está bien.** Las tablas solo abren
dos periodos de devengo: el año en curso y el que vence el 31-12. Lo anterior
no se muestra, pero sí sigue contando en la columna Total, que es el saldo
acumulado real.

**La tabla "Saldo histórico por persona" trabaja en el navegador.** Recibe
todos los colaboradores de una vez y pagina y busca sin volver al servidor.
Con unas 600 filas son ~60 KB. Si algún día son miles, conviene paginar
contra el servidor y cambiar esa tabla por un REPEAT como el de gerencias.

## Lo que falta por conectar

- El botón **Consultar** no manda el formulario todavía: hay que envolverlo en
  el `<form action>` de la intranet o atender el `submit`.
- Los dos botones **Excel** no descargan nada.
- El tramo **En vacaciones hoy** sale en cero: es el único dato que no depende
  del saldo sino de quién está ausente en este momento.
- **Highcharts es de licencia comercial.** Confirmar con TI antes de salir a
  producción. Si la intranet ya lo carga, borrar las tres líneas del CDN.

## Para verla funcionando

Esta carpeta es la plantilla: abierta tal cual muestra los `{{huecos}}`, no
datos. La maqueta navegable, con datos de muestra, es `panel-rrhh.html` en la
raíz del repositorio.
