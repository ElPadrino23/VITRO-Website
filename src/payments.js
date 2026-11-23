// Pagos: webhook de Mercado Pago, confirmación al volver a /gracias y verificación manual desde el panel.
//
// Regla de oro: el estado de un pago SIEMPRE se lee de la API de Mercado Pago con nuestro token
// (GET /v1/payments/{id}); nunca se confía en lo que diga el cuerpo de una notificación o el navegador.
// Por eso las tres entradas (webhook, /api/order/confirm y "Verificar pago") comparten applyPayment() y es seguro
// que se repitan: el pedido pasa a "pagado", descuenta existencias y manda correos UNA sola vez
// (lo garantiza la función mark_order_paid de Supabase).
//
// Variables: MP_ACCESS_TOKEN (secret), MP_WEBHOOK_SECRET (secret, clave secreta de Webhooks en Mercado Pago).

import { rpc } from "./lib/db.js";
import { json, ORDER_ID_RE } from "./lib/util.js";
import { getOrder, patchOrder, createOrderFromPayment, notifyPaid } from "./lib/orders.js";

const MP = "https://api.mercadopago.com";

export async function mpGet(env, path) {
  const res = await fetch(MP + path, { headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Mercado Pago ${res.status} ${path.split("?")[0]}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- Firma de las notificaciones (x-signature) ---------- */
const enc = new TextEncoder();

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Plantilla oficial: "id:[data.id];request-id:[x-request-id];ts:[ts];" (se omiten las partes que no llegaron).
export async function validMpSignature({ xSignature, xRequestId, dataId, secret }) {
  if (!xSignature || !secret) return false;
  let ts = "", v1 = "";
  for (const part of String(xSignature).split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === "ts") ts = v; else if (k === "v1") v1 = v;
  }
  if (!ts || !v1) return false;
  let manifest = "";
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(manifest)));
  const hex = Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
  return sameString(hex, v1.toLowerCase());
}

/* ---------- Aplicar un pago a su pedido ---------- */
const kindOf = (s) =>
  s === "approved" ? "paid"
    : s === "refunded" || s === "charged_back" ? "refunded"
      : s === "cancelled" ? "cancelled"
        : "pending";   // pending, in_process, authorized, in_mediation, rejected (puede reintentar con otro medio)

export async function applyPayment(env, pay) {
  const ref = String(pay.external_reference || "");
  if (!ORDER_ID_RE.test(ref)) return { ignored: "El pago no tiene folio de VITRO." };

  let order = await getOrder(env, ref);
  if (!order) {
    // El pedido no se guardó al crear el pago: se arma con los datos que Mercado Pago conserva del pago.
    order = await createOrderFromPayment(env, ref, pay);
    if (!order) return { ignored: "No se pudo recuperar el pedido." };
  }

  const kind = kindOf(pay.status);
  const paymentId = String(pay.id);
  let firstPaid = false;

  if (kind === "paid") {
    firstPaid = (await rpc(env, "mark_order_paid", { p_id: ref, p_payment_id: paymentId, p_mp_status: pay.status })) === true;
    if (firstPaid && Math.abs((Number(pay.transaction_amount) || 0) - order.total) > 1) {
      await patchOrder(env, ref, { admin_note: `Revisa el monto: Mercado Pago cobró $${pay.transaction_amount} y el pedido decía $${order.total}.` });
    }
  } else if (kind === "refunded") {
    await patchOrder(env, ref, { status: "refunded", mp_status: pay.status, mp_payment_id: paymentId });
  } else {
    if (kind === "cancelled") await patchOrder(env, ref, { status: "cancelled" }, "&status=eq.pending");
    await patchOrder(env, ref, { mp_status: pay.status, mp_payment_id: paymentId }, "&paid_at=is.null");
  }

  if (firstPaid) {
    try { await notifyPaid(env, await getOrder(env, ref)); }
    catch (e) { console.error("avisos del pedido", ref, e.message); }
  }
  return { order_id: ref, mp_status: pay.status, paid_now: firstPaid };
}

