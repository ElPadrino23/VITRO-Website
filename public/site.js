/* ============================================================
   VITRO — código compartido por todas las páginas con tienda
   (index, tienda, producto, carrito, cuenta). Va después de catalog.js.
   Precios, stock y envío están en catalog.js.
   ============================================================ */
const CONFIG = {
  WHATSAPP: "525613321403",          // número con lada país, sin + ni espacios
  INSTAGRAM: "https://instagram.com/vitroscrubs",
  TIKTOK: "https://www.tiktok.com/@vitroscrubs",
  EMAIL: "hola@vitroscrubs.com",     // se usa si NEWSLETTER_URL está vacío
  NEWSLETTER_URL: "",                // URL de Formspree / Google Forms (POST con campo "email"); vacío = abre correo
  /* Cuentas (Supabase). Pega aquí la "Project URL" y la llave "anon public".
     NUNCA pegues la llave "service_role": esa es secreta. */
  SUPABASE_URL: "https://hczdfyrjzpwsmnjogylv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjemRmeXJqenB3c21uam9neWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1OTQ3NTksImV4cCI6MjExMDE3MDc1OX0.iINqe7OlQOKzv982S5s8M38BofRFr8nA3fW5ndCVaSM"
};

const CAT = window.VITRO_CATALOG;
const $ = (s, el = document) => el.querySelector(s);
const money = n => "$" + n.toLocaleString("es-MX");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waLink = text => "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(text);
const MODELS = Object.keys(CAT.models), COLORS = Object.keys(CAT.colors);
const keyOf = (m, c) => m + "-" + c;
const stockOf = (m, c, s) => ((CAT.stock[m + "-" + c] || {})[s]) || 0;
const colorStock = (m, c) => CAT.sizes.reduce((t, s) => t + stockOf(m, c, s), 0);
const unitPrice = (c, stu) => (stu ? CAT.studentPrice : CAT.price)[c];

/* posición del recorte de cada foto: "x% y%" */
const PHOTO_POS = { "mujer-verde": "50% 50%" };
/* fotos con nombre de archivo distinto a "<modelo>-<color>.jpg" (sin espacios en el nombre) */
const IMAGE_NAMES = { "unisex-verde": "loggg.jpg" };
const imgOf = key => "img/" + (IMAGE_NAMES[key] || key + ".jpg");
const productUrl = key => "producto.html?id=" + encodeURIComponent(key);

let student = false;
try { student = localStorage.getItem("vitro-student") === "1"; } catch (_) {}
const setStudent = v => { student = v; try { localStorage.setItem("vitro-student", v ? "1" : "0"); } catch (_) {} };

/* talla seleccionada por cada modelo-color */
const sel = {};
MODELS.forEach(m => COLORS.forEach(c => {
  sel[keyOf(m, c)] = CAT.sizes.find(z => stockOf(m, c, z) > 0) || CAT.sizes[0];
}));

/* ---------- Carrito (se guarda en el navegador) ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("vitro-cart") || "[]"); } catch (_) { cart = []; }
if (new URLSearchParams(location.search).get("pedido") === "ok") cart = [];
cart = cart.filter(i => CAT.models[i.model] && CAT.colors[i.color] && CAT.sizes.includes(i.size) && stockOf(i.model, i.color, i.size) > 0)
           .map(i => ({ ...i, qty: Math.min(i.qty, stockOf(i.model, i.color, i.size), 10) }));
const saveCart = () => { try { localStorage.setItem("vitro-cart", JSON.stringify(cart)); } catch (_) {} };
saveCart();
const units = () => cart.reduce((t, i) => t + i.qty, 0);
const listTotal = () => cart.reduce((t, i) => t + unitPrice(i.color, false) * i.qty, 0);
const payTotal = () => cart.reduce((t, i) => t + unitPrice(i.color, student) * i.qty, 0);
const shipCost = () => (units() >= CAT.freeShippingFrom ? 0 : CAT.shipping);
const isStudentEmail = email => {
  const d = String(email).toLowerCase().split("@")[1] || "";
  return CAT.studentDomains.some(x => x.startsWith(".") ? d.endsWith(x) : d === x || d.endsWith("." + x));
};

/* Renglón de un artículo del carrito (lo usan el panel lateral y carrito.html) */
function cartLine(it, idx, rerender) {
  const M = CAT.models[it.model], C = CAT.colors[it.color];
  const max = Math.min(10, stockOf(it.model, it.color, it.size));
  const row = document.createElement("div"); row.className = "line";
  row.innerHTML = `<div><b>${esc(M.name)}</b><small>${esc(M.kind)} · ${esc(C.name)} · Talla ${esc(it.size)}</small></div>
    <div style="text-align:right"><b>${money(unitPrice(it.color, student) * it.qty)}</b></div>
    <div class="qty"><button type="button" aria-label="Quitar una pieza">−</button><span>${it.qty}</span><button type="button" aria-label="Agregar una pieza"${it.qty >= max ? " disabled" : ""}>+</button></div>
    <div style="text-align:right"><button type="button" class="rm">Quitar</button></div>`;
  const [minus, plus] = row.querySelectorAll(".qty button");
  minus.onclick = () => { it.qty = Math.max(1, it.qty - 1); saveCart(); rerender(); };
  plus.onclick = () => { it.qty = Math.min(max, it.qty + 1); saveCart(); rerender(); };
  $(".rm", row).onclick = () => { cart.splice(idx, 1); saveCart(); rerender(); };
  return row;
}

