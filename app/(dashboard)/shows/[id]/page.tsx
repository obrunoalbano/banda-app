import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EditIcon } from "@/components/ui/icons";
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
    include: { venue: { select: { id: true, name: true, city: true, state: true } } },
  });
  if (!show) notFound();

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
        <DetailItem label="Status de pagamento" wide>
          <ShowPaymentBadge status={show.paymentStatus} />
        </DetailItem>
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
    </div>
  );
}
