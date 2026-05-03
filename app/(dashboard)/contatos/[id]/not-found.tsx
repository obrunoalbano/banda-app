import Link from "next/link";

export default function ContatoNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Contato não encontrado</h1>
      <Link href="/contatos" className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300">
        Voltar à lista
      </Link>
    </div>
  );
}
