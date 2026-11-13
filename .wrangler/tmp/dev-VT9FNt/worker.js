var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// public/catalog.js
var require_catalog = __commonJS({
  "public/catalog.js"(exports, module) {
    init_modules_watch_stub();
    (function(root) {
      var CATALOG2 = {
        // Colores (hex tomados de las muestras de la proforma de ANNO)
        colors: {
          navy: {
            name: "Navy Blue",
            hex: "#21355A",
            vshield: true,
            desc: "El azul que aguantas 12 horas sin verlo sucio. Con V-Shield: repele salpicaduras de l\xEDquidos."
          },
          vino: {
            name: "Cold Wine",
            hex: "#530020",
            vshield: false,
            desc: "Serio en el pase de visita. Inconfundible en la foto de generaci\xF3n."
          },
          verde: {
            name: "Clear Green",
            hex: "#C3D184",
            vshield: false,
            desc: "Fresco para el turno matutino, el laboratorio y la cl\xEDnica."
          }
        },
        sizes: ["XS", "S", "M"],
        // Se venden como set completo (top + pantalón)
        models: {
          // name = nombre del modelo (cámbialo aquí cuando quieras); kind = tipo de set
          mujer: { name: "Montserrat", kind: "Set Mujer", desc: "Corte slim femenino, manga larga. Top y pantal\xF3n." },
          unisex: { name: "Rafaello", kind: "Set Unisex", desc: "Corte unisex, manga corta. Top y pantal\xF3n." }
        },
        // Precio de lista (MXN) por color
        price: { navy: 1150, vino: 950, verde: 950 },
        // Precio estudiante (MXN) por color
        studentPrice: { navy: 950, vino: 800, verde: 800 },
        // Envío (MXN). Gratis desde N sets en el pedido.
        shipping: 99,
        freeShippingFrom: 2,
        // Dominios de correo escolar aceptados para el precio estudiante.
        // Termina en ".edu.mx" o es uno de estos. Si el correo no coincide, se pide pagar por WhatsApp con credencial.
        studentDomains: [".edu.mx", "tec.mx", "itesm.mx", "unam.mx", "uanl.mx", "udg.mx", "ipn.mx", "uaq.mx", "anahuac.mx", "ibero.mx", "up.edu.mx"],
        // Existencias del primer lote (de la proforma SH-26ANNO0903). Se actualizan a mano.
        stock: {
          "mujer-navy": { XS: 3, S: 4, M: 3 },
          "mujer-vino": { XS: 1, S: 3, M: 1 },
          "mujer-verde": { XS: 2, S: 2, M: 1 },
          "unisex-navy": { XS: 2, S: 5, M: 3 },
          "unisex-vino": { XS: 1, S: 2, M: 2 },
          "unisex-verde": { XS: 2, S: 2, M: 1 }
        }
      };
      if (typeof module !== "undefined" && module.exports) module.exports = CATALOG2;
      else root.VITRO_CATALOG = CATALOG2;
    })(typeof self !== "undefined" ? self : globalThis);
  }
});

// .wrangler/tmp/bundle-3SQTlK/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-3SQTlK/middleware-insertion-facade.js
init_modules_watch_stub();

// src/worker.js
init_modules_watch_stub();

