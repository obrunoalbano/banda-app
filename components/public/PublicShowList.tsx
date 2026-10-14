import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ExternalLinkIcon, ShowIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/styles";
import { dateParts } from "@/lib/format";
import type { PublicShow } from "@/lib/public-agenda";

/**
 * Lista de próximos shows da agenda pública (página /b/<slug> e widget).
 * Recebe só `PublicShow` (já filtrado por toPublicShow) — nunca dados internos.
 */
export function PublicShowList({
  shows,
  compact,
  emptyMessage = "Nenhum show agendado no momento.",
}: {
  shows: PublicShow[];
  /** Widget: espaçamento menor. */
  compact?: boolean;
  emptyMessage?: string;
}) {
  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
        <ShowIcon className="size-8 text-fg-subtle" aria-hidden strokeWidth={1.5} />
        <p className="mt-3 text-sm text-fg-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {shows.map((show) => {
        const d = dateParts(show.date);
        const cancelled = show.status === "cancelled";
        const place = [show.city, show.state].filter(Boolean).join(" — ");
        return (
          <li
            key={show.id}
            className={cx("flex flex-wrap items-center gap-4", compact ? "px-3 py-3" : "px-4 py-4 sm:px-5")}
          >
            <time
              dateTime={`${show.date}T${show.time}`}
              title={d.long}
              className={cx(
                "flex w-14 shrink-0 flex-col items-center rounded-md border border-line bg-surface-muted py-1.5 leading-none",
                cancelled && "opacity-60",
              )}
            >
              <span className="text-xs font-medium uppercase text-fg-subtle">{d.month}</span>
              <span className="tabular mt-1 text-xl font-semibold text-fg">{d.day}</span>
              <span className="mt-1 text-xs text-fg-subtle">{d.weekday}</span>
            </time>

            <div className="min-w-0 flex-1">
              <p className={cx("font-medium text-fg", cancelled && "line-through decoration-fg-subtle")}>
                {show.title}
              </p>
              <p className="tabular mt-0.5 text-sm text-fg-muted">
                {place ? `${place} · ` : ""}
                {show.time}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {cancelled ? (
                <Badge tone="danger">Cancelado</Badge>
              ) : show.ticketUrl ? (
                <ButtonLink
                  href={show.ticketUrl}
                  size="sm"
                  variant="secondary"
                  icon={ExternalLinkIcon}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ingressos
                </ButtonLink>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
