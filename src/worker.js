// Worker de VITRO: sirve el sitio (carpeta public/) y atiende POST /api/checkout.
import { onRequestPost } from "./checkout.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/checkout") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return new Response(JSON.stringify({ error: "Método no permitido." }), {
        status: 405, headers: { "Content-Type": "application/json", Allow: "POST" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
