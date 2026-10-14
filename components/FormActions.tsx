import { Button, ButtonLink } from "@/components/ui/Button";

/** Rodapé de formulário: ação principal à esquerda, Cancelar (link explícito) ao lado. */
export function FormActions({
  loading,
  submitLabel,
  cancelHref,
}: {
  loading: boolean;
  submitLabel: string;
  cancelHref?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-line pt-5">
      <Button type="submit" loading={loading}>
        {loading ? "Salvando…" : submitLabel}
      </Button>
      {cancelHref ? (
        <ButtonLink href={cancelHref} variant="secondary">
          Cancelar
        </ButtonLink>
      ) : null}
    </div>
  );
}
