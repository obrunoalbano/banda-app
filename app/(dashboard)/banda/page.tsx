import { auth } from "@/auth";
import { BandForm } from "@/components/BandForm";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function BandaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const band = await prisma.band.findUnique({
    where: { id: session.user.id },
    select: { name: true, responsible: true, phone: true, email: true },
  });

  if (!band) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dados da banda</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Atualize as informações do seu cadastro.
        </p>
      </div>
      <BandForm initial={band} />
    </div>
  );
}

