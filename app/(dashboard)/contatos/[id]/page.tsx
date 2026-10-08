import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonPrimaryClass, containerClass } from "@/components/ui/styles";
import { formatDateTimeFull, whatsappHref } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function ContatoDetalhePage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const lead = await prisma.lead.findFirst({ where: { id, bandId } });
  if (!lead) notFound();

  const wa = whatsappHref(lead.whatsapp);
  const metadataStr = lead.metadata == null ? null : JSON.stringify(lead.metadata, null, 2);

  return (
    <div className={containerClass}>
      <PageHeader
        title={lead.name}
        description={`Recebido em ${formatDateTimeFull(lead.createdAt)}`}
        back={{ href: "/contatos", label: "Voltar aos contatos" }}
        actions={
          <>
            <Link href={`/contatos/${lead.id}/editar`} className={buttonPrimaryClass}>
              Alterar
            </Link>
            <ConfirmDeleteButton
              endpoint={`/api/leads/${lead.id}`}
              redirectTo="/contatos"
              itemLabel={`o contato "${lead.name}"`}
            />
          </>
        }
      />

      <DetailList className="max-w-3xl">
        <DetailItem label="Email" wide>
          <ExternalLink href={`mailto:${lead.email}`}>{lead.email}</ExternalLink>
        </DetailItem>
        <DetailItem label="WhatsApp">
          {lead.whatsapp ? (wa ? <ExternalLink href={wa}>{lead.whatsapp}</ExternalLink> : lead.whatsapp) : null}
        </DetailItem>
        <DetailItem label="Origem">{lead.source}</DetailItem>
        <DetailItem label="Data do evento">{lead.eventDate}</DetailItem>
        <DetailItem label="Cidade">{lead.city}</DetailItem>
        <DetailItem label="Tipo de evento">{lead.eventType}</DetailItem>
        <DetailItem label="Descrição do evento" wide preserveLines>
          {lead.eventDescription}
        </DetailItem>
        {metadataStr ? (
          <DetailItem label="Metadados" wide>
            <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {metadataStr}
            </pre>
          </DetailItem>
        ) : null}
      </DetailList>
    </div>
  );
}
