import { auth } from "@/auth";
import { ShowForm } from "@/components/ShowForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NovoShowPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const venues = await prisma.venue.findMany({
    where: { bandId: session.user.id },
    select: { id: true, name: true, city: true, state: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/shows"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Voltar à listagem
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Novo show</h1>
      </div>
      <ShowForm mode="create" venues={venues} />
    </div>
  );
}
