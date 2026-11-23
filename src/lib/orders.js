// Pedidos: guardar, leer, recrear desde Mercado Pago y avisar por correo.

import CATALOG from "../../public/catalog.js";
import { db } from "./db.js";
import { sendMail, sendToCustomer } from "./mail.js";
import { adminNewOrder, customerPaid, customerShipped } from "./emails.js";
import { ORDER_ID_RE } from "./util.js";

export async function getOrder(env, id) {
  if (!ORDER_ID_RE.test(id)) return null;
  const rows = await db(env, `orders?id=eq.${encodeURIComponent(id)}&select=*`);
  return (Array.isArray(rows) && rows[0]) || null;
}

export async function patchOrder(env, id, patch, extraFilter = "") {
  if (!ORDER_ID_RE.test(id)) throw new Error("Folio inválido.");
  await db(env, `orders?id=eq.${encodeURIComponent(id)}${extraFilter}`, { method: "PATCH", body: patch });
}

// Guarda un pedido nuevo (lo llama el cobro). Si el folio ya existe, no lo pisa.
export async function insertOrder(env, row) {
  await db(env, "orders?on_conflict=id", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal", body: row });
}

export const itemLabel = (model, color) =>
  `${CATALOG.models[model].name} (${CATALOG.models[model].kind}) · ${CATALOG.colors[color].name}`;

/* ---------- Si el pedido no se alcanzó a guardar, se arma con lo que Mercado Pago guardó del pago ---------- */
function itemsFromPayment(pay) {
  const out = [];
  const add = (model, color, size, qty, unit) => {
    if (!CATALOG.models[model] || !CATALOG.colors[color] || !CATALOG.sizes.includes(size)) return;
    out.push({ model, color, size, qty: Math.max(1, Math.floor(Number(qty)) || 1), unit_price: Math.round(Number(unit) || 0), name: itemLabel(model, color) });
  };
  const info = pay.additional_info && Array.isArray(pay.additional_info.items) ? pay.additional_info.items : [];
  for (const it of info) {
    const [model, color, size] = String(it.id || "").split("-");
    add(model, color, size, it.quantity, it.unit_price);
  }
  if (out.length) return out;
  const student = String((pay.metadata || {}).estudiante || "").toUpperCase().startsWith("SI");
  const meta = Array.isArray((pay.metadata || {}).items) ? pay.metadata.items : [];
  for (const s of meta) {
    const m = /^(\w+)\/(\w+)\/(\w+) x(\d+)$/.exec(String(s));
    if (m && CATALOG.colors[m[2]]) add(m[1], m[2], m[3], m[4], (student ? CATALOG.studentPrice : CATALOG.price)[m[2]]);
  }
  return out;
}

export async function createOrderFromPayment(env, id, pay) {
  const meta = pay.metadata || {};
  const c = meta.customer && typeof meta.customer === "object" ? meta.customer : {};
  const payer = pay.payer || {};
  const items = itemsFromPayment(pay);
  const total = Math.round(Number(pay.transaction_amount) || 0);
  const subtotal = items.reduce((t, i) => t + i.unit_price * i.qty, 0);
  const customer = {
    name: c.name || [payer.first_name, payer.last_name].filter(Boolean).join(" ") || "",
    email: c.email || payer.email || "",
    phone: c.phone || (payer.phone && payer.phone.number) || "",
    street: c.street || "", colonia: c.colonia || "", zip: c.zip || "", city: c.city || "", state: c.state || "",
    notes: c.notes || "", school: c.school || ""
  };
  await insertOrder(env, {
    id,
    status: "pending",
    student: String(meta.estudiante || "").toUpperCase().startsWith("SI"),
    customer, items,
    subtotal: items.length ? subtotal : total,
    shipping: items.length ? Math.max(0, total - subtotal) : 0,
    total,
    admin_note: "Pedido recreado desde Mercado Pago (no se alcanzó a guardar al crear el pago). Revisa los datos antes de enviar."
  });
  return getOrder(env, id);
}

/* ---------- Avisos ---------- */
export async function notifyPaid(env, order) {
  const patch = {};
  const result = { admin: null, customer: null };
  if (env.NOTIFY_EMAIL) {
    result.admin = await sendMail(env, { to: env.NOTIFY_EMAIL, ...adminNewOrder(env, order) });
    if (result.admin.ok) patch.admin_notified_at = new Date().toISOString();
    else console.error("aviso a admin", result.admin.error);
  }
  result.customer = await sendToCustomer(env, order.customer && order.customer.email, customerPaid(env, order));
  if (result.customer.ok) patch.customer_notified_at = new Date().toISOString();
  else if (!result.customer.skipped) console.error("confirmación a cliente", result.customer.error);
  if (Object.keys(patch).length) await patchOrder(env, order.id, patch);
  return result;
}

export async function notifyShipped(env, order) {
  const result = await sendToCustomer(env, order.customer && order.customer.email, customerShipped(env, order));
  if (result.ok) await patchOrder(env, order.id, { shipped_notified_at: new Date().toISOString() });
  else if (!result.skipped) console.error("aviso de envío", result.error);
  return result;
}