// src/checkout.js
init_modules_watch_stub();
var import_catalog = __toESM(require_catalog());
var MAX_QTY = 10;
var MAX_LINES = 12;
var json = /* @__PURE__ */ __name((obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }), "json");
var clean = /* @__PURE__ */ __name((v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max), "clean");
var isStudentEmail = /* @__PURE__ */ __name((email) => {
  const domain = String(email).toLowerCase().split("@")[1] || "";
  return import_catalog.default.studentDomains.some((d) => d.startsWith(".") ? domain.endsWith(d) : domain === d || domain.endsWith("." + d));
}, "isStudentEmail");
async function onRequestPost({ request, env }) {
  if (!env.MP_ACCESS_TOKEN || !env.SITE_URL) return json({ error: "El pago no est\xE1 configurado todav\xEDa." }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Solicitud inv\xE1lida." }, 400);
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > MAX_LINES) return json({ error: "Carrito inv\xE1lido." }, 400);
  const c = body.customer || {};
  const customer = {
    name: clean(c.name, 80),
    email: clean(c.email, 120),
    phone: clean(c.phone, 20).replace(/\D/g, "").slice(-10),
    street: clean(c.street, 120),
    colonia: clean(c.colonia, 80),
    zip: clean(c.zip, 5),
    city: clean(c.city, 60),
    state: clean(c.state, 40),
    notes: clean(c.notes, 160),
    school: clean(c.school, 100)
  };
  if (!customer.name || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.length !== 10 || !customer.street || !customer.colonia || !/^\d{5}$/.test(customer.zip) || !customer.city || !customer.state) {
    return json({ error: "Revisa tus datos de env\xEDo." }, 400);
  }
  const student = body.student === true;
  if (student) {
    if (!isStudentEmail(customer.email)) {
      return json({ error: "Para el precio estudiante usa tu correo escolar, o escr\xEDbenos por WhatsApp con tu credencial." }, 400);
    }
    if (!customer.school) return json({ error: "Escribe tu escuela y carrera para el precio estudiante." }, 400);
  }
  const mpItems = [];
  const perKey = {};
  let units = 0;
  for (const it of items) {
    const model = import_catalog.default.models[it.model], color = import_catalog.default.colors[it.color];
    const qty = Number(it.qty);
    if (!model || !color || !import_catalog.default.sizes.includes(it.size) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return json({ error: "Hay un producto inv\xE1lido en tu carrito." }, 400);
    }
    const key = `${it.model}-${it.color}`;
    perKey[key + "|" + it.size] = (perKey[key + "|" + it.size] || 0) + qty;
    const available = (import_catalog.default.stock[key] || {})[it.size] || 0;
    if (perKey[key + "|" + it.size] > available) {
      return json({ error: `${model.name} (${model.kind}) ${color.name} talla ${it.size}: solo quedan ${available}.` }, 400);
    }
    const unit = (student ? import_catalog.default.studentPrice : import_catalog.default.price)[it.color];
    mpItems.push({
      id: `${it.model}-${it.color}-${it.size}`,
      title: `${model.name} (${model.kind}) \xB7 ${color.name} \xB7 Talla ${it.size}${student ? " (precio estudiante)" : ""}`,
      quantity: qty,
      unit_price: unit,
      currency_id: "MXN"
    });
    units += qty;
  }
  const shipping = units >= import_catalog.default.freeShippingFrom ? 0 : import_catalog.default.shipping;
  if (shipping > 0) mpItems.push({ id: "envio", title: "Env\xEDo", quantity: 1, unit_price: shipping, currency_id: "MXN" });
  const orderId = "VITRO-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const site = env.SITE_URL.replace(/\/$/, "");
  const [first, ...rest] = customer.name.split(" ");
  const preference = {
    items: mpItems,
    external_reference: orderId,
    payer: { name: first, surname: rest.join(" "), email: customer.email, phone: { area_code: "52", number: customer.phone } },
    shipments: { receiver_address: { zip_code: customer.zip, street_name: `${customer.street}, ${customer.colonia}`, city_name: customer.city, state_name: customer.state } },
    metadata: {
      order_id: orderId,
      estudiante: student ? "SI - VERIFICAR CREDENCIAL POR WHATSAPP ANTES DE ENVIAR" : "no",
      customer,
      items: items.map((i) => `${i.model}/${i.color}/${i.size} x${i.qty}`)
    },
    statement_descriptor: "VITRO",
    back_urls: { success: `${site}/gracias.html?pedido=ok&ref=${orderId}`, pending: `${site}/gracias.html?pedido=pendiente&ref=${orderId}`, failure: `${site}/?pedido=fallo#tienda` },
    auto_return: "approved"
  };
  let res;
  try {
    res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, "X-Idempotency-Key": orderId },
      body: JSON.stringify(preference)
    });
  } catch {
    return json({ error: "No pudimos conectar con Mercado Pago." }, 502);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.init_point) return json({ error: "Mercado Pago rechaz\xF3 la solicitud." }, 502);
  return json({ url: data.init_point, orderId });
}
__name(onRequestPost, "onRequestPost");

// src/worker.js
var CANONICAL_HOST = "www.vitroscrubs.com";
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "vitroscrubs.com") {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/api/checkout") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return new Response(JSON.stringify({ error: "M\xE9todo no permitido." }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-3SQTlK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-3SQTlK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
