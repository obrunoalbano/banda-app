import { auth } from "@/auth";
import { ShowForm } from "@/components/ShowForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarShowPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [show, venues] = await Promise.all([
    prisma.show.findFirst({
      where: { id, bandId: session.user.id },
      select: {
        id: true,
        venueId: true,
        date: true,
        time: true,
        privateEventDetails: true,
        privateCity: true,
        privateState: true,
        privateValorCache: true,
        paymentStatus: true,
      },
    }),
    prisma.venue.findMany({
      where: { bandId: session.user.id },
      select: { id: true, name: true, city: true, state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!show) notFound();

  const showDate = show.date.toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/shows/${show.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Voltar aos detalhes
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Alterar show</h1>
      </div>
      <ShowForm mode="edit" venues={venues} show={{ ...show, date: showDate }} />
    </div>
  );
}
