import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/casas");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-20">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Agenda da banda
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Cadastre sua banda e organize o contato com casas de show: status de envio, dados e
          histórico em um só lugar.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Cadastrar banda
        </Link>
      </div>
    </div>
  );
}
