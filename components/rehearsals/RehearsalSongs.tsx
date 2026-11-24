"use client";

import type { RehearsalSongStatus } from "@/app/generated/prisma/enums";
import type { SongView } from "@/components/repertoire/SongList";
import { SongCover } from "@/components/repertoire/SongCover";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/fields";
import {
  CheckIcon,
  CloseIcon,
  DragIcon,
  ExternalLinkIcon,
  MoveDownIcon,
  MoveUpIcon,
  SongIcon,
} from "@/components/ui/icons";
import { cx, iconButtonClass, linkClass } from "@/components/ui/styles";
import { songCheckCounts } from "@/lib/rehearsals";
import { formatDuration } from "@/lib/spotify";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Occurrence = { value: string; label: string };

/**
 * Músicas do repertório no ensaio: ordem própria do ensaio (o repertório não muda) e marcação
 * de ensaiada / faltou por data. Administrador organiza e marca; visualizador só vê.
 */
export function RehearsalSongs({
  rehearsalId,
  songs: initialSongs,
  repertoireOrder,
  customOrder,
  canEdit,
  occurrences,
  occurrence,
  checks: initialChecks,
}: {
  rehearsalId: string;
  /** Na ordem do ensaio. */
  songs: SongView[];
  /** Ids na ordem do repertório (para "Usar a ordem do repertório"). */
  repertoireOrder: string[];
  customOrder: boolean;
  canEdit: boolean;
  /** Datas que já chegaram (mais recente primeiro), para escolher qual marcar. */
  occurrences: Occurrence[];
  /** Data selecionada (YYYY-MM-DD) ou null = nenhuma data chegou ainda. */
  occurrence: string | null;
  checks: Record<string, RehearsalSongStatus>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [songs, setSongs] = useState(initialSongs);
  const [checks, setChecks] = useState(initialChecks);
  const [ordering, setOrdering] = useState(false);
  const [draft, setDraft] = useState<SongView[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  // Dados novos do servidor (outra data escolhida, router.refresh) substituem o estado local.
  const [synced, setSynced] = useState({ initialSongs, initialChecks });
  if (synced.initialSongs !== initialSongs || synced.initialChecks !== initialChecks) {
    setSynced({ initialSongs, initialChecks });
    setSongs(initialSongs);
    setChecks(initialChecks);
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const counts = songCheckCounts(
    songs.map((s) => s.id),
    Object.entries(checks).map(([songId, status]) => ({ songId, status })),
  );

  function moveDraft(from: number, to: number) {
    if (to < 0 || to >= draft.length) return;
    setDraft((list) => arrayMove(list, from, to));
    setAnnounce(`${draft[from].title} movida para a posição ${to + 1}.`);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    moveDraft(
      draft.findIndex((s) => s.id === active.id),
      draft.findIndex((s) => s.id === over.id),
    );
  }

  async function saveOrder(list: SongView[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rehearsals/${rehearsalId}/songs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: list.map((s) => s.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível salvar a ordem.");
        return;
      }
      setSongs(list);
      setOrdering(false);
      setNotice(data.followsRepertoire ? "O ensaio voltou a seguir a ordem do repertório." : "Ordem do ensaio salva.");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  async function mark(songId: string, status: RehearsalSongStatus | null) {
    if (!occurrence) return;
    const previous = checks[songId];
    setPending(songId);
    setError(null);
    setChecks((c) => {
      const next = { ...c };
      if (status) next[songId] = status;
      else delete next[songId];
      return next;
    });
    try {
      const res = await fetch(`/api/rehearsals/${rehearsalId}/song-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, occurrenceDate: occurrence, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Não foi possível salvar a marcação.");
      }
    } catch (e) {
      setChecks((c) => {
        const next = { ...c };
        if (previous) next[songId] = previous;
        else delete next[songId];
        return next;
      });
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Falha de conexão. Tente de novo.");
    } finally {
      setPending(null);
    }
  }

  if (songs.length === 0) return <p className="text-sm text-fg-muted">Nenhuma música neste repertório.</p>;

  if (ordering) {
    const byId = new Map(songs.map((s) => [s.id, s]));
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">
          Arraste (no celular, segure o dedo um instante) ou use os botões. Vale só para este ensaio: o repertório
          continua igual.
        </p>
        {error ? <Alert>{error}</Alert> : null}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={draft.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {draft.map((song, index) => (
                <SortableSong
                  key={song.id}
                  song={song}
                  index={index}
                  total={draft.length}
                  onMove={(delta) => moveDraft(index, index + delta)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button loading={saving} onClick={() => void saveOrder(draft)}>
            Salvar ordem
          </Button>
          <Button variant="secondary" disabled={saving} onClick={() => setOrdering(false)}>
            Cancelar
          </Button>
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => setDraft(repertoireOrder.flatMap((id) => byId.get(id) ?? []))}
          >
            Usar a ordem do repertório
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {occurrence ? (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="success">
              {counts.REHEARSED} {counts.REHEARSED === 1 ? "ensaiada" : "ensaiadas"}
            </Badge>
            <Badge tone="danger">
              {counts.MISSED} {counts.MISSED === 1 ? "faltou" : "faltaram"}
            </Badge>
            <Badge>{counts.NONE} sem marcação</Badge>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">
            {canEdit
              ? "No dia do ensaio, marque aqui quais músicas foram ensaiadas e quais faltaram."
              : "No dia do ensaio, as músicas ensaiadas aparecem marcadas aqui."}
          </p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          {occurrences.length > 1 && occurrence ? (
            <SelectField
              label="Ensaio de"
              value={occurrence}
              onChange={(e) =>
                router.push(`${pathname}?data=${e.target.value}`, {
                  scroll: false,
                })
              }
            >
              {occurrences.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          ) : null}
          {canEdit && songs.length > 1 ? (
            <Button
              variant="secondary"
              icon={DragIcon}
              onClick={() => {
                setDraft(songs);
                setNotice(null);
                setError(null);
                setOrdering(true);
              }}
            >
              Organizar ordem
            </Button>
          ) : null}
        </div>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      {customOrder ? (
        <p className="text-xs text-fg-subtle">Ordem própria deste ensaio (diferente da ordem do repertório).</p>
      ) : null}

      <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {songs.map((song, index) => {
          const status = checks[song.id];
          const duration = formatDuration(song.durationMs);
          return (
            <li key={song.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <span className="tabular mt-2.5 w-5 shrink-0 text-right text-sm font-medium text-fg-subtle">
                {index + 1}
              </span>
              <SongCover src={song.imageUrl} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-medium text-fg">{song.title}</p>
                {song.artists ? <p className="text-sm text-fg-muted">{song.artists}</p> : null}
                {song.notes ? (
                  <p className="mt-1 inline-block rounded-md bg-warning-bg px-2 py-0.5 text-xs text-warning-fg">
                    {song.notes}
                  </p>
                ) : null}
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-fg-subtle">
                  {duration ? <span className="tabular">{duration}</span> : null}
                  {song.spotifyUrl ? (
                    <a
                      href={song.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cx(linkClass, "inline-flex items-center gap-1")}
                      aria-label={`Ouvir ${song.title} no Spotify`}
                    >
                      Spotify
                      <ExternalLinkIcon className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </p>
              </div>
              {occurrence ? (
                canEdit ? (
                  <div
                    className="ml-auto flex shrink-0 gap-2 self-center"
                    role="group"
                    aria-label={`${song.title}: ensaiada ou faltou`}
                  >
                    <Button
                      size="sm"
                      variant={status === "REHEARSED" ? "primary" : "secondary"}
                      icon={CheckIcon}
                      aria-pressed={status === "REHEARSED"}
                      disabled={pending === song.id}
                      onClick={() => void mark(song.id, status === "REHEARSED" ? null : "REHEARSED")}
                    >
                      Ensaiada
                    </Button>
                    <Button
                      size="sm"
                      variant={status === "MISSED" ? "danger-solid" : "secondary"}
                      icon={CloseIcon}
                      aria-pressed={status === "MISSED"}
                      disabled={pending === song.id}
                      onClick={() => void mark(song.id, status === "MISSED" ? null : "MISSED")}
                    >
                      Faltou
                    </Button>
                  </div>
                ) : status ? (
                  <span className="ml-auto self-center">
                    <Badge tone={status === "REHEARSED" ? "success" : "danger"}>
                      {status === "REHEARSED" ? "Ensaiada" : "Faltou"}
                    </Badge>
                  </span>
                ) : null
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SortableSong({
  song,
  index,
  total,
  onMove,
}: {
  song: SongView;
  index: number;
  total: number;
  onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "flex items-center gap-2 rounded-lg border border-line bg-surface p-2",
        isDragging && "relative z-10 shadow-lg ring-1 ring-focus",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Arrastar ${song.title} (posição ${index + 1} de ${total})`}
        className={cx(iconButtonClass("sm"), "cursor-grab touch-none active:cursor-grabbing")}
      >
        <DragIcon aria-hidden />
      </button>
      <span className="tabular w-5 shrink-0 text-right text-sm font-medium text-fg-subtle" aria-hidden>
        {index + 1}
      </span>
      {song.imageUrl ? (
        <SongCover src={song.imageUrl} />
      ) : (
        <SongIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{song.title}</p>
        {song.artists ? <p className="truncate text-xs text-fg-muted">{song.artists}</p> : null}
      </div>
      <button
        type="button"
        className={iconButtonClass("sm")}
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`Subir ${song.title}`}
        title="Subir"
      >
        <MoveUpIcon aria-hidden />
      </button>
      <button
        type="button"
        className={iconButtonClass("sm")}
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label={`Descer ${song.title}`}
        title="Descer"
      >
        <MoveDownIcon aria-hidden />
      </button>
    </li>
  );
}
