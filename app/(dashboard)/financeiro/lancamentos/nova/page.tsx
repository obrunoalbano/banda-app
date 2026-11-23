import { FinanceEntryForm } from "@/components/FinanceEntryForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { showOptions } from "@/lib/finance-query";
import { prisma } from "@/lib/prisma";
import { requireBandEditor } from "@/lib/session";
import { toDateOnlyString, todayDateOnly } from "@/lib/shows";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo lançamento" };

type PageProps = { searchParams: Promise<{ showId?: string; tipo?: string }> };

export default async function NovoLancamentoPage({ searchParams }: PageProps) {
  const { bandId } = await requireBandEditor("/financeiro/lancamentos");
  const sp = await searchParams;
  const [shows, show] = await Promise.all([
    showOptions(bandId),
    sp.showId
      ? prisma.show.findFirst({
          where: { id: sp.showId, bandId },
          select: { id: true, date: true },
        })
      : null,
  ]);
  const returnTo = show ? `/shows/${show.id}` : "/financeiro/lancamentos";

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Financeiro"
        title="Novo lançamento"
        back={{
          href: returnTo,
          label: show ? "Voltar ao show" : "Voltar aos lançamentos",
        }}
      />
      <FinanceEntryForm
        mode="create"
        shows={shows}
        returnTo={returnTo}
        defaults={{
          type: sp.tipo === "RECEITA" ? "RECEITA" : "DESPESA",
          showId: show?.id,
          date: toDateOnlyString(show?.date ?? todayDateOnly()),
        }}
      />
    </div>
  );
}
