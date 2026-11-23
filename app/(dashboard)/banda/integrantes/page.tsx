import { AddMemberForm } from "@/components/AddMemberForm";
import { MemberActions } from "@/components/MemberActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { BAND_ROLE_SHORT, BAND_ROLE_TONES } from "@/lib/band-roles";
import { lastAdminBlock, memberStatus } from "@/lib/members";
import { prisma } from "@/lib/prisma";
import { requireBandContext } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Integrantes" };

const STATUS = {
  active: { label: "Com acesso", tone: "success" },
  pending: { label: "Convite enviado", tone: "warning" },
  expired: { label: "Convite expirado", tone: "danger" },
} as const;

export default async function IntegrantesPage() {
  const { bandId, userId, canEdit } = await requireBandContext();
  const members = await prisma.bandMember.findMany({
    where: { bandId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userId: true,
      inviteExpiresAt: true,
      user: { select: { name: true, email: true } },
    },
  });
  const now = new Date();

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Minha banda"
        title="Integrantes"
        description={
          canEdit
            ? "Quem tem acesso a esta banda. Quem já tem conta no app ganha acesso na hora; quem não tem recebe um convite para se cadastrar."
            : "Quem tem acesso a esta banda."
        }
      >
        <Badge>{members.length} integrantes</Badge>
      </PageHeader>

      <div className="flex flex-col gap-8">
        <Table
          caption="Integrantes da banda"
          headers={[
            { label: "Nome" },
            { label: "Email" },
            { label: "Acesso" },
            { label: "Situação" },
            ...(canEdit ? [{ label: "Ações", align: "right" as const }] : []),
          ]}
        >
          {members.map((m) => {
            const status = memberStatus(m, now);
            const isSelf = m.userId === userId;
            return (
              <Tr key={m.id}>
                <Td label="Nome" strong>
                  {m.user?.name ?? m.name}
                  {isSelf ? <span className="ml-1 font-normal text-fg-subtle">(você)</span> : null}
                </Td>
                <Td label="Email">{m.user?.email ?? m.email}</Td>
                <Td label="Acesso">
                  <Badge tone={BAND_ROLE_TONES[m.role]}>{BAND_ROLE_SHORT[m.role]}</Badge>
                </Td>
                <Td label="Situação">
                  <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                </Td>
                {canEdit ? (
                  <Td label="Ações" align="right">
                    <MemberActions
                      member={{
                        id: m.id,
                        name: m.user?.name ?? m.name,
                        email: m.email,
                        role: m.role,
                        pending: !m.userId,
                      }}
                      isSelf={isSelf}
                      blockReason={lastAdminBlock(members, m, {
                        type: "remove",
                      })}
                    />
                  </Td>
                ) : null}
              </Tr>
            );
          })}
        </Table>

        {canEdit ? (
          <Card
            title="Adicionar integrante"
            description="Informe o email que a pessoa usa (ou vai usar) para entrar no app."
          >
            <AddMemberForm />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
