import { FinanceEntryForm } from "@/components/FinanceEntryForm";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { showOptions } from "@/lib/finance-query";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { toDateOnlyString } from "@/lib/shows";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Alterar lançamento" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarLancamentoPage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const [entry, shows] = await Promise.all([
    prisma.financeEntry.findFirst({
      where: { id, bandId },
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        amountCents: true,
        date: true,
        paidAt: true,
        showId: true,
      },
    }),
    showOptions(bandId),
  ]);
  if (!entry) notFound();

  const returnTo = entry.showId ? `/shows/${entry.showId}` : "/financeiro/lancamentos";

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Financeiro"
        title="Alterar lançamento"
        back={{ href: returnTo, label: entry.showId ? "Voltar ao show" : "Voltar aos lançamentos" }}
        actions={
          <ConfirmDeleteButton
            endpoint={`/api/finance-entries/${entry.id}`}
            redirectTo={returnTo}
            itemLabel={`o lançamento "${entry.description}"`}
          />
        }
      />
      <FinanceEntryForm
        mode="edit"
        shows={shows}
        returnTo={returnTo}
        entry={{
          ...entry,
          date: toDateOnlyString(entry.date),
          paidAt: entry.paidAt ? toDateOnlyString(entry.paidAt) : null,
        }}
      />
    </div>
  );
}
