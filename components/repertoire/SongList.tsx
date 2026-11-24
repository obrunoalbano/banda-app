import { SongCover } from "@/components/repertoire/SongCover";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { cx, linkClass } from "@/components/ui/styles";
import { formatDuration } from "@/lib/spotify";

export type SongView = {
  id: string;
  title: string;
  artists: string | null;
  spotifyUrl: string | null;
  imageUrl: string | null;
  durationMs: number | null;
  notes: string | null;
};

/** Músicas do repertório em ordem (detalhe do repertório e do ensaio). */
export function SongList({
  songs,
  emptyText = "Nenhuma música neste repertório.",
}: {
  songs: SongView[];
  emptyText?: string;
}) {
  if (songs.length === 0) return <p className="text-sm text-fg-muted">{emptyText}</p>;
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {songs.map((song, index) => {
        const duration = formatDuration(song.durationMs);
        return (
          <li key={song.id} className="flex items-start gap-3 px-4 py-3">
            <span className="tabular mt-2.5 w-5 shrink-0 text-right text-sm font-medium text-fg-subtle">
              {index + 1}
            </span>
            <SongCover src={song.imageUrl} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg">{song.title}</p>
              {song.artists ? <p className="text-sm text-fg-muted">{song.artists}</p> : null}
              {song.notes ? (
                <p className="mt-1 inline-block rounded-md bg-warning-bg px-2 py-0.5 text-xs text-warning-fg">
                  {song.notes}
                </p>
              ) : null}
            </div>
            <div className={cx("flex shrink-0 flex-col items-end gap-1 text-xs text-fg-subtle")}>
              {duration ? <span className="tabular">{duration}</span> : null}
              {song.spotifyUrl ? (
                <a
                  href={song.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(linkClass, "inline-flex items-center gap-1 text-xs")}
                  aria-label={`Ouvir ${song.title} no Spotify`}
                >
                  Spotify
                  <ExternalLinkIcon className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
