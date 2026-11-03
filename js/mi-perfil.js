// ============================================================================
// Mi perfil — INTEGRACIÓN PENDIENTE CON EL BACKEND.
//
// La pantalla es casi toda de lectura: los datos vienen pintados en el HTML y
// el dev los reemplaza por los del backend. Este archivo resuelve lo único
// que se mueve, que son los dos botones de la tarjeta de identidad:
//
//   1. "Editar datos" abre el modal con los tres datos que la persona puede
//      corregir sola. Al abrirlo los campos se llenan con lo que se ve en la
//      rejilla, así nadie escribe de cero para cambiar una letra. Guardar
//      repinta la rejilla y cierra. Falta mandarlo a la API.
//   2. "Cambiar Contraseña" abre el otro modal, que comprueba que las dos
//      nuevas coincidan. Falta mandarlo a la API.
//
// Los dos TODO(backend) del HTML marcan dónde engancha cada uno.
// ============================================================================

(() => {
  "use strict";

  // Los tres datos que la persona edita. La clave es la misma en el
  // [data-perfil-valor] de la rejilla y en el name del campo del modal.
  const EDITABLES = ["direccion", "correo", "telefono"];

  const MINIMO_CLAVE = 8;

  const valorDe = (clave) =>
    document.querySelector(`[data-perfil-valor="${clave}"]`);

  /* ========================================================================
     EDITAR LOS DATOS DE CONTACTO
     ======================================================================== */

  function conectaDatos() {
    const modal = document.getElementById("modal-datos");
    const form = document.querySelector("[data-perfil-datos]");
    if (!modal || !form) return;

    // componentes.js es quien abre el <dialog> con [data-abre]; acá solo se
    // aprovecha el evento para llenar los campos con lo que ya se ve.
    modal.addEventListener("close", () => form.reset());
    document.addEventListener("click", (ev) => {
      if (!ev.target.closest('[data-abre="#modal-datos"]')) return;
      EDITABLES.forEach((clave) => {
        const celda = valorDe(clave);
        if (celda) form.elements[clave].value = celda.textContent.trim();
      });
    });

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      EDITABLES.forEach((clave) => {
        const celda = valorDe(clave);
        const nuevo = form.elements[clave].value.trim();
        if (celda && nuevo) celda.textContent = nuevo;
      });
      modal.close();
    });
  }

  /* ========================================================================
     CAMBIAR LA CONTRASEÑA
     ======================================================================== */

  function conectaClave() {
    const modal = document.getElementById("modal-clave");
    const form = document.querySelector("[data-perfil-clave]");
    if (!form) return;

    const aviso = form.querySelector("[data-perfil-aviso]");
    const di = (texto) => {
      if (aviso) aviso.textContent = texto;
    };

    // Al cerrar no quedan ni las contraseñas escritas ni el aviso anterior
    if (modal) {
      modal.addEventListener("close", () => {
        form.reset();
        di("");
      });
    }

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const { actual, nueva, repite } = form.elements;

      if (!actual.value || !nueva.value || !repite.value) {
        di("Completa los tres campos.");
        return;
      }
      if (nueva.value.length < MINIMO_CLAVE) {
        di(`La nueva contraseña necesita al menos ${MINIMO_CLAVE} caracteres.`);
        nueva.focus();
        return;
      }
      if (nueva.value !== repite.value) {
        di("Las dos contraseñas nuevas no coinciden.");
        repite.focus();
        return;
      }

      // TODO(backend): acá va la llamada real. Hasta entonces, solo se
      // limpia el formulario y se avisa, sin cerrar: el mensaje se tiene
      // que alcanzar a leer.
      form.reset();
      di("Listo: tu contraseña quedó cambiada.");
    });

    // Al volver a escribir el aviso anterior sobra
    form.addEventListener("input", () => di(""));
  }

  conectaDatos();
  conectaClave();
})();
