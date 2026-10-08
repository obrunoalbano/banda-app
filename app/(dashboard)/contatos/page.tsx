import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import Link from "next/link";

type PageProps = { searchParams: Promise<{ pagina?: string }> };

export default async function ContatosPage({ searchParams }: PageProps) {
  const bandId = await requireBandId();
  const page = parsePage((await searchParams).pagina);

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where: { bandId } }),
    prisma.lead.findMany({
      where: { bandId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, whatsapp: true, source: true, createdAt: true },
      ...pageArgs(page),
    }),
  ]);

  return (
    <div className={containerClass}>
      <PageHeader
        title="Contatos"
        description={
          <>
            Leads recebidos via integração.{" "}
            <Link href="/integracoes" className={linkClass}>
              Configurar integrações
            </Link>
          </>
        }
      />

      {total === 0 ? (
        <EmptyState
          message="Nenhum contato recebido ainda."
          action={{ href: "/integracoes", label: "Ative a integração com seu site" }}
        />
      ) : (
        <>
          <Table
            headers={[
              { label: "Nome" },
              { label: "Email" },
              { label: "WhatsApp" },
              { label: "Origem" },
              { label: "Recebido em" },
              { label: "Ações", align: "right" },
            ]}
          >
            {leads.map((lead) => (
              <Tr key={lead.id}>
                <Td strong>{lead.name}</Td>
                <Td>{lead.email}</Td>
                <Td>{lead.whatsapp}</Td>
                <Td>{lead.source}</Td>
                <Td>{formatDateTimeShort(lead.createdAt)}</Td>
                <Td align="right">
                  <Link href={`/contatos/${lead.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={total} basePath="/contatos" />
        </>
      )}
    </div>
  );
}
