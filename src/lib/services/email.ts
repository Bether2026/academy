import "server-only";

/**
 * Envío de emails transaccionales vía la API REST de Resend.
 * Sin RESEND_API_KEY / EMAIL_FROM no envía nada (solo lo registra): la app
 * funciona igual. Nunca lanza: un email fallido no debe romper una reserva.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email] sin configurar, se omite: "${params.subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) console.error(`[email] Resend respondió ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error("[email] error de red", err);
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plantilla de marca: fondo medianoche, tarjeta blanca y botón dorado. Textos ya escapados. */
export function emailLayout(params: { paragraphs: string[]; cta?: { label: string; url: string }; footer: string }) {
  const body = params.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1e293b">${p}</p>`)
    .join("");
  const cta = params.cta
    ? `<p style="margin:22px 0 4px"><a href="${escapeHtml(params.cta.url)}" style="display:inline-block;background:#f59e0b;color:#0b1a38;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px">${escapeHtml(params.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#0b1a38;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1a38;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 18px;font-family:Georgia,serif;letter-spacing:3px;color:#ffffff;font-size:15px">LEARNING <span style="color:#7dd3fc">TO FLY</span> <span style="color:#94a3b8;font-size:11px;letter-spacing:4px">ACADEMY</span></td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:28px 26px">${body}${cta}</td></tr>
<tr><td style="padding:16px 4px;color:#94a3b8;font-size:12px">${escapeHtml(params.footer)}</td></tr>
</table></td></tr></table></body></html>`;
}
