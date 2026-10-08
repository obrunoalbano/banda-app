import Link from "next/link";
import { buttonPrimaryClass, buttonSecondaryClass } from "@/components/ui/styles";

/** Botões Salvar/Cancelar dos formulários. Cancelar é link explícito (não depende do histórico). */
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
    <div className="flex flex-wrap gap-3 pt-2">
      <button type="submit" disabled={loading} className={buttonPrimaryClass}>
        {loading ? "Salvando…" : submitLabel}
      </button>
      {cancelHref ? (
        <Link href={cancelHref} className={buttonSecondaryClass}>
          Cancelar
        </Link>
      ) : null}
    </div>
  );
}
