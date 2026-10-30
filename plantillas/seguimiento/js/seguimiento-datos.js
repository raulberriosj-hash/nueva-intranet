/* ==========================================================================
   SEGUIMIENTO DE VACACIONES · DATOS

   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR.

   Cada {{hueco}} se reemplaza por JSON. No lleva comillas alrededor: el motor
   de plantillas escribe el arreglo o el objeto tal cual, igual que un
   json_encode. Si queda un hueco sin reemplazar, el archivo no es JavaScript
   válido y la pantalla no dibuja nada: es a propósito, así no se publica a
   medias.

   Los cuatro gráficos y la tabla "Saldo histórico por persona" salen de acá.
   La tabla de gerencias no: esa va escrita en el HTML, con su REPEAT.

   Qué NO va en este archivo: los indicadores de arriba, los cuatro tramos y
   la tabla de gerencias. Esos son huecos del HTML.
   ========================================================================== */

window.SEGUIMIENTO = {
  /* Colaboradores con saldo de periodos anteriores, semana a semana.
     Las dos listas tienen el mismo largo y el mismo orden.
     Ejemplo:  { semanas: ["Sem 31", "Sem 32"], personas: [231, 236] }        */
  anteriores: {
    semanas: {{anteriores.semanas}},
    personas: {{anteriores.personas}},
  },

  /* Evolución semanal de vacaciones, por fecha de ingreso de la solicitud.
     Tres listas del mismo largo: la etiqueta de la semana, los días ya
     aprobados y los que siguen esperando respuesta.
     Ejemplo:  { semanas: ["12/01"], aprobados: [86], pendientes: [12] }      */
  semanal: {
    semanas: {{semanal.semanas}},
    aprobados: {{semanal.aprobados}},
    pendientes: {{semanal.pendientes}},
  },

  /* Saldo acumulado por gerente de servicio, últimas cuatro semanas.
     Una serie por gerente; data tiene un número por semana, en el orden de
     "semanas". Si el maestro no trae el nombre, va el RUT.
     Ejemplo:  { semanas: ["Sem 35"], series: [{ name: "…", data: [4439] }] } */
  saldoGerente: {
    semanas: {{saldoGerente.semanas}},
    series: {{saldoGerente.series}},
  },

  /* Centros de costo y gerentes de servicio. Son listas de nombres: en cada
     persona no se repite el texto, va la posición dentro de esta lista.
     Ejemplo:  ["Administración", "COE", "TI"]                               */
  areas: {{areas}},
  gerentes: {{gerentes}},

  /* Los colaboradores con saldo, de mayor a menor. Una fila por persona, en
     este orden exacto:

       [0] rut               sin puntos ni guion, como texto
       [1] nombres
       [2] apellido paterno
       [3] apellido materno
       [4] índice del centro de costo dentro de "areas"
       [5] índice del gerente dentro de "gerentes"
       [6] días por periodo de devengo, del más nuevo al más viejo

     La lista [6] empieza en el año en curso. La tabla solo abre los dos
     primeros —el vigente y el que vence el 31-12— pero el resto SÍ cuenta en
     la columna Total. Por eso las columnas de año no suman el total.

     Ejemplo de una fila:
       ["23373920", "Tomás Eduardo", "Alarcón", "Quintana", 0, 5, [11,6,14,15,15,15]]

     Van todas de una vez: el buscador y la paginación de la tabla trabajan en
     el navegador, sin volver al servidor. Con 600 filas pesa unos 60 KB; si
     algún día son miles, conviene paginar contra el servidor y cambiar esa
     tabla por un REPEAT como el de gerencias.                                */
  personas: {{personas}},
};
