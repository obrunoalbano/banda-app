import type { AttendanceStatus, RehearsalRecurrence, RehearsalSongStatus } from "@/app/generated/prisma/enums";
import type { Tone } from "@/components/ui/styles";
import { PRODUCT_NAME } from "@/components/ui/Brand";

/**
 * Ensaios (módulo Administrativo): recorrência, próxima ocorrência e presença. Funções puras.
 * Datas são "datas puras" em UTC 00:00 (como Show.date). Ver docs/ensaios.md.
 */

export const RECURRENCE_LABELS: Record<RehearsalRecurrence, string> = {
  NONE: "Não se repete",
  WEEKLY: "Toda semana",
  BIWEEKLY: "A cada 2 semanas",
  MONTHLY: "Todo mês",
};

export const RECURRENCE_OPTIONS = (Object.keys(RECURRENCE_LABELS) as RehearsalRecurrence[]).map((value) => ({
  value,
  label: RECURRENCE_LABELS[value],
}));

export const ATTENDANCE_LABELS: Record<AttendanceStatus | "PENDING", string> = {
  CONFIRMED: "Confirmado",
  DECLINED: "Não vai",
  PENDING: "Sem resposta",
};

export const ATTENDANCE_TONES: Record<AttendanceStatus | "PENDING", Tone> = {
  CONFIRMED: "success",
  DECLINED: "danger",
  PENDING: "warning",
};

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}

/** "Toda terça-feira" · "A cada 2 semanas, às sextas-feiras" · "Todo mês, no dia 12" · "Não se repete". */
export function recurrenceDescription(recurrence: RehearsalRecurrence, date: Date): string {
  const weekday = weekdayName(date);
  const plural = weekday.replace(/-feira$/, "s-feiras").replace(/^(sábado|domingo)$/, "$1s");
  switch (recurrence) {
    case "WEEKLY":
      return `${weekday === "sábado" || weekday === "domingo" ? "Todo" : "Toda"} ${weekday}`;
    case "BIWEEKLY":
      return `A cada 2 semanas, às ${plural}`;
    case "MONTHLY":
      return `Todo mês, no dia ${date.getUTCDate()}`;
    default:
      return "Não se repete";
  }
}

const DAY_MS = 24 * 60 * 60_000;

function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/** Ocorrência mensal `monthsAhead` meses depois de `start` (dia 31 vira o último dia em meses curtos). */
function monthlyOccurrence(start: Date, monthsAhead: number): Date {
  const total = start.getUTCMonth() + monthsAhead;
  const y = start.getUTCFullYear() + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return utcDate(y, m, Math.min(start.getUTCDate(), daysInMonth(y, m)));
}

export type RecurrenceRule = { date: Date; recurrence: RehearsalRecurrence; recurrenceUntil: Date | null };

/**
 * Próxima ocorrência a partir de `today` (inclusive). `null` = o ensaio já passou (único no
 * passado ou recorrência encerrada).
 */
export function nextOccurrence(rule: RecurrenceRule, today: Date): Date | null {
  const { date, recurrence, recurrenceUntil } = rule;
  let next: Date;
  if (date >= today || recurrence === "NONE") {
    next = date;
  } else if (recurrence === "MONTHLY") {
    const months = (today.getUTCFullYear() - date.getUTCFullYear()) * 12 + (today.getUTCMonth() - date.getUTCMonth());
    next = monthlyOccurrence(date, months);
    if (next < today) next = monthlyOccurrence(date, months + 1);
  } else {
    const step = (recurrence === "WEEKLY" ? 7 : 14) * DAY_MS;
    const elapsed = today.getTime() - date.getTime();
    next = new Date(date.getTime() + Math.ceil(elapsed / step) * step);
  }
  if (next < today) return null;
  if (recurrence !== "NONE" && recurrenceUntil && next > recurrenceUntil) return null;
  return next;
}

/** `candidate` é uma ocorrência válida do ensaio? (confere a resposta de presença). */
export function isOccurrence(rule: RecurrenceRule, candidate: Date): boolean {
  if (candidate < rule.date) return false;
  if (rule.recurrence !== "NONE" && rule.recurrenceUntil && candidate > rule.recurrenceUntil) return false;
  if (rule.recurrence === "NONE") return candidate.getTime() === rule.date.getTime();
  return nextOccurrence(rule, candidate)?.getTime() === candidate.getTime();
}

/** Próximas `count` ocorrências a partir de `today` (para a tela do ensaio). */
export function upcomingOccurrences(rule: RecurrenceRule, today: Date, count: number): Date[] {
  const result: Date[] = [];
  let from = today;
  while (result.length < count) {
    const next = nextOccurrence(rule, from);
    if (!next) break;
    result.push(next);
    if (rule.recurrence === "NONE") break;
    from = new Date(next.getTime() + DAY_MS);
  }
  return result;
}

