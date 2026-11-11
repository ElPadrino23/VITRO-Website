// Worker de VITRO: sirve el sitio (carpeta public/) y atiende POST /api/checkout.
// vitroscrubs.com (sin www) redirige a www.vitroscrubs.com.
import { onRequestPost } from "./checkout.js";

const CANONICAL_HOST = "www.vitroscrubs.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "vitroscrubs.com") {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/checkout") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return new Response(JSON.stringify({ error: "Método no permitido." }), {
        status: 405, headers: { "Content-Type": "application/json", Allow: "POST" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
