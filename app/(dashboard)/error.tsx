"use client"; // Error boundaries precisam ser Client Components

import { Button, ButtonLink } from "@/components/ui/Button";
import { DangerIcon, RetryIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";
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
    <StatusPage
      icon={DangerIcon}
      title="Algo deu errado"
      description={
        <>
          Não foi possível carregar esta página. Tente novamente em instantes.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs text-fg-subtle">Código: {error.digest}</span>
          ) : null}
        </>
      }
      actions={
        <>
          <Button icon={RetryIcon} onClick={() => unstable_retry()}>
            Tentar de novo
          </Button>
          <ButtonLink href="/casas" variant="secondary">
            Ir para o início
          </ButtonLink>
        </>
      }
    />
  );
}
