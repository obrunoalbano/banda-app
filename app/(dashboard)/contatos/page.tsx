import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ContatosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bandId = session.user.id;

  const leads = await prisma.lead.findMany({
    where: { bandId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      source: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Contatos</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Leads recebidos via integração.{" "}
            <Link
              href="/integracoes"
              className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
            >
              Configurar integrações
            </Link>
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Nenhum contato recebido ainda.{" "}
          <Link href="/integracoes" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Ative a integração com seu site
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Nome</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">WhatsApp</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Origem</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Data</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {leads.map((lead) => (
                <tr key={lead.id} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{lead.name}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{lead.email}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{lead.whatsapp ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{lead.source ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/contatos/${lead.id}`}
                      className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
