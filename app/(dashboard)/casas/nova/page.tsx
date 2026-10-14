import { VenueForm } from "@/components/VenueForm";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass, linkClass } from "@/components/ui/styles";
import {
  canAddToVenues,
  venuePrefillFromLead,
  venuePrefillFromSnapshot,
  venuePrefillFromStage,
  type VenuePrefill,
} from "@/lib/deals";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Nova casa de show" };

type PageProps = { searchParams: Promise<{ negociacao?: string }> };

/** `?negociacao=<id>`: "Adicionar às minhas casas" de uma negociação ganha (form pré-preenchido). */
async function loadDeal(bandId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, bandId },
    select: {
      id: true,
      step: true,
      venueId: true,
      name: true,
      city: true,
      state: true,
      lead: { select: { name: true, email: true, whatsapp: true, city: true } },
      stage: {
        select: {
          name: true,
          city: true,
          state: true,
          instagram: true,
          whatsapp: true,
          publicPhone: true,
          publicEmail: true,
        },
      },
    },
  });
  if (!deal) return null;
  const prefill: VenuePrefill = deal.stage
    ? venuePrefillFromStage(deal.stage)
    : deal.lead
      ? venuePrefillFromLead(deal.lead)
      : venuePrefillFromSnapshot(deal);
  return { ...deal, prefill };
}

export default async function NovaCasaPage({ searchParams }: PageProps) {
  const dealId = (await searchParams).negociacao;
  const bandId = dealId ? await requireBandId() : null;
  const deal = bandId && dealId ? await loadDeal(bandId, dealId) : null;
  const usable = deal && canAddToVenues(deal);

  return (
    <div className={containerClass}>
      <PageHeader
        title="Nova casa de show"
        description={usable ? `A partir da negociação ganha com “${deal.name}”. Confira e complete os dados.` : undefined}
        back={dealId ? { href: "/fluxo", label: "Voltar ao fluxo" } : { href: "/casas", label: "Voltar à listagem" }}
      />
      {dealId && !usable ? (
        <div className="mb-6 max-w-xl">
          <Alert tone="warning">
            {deal?.venueId ? (
              <>
                Esta negociação já virou casa.{" "}
                <Link href={`/casas/${deal.venueId}`} className={linkClass}>
                  Ver a casa
                </Link>
              </>
            ) : deal ? (
              "Só negociações na etapa Ganhou podem virar casa. O cadastro abaixo é de uma casa avulsa."
            ) : (
              "Negociação não encontrada. O cadastro abaixo é de uma casa avulsa."
            )}
          </Alert>
        </div>
      ) : null}
      <VenueForm mode="create" fromDeal={usable ? { id: deal.id, prefill: deal.prefill } : undefined} />
    </div>
  );
}
