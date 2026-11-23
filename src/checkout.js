// Cobro: POST /api/checkout (lo llama src/worker.js)
// Crea una preferencia de pago en Mercado Pago y devuelve la URL de pago.
// Precios, descuento, envío y existencias se calculan AQUÍ con catalog.js, nunca con lo que mande el navegador.
//
// Variables de entorno (Cloudflare Pages > Settings > Variables and secrets):
//   MP_ACCESS_TOKEN  (secreto)  Access Token de Mercado Pago (se guarda como Secret en Cloudflare)
//   SITE_URL                    se define en wrangler.jsonc (sin diagonal final)
// Además guarda cada pedido en Supabase (si está configurado) y lee las existencias en vivo de allí.
// Si la base de datos falla, el cobro SIGUE funcionando: el webhook recrea el pedido desde Mercado Pago.

import CATALOG from "../public/catalog.js";
import { loadStock } from "./lib/stock.js";
import { insertOrder, itemLabel } from "./lib/orders.js";
import { hasDb } from "./lib/db.js";

const MAX_QTY = 10, MAX_LINES = 12;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const clean = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);

const isStudentEmail = (email) => {
  const domain = String(email).toLowerCase().split("@")[1] || "";
  return CATALOG.studentDomains.some((d) => (d.startsWith(".") ? domain.endsWith(d) : domain === d || domain.endsWith("." + d)));
};

export async function onRequestPost({ request, env }) {
  if (!env.MP_ACCESS_TOKEN || !env.SITE_URL) return json({ error: "El pago no está configurado todavía." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > MAX_LINES) return json({ error: "Carrito inválido." }, 400);

  const c = body.customer || {};
  const customer = {
    name: clean(c.name, 80), email: clean(c.email, 120), phone: clean(c.phone, 20).replace(/\D/g, "").slice(-10),
    street: clean(c.street, 120), colonia: clean(c.colonia, 80), zip: clean(c.zip, 5),
    city: clean(c.city, 60), state: clean(c.state, 40), notes: clean(c.notes, 160), school: clean(c.school, 100)
  };
  if (!customer.name || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.length !== 10 ||
      !customer.street || !customer.colonia || !/^\d{5}$/.test(customer.zip) || !customer.city || !customer.state) {
    return json({ error: "Revisa tus datos de envío." }, 400);
  }

  // Precio estudiante: requiere casilla + correo escolar + escuela. La credencial se verifica por WhatsApp antes del envío.
  const student = body.student === true;
  if (student) {
    if (!isStudentEmail(customer.email)) {
      return json({ error: "Para el precio estudiante usa tu correo escolar, o escríbenos por WhatsApp con tu credencial." }, 400);
    }
    if (!customer.school) return json({ error: "Escribe tu escuela y carrera para el precio estudiante." }, 400);
  }

  let liveStock = null;
  try { liveStock = await loadStock(env); } catch (e) { console.error("existencias en vivo", e.message); }
  const stock = liveStock || CATALOG.stock;   // respaldo: catalog.js

  const mpItems = [];
  const orderItems = [];
  const perKey = {};   // piezas pedidas por modelo-color-talla, para validar existencias
  let units = 0;
  for (const it of items) {
    const model = CATALOG.models[it.model], color = CATALOG.colors[it.color];
    const qty = Number(it.qty);
    if (!model || !color || !CATALOG.sizes.includes(it.size) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return json({ error: "Hay un producto inválido en tu carrito." }, 400);
    }
    const key = `${it.model}-${it.color}`;
    perKey[key + "|" + it.size] = (perKey[key + "|" + it.size] || 0) + qty;
    const available = (stock[key] || {})[it.size] || 0;
    if (perKey[key + "|" + it.size] > available) {
      return json({ error: `${model.name} (${model.kind}) ${color.name} talla ${it.size}: solo quedan ${available}.` }, 400);
    }
    const unit = (student ? CATALOG.studentPrice : CATALOG.price)[it.color];
    mpItems.push({
      id: `${it.model}-${it.color}-${it.size}`,
      title: `${model.name} (${model.kind}) · ${color.name} · Talla ${it.size}${student ? " (precio estudiante)" : ""}`,
      quantity: qty,
      unit_price: unit,
      currency_id: "MXN"
    });
    orderItems.push({ model: it.model, color: it.color, size: it.size, qty, unit_price: unit, name: itemLabel(it.model, it.color) });
    units += qty;
  }

  const shipping = units >= CATALOG.freeShippingFrom ? 0 : CATALOG.shipping;
  if (shipping > 0) mpItems.push({ id: "envio", title: "Envío", quantity: 1, unit_price: shipping, currency_id: "MXN" });

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
  if (!res.ok || !data.init_point) return json({ error: "Mercado Pago rechazó la solicitud." }, 502);

  // Guardar el pedido (si falla no se interrumpe el pago; ver el comentario de arriba).
  if (hasDb(env)) {
    const subtotal = orderItems.reduce((t, i) => t + i.unit_price * i.qty, 0);
    try {
      await insertOrder(env, { id: orderId, status: "pending", student, customer, items: orderItems, subtotal, shipping, total: subtotal + shipping });
    } catch (e) { console.error("no se guardó el pedido", orderId, e.message); }
  }

  return json({ url: data.init_point, orderId });
}

export async function onRequest() {
  return json({ error: "Método no permitido." }, 405);
}