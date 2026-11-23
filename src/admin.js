// API del panel de administración (/admin). Todas las rutas /api/admin/* exigen:
//   1) una sesión válida de Supabase (Authorization: Bearer <token de la sesión>), y
//   2) que ese usuario esté en la tabla public.admins (se da de alta a mano en el SQL Editor).
// Se usa la llave service_role para leer/escribir; el navegador nunca la ve.

import CATALOG from "../public/catalog.js";
import { db, hasDb, dbHelp } from "./lib/db.js";
import { json, cleanText, cleanNote, ORDER_ID_RE } from "./lib/util.js";
import { getOrder, patchOrder, notifyPaid, notifyShipped } from "./lib/orders.js";
import { syncOrder } from "./payments.js";
import { purgeStockCache } from "./lib/stock.js";
import { canEmailCustomers } from "./lib/mail.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin(request, env) {
  if (!hasDb(env)) {
    const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !env[k]);
    return { error: json({ error: `Falta configurar en Cloudflare: ${missing.join(", ")} (el nombre debe ser exactamente ese).`, missing }, 503) };
  }
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { error: json({ error: "Inicia sesión." }, 401) };
  let user;
  try {
    const res = await fetch(`${String(env.SUPABASE_URL).replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) return { error: json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." }, 401) };
    if (!res.ok) { console.error("auth/v1/user", res.status); return { error: json({ error: `No se pudo verificar tu sesión (código ${res.status}).` }, 502) }; }
    user = await res.json();
  } catch {
    return { error: json({ error: "No se pudo verificar tu sesión." }, 502) };
  }
  if (!user || !UUID_RE.test(String(user.id || ""))) return { error: json({ error: "Sesión inválida." }, 401) };
  try {
    const rows = await db(env, `admins?user_id=eq.${user.id}&select=user_id`);
    if (!Array.isArray(rows) || !rows.length) return { error: json({ error: "Tu cuenta no tiene acceso de administrador.", email: user.email || "" }, 403) };
  } catch (e) {
    return { error: json({ error: dbHelp(e) || "No se pudo verificar tu acceso." }, 500) };
  }
  return { user };
}

const cleanUrl = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return u.toString().slice(0, 300);
  } catch { return false; }
};

const emailResult = (r) => (r ? { sent: r.ok === true, skipped: r.skipped === true, error: r.ok ? undefined : r.error } : null);

/* ---------- Pedidos ---------- */
async function listOrders(env) {
  const orders = await db(env, "orders?select=*&order=created_at.desc&limit=300");
  return json({ orders, email: { customers: canEmailCustomers(env), me: Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL) } });
}

const SHIPPING_STATES = ["paid", "preparing", "shipped", "delivered"];

async function updateOrder(env, id, body) {
  const order = await getOrder(env, id);
  if (!order) return json({ error: "No existe ese pedido." }, 404);
  const patch = {};

  if ("carrier" in body) patch.carrier = cleanText(body.carrier, 40) || null;
  if ("tracking_number" in body) patch.tracking_number = cleanText(body.tracking_number, 60) || null;
  if ("tracking_url" in body) {
    const u = cleanUrl(body.tracking_url);
    if (u === false) return json({ error: "El enlace de rastreo no es válido (debe empezar con https://)." }, 400);
    patch.tracking_url = u;
  }
  if ("admin_note" in body) patch.admin_note = cleanNote(body.admin_note, 500) || null;
  if ("student_verified" in body) patch.student_verified = body.student_verified === true;

  if (body.status !== undefined && body.status !== order.status) {
    const next = String(body.status);
    if (!["paid", "preparing", "shipped", "delivered", "cancelled"].includes(next)) return json({ error: "Estado inválido." }, 400);
    if (order.status === "refunded") return json({ error: "Este pedido ya fue reembolsado." }, 409);
    if (SHIPPING_STATES.includes(next) && !order.paid_at) return json({ error: "Este pedido todavía no está pagado. Usa «Verificar pago»." }, 409);
    patch.status = next;
    if (next === "shipped" && !order.shipped_at) patch.shipped_at = new Date().toISOString();
  }

  const merged = { ...order, ...patch };
  const wantsMail = body.notify === "shipped";
  if (wantsMail) {
    if (!merged.paid_at) return json({ error: "Este pedido todavía no está pagado. Usa «Verificar pago»." }, 409);
    if (merged.status === "cancelled" || merged.status === "refunded") return json({ error: "Este pedido está cancelado o reembolsado." }, 409);
    if (!merged.carrier || !merged.tracking_number) return json({ error: "Para avisar al cliente escribe la paquetería y el número de guía." }, 400);
    if (merged.status !== "shipped" && merged.status !== "delivered") { patch.status = "shipped"; merged.status = "shipped"; }
    if (!merged.shipped_at) { patch.shipped_at = new Date().toISOString(); merged.shipped_at = patch.shipped_at; }
  }

  if (Object.keys(patch).length) await patchOrder(env, id, patch);
  let mail = null;
  if (wantsMail) mail = await notifyShipped(env, merged);
  return json({ order: await getOrder(env, id), email: emailResult(mail) });
}

async function resendNotice(env, id, kind) {
  const order = await getOrder(env, id);
  if (!order) return json({ error: "No existe ese pedido." }, 404);
  if (kind === "shipped") {
    if (!order.carrier || !order.tracking_number) return json({ error: "Falta la paquetería o el número de guía." }, 400);
    return json({ order: order, email: emailResult(await notifyShipped(env, order)) });
  }
  if (kind === "paid") {
    if (!order.paid_at) return json({ error: "El pedido todavía no está pagado." }, 409);
    const r = await notifyPaid(env, order);
    return json({ order: await getOrder(env, id), email: emailResult(r.customer), admin: emailResult(r.admin) });
  }
  return json({ error: "Tipo de aviso inválido." }, 400);
}

/* ---------- Existencias ---------- */
async function readStock(env) {
  const rows = await db(env, "stock?select=model,color,size,qty,updated_at&order=model,color,size");
  return json({ rows: Array.isArray(rows) ? rows : [] });
}

async function saveStock(request, env, body) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 60) return json({ error: "Solicitud inválida." }, 400);
  const now = new Date().toISOString();
  const rows = [];
  for (const it of items) {
    const qty = Number(it.qty);
    if (!CATALOG.models[it.model] || !CATALOG.colors[it.color] || !CATALOG.sizes.includes(it.size) || !Number.isInteger(qty) || qty < 0 || qty > 999) {
      return json({ error: "Hay una existencia inválida (usa números enteros de 0 a 999)." }, 400);
    }
    rows.push({ model: it.model, color: it.color, size: it.size, qty, updated_at: now });
  }
  await db(env, "stock?on_conflict=model,color,size", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: rows });
  await purgeStockCache(request);
  return readStock(env);
}

/* ---------- Router ---------- */
export async function onAdmin({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (gate.error) return gate.error;

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
  const method = request.method;
  try {
    if (path === "orders" && method === "GET") return await listOrders(env);

    const m = /^orders\/([A-Z0-9-]+)(?:\/(sync|notify))?$/.exec(path);
    if (m) {
      const id = m[1], action = m[2];
      if (!ORDER_ID_RE.test(id)) return json({ error: "Folio inválido." }, 400);
      if (method !== "POST") return json({ error: "Método no permitido." }, 405, { Allow: "POST" });
      let body = {};
      try { body = await request.json(); } catch { /* sin cuerpo */ }
      if (!action) return await updateOrder(env, id, body || {});
      if (action === "notify") return await resendNotice(env, id, String((body || {}).kind || ""));
      if (action === "sync") {
        const result = await syncOrder(env, id);
        return json({ order: await getOrder(env, id), sync: result });
      }
    }

    if (path === "stock") {
      if (method === "GET") return await readStock(env);
      if (method === "POST") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }
        return await saveStock(request, env, body || {});
      }
    }
    return json({ error: "No encontrado." }, 404);
  } catch (e) {
    console.error("admin", path, e.message);
    return json({ error: dbHelp(e) || (/^Mercado Pago/.test(e.message) ? "No se pudo consultar Mercado Pago." : "No se pudo completar. Intenta de nuevo.") }, 500);
  }
}
