import { cx } from "./styles";

/** Indicador numérico (resumos, ex.: Financeiro): rótulo, valor grande e uma linha de apoio. */
export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Cor do valor quando ele carrega significado (ex.: resultado negativo = danger). */
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm text-fg-muted">{label}</p>
      <p
        className={cx(
          "tabular mt-1 text-2xl font-semibold tracking-tight",
          tone === "success" ? "text-success-fg" : tone === "danger" ? "text-danger-fg" : "text-fg",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
