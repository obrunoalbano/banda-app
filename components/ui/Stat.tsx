import { cx } from "./styles";

/** Indicador numérico (resumos, ex.: Financeiro): rótulo, valor grande e uma linha de apoio. */
export function Stat({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Cor do valor quando ele carrega significado (ex.: resultado negativo = danger). */
  tone?: "success" | "danger";
  /** Ex.: `col-span-2` para o destaque ocupar a linha toda no celular. */
  className?: string;
}) {
  return (
    <div className={cx("min-w-0 rounded-lg border border-line bg-surface p-3 sm:p-4", className)}>
      <p className="text-sm text-fg-muted">{label}</p>
      <p
        className={cx(
          "tabular mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl",
          tone === "success" ? "text-success-fg" : tone === "danger" ? "text-danger-fg" : "text-fg",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
