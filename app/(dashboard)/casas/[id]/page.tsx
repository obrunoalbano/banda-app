import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EditIcon, EmailIcon, WhatsappIcon } from "@/components/ui/icons";
import { containerClass, linkClass } from "@/components/ui/styles";
import { DEAL_SOURCE_LABELS } from "@/lib/deals";
import { instagramHref, whatsappHref } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Casa de show" };
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function CasaDetalhePage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const venue = await prisma.venue.findFirst({
    where: { id, bandId },
    include: {
      _count: { select: { shows: true } },
      deals: { where: { bandId }, select: { id: true, source: true }, take: 1 },
    },
  });
  if (!venue) notFound();

  const showCount = venue._count.shows;
  const originDeal = venue.deals[0];
  const wa = whatsappHref(venue.phone);
  const ig = instagramHref(venue.instagram);

  return (
    <div className={containerClass}>
      <PageHeader
        title={venue.name}
        back={{ href: "/casas", label: "Voltar à listagem" }}
        actions={
          <>
            <ButtonLink href={`/casas/${venue.id}/editar`} icon={EditIcon}>
              Alterar
            </ButtonLink>
            <ConfirmDeleteButton
              endpoint={`/api/venues/${venue.id}`}
              redirectTo="/casas"
              itemLabel={`a casa "${venue.name}"`}
              disabledReason={
                showCount > 0
                  ? `Esta casa tem ${showCount} show(s) vinculado(s). Remova ou altere esses shows antes.`
                  : undefined
              }
            />
          </>
        }
      >
        <StatusBadge status={venue.sendStatus} />
      </PageHeader>

      <DetailList>
        <DetailItem label="Responsável">{venue.responsible}</DetailItem>
        <DetailItem label="Telefone">
          {wa ? (
            <ExternalLink href={wa} icon={WhatsappIcon}>
              {venue.phone}
            </ExternalLink>
          ) : (
            venue.phone
          )}
        </DetailItem>
        <DetailItem label="Email" wide>
          {venue.email ? (
            <ExternalLink href={`mailto:${venue.email}`} icon={EmailIcon}>
              {venue.email}
            </ExternalLink>
          ) : null}
        </DetailItem>
        <DetailItem label="Cidade">{venue.city}</DetailItem>
        <DetailItem label="Estado">{venue.state}</DetailItem>
        <DetailItem label="Instagram" wide>
          {venue.instagram ? (
            ig ? (
              <ExternalLink href={ig}>
                {venue.instagram}
              </ExternalLink>
            ) : (
              venue.instagram
            )
          ) : null}
        </DetailItem>
        <DetailItem label="Cachê de referência" numeric>
          {venue.valorCacheCents != null ? formatCents(venue.valorCacheCents) : null}
        </DetailItem>
        <DetailItem label="Shows">
          {showCount > 0 ? (
            <Link href={`/shows?casaId=${venue.id}`} className={linkClass}>
              {showCount} show(s)
            </Link>
          ) : (
            <span className="text-fg-subtle">Nenhum</span>
          )}
        </DetailItem>
        {originDeal ? (
          <DetailItem label="Origem">
            <Link href={`/fluxo#negociacao-${originDeal.id}`} className={linkClass}>
              Fluxo de contatos
            </Link>{" "}
            ({DEAL_SOURCE_LABELS[originDeal.source]})
          </DetailItem>
        ) : venue.stageId ? (
          <DetailItem label="Origem">Explorar Palcos</DetailItem>
        ) : null}
      </DetailList>
    </div>
  );
}
