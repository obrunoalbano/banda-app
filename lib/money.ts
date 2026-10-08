/**
 * Valores monetários são persistidos em centavos (Int) para evitar erro de ponto flutuante.
 * A UI usa máscara (`CurrencyField`): o usuário digita dígitos e o estado já é em centavos.
 */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const plain = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Teto: R$ 9.999.999,99. Postgres INTEGER é 32 bits (máx. 2.147.483.647 centavos). */
export const MAX_CENTS = 999_999_999;

/** Formata centavos como BRL ("R$ 1.500,00"); `null`/inválido vira "—". */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return brl.format(cents / 100);
}

/** Centavos → texto do input mascarado ("1.500,00"); `null` → "". */
export function formatCentsPlain(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  return plain.format(cents / 100);
}

/** Texto digitado no input mascarado → centavos (só os dígitos contam). Vazio → `null`. */
export function centsFromDigits(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return null;
  return Math.min(Number(digits), MAX_CENTS);
}
