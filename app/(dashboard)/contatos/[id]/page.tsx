import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EditIcon, EmailIcon, WhatsappIcon } from "@/components/ui/icons";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { containerClass } from "@/components/ui/styles";
import { formatDateTimeFull, whatsappHref } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contato" };
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
            <ButtonLink href={`/contatos/${lead.id}/editar`} icon={EditIcon}>
              Alterar
            </ButtonLink>
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
          <ExternalLink href={`mailto:${lead.email}`} icon={EmailIcon}>
            {lead.email}
          </ExternalLink>
        </DetailItem>
        <DetailItem label="WhatsApp">
          {lead.whatsapp ? (
            wa ? (
              <ExternalLink href={wa} icon={WhatsappIcon}>
                {lead.whatsapp}
              </ExternalLink>
            ) : (
              lead.whatsapp
            )
          ) : null}
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
            <CodeBlock>{metadataStr}</CodeBlock>
          </DetailItem>
        ) : null}
      </DetailList>
    </div>
  );
}
