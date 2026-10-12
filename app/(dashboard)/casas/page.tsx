import { VenueSendStatus } from "@/app/generated/prisma/enums";
import { CasasFilterForm } from "@/components/CasasFilterForm";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { ButtonLink } from "@/components/ui/Button";
import { AddIcon, VenueIcon } from "@/components/ui/icons";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Casas de show" };

const STATUS_VALUES = new Set<string>(Object.values(VenueSendStatus));

function parseStatusFilter(raw: string | undefined): VenueSendStatus | undefined {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || !STATUS_VALUES.has(s)) return undefined;
  return s as VenueSendStatus;
}

type PageProps = { searchParams: Promise<{ cidade?: string; status?: string; pagina?: string }> };

export default async function CasasPage({ searchParams }: PageProps) {
  const bandId = await requireBandId();
  const sp = await searchParams;
  const cidadeFilter = typeof sp.cidade === "string" ? sp.cidade.trim() : "";
  const statusFilter = parseStatusFilter(sp.status);
  const page = parsePage(sp.pagina);

  const where = {
    bandId,
    ...(cidadeFilter ? { city: cidadeFilter } : {}),
    ...(statusFilter ? { sendStatus: statusFilter } : {}),
  };

  const [cityRows, totalBandVenues, filteredTotal, venues] = await Promise.all([
    prisma.venue.findMany({
      where: { bandId },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.venue.count({ where: { bandId } }),
    prisma.venue.count({ where }),
    prisma.venue.findMany({
      where,
      select: { id: true, name: true, city: true, state: true, valorCacheCents: true, sendStatus: true },
      orderBy: { updatedAt: "desc" },
      ...pageArgs(page),
    }),
  ]);

  const filterParams: Record<string, string> = {
    ...(cidadeFilter && { cidade: cidadeFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  return (
    <div className={containerClass}>
      <PageHeader
        title="Casas de show"
        description="Listagem com status de envio, detalhes e edição."
        actions={
          <ButtonLink href="/casas/nova" icon={AddIcon}>
            Nova casa
          </ButtonLink>
        }
      />

      {totalBandVenues > 0 && (
        <CasasFilterForm
          cities={cityRows.map((r) => r.city)}
          defaultCidade={cidadeFilter}
          defaultStatus={statusFilter ?? ""}
        />
      )}

      {totalBandVenues === 0 ? (
        <EmptyState
          icon={VenueIcon}
          title="Nenhuma casa cadastrada"
          description="Cadastre as casas de show para acompanhar contatos, cachê e o envio da sua proposta."
          action={{ href: "/casas/nova", label: "Cadastrar a primeira casa", primary: true }}
        />
      ) : venues.length === 0 ? (
        <EmptyState
          title="Nenhuma casa corresponde aos filtros"
          action={{ href: "/casas", label: "Limpar filtros" }}
        />
      ) : (
        <>
          <Table
            caption="Casas de show cadastradas"
            headers={[
              { label: "Nome" },
              { label: "Cidade" },
              { label: "UF" },
              { label: "Cachê ref." },
              { label: "Status" },
              { label: "Ações", align: "right" },
            ]}
          >
            {venues.map((v) => (
              <Tr key={v.id}>
                <Td label="Nome" strong>
                  <Link href={`/casas/${v.id}`} className="hover:underline">
                    {v.name}
                  </Link>
                </Td>
                <Td label="Cidade">{v.city}</Td>
                <Td label="UF">{v.state}</Td>
                <Td label="Cachê ref." numeric>
                  {formatCents(v.valorCacheCents)}
                </Td>
                <Td label="Status">
                  <StatusBadge status={v.sendStatus} />
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/casas/${v.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={filteredTotal} basePath="/casas" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}
