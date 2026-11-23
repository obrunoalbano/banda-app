import { AccountStatus } from "@/components/admin/AccountStatus";
import { AccountActions } from "@/components/admin/AccountActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { BAND_ROLE_SHORT, BAND_ROLE_TONES } from "@/lib/band-roles";
import { formatDateTimeShort } from "@/lib/format";
import { memberStatus } from "@/lib/members";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Banda" };

type PageProps = { params: Promise<{ id: string }> };

/** Visão da banda para a equipe: dados cadastrais, integrantes, uso e ativação (sem dados de negócio). */
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
      slug: true,
      createdAt: true,
      disabledAt: true,
      publicAgendaEnabled: true,
      leadFormEnabled: true,
      _count: { select: { venues: true, shows: true, leads: true } },
      members: {
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, role: true, userId: true, inviteExpiresAt: true },
      },
    },
  });
  if (!band) notFound();

  return (
    <div className={containerClass}>
      <PageHeader
        title={band.name}
        description={`Banda criada em ${formatDateTimeShort(band.createdAt)}`}
        back={{ href: "/admin/usuarios/bandas", label: "Voltar às bandas" }}
      >
        <AccountStatus disabled={!!band.disabledAt} provisional={false} />
      </PageHeader>

      <div className="flex flex-col gap-8">
        <Card title="Banda">
          <AccountActions kind="band" id={band.id} name={band.name} disabled={!!band.disabledAt} />
        </Card>

        <DetailList>
          <DetailItem label="Responsável">{band.responsible}</DetailItem>
          <DetailItem label="Telefone">{band.phone}</DetailItem>
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

        <Table
          caption="Integrantes"
          headers={[{ label: "Nome" }, { label: "Email" }, { label: "Acesso" }, { label: "Situação" }]}
        >
          {band.members.map((m) => {
            const status = memberStatus(m);
            return (
              <Tr key={m.id}>
                <Td label="Nome" strong>
                  {m.userId ? (
                    <Link href={`/admin/usuarios/contas/${m.userId}`} className="hover:underline">
                      {m.name}
                    </Link>
                  ) : (
                    m.name
                  )}
                </Td>
                <Td label="Email">{m.email}</Td>
                <Td label="Acesso">
                  <Badge tone={BAND_ROLE_TONES[m.role]}>{BAND_ROLE_SHORT[m.role]}</Badge>
                </Td>
                <Td label="Situação">
                  {status === "active" ? (
                    <Badge tone="success">Com acesso</Badge>
                  ) : (
                    <Badge tone="warning">{status === "pending" ? "Convite enviado" : "Convite expirado"}</Badge>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
