import { NextResponse } from "next/server";
import { jsonError, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/** Cria um contato de teste (aparece em Contatos com origem "teste"). */
export const POST = withBand(async (_request, { bandId }) => {
  const limited = rateLimit(`test-lead:${bandId}`, RATE_LIMITS.testLead);
  if (!limited.ok) {
    return jsonError(429, "Muitos testes seguidos. Aguarde alguns minutos.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }
  const lead = await prisma.lead.create({
    data: {
      bandId,
      name: "Contato de teste",
      email: "teste@exemplo.com",
      eventType: "Teste",
      eventDescription: "Enviado pelo botão \"Enviar lead de teste\" em Integrações. Pode remover.",
      source: "teste",
    },
    select: { id: true },
  });
  return NextResponse.json(lead, { status: 201 });
});
