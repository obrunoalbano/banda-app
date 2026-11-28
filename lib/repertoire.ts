/** Limite de músicas por repertório (schema, importação de playlist e formulário). */
export const MAX_REPERTOIRE_SONGS = 200;

export type ShareSong = { title: string; artists: string | null; durationMs: number | null; notes: string | null };

export type ShareOptions = { artists: boolean; notes: boolean; durations: boolean };

export const DEFAULT_SHARE_OPTIONS: ShareOptions = { artists: true, notes: true, durations: false };

/** "3:32" · "1h05" (mesma regra de `formatDuration` em lib/spotify.ts, sem importar o módulo de rede). */
function duration(ms: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  if (total >= 3600) {
    const minutes = Math.round(total / 60);
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** "12 músicas · 48:10" (duração só se todas as músicas têm; senão "≈"). */
export function repertoireSummary(songs: ShareSong[]): string {
  const count = `${songs.length} ${songs.length === 1 ? "música" : "músicas"}`;
  const total = songs.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  if (!total) return count;
  const approx = songs.every((s) => s.durationMs) ? "" : "≈ ";
  return `${count} · ${approx}${duration(total)}`;
}

/** Tira os marcadores de formatação do WhatsApp (*negrito*, _itálico_, ~riscado~) do texto livre. */
function plain(text: string): string {
  return text
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Listagem do repertório em texto para colar no WhatsApp (negrito/itálico do WhatsApp).
 *
 *   *Repertório: Show de sábado*
 *   Banda Demo
 *
 *   1. Garota de Ipanema — Tom Jobim
 *      ↳ toca em um tom a menos
 */
export function repertoireShareText({
  bandName,
  name,
  description,
  songs,
  options = DEFAULT_SHARE_OPTIONS,
}: {
  bandName: string;
  name: string;
  description: string | null;
  songs: ShareSong[];
  options?: ShareOptions;
}): string {
  const lines = [`*Repertório: ${plain(name)}*`, plain(bandName)];
  if (description?.trim()) lines.push(`_${plain(description)}_`);
  lines.push("");
  songs.forEach((song, i) => {
    let line = `${i + 1}. ${plain(song.title)}`;
    if (options.artists && song.artists?.trim()) line += ` — ${plain(song.artists)}`;
    const d = options.durations ? duration(song.durationMs) : null;
    if (d) line += ` (${d})`;
    lines.push(line);
    if (options.notes && song.notes?.trim()) lines.push(`   ↳ ${plain(song.notes)}`);
  });
  lines.push("", repertoireSummary(songs));
  return lines.join("\n");
}

/** Nome de arquivo seguro: "repertorio-show-de-sabado.png". */
export function repertoireFileName(name: string, ext: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `repertorio${slug ? `-${slug}` : ""}.${ext}`;
}

/**
 * Valida a ordem enviada para um ensaio/show (`songOrder`): precisa ter TODAS as músicas do
 * repertório, cada uma uma vez. Lista vazia ou igual à ordem do repertório = segue o repertório
 * (`songOrder` vazio). `ok: false` = o repertório mudou enquanto a pessoa organizava (→ 409).
 */
export function resolveSongOrder(
  songIds: string[],
  repertoireIds: string[],
): { ok: true; songOrder: string[] } | { ok: false } {
  if (songIds.length === 0) return { ok: true, songOrder: [] };
  const known = new Set(repertoireIds);
  const unique = new Set(songIds);
  if (unique.size !== songIds.length || unique.size !== known.size || songIds.some((id) => !known.has(id))) {
    return { ok: false };
  }
  const same = songIds.every((id, i) => id === repertoireIds[i]);
  return { ok: true, songOrder: same ? [] : songIds };
}

export const SONG_ORDER_CONFLICT = "O repertório mudou enquanto você organizava. Recarregue a página e tente de novo.";

/**
 * Músicas do repertório na ordem própria do ensaio/show (`songOrder`). Músicas que não estão na ordem salva
 * (adicionadas ao repertório depois) vão para o fim, na ordem do repertório; ids que não
 * existem mais são ignorados.
 */
export function orderSetlistSongs<T extends { id: string }>(songs: T[], songOrder: string[]): T[] {
  if (songOrder.length === 0) return songs;
  const rank = new Map(songOrder.map((id, i) => [id, i]));
  const ordered = songs.filter((s) => rank.has(s.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  return [...ordered, ...songs.filter((s) => !rank.has(s.id))];
}