/**
 * Ocorrências que já aconteceram (até `today`, inclusive), da mais recente para a mais antiga,
 * no máximo `count` (para marcar músicas ensaiadas).
 */
export function pastOccurrences(rule: RecurrenceRule, today: Date, count: number): Date[] {
  const window: Date[] = [];
  let from = rule.date;
  // Teto de iterações: ~20 anos de ensaios semanais.
  for (let i = 0; i < 1100; i++) {
    const next = nextOccurrence(rule, from);
    if (!next || next > today) break;
    window.push(next);
    if (window.length > count) window.shift();
    if (rule.recurrence === "NONE") break;
    from = new Date(next.getTime() + DAY_MS);
  }
  return window.reverse();
}

/* ── Músicas do ensaio: ordem própria e marcação de ensaiadas ─────── */

export const SONG_CHECK_LABELS: Record<RehearsalSongStatus | "NONE", string> = {
  REHEARSED: "Ensaiada",
  MISSED: "Faltou",
  NONE: "Sem marcação",
};

export const SONG_CHECK_TONES: Record<RehearsalSongStatus | "NONE", Tone> = {
  REHEARSED: "success",
  MISSED: "danger",
  NONE: "neutral",
};

/**
 * Músicas do repertório na ordem do ensaio (`songOrder`). Músicas que não estão na ordem salva
 * (adicionadas ao repertório depois) vão para o fim, na ordem do repertório; ids que não
 * existem mais são ignorados.
 */
export function orderRehearsalSongs<T extends { id: string }>(songs: T[], songOrder: string[]): T[] {
  if (songOrder.length === 0) return songs;
  const rank = new Map(songOrder.map((id, i) => [id, i]));
  const ordered = songs.filter((s) => rank.has(s.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  return [...ordered, ...songs.filter((s) => !rank.has(s.id))];
}

/** A ordem enviada é a mesma do repertório? (então salva vazia = segue o repertório). */
export function isRepertoireOrder(songIds: string[], repertoireIds: string[]): boolean {
  return songIds.length === repertoireIds.length && songIds.every((id, i) => id === repertoireIds[i]);
}

export type SongCheckCounts = Record<RehearsalSongStatus | "NONE", number>;

export function songCheckCounts(songIds: string[], checks: { songId: string; status: RehearsalSongStatus }[]) {
  const bySong = new Map(checks.map((c) => [c.songId, c.status]));
  const counts: SongCheckCounts = { REHEARSED: 0, MISSED: 0, NONE: 0 };
  for (const id of songIds) counts[bySong.get(id) ?? "NONE"]++;
  return counts;
}

export type AttendanceCounts = Record<AttendanceStatus | "PENDING", number>;

/** Contagem de respostas entre os integrantes com conta (sem resposta = pendente). */
export function attendanceCounts(memberIds: string[], responses: { memberId: string; status: AttendanceStatus }[]) {
  const byMember = new Map(responses.map((r) => [r.memberId, r.status]));
  const counts: AttendanceCounts = { CONFIRMED: 0, DECLINED: 0, PENDING: 0 };
  for (const id of memberIds) counts[byMember.get(id) ?? "PENDING"]++;
  return counts;
}

export function rehearsalInviteEmail({
  bandName,
  rehearsalName,
  when,
  location,
  recurrence,
  url,
}: {
  bandName: string;
  rehearsalName: string;
  /** Ex.: "terça-feira, 01/12/2026 às 19:30". */
  when: string;
  location: string;
  recurrence: string;
  url: string;
}) {
  const subject = `Novo ensaio da ${bandName}: ${rehearsalName} — confirme sua presença`;
  const text = [
    `Um ensaio foi marcado na banda ${bandName}.`,
    "",
    `${rehearsalName}`,
    `Quando: ${when}${recurrence ? ` (${recurrence.toLowerCase()})` : ""}`,
    `Onde: ${location}`,
    "",
    `Confirme se você vai pelo ${PRODUCT_NAME}:`,
    url,
  ].join("\n");
  const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<p>Um ensaio foi marcado na banda <strong>${esc(bandName)}</strong>.</p>
<p><strong>${esc(rehearsalName)}</strong><br>
Quando: ${esc(when)}${recurrence ? ` (${esc(recurrence.toLowerCase())})` : ""}<br>
Onde: ${esc(location)}</p>
<p><a href="${esc(url)}">Confirmar presença</a></p>`;
  return { subject, text, html };
}
