// Plantillas de correo (HTML + texto). Todo dato que viene del cliente se escapa con h().

import { h, money, siteOf } from "./util.js";

const NAVY = "#0E1830", INK = "#12182B", MUTED = "#68728A", LINE = "#E4E0D3";

function layout(env, title, inner) {
  const site = siteOf(env);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(title)}</title></head>
<body style="margin:0;background:#F1F3F6;font-family:Arial,Helvetica,sans-serif;color:${INK};line-height:1.5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:${NAVY};padding:18px 24px"><img src="${h(site)}/img/logo-vitro-blanco.png" alt="VITRO" height="26" style="display:block;height:26px;width:auto;color:#fff;font-weight:bold;font-size:20px"></td></tr>
<tr><td style="padding:24px">${inner}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED}">VITRO · De estudiantes para estudiantes · <a href="${h(site)}" style="color:${MUTED}">${h(site.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const itemName = (it) => `${it.name || `${it.model} ${it.color}`} · Talla ${it.size}`;

function itemsTable(order) {
  const rows = (order.items || []).map((it) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid ${LINE}">${h(itemName(it))}</td>
<td style="padding:8px 8px;border-bottom:1px solid ${LINE};text-align:center;white-space:nowrap">× ${h(it.qty)}</td>
<td style="padding:8px 0;border-bottom:1px solid ${LINE};text-align:right;white-space:nowrap">${money((it.unit_price || 0) * (it.qty || 0))}</td></tr>`).join("");
  const line = (label, val, bold) => `<tr><td colspan="2" style="padding:6px 0;${bold ? "font-weight:bold;font-size:16px" : "color:" + MUTED}">${label}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:bold;font-size:16px" : ""}">${val}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0">${rows}
${line("Subtotal", money(order.subtotal))}${line("Envío", order.shipping ? money(order.shipping) : "Gratis")}${line("Total", money(order.total) + " MXN", true)}</table>`;
}

const addressLines = (c = {}) => [c.street, c.colonia, `${c.zip || ""} ${c.city || ""}`.trim(), c.state].filter(Boolean);
const addressHtml = (c) => addressLines(c).map(h).join("<br>");
const waLink = (env, text) => (env.WHATSAPP ? `https://wa.me/${env.WHATSAPP}?text=${encodeURIComponent(text)}` : "");
const btn = (href, label) => `<p style="margin:20px 0 4px"><a href="${h(href)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">${h(label)}</a></p>`;
const firstName = (c = {}) => String(c.name || "").trim().split(/\s+/)[0] || "";

/* ---------- Aviso para ti: pedido nuevo y pagado ---------- */
export function adminNewOrder(env, order) {
  const c = order.customer || {};
  const site = siteOf(env);
  const subject = `Pedido pagado ${order.id} · ${money(order.total)}${order.student ? " · ESTUDIANTE" : ""}`;
  const phoneWa = c.phone ? `https://wa.me/52${String(c.phone).replace(/\D/g, "")}` : "";
  const html = layout(env, subject, `
<h1 style="margin:0 0 4px;font-size:22px">Nuevo pedido pagado</h1>
<p style="margin:0 0 16px;color:${MUTED}">Folio <b style="color:${INK}">${h(order.id)}</b></p>
${order.student ? `<div style="background:#FFF4D6;border:1px solid #E8B84B;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:14px"><b>Precio estudiante:</b> pídele por WhatsApp la foto de su credencial vigente antes de enviar.${c.school ? `<br>Escuela y carrera: ${h(c.school)}` : ""}</div>` : ""}
${order.stock_warning ? `<div style="background:#FDE8E8;border:1px solid #D9534F;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:14px"><b>Ojo:</b> este pedido se pagó pero las existencias no alcanzaban. Revisa el stock y el pedido.</div>` : ""}
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Cliente</p>
<p style="margin:0 0 16px;font-size:14px"><b>${h(c.name)}</b><br><a href="mailto:${h(c.email)}" style="color:${INK}">${h(c.email)}</a><br>${h(c.phone)}${phoneWa ? ` · <a href="${h(phoneWa)}" style="color:${INK}">WhatsApp</a>` : ""}</p>
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Enviar a</p>
<p style="margin:0 0 16px;font-size:14px">${addressHtml(c)}${c.notes ? `<br><i>Referencias: ${h(c.notes)}</i>` : ""}</p>
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Artículos</p>
${itemsTable(order)}
${btn(`${site}/admin`, "Abrir el panel de pedidos")}`);
  const text = [
    `Nuevo pedido pagado ${order.id} · ${money(order.total)} MXN`,
    order.student ? "PRECIO ESTUDIANTE: verifica la credencial por WhatsApp antes de enviar." : "",
    order.stock_warning ? "OJO: las existencias no alcanzaban para este pedido." : "",
    `Cliente: ${c.name} · ${c.email} · ${c.phone}`,
    `Enviar a: ${addressLines(c).join(", ")}`,
    "Artículos:", ...(order.items || []).map((it) => ` - ${itemName(it)} x${it.qty}`),
    `Panel: ${site}/admin`
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

/* ---------- Al cliente: recibimos tu pago ---------- */
export function customerPaid(env, order) {
  const c = order.customer || {};
  const subject = `Recibimos tu pago · pedido ${order.id}`;
  const wa = waLink(env, `Hola VITRO, soy ${c.name || "cliente"} (pedido ${order.id}). Les mando mi credencial de estudiante.`);
  const html = layout(env, subject, `
<h1 style="margin:0 0 8px;font-size:22px">¡Gracias por tu compra${firstName(c) ? ", " + h(firstName(c)) : ""}!</h1>
<p style="margin:0 0 16px;font-size:15px">Recibimos tu pago. Estamos preparando tu pedido y te mandaremos tu número de guía por correo en cuanto salga.</p>
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Folio</p>
<p style="margin:0 0 16px;font-size:16px"><b>${h(order.id)}</b></p>
${itemsTable(order)}
<p style="margin:16px 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Se envía a</p>
<p style="margin:0 0 16px;font-size:14px">${h(c.name)}<br>${addressHtml(c)}</p>
${order.student && !order.student_verified ? `<div style="background:#FFF4D6;border:1px solid #E8B84B;border-radius:10px;padding:12px 14px;font-size:14px"><b>Precio estudiante:</b> antes del envío necesitamos ver tu credencial vigente. ${wa ? `<a href="${h(wa)}" style="color:${INK}">Mándanos la foto por WhatsApp</a>.` : "Mándanos la foto por WhatsApp."} Si no se puede comprobar, te pediremos la diferencia al precio de lista.</div>` : ""}
<p style="margin:16px 0 0;font-size:13px;color:${MUTED}">El pago se procesó en Mercado Pago; VITRO no guarda tus datos de tarjeta ni bancarios.</p>`);
  const text = [
    `¡Gracias por tu compra${firstName(c) ? ", " + firstName(c) : ""}!`,
    "Recibimos tu pago. Te mandaremos tu número de guía por correo en cuanto salga tu pedido.",
    `Folio: ${order.id}`,
    ...(order.items || []).map((it) => ` - ${itemName(it)} x${it.qty}`),
    `Total: ${money(order.total)} MXN`,
    `Se envía a: ${addressLines(c).join(", ")}`,
    order.student && !order.student_verified ? `Precio estudiante: mándanos por WhatsApp una foto de tu credencial vigente antes del envío.${wa ? " " + wa : ""}` : ""
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

/* ---------- Al cliente: tu pedido va en camino (guía) ---------- */
export function customerShipped(env, order) {
  const c = order.customer || {};
  const subject = `Tu pedido ${order.id} ya va en camino`;
  const html = layout(env, subject, `
<h1 style="margin:0 0 8px;font-size:22px">Tu pedido va en camino</h1>
<p style="margin:0 0 16px;font-size:15px">${h(firstName(c) ? firstName(c) + ", " : "")}ya entregamos tu pedido <b>${h(order.id)}</b> a la paquetería.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;margin-bottom:8px">
<tr><td style="padding:4px 16px 4px 0;color:${MUTED}">Paquetería</td><td style="padding:4px 0"><b>${h(order.carrier || "—")}</b></td></tr>
<tr><td style="padding:4px 16px 4px 0;color:${MUTED}">Número de guía</td><td style="padding:4px 0"><b>${h(order.tracking_number || "—")}</b></td></tr></table>
${order.tracking_url ? btn(order.tracking_url, "Rastrear mi paquete") : ""}
<p style="margin:20px 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">Se entrega en</p>
<p style="margin:0 0 8px;font-size:14px">${h(c.name)}<br>${addressHtml(c)}</p>`);
  const text = [
    `Tu pedido ${order.id} ya va en camino.`,
    `Paquetería: ${order.carrier || "—"}`,
    `Número de guía: ${order.tracking_number || "—"}`,
    order.tracking_url ? `Rastreo: ${order.tracking_url}` : "",
    `Se entrega en: ${addressLines(c).join(", ")}`
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}
