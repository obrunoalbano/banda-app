import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type PublicBand = {
  name: string;
  slug: string;
  publicAgendaEnabled: boolean;
  leadFormEnabled: boolean;
};

/**
 * Dados públicos mínimos da banda (nome, slug e o que está ativo). `null` se o slug não existe.
 * Deduplicado por request (página + generateMetadata).
 */
export const getPublicBand = cache(async function getPublicBand(slug: string): Promise<PublicBand | null> {
  return prisma.band.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { name: true, slug: true, publicAgendaEnabled: true, leadFormEnabled: true },
  });
});
