import { PublicShowList } from "@/components/public/PublicShowList";
import { Brand } from "@/components/ui/Brand";
import { ShowIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/Button";
import { LeadIcon } from "@/components/ui/icons";
import { jsonLdScript, toMusicEventJsonLd } from "@/lib/public-agenda";
import { getPublicBand } from "@/lib/public-band";
import { getPublicAgenda } from "@/lib/public-agenda-query";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const agenda = await getPublicAgenda((await params).slug.toLowerCase());
  if (!agenda) return { title: "Agenda não encontrada", robots: { index: false } };
  const description = `Próximos shows de ${agenda.band.name}: datas, cidades e ingressos.`;
  return {
    title: `${agenda.band.name} — Agenda de shows`,
    description,
    openGraph: { title: `${agenda.band.name} — Agenda de shows`, description, type: "website" },
  };
}

/** Página pública da agenda da banda (opt-in em Integrações). Link para bio do Instagram etc. */
export default async function PublicAgendaPage({ params }: PageProps) {
  const slug = (await params).slug.toLowerCase();
  const [agenda, publicBand] = await Promise.all([getPublicAgenda(slug), getPublicBand(slug)]);
  if (!agenda) notFound();

  const baseUrl = await getPublicBaseUrl();
  const band = { name: agenda.band.name, url: `${baseUrl}/b/${agenda.band.slug}` };
  const jsonLd = agenda.shows.map((show) => toMusicEventJsonLd(show, band));

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:py-16">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-fg-subtle">
          <ShowIcon className="size-4" aria-hidden />
          Agenda de shows
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{agenda.band.name}</h1>
        <p className="mt-2 text-fg-muted">Próximas apresentações. Horários no fuso local de cada cidade.</p>
        {publicBand?.leadFormEnabled ? (
          <ButtonLink href={`/b/${agenda.band.slug}/contato`} icon={LeadIcon} className="mt-6">
            Pedir orçamento
          </ButtonLink>
        ) : null}

        <section aria-label="Próximos shows" className="mt-8">
          <PublicShowList shows={agenda.shows} />
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-fg-subtle">
          <span>Agenda publicada com</span>
          <Brand href="/" />
        </div>
      </footer>

      {jsonLd.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      ) : null}
    </div>
  );
}
