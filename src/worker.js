// Worker de VITRO: sirve el sitio (carpeta public/) y atiende la API.
//   POST /api/checkout        crea el pago en Mercado Pago y guarda el pedido
//   POST /api/mp-webhook      notificaciones de pago de Mercado Pago
//   POST /api/order/confirm   confirma un pago al volver a /gracias
//   GET  /stock.js            existencias en vivo (pisa catalog.js → stock)
//   *    /api/admin/*         panel de administración (requiere sesión de administrador)
// vitroscrubs.com (sin www) redirige a www.vitroscrubs.com.
import { onRequestPost } from "./checkout.js";
import { onMpWebhook, onOrderConfirm } from "./payments.js";
import { onAdmin } from "./admin.js";
import { onStockJs } from "./lib/stock.js";
import { json } from "./lib/util.js";

const CANONICAL_HOST = "www.vitroscrubs.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname === "vitroscrubs.com") {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const path = url.pathname;

    if (path === "/api/checkout") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return json({ error: "Método no permitido." }, 405, { Allow: "POST" });
    }
    if (path === "/api/mp-webhook") return onMpWebhook({ request, env });
    if (path === "/api/order/confirm") return onOrderConfirm({ request, env });
    if (path.startsWith("/api/admin/")) return onAdmin({ request, env, ctx });
    if (path.startsWith("/api/")) return json({ error: "No encontrado." }, 404);

    if (path === "/stock.js" && request.method === "GET") return onStockJs({ request, env, ctx });

    return env.ASSETS.fetch(request);
  }
};
