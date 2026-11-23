import { AccountActions } from "@/components/admin/AccountActions";
import { AccountStatus } from "@/components/admin/AccountStatus";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DetailItem, DetailList } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { BAND_ROLE_SHORT, BAND_ROLE_TONES } from "@/lib/band-roles";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Conta" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminContaDetalhePage({ params }: PageProps) {
  await requireAdminId();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      lastLoginAt: true,
      disabledAt: true,
      mustChangePassword: true,
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: { id: true, role: true, band: { select: { id: true, name: true, disabledAt: true } } },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className={containerClass}>
      <PageHeader
        title={user.name}
        description={`Conta criada em ${formatDateTimeShort(user.createdAt)}`}
        back={{ href: "/admin/usuarios/contas", label: "Voltar às contas" }}
      >
        <AccountStatus disabled={!!user.disabledAt} provisional={user.mustChangePassword} />
      </PageHeader>

      <div className="flex flex-col gap-8">
        <Card title="Conta">
          <AccountActions kind="user" id={user.id} name={user.name} email={user.email} disabled={!!user.disabledAt} />
        </Card>

        <DetailList>
          <DetailItem label="Email de acesso" wide>
            {user.email}
          </DetailItem>
          <DetailItem label="Telefone">{user.phone}</DetailItem>
          <DetailItem label="Último acesso" numeric>
            {user.lastLoginAt ? formatDateTimeShort(user.lastLoginAt) : "Nunca entrou"}
          </DetailItem>
        </DetailList>

        <Table caption="Bandas da conta" headers={[{ label: "Banda" }, { label: "Acesso" }, { label: "Situação" }]}>
          {user.memberships.map((m) => (
            <Tr key={m.id}>
              <Td label="Banda" strong>
                <Link href={`/admin/usuarios/bandas/${m.band.id}`} className="hover:underline">
                  {m.band.name}
                </Link>
              </Td>
              <Td label="Acesso">
                <Badge tone={BAND_ROLE_TONES[m.role]}>{BAND_ROLE_SHORT[m.role]}</Badge>
              </Td>
              <Td label="Situação">
                {m.band.disabledAt ? (
                  <Badge tone="danger">Banda desativada</Badge>
                ) : (
                  <Badge tone="success">Ativa</Badge>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
