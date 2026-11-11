/* ============================================================
   CATÁLOGO ÚNICO DE VITRO
   Lo leen el sitio (index.html) y el servidor (functions/api/checkout.js).
   Aquí cambias precios, descuento estudiante, envío y existencias.
   ============================================================ */
(function (root) {
  var CATALOG = {
    // Colores (hex tomados de las muestras de la proforma de ANNO)
    colors: {
      navy:  { name: "Traction Navy",   hex: "#21355A", vshield: true,
               desc: "El azul que aguantas 12 horas sin verlo sucio. Con V-Shield: repele salpicaduras de líquidos." },
      vino:  { name: "Vino de Guardia", hex: "#530020", vshield: false,
               desc: "Serio en el pase de visita. Inconfundible en la foto de generación." },
      verde: { name: "Verde de Turno",  hex: "#C3D184", vshield: false,
               desc: "Fresco para el turno matutino, el laboratorio y la clínica." }
    },

    sizes: ["XS", "S", "M"],

    // Se venden como set completo (top + pantalón)
    models: {
      // name = nombre del modelo (cámbialo aquí cuando quieras); kind = tipo de set
      mujer:  { name: "Prisma",  kind: "Set Mujer",  desc: "Corte slim femenino, manga larga. Top y pantalón." },
      unisex: { name: "Cristal", kind: "Set Unisex", desc: "Corte unisex, manga corta. Top y pantalón." }
    },

    // Precio de lista (MXN) por color
    price:        { navy: 1150, vino: 950, verde: 950 },
    // Precio estudiante (MXN) por color
    studentPrice: { navy: 950,  vino: 800, verde: 800 },

    // Envío (MXN). Gratis desde N sets en el pedido.
    shipping: 99,
    freeShippingFrom: 2,

    // Dominios de correo escolar aceptados para el precio estudiante.
    // Termina en ".edu.mx" o es uno de estos. Si el correo no coincide, se pide pagar por WhatsApp con credencial.
    studentDomains: [".edu.mx", "tec.mx", "itesm.mx", "unam.mx", "uanl.mx", "udg.mx", "ipn.mx", "uaq.mx", "anahuac.mx", "ibero.mx", "up.edu.mx"],

    // Existencias del primer lote (de la proforma SH-26ANNO0903). Se actualizan a mano.
    stock: {
      "mujer-navy":   { XS: 3, S: 4, M: 3 },
      "mujer-vino":   { XS: 1, S: 3, M: 1 },
      "mujer-verde":  { XS: 2, S: 2, M: 1 },
      "unisex-navy":  { XS: 2, S: 5, M: 3 },
      "unisex-vino":  { XS: 1, S: 2, M: 2 },
      "unisex-verde": { XS: 2, S: 2, M: 1 }
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = CATALOG;
  else root.VITRO_CATALOG = CATALOG;
})(typeof self !== "undefined" ? self : globalThis);