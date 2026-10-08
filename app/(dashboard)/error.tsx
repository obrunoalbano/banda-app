"use client"; // Error boundaries precisam ser Client Components

import { buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/styles";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Algo deu errado</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Não foi possível carregar esta página. Tente novamente em instantes.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-zinc-400">Código: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => unstable_retry()} className={buttonPrimaryClass}>
          Tentar de novo
        </button>
        <Link href="/casas" className={buttonSecondaryClass}>
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
