import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonPrimaryClass, containerClass, linkClass } from "@/components/ui/styles";
import { formatDateOnly } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import Link from "next/link";
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
            <Link href={`/shows/${show.id}/editar`} className={buttonPrimaryClass}>
              Alterar
            </Link>
            <ConfirmDeleteButton
              endpoint={`/api/shows/${show.id}`}
              redirectTo="/shows"
              itemLabel={`o show "${title} - ${date}"`}
            />
          </>
        }
      />

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
        <DetailItem label="Cachê">
          {show.cacheCents != null ? formatCents(show.cacheCents) : null}
        </DetailItem>
        {show.privateEventDetails && (
          <DetailItem label="Detalhes do evento particular" wide preserveLines>
            {show.privateEventDetails}
          </DetailItem>
        )}
        <DetailItem label="Data">{date}</DetailItem>
        <DetailItem label="Horário">{show.time}</DetailItem>
        <DetailItem label="Status de pagamento" wide>
          <ShowPaymentBadge status={show.paymentStatus} />
        </DetailItem>
      </DetailList>
    </div>
  );
}
