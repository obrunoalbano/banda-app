import { AccountStatus } from "@/components/admin/AccountStatus";
import { AccountActions } from "@/components/admin/AccountActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Banda" };

type PageProps = { params: Promise<{ id: string }> };

/** Visão da conta para a equipe: dados cadastrais, uso e ações de conta (sem dados de negócio da banda). */
export default async function AdminBandaDetalhePage({ params }: PageProps) {
  await requireAdminId();
  const { id } = await params;
  const band = await prisma.band.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      responsible: true,
      phone: true,
      email: true,
      slug: true,
      createdAt: true,
      disabledAt: true,
      mustChangePassword: true,
      publicAgendaEnabled: true,
      leadFormEnabled: true,
      _count: { select: { venues: true, shows: true, leads: true } },
    },
  });
  if (!band) notFound();

  return (
    <div className={containerClass}>
      <PageHeader
        title={band.name}
        description={`Conta criada em ${formatDateTimeShort(band.createdAt)}`}
        back={{ href: "/admin/usuarios/bandas", label: "Voltar às bandas" }}
      >
        <AccountStatus disabled={!!band.disabledAt} provisional={band.mustChangePassword} />
      </PageHeader>

      <div className="flex flex-col gap-8">
        <Card title="Conta">
          <AccountActions
            kind="band"
            id={band.id}
            name={band.name}
            email={band.email}
            disabled={!!band.disabledAt}
          />
        </Card>

        <DetailList>
          <DetailItem label="Responsável">{band.responsible}</DetailItem>
          <DetailItem label="Telefone">{band.phone}</DetailItem>
          <DetailItem label="Email de acesso" wide>
            {band.email}
          </DetailItem>
          <DetailItem label="Endereço público" wide>
            {band.publicAgendaEnabled ? (
              <ExternalLink href={`/b/${band.slug}`}>/b/{band.slug}</ExternalLink>
            ) : (
              `/b/${band.slug}`
            )}
          </DetailItem>
          <DetailItem label="Integrações">
            <span className="flex flex-wrap gap-2">
              {band.publicAgendaEnabled ? <Badge tone="success">Agenda pública</Badge> : <Badge>Agenda desligada</Badge>}
              {band.leadFormEnabled ? <Badge tone="success">Formulário</Badge> : <Badge>Formulário desligado</Badge>}
            </span>
          </DetailItem>
          <DetailItem label="Uso" numeric>
            {band._count.venues} casas · {band._count.shows} shows · {band._count.leads} contatos
          </DetailItem>
        </DetailList>
      </div>
    </div>
  );
}
