import { NextResponse } from "next/server";
import { jsonError, withBand } from "@/lib/api";
import { LOGO_LIMITS, pngDimensions, validateLogoPng } from "@/lib/band-logo";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * Envia (POST, corpo = PNG já reduzido no navegador, `Content-Type: image/png`) ou remove (DELETE)
 * a logo da banda. Só administrador. O servidor não processa a imagem: confere assinatura PNG,
 * dimensões e tamanho (lib/band-logo.ts).
 */
export const POST = withBand(async (request, { bandId }) => {
  const limited = rateLimit(`band-logo:${bandId}`, RATE_LIMITS.bandLogo);
  if (!limited.ok) return jsonError(429, "Muitos envios seguidos. Tente de novo mais tarde.");

  if (request.headers.get("content-type")?.split(";")[0].trim() !== "image/png") {
    return jsonError(415, "Formato inválido. Envie a imagem de novo.");
  }
  // Recusa antes de ler o corpo quando o tamanho declarado já passa do limite.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > LOGO_LIMITS.maxStoredBytes) return jsonError(413, "Imagem muito grande. Use um arquivo menor.");

  const bytes = new Uint8Array(await request.arrayBuffer());
  const invalid = validateLogoPng(bytes);
  if (invalid) return jsonError(400, invalid);
  const { width, height } = pngDimensions(bytes)!;

  const logo = await prisma.bandLogo.upsert({
    where: { bandId },
    create: { bandId, data: bytes, width, height },
    update: { data: bytes, width, height },
    select: { updatedAt: true },
  });
  return NextResponse.json({ updatedAt: logo.updatedAt.toISOString(), width, height });
});

export const DELETE = withBand(async (_request, { bandId }) => {
  await prisma.bandLogo.deleteMany({ where: { bandId } });
  return NextResponse.json({ ok: true });
});
