import { PublicLeadForm } from "@/components/public/PublicLeadForm";
import { Brand } from "@/components/ui/Brand";
import { BackIcon, LeadIcon } from "@/components/ui/icons";
import { subtleLinkClass } from "@/components/ui/styles";
import { issueFormToken } from "@/lib/lead-form-token";
import { getPublicBand } from "@/lib/public-band";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const band = await getPublicBand((await params).slug);
  if (!band?.leadFormEnabled) return { title: "Formulário não encontrado", robots: { index: false } };
  return {
    title: `${band.name} — Pedir orçamento`,
    description: `Peça um orçamento para ${band.name}: conte sobre o seu evento.`,
  };
}

/** Formulário público de pedido de orçamento (opt-in em Integrações → Contatos). */
export default async function PublicContactPage({ params }: PageProps) {
  // Token anti-spam é emitido por request: a página nunca pode ser pré-renderizada/cacheada.
  await connection();
  const band = await getPublicBand((await params).slug);
  if (!band?.leadFormEnabled) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:py-16">
        {band.publicAgendaEnabled ? (
          <Link href={`/b/${band.slug}`} className={`mb-6 inline-flex items-center gap-1 ${subtleLinkClass}`}>
            <BackIcon className="size-4" aria-hidden />
            Agenda de shows
          </Link>
        ) : null}
        <p className="inline-flex items-center gap-2 text-sm font-medium text-fg-subtle">
          <LeadIcon className="size-4" aria-hidden />
          Pedir orçamento
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{band.name}</h1>
        <p className="mt-2 text-fg-muted">Conte sobre o seu evento e a banda entra em contato.</p>

        <div className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-6">
          <PublicLeadForm slug={band.slug} formToken={issueFormToken(band.slug)} source="formulario-publico" />
        </div>
      </main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-fg-subtle">
          <span>Formulário publicado com</span>
          <Brand href="/" />
        </div>
      </footer>
    </div>
  );
}
