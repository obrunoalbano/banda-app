import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { AddIcon, RepertoireIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandContext } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Repertórios" };

export default async function RepertoriosPage() {
  const { bandId, canEdit } = await requireBandContext();
  const repertoires = await prisma.repertoire.findMany({
    where: { bandId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: { select: { songs: true, rehearsals: true } },
    },
  });

  return (
    <div className={containerClass}>
      <PageHeader
        title="Repertórios"
        description="Listas de músicas da banda, na ordem de tocar. Use nos ensaios."
        actions={
          canEdit ? (
            <ButtonLink href="/repertorios/novo" icon={AddIcon}>
              Novo repertório
            </ButtonLink>
          ) : null
        }
      />

      {repertoires.length === 0 ? (
        <EmptyState
          icon={RepertoireIcon}
          title="Nenhum repertório ainda"
          description="Monte a lista de músicas (pelo link do Spotify ou à mão) e escolha a ordem."
          action={canEdit ? { href: "/repertorios/novo", label: "Criar repertório", primary: true } : undefined}
        />
      ) : (
        <Table
          caption="Repertórios da banda"
          headers={[{ label: "Nome" }, { label: "Músicas" }, { label: "Ensaios" }, { label: "Atualizado" }]}
        >
          {repertoires.map((r) => (
            <Tr key={r.id}>
              <Td label="Nome" strong>
                <Link href={`/repertorios/${r.id}`} className={linkClass}>
                  {r.name}
                </Link>
                {r.description ? (
                  <span className="mt-0.5 block truncate text-xs font-normal text-fg-subtle">{r.description}</span>
                ) : null}
              </Td>
              <Td label="Músicas" numeric>
                {r._count.songs}
              </Td>
              <Td label="Ensaios" numeric>
                {r._count.rehearsals}
              </Td>
              <Td label="Atualizado">{formatDateTimeShort(r.updatedAt)}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}
