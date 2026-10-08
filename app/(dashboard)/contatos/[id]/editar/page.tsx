import { LeadForm } from "@/components/LeadForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarContatoPage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, bandId },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      source: true,
      eventDate: true,
      city: true,
      eventType: true,
      eventDescription: true,
    },
  });
  if (!lead) notFound();

  return (
    <div className={containerClass}>
      <PageHeader title="Alterar contato" back={{ href: `/contatos/${lead.id}`, label: "Voltar aos detalhes" }} />
      <LeadForm lead={lead} />
    </div>
  );
}
