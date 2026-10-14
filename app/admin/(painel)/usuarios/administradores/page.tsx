import { AccountStatus } from "@/components/admin/AccountStatus";
import { AccountActions } from "@/components/admin/AccountActions";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { AddIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administradores" };

export default async function AdministradoresPage() {
  const me = await requireAdminId();
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, disabledAt: true, mustChangePassword: true, lastLoginAt: true },
  });

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Usuários"
        title="Administradores"
        description="Equipe com acesso ao painel. Todos têm o mesmo nível (superadmin)."
        actions={
          <ButtonLink href="/admin/usuarios/administradores/novo" icon={AddIcon}>
            Novo administrador
          </ButtonLink>
        }
      >
        <Badge>{admins.length} administradores</Badge>
      </PageHeader>

      <Table
        caption="Administradores do painel"
        headers={[{ label: "Nome" }, { label: "Email" }, { label: "Último acesso" }, { label: "Situação" }, { label: "Ações", align: "right" }]}
      >
        {admins.map((a) => (
          <Tr key={a.id}>
            <Td label="Nome" strong>
              {a.name}
              {a.id === me ? <span className="ml-2 text-xs font-normal text-fg-subtle">(você)</span> : null}
            </Td>
            <Td label="Email">{a.email}</Td>
            <Td label="Último acesso" numeric>
              {a.lastLoginAt ? formatDateTimeShort(a.lastLoginAt) : null}
            </Td>
            <Td label="Situação">
              <AccountStatus disabled={!!a.disabledAt} provisional={a.mustChangePassword} />
            </Td>
            <Td label="Ações" align="right">
              <div className="flex justify-end">
                <AccountActions
                  kind="admin"
                  id={a.id}
                  name={a.name}
                  email={a.email}
                  disabled={!!a.disabledAt}
                  isSelf={a.id === me}
                />
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
