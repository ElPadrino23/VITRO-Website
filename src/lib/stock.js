// Existencias en vivo.
// La fuente de verdad es la tabla `stock` de Supabase (se edita en /admin y se descuenta sola con cada pago).
// public/catalog.js → stock queda solo como respaldo si la base de datos no responde.

import CATALOG from "../../public/catalog.js";
import { hasDb, db } from "./db.js";

// → { "mujer-navy": { XS: 3, S: 4, M: 3 }, ... }  o null si no hay base de datos / está vacía.
export async function loadStock(env) {
  if (!hasDb(env)) return null;
  const rows = await db(env, "stock?select=model,color,size,qty");
  if (!Array.isArray(rows) || !rows.length) return null;
  const out = {};
  for (const m of Object.keys(CATALOG.models)) {
    for (const c of Object.keys(CATALOG.colors)) {
      out[`${m}-${c}`] = Object.fromEntries(CATALOG.sizes.map((s) => [s, 0]));
    }
  }
  for (const r of rows) {
    const bucket = out[`${r.model}-${r.color}`];
    if (bucket && r.size in bucket) bucket[r.size] = Math.max(0, Math.floor(Number(r.qty)) || 0);
  }
  return out;
}

const cacheKeyFor = (request) => new Request(new URL("/stock.js", request.url).toString());

// GET /stock.js: script que pisa catalog.js → stock con las existencias reales.
// Si algo falla devuelve un script vacío y el sitio sigue con las existencias de catalog.js.
export async function onStockJs({ request, env, ctx }) {
  const headers = { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=15" };
  const hasCache = typeof caches !== "undefined" && caches.default;
  const key = cacheKeyFor(request);
  if (hasCache) {
    try { const hit = await caches.default.match(key); if (hit) return hit; } catch { /* sin caché */ }
  }
  let live = null;
  try { live = await loadStock(env); } catch (e) { console.error("stock.js", e.message); }
  const body = live
    ? `(function(){var C=window.VITRO_CATALOG;if(!C)return;var s=${JSON.stringify(live)};for(var k in s)C.stock[k]=s[k];})();`
    : "/* existencias: catalog.js */";
  // También se guarda en caché el script vacío: así, si la base de datos falla o aún no existe, no se le pega en cada visita.
  const res = new Response(body, { headers });
  if (hasCache && ctx && ctx.waitUntil) { try { ctx.waitUntil(caches.default.put(key, res.clone())); } catch { /* sin caché */ } }
  return res;
}

// Después de editar existencias en /admin: que el sitio las vea ya (en esta ubicación; en el resto, en ≤15 s).
export async function purgeStockCache(request) {
  if (typeof caches === "undefined" || !caches.default) return;
  try { await caches.default.delete(cacheKeyFor(request)); } catch { /* sin caché */ }
}
