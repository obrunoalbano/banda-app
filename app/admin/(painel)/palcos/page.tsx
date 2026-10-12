import type { Prisma } from "@/app/generated/prisma/client";
import { StageStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { AddIcon, ExploreIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass, inputSmClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { BRAZIL_UFS } from "@/lib/brazil-states";
import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import {
  needsReverification,
  reverifyCutoff,
  STAGE_STATUS_LABELS,
  STAGE_STATUS_OPTIONS,
  STAGE_STATUS_TONES,
  STAGE_TYPE_LABELS,
} from "@/lib/stages";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Palcos" };

type PageProps = { searchParams: Promise<{ q?: string; status?: string; uf?: string; pagina?: string }> };

const STATUS_VALUES = new Set<string>(Object.values(StageStatus));

export default async function AdminPalcosPage({ searchParams }: PageProps) {
  await requireAdminId();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status && STATUS_VALUES.has(sp.status) ? (sp.status as StageStatus) : undefined;
  const uf = sp.uf && /^[A-Z]{2}$/.test(sp.uf) ? sp.uf : undefined;
  const page = parsePage(sp.pagina);

  const where: Prisma.StageWhereInput = {
    ...(status && { status }),
    ...(uf && { state: uf }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { neighborhood: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const reverifyBefore = reverifyCutoff();

  const [total, filtered, stages, byStatus, toReverify] = await Promise.all([
    prisma.stage.count(),
    prisma.stage.count({ where }),
    prisma.stage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, type: true, city: true, neighborhood: true, state: true, status: true, verifiedAt: true },
      ...pageArgs(page),
    }),
    prisma.stage.groupBy({ by: ["status"], _count: true }),
    prisma.stage.count({
      where: { status: "PUBLISHED", OR: [{ verifiedAt: null }, { verifiedAt: { lt: reverifyBefore } }] },
    }),
  ]);
  const count = (s: StageStatus) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const filterParams: Record<string, string> = { ...(q && { q }), ...(status && { status }), ...(uf && { uf }) };

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Painel"
        title="Palcos"
        description="Base curada do Explorar Palcos. Só palcos publicados aparecem para as bandas."
        actions={
          <ButtonLink href="/admin/palcos/novo" icon={AddIcon}>
            Novo palco
          </ButtonLink>
        }
      >
        <Badge tone="success">{count("PUBLISHED")} publicados</Badge>
        <Badge tone="warning">{count("DRAFT")} rascunhos</Badge>
        <Badge>{count("ARCHIVED")} arquivados</Badge>
        {toReverify > 0 ? <Badge tone="danger">{toReverify} para reverificar</Badge> : null}
      </PageHeader>

      {total > 0 ? (
        <FilterBar clearHref="/admin/palcos">
          <FilterField id="f-q" label="Nome, cidade ou bairro">
            <input id="f-q" name="q" defaultValue={q} className={inputSmClass} placeholder="Buscar…" />
          </FilterField>
          <FilterField id="f-status" label="Situação" minWidth={150}>
            <select id="f-status" name="status" defaultValue={status ?? ""} className={inputSmClass}>
              <option value="">Todas</option>
              {STAGE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="f-uf" label="UF" minWidth={120}>
            <select id="f-uf" name="uf" defaultValue={uf ?? ""} className={inputSmClass}>
              <option value="">Todas</option>
              {BRAZIL_UFS.map((s) => (
                <option key={s.sigla} value={s.sigla}>
                  {s.sigla}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterBar>
      ) : null}

      {total === 0 ? (
        <EmptyState
          icon={ExploreIcon}
          title="Nenhum palco cadastrado"
          description="Cadastre os palcos verificados pela equipe. Eles alimentam o Explorar Palcos das bandas."
          action={{ href: "/admin/palcos/novo", label: "Cadastrar o primeiro palco", primary: true }}
        />
      ) : stages.length === 0 ? (
        <EmptyState title="Nenhum palco corresponde aos filtros" action={{ href: "/admin/palcos", label: "Limpar filtros" }} />
      ) : (
        <>
          <Table
            caption="Palcos da base curada"
            headers={[
              { label: "Nome" },
              { label: "Tipo" },
              { label: "Cidade" },
              { label: "Situação" },
              { label: "Verificado em" },
              { label: "Ações", align: "right" },
            ]}
          >
            {stages.map((s) => (
              <Tr key={s.id}>
                <Td label="Nome" strong>
                  <Link href={`/admin/palcos/${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                </Td>
                <Td label="Tipo">{STAGE_TYPE_LABELS[s.type]}</Td>
                <Td label="Cidade">
                  {s.city}/{s.state}
                  {s.neighborhood ? <span className="block text-xs text-fg-subtle">{s.neighborhood}</span> : null}
                </Td>
                <Td label="Situação">
                  <Badge tone={STAGE_STATUS_TONES[s.status]}>{STAGE_STATUS_LABELS[s.status]}</Badge>
                </Td>
                <Td label="Verificado em" numeric>
                  {s.verifiedAt ? formatDateOnly(s.verifiedAt) : null}
                  {s.status === "PUBLISHED" && needsReverification(s.verifiedAt) ? (
                    <span className="ml-2">
                      <Badge tone="danger">Reverificar</Badge>
                    </span>
                  ) : null}
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/admin/palcos/${s.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={filtered} basePath="/admin/palcos" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}
