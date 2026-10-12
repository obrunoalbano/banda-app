"use client";

import type { StageStatus } from "@/app/generated/prisma/enums";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ArchiveIcon, DeleteIcon, PublishIcon, VerifiedIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";

/** Ações de curadoria: publicar, marcar como verificado, arquivar, voltar a rascunho, excluir rascunho. */
export function StageActions({ id, status, name }: { id: string; status: StageStatus; name: string }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();

  async function patch(body: { status?: StageStatus; verify?: boolean }): Promise<string | null> {
    const data = await submit(`/api/admin/stages/${id}`, "PATCH", body, "Não foi possível atualizar.");
    if (!data) return "Não foi possível atualizar.";
    router.refresh();
    return null;
  }

  async function remove(): Promise<string | null> {
    const res = await fetch(`/api/admin/stages/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      return typeof data.error === "string" ? data.error : "Não foi possível excluir.";
    }
    router.push("/admin/palcos");
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        {status !== "PUBLISHED" ? (
          <Button icon={PublishIcon} loading={loading} onClick={() => void patch({ status: "PUBLISHED" })}>
            Publicar
          </Button>
        ) : (
          <Button variant="secondary" icon={VerifiedIcon} loading={loading} onClick={() => void patch({ verify: true })}>
            Marcar como verificado
          </Button>
        )}
        {status === "PUBLISHED" ? (
          <ConfirmButton
            label="Arquivar"
            variant="secondary"
            icon={ArchiveIcon}
            title="Arquivar este palco?"
            description="Ele deixa de aparecer para as bandas no Explorar Palcos. Use quando fechou ou parou de contratar música ao vivo."
            confirmLabel="Arquivar"
            onConfirm={() => patch({ status: "ARCHIVED" })}
          />
        ) : null}
        {status === "ARCHIVED" ? (
          <Button variant="secondary" loading={loading} onClick={() => void patch({ status: "DRAFT" })}>
            Voltar para rascunho
          </Button>
        ) : null}
        {status === "DRAFT" ? (
          <ConfirmButton
            label="Excluir"
            variant="danger"
            icon={DeleteIcon}
            title="Excluir rascunho?"
            description={<>Excluir o palco &quot;{name}&quot;? Esta ação não pode ser desfeita.</>}
            confirmLabel="Excluir"
            tone="danger"
            onConfirm={remove}
          />
        ) : null}
      </div>
    </div>
  );
}
