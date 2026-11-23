import { FinanceEntryStatusBadge } from "@/components/FinanceEntryStatusBadge";
import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { Card } from "@/components/ui/Card";
import { Table, Td, Tr } from "@/components/ui/Table";
import { entryStatus, isShowOverdue, showDueDate, showResultCents } from "@/lib/finance";
import { FINANCE_CATEGORY_LABELS, FINANCE_TYPE_LABELS } from "@/lib/finance-categories";
import { entryMoneySelect } from "@/lib/finance-query";
import { todayDateOnly } from "@/lib/shows";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { AddIcon, EditIcon } from "@/components/ui/icons";
import { containerClass, linkClass } from "@/components/ui/styles";
import { formatDateOnly } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Show" };
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function ShowDetalhePage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const show = await prisma.show.findFirst({
    where: { id, bandId },
    include: {
      venue: { select: { id: true, name: true, city: true, state: true } },
      financeEntries: { select: entryMoneySelect, orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!show) notFound();

  const today = todayDateOnly();
  const overdue = isShowOverdue(show, today);
  const entries = show.financeEntries;

  const title = show.venue?.name ?? "Evento Particular";
  const date = formatDateOnly(show.date);

  return (
    <div className={containerClass}>
      <PageHeader
        title={title}
        description={`${date} às ${show.time}`}
        back={{ href: "/shows", label: "Voltar à listagem" }}
        actions={
          <>
            <ButtonLink href={`/shows/${show.id}/editar`} icon={EditIcon}>
              Alterar
            </ButtonLink>
            <ConfirmDeleteButton
              endpoint={`/api/shows/${show.id}`}
              redirectTo="/shows"
              itemLabel={`o show "${title} - ${date}"`}
            />
          </>
        }
      >
        {show.cancelledAt ? <Badge tone="danger">Cancelado</Badge> : null}
      </PageHeader>

      <DetailList>
        <DetailItem label="Casa de show" wide>
          {show.venue ? (
            <Link href={`/casas/${show.venue.id}`} className={linkClass}>
              {show.venue.name}
            </Link>
          ) : (
            "Evento Particular"
          )}
        </DetailItem>
        <DetailItem label="Cidade">{show.venue?.city ?? show.privateCity}</DetailItem>
        <DetailItem label="Estado">{show.venue?.state ?? show.privateState}</DetailItem>
        <DetailItem label="Cachê" numeric>
          {show.cacheCents != null ? formatCents(show.cacheCents) : null}
        </DetailItem>
        {show.privateEventDetails && (
          <DetailItem label="Detalhes do evento particular" wide preserveLines>
            {show.privateEventDetails}
          </DetailItem>
        )}
        <DetailItem label="Data" numeric>
          {date}
        </DetailItem>
        <DetailItem label="Horário" numeric>
          {show.time}
        </DetailItem>
        <DetailItem label="Status de pagamento">
          <ShowPaymentBadge status={show.paymentStatus} overdue={overdue} />
        </DetailItem>
        {show.paymentStatus === "PAGO" ? (
          <DetailItem label="Recebido em" numeric>
            {show.paidAt ? formatDateOnly(show.paidAt) : null}
          </DetailItem>
        ) : (
          <DetailItem label="Vencimento do cachê" numeric>
            {formatDateOnly(showDueDate(show))}
            {show.paymentDueDate ? null : <span className="text-fg-subtle"> (data do show)</span>}
          </DetailItem>
        )}
        <DetailItem label="Agenda pública">
          {show.isPublic ? <Badge tone="info">Visível</Badge> : <Badge>Oculto</Badge>}
        </DetailItem>
        <DetailItem label="Ingressos">
          {show.ticketUrl ? (
            <ExternalLink href={show.ticketUrl}>
              {show.ticketUrl.replace(/^https?:\/\//, "")}
            </ExternalLink>
          ) : null}
        </DetailItem>
      </DetailList>

      <Card
        title="Financeiro do show"
        description="Despesas e receitas extras deste show. O resultado entra na visão geral do Financeiro."
        className="mt-8"
        actions={
          <>
            <ButtonLink
              href={`/financeiro/lancamentos/nova?showId=${show.id}&tipo=RECEITA`}
              variant="secondary"
              size="sm"
              icon={AddIcon}
            >
              Receita
            </ButtonLink>
            <ButtonLink
              href={`/financeiro/lancamentos/nova?showId=${show.id}&tipo=DESPESA`}
              variant="secondary"
              size="sm"
              icon={AddIcon}
            >
              Despesa
            </ButtonLink>
          </>
        }
      >
        {entries.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Nenhuma despesa lançada. Adicione transporte, som, freelancer… para ver quanto o show rendeu de verdade.
          </p>
        ) : (
          <Table
            caption="Lançamentos do show"
            headers={[{ label: "Descrição" }, { label: "Categoria" }, { label: "Valor" }, { label: "Situação" }]}
          >
            {entries.map((e) => (
              <Tr key={e.id}>
                <Td label="Descrição" strong>
                  <Link href={`/financeiro/lancamentos/${e.id}/editar`} className="hover:underline">
                    {e.description}
                  </Link>
                </Td>
                <Td label="Categoria">
                  {FINANCE_TYPE_LABELS[e.type]} · {FINANCE_CATEGORY_LABELS[e.category]}
                </Td>
                <Td label="Valor" numeric>
                  <span className={`whitespace-nowrap ${e.type === "DESPESA" ? "text-danger-fg" : "text-success-fg"}`}>
                    {e.type === "DESPESA" ? "−" : "+"} {formatCents(e.amountCents)}
                  </span>
                </Td>
                <Td label="Situação">
                  <FinanceEntryStatusBadge status={entryStatus(e, today)} />
                </Td>
              </Tr>
            ))}
          </Table>
        )}
        <dl className="mt-4 flex flex-wrap items-baseline justify-end gap-x-6 gap-y-1 border-t border-line pt-4 text-sm">
          <div className="flex gap-2">
            <dt className="text-fg-muted">Cachê</dt>
            <dd className="tabular text-fg">{show.cancelledAt ? "— (cancelado)" : formatCents(show.cacheCents ?? 0)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-fg">Resultado</dt>
            <dd
              className={`tabular font-semibold ${showResultCents(show, entries) < 0 ? "text-danger-fg" : "text-fg"}`}
            >
              {formatCents(showResultCents(show, entries))}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
