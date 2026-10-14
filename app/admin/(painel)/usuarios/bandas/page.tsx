import type { Prisma } from "@/app/generated/prisma/client";
import { AccountStatus } from "@/components/admin/AccountStatus";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { AddIcon, BandIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass, inputSmClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Bandas" };

type PageProps = { searchParams: Promise<{ q?: string; situacao?: string; pagina?: string }> };

const SITUACOES = {
  ativas: { label: "Ativas", where: { disabledAt: null } },
  desativadas: { label: "Desativadas", where: { disabledAt: { not: null } } },
  provisoria: { label: "Senha provisória", where: { mustChangePassword: true, disabledAt: null } },
} satisfies Record<string, { label: string; where: Prisma.BandWhereInput }>;

export default async function AdminBandasPage({ searchParams }: PageProps) {
  await requireAdminId();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const situacao = sp.situacao && sp.situacao in SITUACOES ? (sp.situacao as keyof typeof SITUACOES) : undefined;
  const page = parsePage(sp.pagina);

  const where: Prisma.BandWhereInput = {
    ...(situacao && SITUACOES[situacao].where),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [total, filtered, bands] = await Promise.all([
    prisma.band.count(),
    prisma.band.count({ where }),
    prisma.band.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, disabledAt: true, mustChangePassword: true },
      ...pageArgs(page),
    }),
  ]);
  const filterParams: Record<string, string> = { ...(q && { q }), ...(situacao && { situacao }) };

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Usuários"
        title="Bandas"
        description="Contas de banda da plataforma."
        actions={
          <ButtonLink href="/admin/usuarios/bandas/nova" icon={AddIcon}>
            Nova banda
          </ButtonLink>
        }
      >
        <Badge>{total} contas</Badge>
      </PageHeader>

      {total > 0 ? (
        <FilterBar clearHref="/admin/usuarios/bandas">
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
        <EmptyState
          icon={BandIcon}
          title="Nenhuma banda cadastrada"
          action={{ href: "/admin/usuarios/bandas/nova", label: "Criar a primeira conta", primary: true }}
        />
      ) : bands.length === 0 ? (
        <EmptyState title="Nenhuma banda corresponde aos filtros" action={{ href: "/admin/usuarios/bandas", label: "Limpar filtros" }} />
      ) : (
        <>
          <Table
            caption="Contas de banda"
            headers={[{ label: "Nome" }, { label: "Email" }, { label: "Criada em" }, { label: "Situação" }, { label: "Ações", align: "right" }]}
          >
            {bands.map((b) => (
              <Tr key={b.id}>
                <Td label="Nome" strong>
                  <Link href={`/admin/usuarios/bandas/${b.id}`} className="hover:underline">
                    {b.name}
                  </Link>
                </Td>
                <Td label="Email">{b.email}</Td>
                <Td label="Criada em" numeric>
                  {formatDateOnly(b.createdAt)}
                </Td>
                <Td label="Situação">
                  <AccountStatus disabled={!!b.disabledAt} provisional={b.mustChangePassword} />
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/admin/usuarios/bandas/${b.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={filtered} basePath="/admin/usuarios/bandas" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}

