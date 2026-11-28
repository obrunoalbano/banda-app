import { cache } from "react";
import { bandLogoUrl } from "@/lib/band-logo";
import { prisma } from "@/lib/prisma";

/** URL versionada da logo da banda (ou null). Só lê a data — os bytes ficam para /banda/logo. */
export const getBandLogoUrl = cache(async (bandId: string): Promise<string | null> => {
  const logo = await prisma.bandLogo.findUnique({ where: { bandId }, select: { updatedAt: true } });
  return bandLogoUrl(logo?.updatedAt);
});
