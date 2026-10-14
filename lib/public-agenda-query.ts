import { prisma } from "@/lib/prisma";
import {
  PUBLIC_SHOWS_DEFAULT_LIMIT,
  publicShowSelect,
  toPublicShow,
  type PublicShow,
} from "@/lib/public-agenda";
import { todayDateOnly } from "@/lib/shows";
import { cache } from "react";

export type PublicAgenda = {
  band: { name: string; slug: string };
  shows: PublicShow[];
};

/**
 * Agenda pública da banda: só se o opt-in estiver ligado; só shows marcados como públicos,
 * de hoje em diante (fuso de São Paulo), em ordem cronológica.
 * `null` = banda inexistente OU agenda desligada (mesma resposta, não revela existência).
 * `cache` deduplica a chamada entre generateMetadata e a página no mesmo request.
 */
export const getPublicAgenda = cache(async function getPublicAgenda(
  slug: string,
  limit: number = PUBLIC_SHOWS_DEFAULT_LIMIT,
): Promise<PublicAgenda | null> {
  const band = await prisma.band.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, publicAgendaEnabled: true },
  });
  if (!band?.publicAgendaEnabled) return null;

  const shows = await prisma.show.findMany({
    where: { bandId: band.id, isPublic: true, date: { gte: todayDateOnly() } },
    select: publicShowSelect,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: limit,
  });

  return { band: { name: band.name, slug: band.slug }, shows: shows.map(toPublicShow) };
});
