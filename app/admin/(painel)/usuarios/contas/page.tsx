import type { Prisma } from "@/app/generated/prisma/client";
import { AccountStatus } from "@/components/admin/AccountStatus";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { AccountIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass, inputSmClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contas" };

type PageProps = { searchParams: Promise<{ q?: string; situacao?: string; pagina?: string }> };

const SITUACOES = {
  ativas: { label: "Ativas", where: { disabledAt: null } },
  desativadas: { label: "Desativadas", where: { disabledAt: { not: null } } },
  provisoria: { label: "Senha provisória", where: { mustChangePassword: true, disabledAt: null } },
} satisfies Record<string, { label: string; where: Prisma.UserWhereInput }>;

/** Contas de usuário do app (pessoas que entram e acessam uma ou mais bandas). */
export default async function AdminContasPage({ searchParams }: PageProps) {
  await requireAdminId();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const situacao = sp.situacao && sp.situacao in SITUACOES ? (sp.situacao as keyof typeof SITUACOES) : undefined;
  const page = parsePage(sp.pagina);

  const where: Prisma.UserWhereInput = {
    ...(situacao && SITUACOES[situacao].where),
    ...(q && {
      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
    }),
  };
  const [total, filtered, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        disabledAt: true,
        mustChangePassword: true,
        _count: { select: { memberships: true } },
      },
      ...pageArgs(page),
    }),
  ]);
  const filterParams: Record<string, string> = { ...(q && { q }), ...(situacao && { situacao }) };

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Usuários"
        title="Contas"
        description="Pessoas que entram no app. Cada conta pode acessar várias bandas."
      >
        <Badge>{total} contas</Badge>
      </PageHeader>

      {total > 0 ? (
        <FilterBar clearHref="/admin/usuarios/contas">
          <FilterField id="f-q" label="Nome ou email">
            <input id="f-q" name="q" defaultValue={q} className={inputSmClass} placeholder="Buscar…" />
          </FilterField>
          <FilterField id="f-sit" label="Situação" minWidth={170}>
            <select id="f-sit" name="situacao" defaultValue={situacao ?? ""} className={inputSmClass}>
              <option value="">Todas</option>
              {Object.entries(SITUACOES).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterBar>
      ) : null}

      {total === 0 ? (
        <EmptyState icon={AccountIcon} title="Nenhuma conta cadastrada" />
      ) : users.length === 0 ? (
        <EmptyState
          title="Nenhuma conta corresponde aos filtros"
          action={{ href: "/admin/usuarios/contas", label: "Limpar filtros" }}
        />
      ) : (
        <>
          <Table
            caption="Contas de usuário"
            headers={[
              { label: "Nome" },
              { label: "Email" },
              { label: "Bandas" },
              { label: "Criada em" },
              { label: "Situação" },
              { label: "Ações", align: "right" },
            ]}
          >
            {users.map((u) => (
              <Tr key={u.id}>
                <Td label="Nome" strong>
                  <Link href={`/admin/usuarios/contas/${u.id}`} className="hover:underline">
                    {u.name}
                  </Link>
                </Td>
                <Td label="Email">{u.email}</Td>
                <Td label="Bandas" numeric>
                  {u._count.memberships}
                </Td>
                <Td label="Criada em" numeric>
                  {formatDateOnly(u.createdAt)}
                </Td>
                <Td label="Situação">
                  <AccountStatus disabled={!!u.disabledAt} provisional={u.mustChangePassword} />
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/admin/usuarios/contas/${u.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={filtered} basePath="/admin/usuarios/contas" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}
