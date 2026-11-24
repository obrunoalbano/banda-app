import { NextResponse } from "next/server";
import { parseBody, withBand } from "@/lib/api";
import { generateBandLinkNonce } from "@/lib/band-link";
import { prisma } from "@/lib/prisma";
import { bandInviteLinkSchema } from "@/lib/validations";

/**
 * Link de convite da banda (grupo) — só administrador.
 * `enabled: false` desativa (o link para de funcionar); `regenerate` (ou ativar um link desligado)
 * cria um novo nonce e invalida o anterior; `role` muda o acesso de quem entrar daqui em diante.
 */
export const PATCH = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, bandInviteLinkSchema);
  if (!parsed.ok) return parsed.response;
  const { enabled, role, regenerate } = parsed.data;

  const band = await prisma.band.findUnique({ where: { id: bandId }, select: { inviteLinkNonce: true } });
  const nonce = !enabled ? null : regenerate || !band?.inviteLinkNonce ? generateBandLinkNonce() : band.inviteLinkNonce;
  await prisma.band.update({
    where: { id: bandId },
    data: { inviteLinkNonce: nonce, ...(role ? { inviteLinkRole: role } : {}) },
  });
  return NextResponse.json({ enabled: !!nonce });
});
