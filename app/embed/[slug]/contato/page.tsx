import { EmbedAutoResize } from "@/components/public/EmbedAutoResize";
import { PublicLeadForm } from "@/components/public/PublicLeadForm";
import { issueFormToken } from "@/lib/lead-form-token";
import { getPublicBand } from "@/lib/public-band";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Pedir orçamento",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tema?: string; fundo?: string }>;
};

const THEMES: Record<string, "light" | "dark" | undefined> = { claro: "light", escuro: "dark", auto: undefined };

/**
 * Widget do formulário de contato para iframe (Wix, WordPress…).
 * Parâmetros: ?tema=claro|escuro|auto (padrão claro) · ?fundo=transparente.
 * Mesmo protocolo de auto-altura do widget de agenda (public/embed.js). Contrato: docs/integracoes.md.
 */
export default async function EmbedContactPage({ params, searchParams }: PageProps) {
  await connection();
  const { slug } = await params;
  const sp = await searchParams;
  const theme = sp.tema && sp.tema in THEMES ? THEMES[sp.tema] : "light";
  const band = await getPublicBand(slug);

  return (
    <div
      data-embed
      data-theme={theme}
      data-embed-transparent={sp.fundo === "transparente" || undefined}
      className="p-1"
    >
      {band?.leadFormEnabled ? (
        <PublicLeadForm slug={band.slug} formToken={issueFormToken(band.slug)} source="widget" compact />
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-fg-muted">
          Formulário indisponível no momento.
        </p>
      )}
      <EmbedAutoResize />
    </div>
  );
}
