/**
 * Formatadores compartilhados. Instâncias de `Intl` são criadas uma vez no módulo
 * (criar por linha de tabela é caro).
 *
 * Fusos:
 * - `Show.date` é data pura gravada em UTC 00:00 → formatar SEMPRE em UTC (senão vira o dia anterior).
 * - Timestamps reais (`createdAt`, etc.) → formatar no fuso da banda (America/Sao_Paulo).
 */

export const APP_TIME_ZONE = "America/Sao_Paulo";

const dateOnlyFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTimeShortFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});
const dateTimeFullFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});
const monthNameFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

/** Data pura (UTC 00:00) → "15/12/2026". */
export function formatDateOnly(date: Date): string {
  return dateOnlyFmt.format(date);
}

/** Timestamp → "15/12/2026 14:30" no fuso da app. */
export function formatDateTimeShort(date: Date): string {
  return dateTimeShortFmt.format(date);
}

/** Timestamp → "terça-feira, 15 de dezembro de 2026 14:30" no fuso da app. */
export function formatDateTimeFull(date: Date): string {
  return dateTimeFullFmt.format(date);
}

/** 1..12 → "Dezembro". */
export function monthLabel(month1to12: number): string {
  const name = monthNameFmt.format(new Date(Date.UTC(2000, month1to12 - 1, 1)));
  return name.charAt(0).toLocaleUpperCase("pt-BR") + name.slice(1);
}

/** Só dígitos. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Máscara de telefone BR enquanto digita: (11) 99999-0000 / (11) 3333-0000.
 * Números com DDI (+55...) ou fora do padrão são devolvidos sem máscara.
 */
export function maskPhoneBr(value: string): string {
  if (value.trim().startsWith("+")) return value;
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Link wa.me a partir de um telefone livre. Assume Brasil (55) quando vier só DDD+número. */
export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = digitsOnly(phone);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (d.length < 12) return null;
  return `https://wa.me/${d}`;
}

/** "@casa", "casa" ou URL → URL do perfil. */
export function instagramHref(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return `https://instagram.com/${handle}`;
}
