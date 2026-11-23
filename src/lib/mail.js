// Correo transaccional con Resend (https://resend.com).
// Secrets/variables en Cloudflare:
//   RESEND_API_KEY  (secret)  llave de Resend
//   MAIL_FROM       (var)     remitente, p. ej. "VITRO <pedidos@vitroscrubs.com>". Mientras el dominio no esté
//                             verificado en Resend se usa "onboarding@resend.dev", que SOLO puede escribirle al
//                             correo con el que abriste tu cuenta de Resend.
//   NOTIFY_EMAIL    (var)     a dónde te llega el aviso de cada pedido pagado
//   MAIL_REPLY_TO   (var, opcional) a dónde llegan las respuestas de los clientes

export const SANDBOX_FROM = "VITRO <onboarding@resend.dev>";

export const fromOf = (env) => env.MAIL_FROM || SANDBOX_FROM;

// Con el remitente de prueba no se puede escribir a clientes (Resend lo rechaza).
export const canEmailCustomers = (env) => Boolean(env.RESEND_API_KEY) && !/@resend\.dev/i.test(fromOf(env));

export async function sendMail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) return { ok: false, skipped: true, error: "Falta RESEND_API_KEY." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "vitro-worker/1.0" },
      body: JSON.stringify({
        from: fromOf(env), to: [to], subject, html, text,
        ...(env.MAIL_REPLY_TO ? { reply_to: env.MAIL_REPLY_TO } : {})
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data && data.message) || `Resend respondió ${res.status}.` };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "No se pudo conectar con Resend." };
  }
}

export async function sendToCustomer(env, to, mail) {
  if (!to) return { ok: false, skipped: true, error: "El pedido no tiene correo." };
  if (!canEmailCustomers(env)) {
    return { ok: false, skipped: true, error: "Falta verificar tu dominio en Resend para poder escribirle a clientes." };
  }
  return sendMail(env, { to, ...mail });
}
