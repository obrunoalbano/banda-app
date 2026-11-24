/**
 * Envio de email transacional pela API HTTP da Resend (sem SDK).
 * Sem RESEND_API_KEY/EMAIL_FROM: em desenvolvimento o email vai para o console do servidor
 * (para testar o fluxo local); em produção registra erro e devolve a falha.
 */

export type Email = { to: string; subject: string; text: string; html: string };

/** `reason` é curto e sem segredos: pode ser mostrado ao administrador da banda para diagnóstico. */
export type EmailResult = { ok: true } | { ok: false; reason: string };

/** Mensagem da Resend (`{ message }`/`{ error }`) resumida, sem ecoar o corpo inteiro. */
export function resendFailureReason(status: number, body: string): string {
  let message = "";
  try {
    const data = JSON.parse(body) as { message?: unknown; error?: unknown; name?: unknown };
    message = [data.message, data.error, data.name].find((v): v is string => typeof v === "string") ?? "";
  } catch {
    message = body;
  }
  message = message.replace(/\s+/g, " ").trim().slice(0, 200);
  return message ? `Resend ${status}: ${message}` : `Resend ${status}`;
}

export async function sendEmailResult(email: Email): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    const missing = [!apiKey && "RESEND_API_KEY", !from && "EMAIL_FROM"].filter(Boolean).join(" e ");
    if (process.env.NODE_ENV === "production") {
      console.error(`[email] ${missing} ausente(s) — email não enviado:`, email.subject);
      return { ok: false, reason: `Envio de email não configurado (${missing}).` };
    }
    console.info(`[email:dev] Para: ${email.to}\nAssunto: ${email.subject}\n\n${email.text}\n`);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const reason = resendFailureReason(res.status, await res.text().catch(() => ""));
      console.error("[email] falha no envio:", reason);
      return { ok: false, reason };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email] falha no envio:", error);
    return { ok: false, reason: "Sem resposta do serviço de email." };
  }
}

export async function sendEmail(email: Email): Promise<boolean> {
  return (await sendEmailResult(email)).ok;
}
