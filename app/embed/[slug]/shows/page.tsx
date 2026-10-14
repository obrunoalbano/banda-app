import { EmbedAutoResize } from "@/components/public/EmbedAutoResize";
import { PublicShowList } from "@/components/public/PublicShowList";
import { PUBLIC_SHOWS_DEFAULT_LIMIT, PUBLIC_SHOWS_MAX_LIMIT } from "@/lib/public-agenda";
import { getPublicAgenda } from "@/lib/public-agenda-query";
import { PRODUCT_NAME } from "@/components/ui/Brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda de shows",
  // Widget é conteúdo embutido: quem indexa é a página /b/<slug>.
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tema?: string; fundo?: string; limite?: string }>;
};

const THEMES: Record<string, "light" | "dark" | undefined> = { claro: "light", escuro: "dark", auto: undefined };

/**
 * Widget de agenda para embutir via iframe em sites externos (Wix, WordPress…).
 * Parâmetros: ?tema=claro|escuro|auto (padrão claro) · ?fundo=transparente · ?limite=1..100.
 * Contrato público: não remova parâmetros (docs/integracoes.md).
 */
export default async function EmbedShowsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const theme = sp.tema && sp.tema in THEMES ? THEMES[sp.tema] : "light";
  const rawLimit = Number.parseInt(sp.limite ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), PUBLIC_SHOWS_MAX_LIMIT)
    : PUBLIC_SHOWS_DEFAULT_LIMIT;

  const agenda = await getPublicAgenda(slug.toLowerCase(), limit);

  return (
    <div
      data-embed
      data-theme={theme}
      data-embed-transparent={sp.fundo === "transparente" || undefined}
      className="p-1"
    >
      {agenda ? (
        <>
          <PublicShowList shows={agenda.shows} compact />
          <p className="mt-2 text-right text-xs text-fg-subtle">
            <a
              href={`/b/${agenda.band.slug}`}
              target="_blank"
              rel="noopener"
              className="hover:text-fg hover:underline"
            >
              Agenda completa · {PRODUCT_NAME}
            </a>
          </p>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-fg-muted">
          Agenda indisponível no momento.
        </p>
      )}
      <EmbedAutoResize />
    </div>
  );
}
