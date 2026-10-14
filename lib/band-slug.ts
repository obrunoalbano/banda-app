import { prisma } from "@/lib/prisma";
import { baseSlugFor, slugCandidate } from "@/lib/slug";

/** Primeiro slug livre para o nome: base, base-2, base-3… (uma query). */
export async function findAvailableSlug(name: string): Promise<string> {
  const base = baseSlugFor(name);
  const taken = new Set(
    (
      await prisma.band.findMany({
        where: { slug: { startsWith: base.slice(0, 40) } },
        select: { slug: true },
      })
    ).map((b) => b.slug),
  );
  for (let attempt = 1; ; attempt++) {
    const candidate = slugCandidate(base, attempt);
    if (!taken.has(candidate)) return candidate;
  }
}