/* ---------- Panel lateral: resumen rápido. El pago se hace en carrito.html ---------- */
let lastFocus = null;
if (!$("#drawer")) {
  document.body.insertAdjacentHTML("beforeend", `<div class="veil" id="veil" hidden></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="dtitle" hidden>
  <header><h2 id="dtitle">Tu carrito</h2><button type="button" class="x" id="closecart" aria-label="Cerrar carrito">&times;</button></header>
  <div class="dbody" id="dbody"></div>
  <div class="dfoot" id="dfoot"></div>
</aside>`);
}
function addToCart(model, color, size) {
  const max = Math.min(10, stockOf(model, color, size));
  const f = cart.find(i => i.model === model && i.color === color && i.size === size);
  if (f) f.qty = Math.min(max, f.qty + 1); else cart.push({ model, color, size, qty: 1 });
  saveCart(); openCart();
}
function openCart() {
  lastFocus = document.activeElement;
  $("#veil").hidden = false; $("#drawer").hidden = false;
  document.body.style.overflow = "hidden";
  renderCart();
  $("#closecart").focus();
}
function closeCart() {
  $("#veil").hidden = true; $("#drawer").hidden = true;
  document.body.style.overflow = "";
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
function updateBadge() {
  const b = $("#cartcount"); if (!b) return;
  const n = units(); b.textContent = n; b.hidden = n === 0;
}
function renderCart() {
  updateBadge();
  const body = $("#dbody"), foot = $("#dfoot");
  body.innerHTML = ""; foot.innerHTML = "";
  if (!cart.length) {
    body.innerHTML = '<p class="empty">Tu carrito está vacío.</p>';
    const here = document.getElementById("tienda");
    foot.innerHTML = `<a class="btn" href="${here ? "#tienda" : "tienda.html"}" id="goshop2">Ver los scrubs</a>`;
    $("#goshop2").onclick = closeCart;
    return;
  }
  cart.forEach((it, idx) => body.appendChild(cartLine(it, idx, renderCart)));
  foot.innerHTML = `<div class="tot big"><span>Subtotal</span><span>${money(payTotal())} MXN</span></div>
    <p class="note">El envío y el precio estudiante se confirman en el carrito, antes de pagar.</p>
    <a class="btn" href="carrito.html">Ir al carrito y pagar</a>
    <button type="button" class="rm" id="keepshop">Seguir comprando</button>`;
  $("#keepshop").onclick = closeCart;
}
if ($("#opencart")) $("#opencart").onclick = openCart;
$("#closecart").onclick = closeCart;
$("#veil").onclick = closeCart;
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#drawer").hidden) closeCart(); });

/* ---------- Tarjeta de producto (index y tienda) ---------- */
function buildCard(m, c, rerender) {
  const M = CAT.models[m], col = CAT.colors[c], key = keyOf(m, c), size = sel[key];
  const left = stockOf(m, c, size);
  const soldOut = colorStock(m, c) === 0;
  const img = imgOf(key);
  const card = document.createElement("article");
  card.className = "card"; card.id = "card-" + key;
  card.innerHTML = `
    <a class="ph" href="${productUrl(key)}" style="background-image:url(${img});${PHOTO_POS[key] ? "--pos:" + PHOTO_POS[key] : ""}" aria-label="Ver ${esc(M.name)} en ${esc(col.name)}">
      ${col.vshield ? '<span class="chip">V-SHIELD</span>' : ""}
    </a>
    <div class="row"><h3>Modelo: ${esc(M.name)}</h3>
      <span class="price">${money(unitPrice(c, false))}<small class="mxn"> MXN</small></span></div>
    <p class="kind">${esc(M.kind)} · ${esc(col.name)}</p>
    <p class="stu">Precio estudiante: <b>${money(unitPrice(c, true))}</b></p>
    <p class="desc">${esc(M.desc)}</p>
    <div><div class="lbl">Talla: ${esc(size)}</div>
      <div class="sizes" role="group" aria-label="Talla de ${esc(M.name)} ${esc(col.name)}"></div></div>
    <div class="buy"></div>`;
  const probe = new Image();
  probe.onerror = () => $(".ph", card).classList.add("nophoto");
  probe.src = img;
  const sizes = $(".sizes", card);
  CAT.sizes.forEach(z => {
    const b = document.createElement("button");
    const out = stockOf(m, c, z) === 0;
    b.type = "button"; b.className = "size"; b.textContent = z;
    if (out) { b.disabled = true; b.title = "Agotada"; b.style.opacity = ".4"; b.style.textDecoration = "line-through"; }
    b.setAttribute("aria-pressed", z === size);
    b.onclick = () => { sel[key] = z; rerender(); };
    sizes.appendChild(b);
  });
  const buy = $(".buy", card);
  const add = document.createElement("button");
  add.type = "button"; add.className = "btn";
  add.textContent = soldOut || left === 0 ? "Agotado" : "Agregar al carrito";
  if (soldOut || left === 0) add.disabled = true;
  add.onclick = () => addToCart(m, c, size);
  buy.appendChild(add);
  const view = document.createElement("a");
  view.className = "btn ghost"; view.href = productUrl(key); view.textContent = "Ver producto";
  buy.appendChild(view);
  const n = document.createElement("p");
  n.className = "note";
  n.textContent = "Pago seguro con Mercado Pago: tarjeta, OXXO o transferencia.";
  buy.appendChild(n);
  return card;
}

updateBadge();
