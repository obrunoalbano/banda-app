import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { LeadIcon } from "@/components/ui/icons";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contatos" };

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
          icon={LeadIcon}
          title="Nenhum contato recebido ainda"
          description="Conecte o formulário do seu site para receber pedidos de orçamento aqui."
          action={{ href: "/integracoes", label: "Configurar integração", primary: true }}
        />
      ) : (
        <>
          <Table
            caption="Contatos recebidos"
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
                <Td label="Nome" strong>
                  <Link href={`/contatos/${lead.id}`} className="hover:underline">
                    {lead.name}
                  </Link>
                </Td>
                <Td label="Email">{lead.email}</Td>
                <Td label="WhatsApp">{lead.whatsapp}</Td>
                <Td label="Origem">{lead.source}</Td>
                <Td label="Recebido em" numeric>
                  {formatDateTimeShort(lead.createdAt)}
                </Td>
                <Td label="Ações" align="right">
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
