// Utilidades compartidas del servidor.

export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

// Escapa texto para meterlo en HTML (correos): todo lo que viene del cliente se pasa por aquí.
export const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const money = (n) => "$" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Folio de pedido: VITRO- + letras/números en mayúscula. Se valida siempre antes de usarlo en una consulta.
export const ORDER_ID_RE = /^VITRO-[A-Z0-9]{4,24}$/;

export const cleanText = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);
// Igual, pero conserva los saltos de línea (notas internas).
export const cleanNote = (v, max = 500) => String(v ?? "").replace(/[\u0000-\u0009\u000b-\u001f<>]/g, " ").trim().slice(0, max);

export const siteOf = (env) => String(env.SITE_URL || "https://www.vitroscrubs.com").replace(/\/$/, "");
