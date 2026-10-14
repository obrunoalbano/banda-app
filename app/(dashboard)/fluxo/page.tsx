import type { DealStep } from "@/app/generated/prisma/enums";
import { DealBoard } from "@/components/deals/DealBoard";
import type { BoardDeal } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DealIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerWideClass, linkClass } from "@/components/ui/styles";
import { DEAL_COLUMN_LIMIT, DEAL_STEPS } from "@/lib/deals";
import { formatDateTimeShort, formatMonthYear, formatRelative } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Fluxo de contatos" };

const dealSelect = {
  id: true,
  step: true,
  source: true,
  name: true,
  city: true,
  state: true,
  venueId: true,
  notes: true,
  stepChangedAt: true,
  createdAt: true,
  lead: {
    select: {
      id: true,
      email: true,
      whatsapp: true,
      city: true,
      eventDate: true,
      eventType: true,
      eventDescription: true,
      createdAt: true,
    },
  },
  // Só canais institucionais do palco (mesmos do Explorar).
  stage: {
    select: {
      type: true,
      neighborhood: true,
      city: true,
      state: true,
      whatsapp: true,
      publicPhone: true,
      publicEmail: true,
      instagram: true,
      website: true,
      imageThumbUrl: true,
      verifiedAt: true,
      lastActivityAt: true,
      notes: true,
      genres: true,
      capacity: true,
    },
  },
} as const;

export default async function FluxoPage() {
  const bandId = await requireBandId();

  const [counts, ...columns] = await Promise.all([
    prisma.deal.groupBy({ by: ["step"], where: { bandId }, _count: { _all: true } }),
    ...DEAL_STEPS.map((step) =>
      prisma.deal.findMany({
        where: { bandId, step },
        select: dealSelect,
        orderBy: { stepChangedAt: "desc" },
        take: DEAL_COLUMN_LIMIT,
      }),
    ),
  ]);
  const countByStep = Object.fromEntries(DEAL_STEPS.map((step) => [step, 0])) as Record<DealStep, number>;
  for (const c of counts) countByStep[c.step] = c._count._all;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);
  const now = new Date();
  // Datas viram texto aqui (o quadro é client: evita divergência de hidratação).
  const deals: BoardDeal[] = columns.flat().map(({ stepChangedAt, createdAt, lead, stage, ...deal }) => ({
    ...deal,
    sinceLabel: formatRelative(stepChangedAt, now),
    createdLabel: formatDateTimeShort(createdAt),
    lead: lead && (({ createdAt: received, ...rest }) => ({ ...rest, receivedLabel: formatDateTimeShort(received) }))(lead),
    stage:
      stage &&
      (({ verifiedAt, lastActivityAt, ...rest }) => ({
        ...rest,
        verified: verifiedAt !== null,
        lastActivityLabel: lastActivityAt ? formatMonthYear(lastActivityAt) : null,
      }))(stage),
  }));

  return (
    <div className={containerWideClass}>
      <PageHeader
        title="Fluxo de contatos"
        description={
          <>
            Acompanhe cada negociação do primeiro contato até o resultado. Inclua pelos{" "}
            <Link href="/contatos" className={linkClass}>
              Contatos
            </Link>{" "}
            ou pelo{" "}
            <Link href="/explorar" className={linkClass}>
              Explorar Palcos
            </Link>
            .
          </>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={DealIcon}
          title="Nenhuma negociação no fluxo"
          description="Use “Adicionar ao fluxo” em um contato recebido ou em um palco do Explorar Palcos."
          action={{ href: "/explorar", label: "Explorar Palcos", primary: true }}
        />
      ) : (
        <DealBoard initialDeals={deals} initialCounts={countByStep} />
      )}
    </div>
  );
}
