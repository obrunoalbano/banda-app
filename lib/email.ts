/**
 * Envio de email transacional pela API HTTP da Resend (sem SDK).
 * Sem RESEND_API_KEY/EMAIL_FROM: em desenvolvimento o email vai para o console do servidor
 * (para testar o fluxo local); em produção registra erro e devolve `false`.
 */

export type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY/EMAIL_FROM não configurados — email não enviado:", email.subject);
      return false;
    }
    console.info(`[email:dev] Para: ${email.to}\nAssunto: ${email.subject}\n\n${email.text}\n`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[email] falha no envio:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] falha no envio:", error);
    return false;
  }
}
