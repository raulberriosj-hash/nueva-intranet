/* ==========================================================================
   SEGUIMIENTO DE VACACIONES · DATOS

   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR.

   Cada {{hueco}} se reemplaza por JSON. No lleva comillas alrededor: el motor
   de plantillas escribe el arreglo o el objeto tal cual, igual que un
   json_encode. Si queda un hueco sin reemplazar, el archivo no es JavaScript
   válido y la pantalla no dibuja nada: es a propósito, así no se publica a
   medias.

   Los cinco gráficos, la tabla "Saldo histórico por persona" y las cifras de
   los cuatro tramos salen de acá. La tabla de gerencias no: esa va escrita
   en el HTML, con su REPEAT.

   QUÉ CAMBIÓ DESDE LA VERSIÓN ANTERIOR
     · "anteriores" cambió de forma: ahora son series por colaborador.
     · "tomados" es nuevo.
     · Los tramos ya no se mandan por el HTML: se calculan desde "personas".
   Lo demás se queda igual.
   ========================================================================== */

window.SEGUIMIENTO = {
  /* CAMBIÓ · Saldo de periodos anteriores semana a semana, una serie por
     colaborador. Antes era un solo número de personas por semana.

     Los ocho con más días viejos bastan: con más, el gráfico no se lee.
     "data" tiene un número por semana, en el orden de "semanas".
     Ejemplo:
       { semanas: ["26/10", "02/11"], series: [{ name: "…", data: [59, 58] }] } */
  anteriores: {
    semanas: {{anteriores.semanas}},
    series: {{anteriores.series}},
  },

  /* NUEVO · Días efectivamente tomados, mes a mes. Es lo contrario del
     saldo: lo que la gente SÍ usó.

     Es un objeto con clave "AAAA-MM", no una lista de doce, porque la
     ventana se mueve sola con el calendario: el gráfico toma los últimos
     doce meses contando el de hoy. Mandar unos cuantos meses de más no
     molesta; los que falten salen vacíos.
     Ejemplo:  { "2026-10": 505, "2026-11": 118 }                            */
  tomados: {{tomados}},

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
