import Link from "next/link";

export default function CasaNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Casa não encontrada</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ela pode ter sido removida ou não pertence à sua banda.
      </p>
      <Link
        href="/casas"
        className="mt-6 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Voltar à listagem
      </Link>
    </div>
  );
}
