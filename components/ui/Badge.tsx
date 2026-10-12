import { cx, toneClass, type Tone } from "./styles";

/**
 * Selo de status curto (1–3 palavras). Cor = significado:
 * neutral (informativo), info (em andamento), success (concluído/pago),
 * warning (pendente/aguardando), danger (erro/cancelado).
 */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
