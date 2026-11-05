# Plantillas

La versión de cada pantalla **sin datos de ejemplo y sin el JS del prototipo**:
el marcado limpio, que es lo que hay que copiar al implementar.

No se enlazan desde ninguna pantalla, así que no aparecen al navegar el
prototipo. Están acá para quien las busque.

## Qué cambia respecto de la pantalla de la raíz

| | Pantalla | Plantilla |
|---|---|---|
| Datos | De ejemplo, para que se entienda | Vacíos o con `{{placeholder}}` |
| JS del prototipo | Sí, para poder clicar | No |
| `js/componentes.js` | Sí | Sí — el comportamiento compartido se queda |
| CSS | El mismo | El mismo |

## Qué hay

- `mis-vacaciones.html` — solicitud de vacaciones del colaborador
- `informe-colaborador.html` — informe de un colaborador
- `seguimiento/` — el panel de RRHH, con su propio CSS, sus datos y su
  LEEME.md. Es la única que va en carpeta aparte: se monta dentro de la
  intranet que ya existe y no se puede pisar con sus estilos.

## Qué falta

La de `aprobaciones.html`.
