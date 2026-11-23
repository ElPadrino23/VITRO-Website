// Acceso a la base de datos (Supabase) desde el servidor, con la llave service_role.
// Esa llave se salta las reglas de seguridad: vive SOLO como secret de Cloudflare (SUPABASE_SERVICE_ROLE_KEY)
// y nunca se manda al navegador ni se escribe en el repositorio.

export const hasDb = (env) => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

export async function db(env, path, { method = "GET", body, prefer } = {}) {
  if (!hasDb(env)) throw new Error("La base de datos no está configurada.");
  const res = await fetch(`${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && typeof data === "object" && (data.message || data.error)) || text || res.statusText;
    const err = new Error(`Supabase ${res.status} ${path.split("?")[0]}: ${detail}`);
    err.status = res.status;
    err.code = data && typeof data === "object" ? data.code : undefined;
    throw err;
  }
  return data;
}

export const rpc = (env, fn, args) => db(env, `rpc/${fn}`, { method: "POST", body: args });

// Mensaje claro para el panel cuando falta correr el SQL.
export const dbHelp = (e) =>
  e && (e.code === "PGRST205" || e.code === "PGRST202" || /schema cache|does not exist|Could not find/i.test(e.message || ""))
    ? "Falta correr supabase/orders.sql en Supabase (SQL Editor)."
    : null;