export async function syncPayment(env, paymentId) {
  return applyPayment(env, await mpGet(env, `/v1/payments/${encodeURIComponent(paymentId)}`));
}

// Busca en Mercado Pago los pagos de un folio (por si el webhook no llegó) y aplica el más relevante.
export async function syncOrder(env, id) {
  const data = await mpGet(env, `/v1/payments/search?external_reference=${encodeURIComponent(id)}&sort=date_created&criteria=desc&limit=10`);
  const list = Array.isArray(data.results) ? data.results : [];
  if (!list.length) return { found: false };
  const pick = list.find((p) => p.status === "approved") || list[0];
  return { found: true, ...(await applyPayment(env, pick)) };
}

/* ---------- POST /api/mp-webhook ---------- */
export async function onMpWebhook({ request, env }) {
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405, { Allow: "POST" });
  if (!env.MP_ACCESS_TOKEN) return json({ error: "El pago no está configurado." }, 500);

  const url = new URL(request.url);
  let body = {};
  try { body = await request.json(); } catch { /* algunas notificaciones llegan sin cuerpo */ }
  const type = url.searchParams.get("type") || url.searchParams.get("topic") || body.type || "";
  const dataId = String(url.searchParams.get("data.id") || (body.data && body.data.id) || "");

  // La firma se revisa y, si no coincide, queda en los registros. No bloquea porque el estado del pago nunca sale
  // de esta notificación sino de la API de Mercado Pago (ver arriba): una notificación falsa solo puede hacer que
  // consultemos un pago real, que es justo lo que haríamos de todos modos. Así una clave de prueba/producción
  // equivocada no deja pedidos sin marcar como pagados.
  if (env.MP_WEBHOOK_SECRET) {
    const okSig = await validMpSignature({
      xSignature: request.headers.get("x-signature"), xRequestId: request.headers.get("x-request-id"),
      dataId: url.searchParams.get("data.id") || dataId, secret: env.MP_WEBHOOK_SECRET
    });
    if (!okSig) console.warn("mp-webhook: la firma no coincide (¿clave secreta de prueba vs producción?)");
  }

  if (type !== "payment" || !/^\d{3,20}$/.test(dataId)) return json({ ok: true, ignored: true });
  try {
    return json({ ok: true, ...(await syncPayment(env, dataId)) });
  } catch (e) {
    // 404 = pago que no existe (p. ej. la notificación de prueba del panel): no tiene caso que Mercado Pago reintente.
    if (e.status === 404) return json({ ok: true, ignored: "Pago no encontrado." });
    console.error("mp-webhook", e.message);
    return json({ error: "No se pudo procesar la notificación." }, 500);
  }
}

/* ---------- POST /api/order/confirm  { ref, payment_id }  (lo llama /gracias al volver de Mercado Pago) ---------- */
export async function onOrderConfirm({ request, env }) {
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405, { Allow: "POST" });
  if (!env.MP_ACCESS_TOKEN) return json({ error: "El pago no está configurado." }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }
  const ref = String(body.ref || ""), paymentId = String(body.payment_id || "");
  if (!ORDER_ID_RE.test(ref) || !/^\d{3,20}$/.test(paymentId)) return json({ error: "Datos inválidos." }, 400);
  try {
    const pay = await mpGet(env, `/v1/payments/${paymentId}`);
    if (pay.external_reference !== ref) return json({ error: "El pago no corresponde a ese pedido." }, 400);
    await applyPayment(env, pay);
    const order = await getOrder(env, ref);
    return json({ ok: true, status: order ? order.status : null });
  } catch (e) {
    if (e.status === 404) return json({ error: "Pago no encontrado." }, 404);
    console.error("order/confirm", e.message);
    return json({ error: "No se pudo confirmar el pago." }, 502);
  }
}
