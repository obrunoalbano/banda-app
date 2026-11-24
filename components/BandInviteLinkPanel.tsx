"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { SelectField } from "@/components/ui/fields";
import { DisableIcon, LinkIcon, RetryIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import type { BandRole } from "@/app/generated/prisma/enums";
import { BAND_ROLE_OPTIONS } from "@/lib/band-roles";
import { useRouter } from "next/navigation";

const ENDPOINT = "/api/band/invite-link";

/**
 * Link de convite da banda (grupo): um link reutilizável para mandar no grupo da banda.
 * Quem abre cria a conta (ou entra) e passa a ser integrante com o acesso escolhido.
 */
export function BandInviteLinkPanel({ url, role }: { url: string | null; role: BandRole }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();

  async function save(body: { enabled: boolean; role?: BandRole; regenerate?: boolean }): Promise<string | null> {
    const ok = await submit(ENDPOINT, "PATCH", body, "Não foi possível atualizar o link.");
    if (!ok) return "Não foi possível atualizar o link.";
    router.refresh();
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <SelectField
        label="Acesso de quem entrar pelo link"
        value={role}
        disabled={loading}
        onChange={(e) => void save({ enabled: !!url, role: e.target.value as BandRole })}
        hint={
          role === "ADMIN"
            ? "Atenção: quem tiver o link vira administrador (cria, altera e exclui tudo). Prefira Visualizador para grupos."
            : "Quem já entrou mantém o acesso atual; a mudança vale para as próximas entradas."
        }
      >
        {BAND_ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>

      {url ? (
        <>
          <CodeBlock label="Link de convite da banda" copyable wrap>
            {url}
          </CodeBlock>
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              label="Gerar novo link"
              size="sm"
              icon={RetryIcon}
              title="Gerar um novo link?"
              description="O link atual deixa de funcionar. Quem já entrou continua na banda."
              confirmLabel="Gerar novo link"
              onConfirm={() => save({ enabled: true, regenerate: true })}
            />
            <ConfirmButton
              label="Desativar link"
              size="sm"
              variant="ghost"
              icon={DisableIcon}
              title="Desativar o link de convite?"
              description="Ninguém mais consegue entrar pelo link. Quem já entrou continua na banda."
              confirmLabel="Desativar"
              tone="danger"
              onConfirm={() => save({ enabled: false })}
            />
          </div>
        </>
      ) : (
        <div>
          <Button icon={LinkIcon} loading={loading} onClick={() => void save({ enabled: true, role })}>
            Criar link de convite
          </Button>
        </div>
      )}
    </div>
  );
}
