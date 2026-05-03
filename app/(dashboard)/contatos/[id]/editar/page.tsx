import { auth } from "@/auth";
import { LeadForm } from "@/components/LeadForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarContatoPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, bandId: session.user.id },
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/contatos/${lead.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Voltar aos detalhes
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Alterar contato</h1>
      </div>
      <LeadForm mode="edit" lead={lead} />
    </div>
  );
}
