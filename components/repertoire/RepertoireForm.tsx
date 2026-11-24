"use client";

import { FormActions } from "@/components/FormActions";
import { SongCover } from "@/components/repertoire/SongCover";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/fields";
import {
  DeleteIcon,
  DragIcon,
  ExternalLinkIcon,
  MoveDownIcon,
  MoveUpIcon,
  PlaylistIcon,
  SearchIcon,
  SongIcon,
} from "@/components/ui/icons";
import { cx, iconButtonClass, linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { MAX_REPERTOIRE_SONGS } from "@/lib/repertoire";
import { formatDuration, isSpotifyPlaylistLink } from "@/lib/spotify";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export type SongInput = {
  /** Música já salva (mantém o id ao salvar). */
  id?: string;
  title: string;
  artists: string | null;
  spotifyUrl: string | null;
  imageUrl: string | null;
  durationMs: number | null;
  notes: string | null;
};

type SongRow = {
  key: string;
  id?: string;
  title: string;
  artists: string;
  spotifyUrl: string | null;
  imageUrl: string | null;
  durationMs: number | null;
  notes: string;
};

export type RepertoireFormData = {
  id: string;
  name: string;
  description: string | null;
  songs: SongInput[];
};

let keySeq = 0;
const newKey = () => `s${++keySeq}-${Date.now()}`;

const toRow = (s: SongInput): SongRow => ({
  key: newKey(),
  id: s.id,
  title: s.title,
  artists: s.artists ?? "",
  spotifyUrl: s.spotifyUrl,
  imageUrl: s.imageUrl,
  durationMs: s.durationMs,
  notes: s.notes ?? "",
});

/**
 * Cadastro/edição de repertório: dados + músicas. Música entra pelo link do Spotify (nome,
 * artistas e capa preenchidos sozinhos, editáveis) ou à mão. Ordem por arrastar (mouse, toque
 * longo ou teclado) ou pelos botões subir/descer. Salva a lista inteira de uma vez.
 */
export function RepertoireForm({
  mode,
  repertoire,
}: {
  mode: "create" | "edit";
  repertoire?: RepertoireFormData;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [name, setName] = useState(repertoire?.name ?? "");
  const [description, setDescription] = useState(repertoire?.description ?? "");
  const [songs, setSongs] = useState<SongRow[]>(() =>
    (repertoire?.songs ?? []).map(toRow),
  );
  const [link, setLink] = useState("");
  const [lookup, setLookup] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [announce, setAnnounce] = useState("");
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [playlistLink, setPlaylistLink] = useState("");
  const [playlist, setPlaylist] = useState<{
    loading: boolean;
    error: string | null;
    notice: {
      tone: "success" | "warning";
      text: string;
      source: "playlist" | "song";
    } | null;
  }>({ loading: false, error: null, notice: null });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Toque longo para arrastar: rolar a lista continua funcionando.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const update = (key: string, patch: Partial<SongRow>) =>
    setSongs((list) =>
      list.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );

  function move(index: number, delta: number) {
    const to = index + delta;
    if (to < 0 || to >= songs.length) return;
    setSongs((list) => arrayMove(list, index, to));
    setAnnounce(
      `${songs[index].title || "Música"} movida para a posição ${to + 1}.`,
    );
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = songs.findIndex((s) => s.key === active.id);
    const to = songs.findIndex((s) => s.key === over.id);
    setSongs((list) => arrayMove(list, from, to));
    setAnnounce(
      `${songs[from].title || "Música"} movida para a posição ${to + 1}.`,
    );
  }

  function add(row: SongRow) {
    setLastAdded(row.key);
    setSongs((list) => [...list, row]);
  }

  type PlaylistTrack = {
    title: string;
    artists: string | null;
    spotifyUrl: string;
    imageUrl: string | null;
    durationMs: number | null;
  };

  /**
   * Carrega as músicas de uma playlist pública e coloca no fim da lista (as que já estão no
   * repertório ficam de fora). Nome/descrição vazios recebem os da playlist. Nada é salvo
   * até a pessoa clicar em criar/salvar.
   */
  async function importPlaylist(url: string, source: "playlist" | "song") {
    const setError = (message: string) =>
      source === "playlist"
        ? setPlaylist({ loading: false, error: message, notice: null })
        : setLookup({ loading: false, error: message });
    if (!url.trim()) return setError("Cole o link da playlist no Spotify.");
    if (source === "playlist")
      setPlaylist({ loading: true, error: null, notice: null });
    else setLookup({ loading: true, error: null });
    try {
      const res = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        return setError(
          typeof data.error === "string"
            ? data.error
            : "Não foi possível carregar a playlist.",
        );

      const existing = new Set(songs.map((s) => s.spotifyUrl).filter(Boolean));
      const fresh = (data.tracks as PlaylistTrack[]).filter(
        (t) => !existing.has(t.spotifyUrl),
      );
      const room = Math.max(0, MAX_REPERTOIRE_SONGS - songs.length);
      const added = fresh.slice(0, room);
      setSongs((list) => [
        ...list,
        ...added.map((t) => toRow({ ...t, notes: null })),
      ]);
      if (!name.trim() && data.name) setName(data.name);
      if (!description.trim() && data.description)
        setDescription(data.description);

      const skipped = data.tracks.length - fresh.length;
      const allSkipped =
        added.length === 0 && skipped > 0 && fresh.length === 0;
      const parts = allSkipped
        ? [
            `Todas as músicas da playlist “${data.name}” já estavam no repertório.`,
          ]
        : [
            `${added.length} ${added.length === 1 ? "música carregada" : "músicas carregadas"} da playlist “${data.name}”.`,
          ];
      if (skipped && !allSkipped)
        parts.push(
          `${skipped} já ${skipped === 1 ? "estava" : "estavam"} no repertório.`,
        );
      const cut = data.truncated || fresh.length > room;
      if (cut)
        parts.push(
          fresh.length > room
            ? `O repertório chegou ao limite de ${MAX_REPERTOIRE_SONGS} músicas.`
            : "O Spotify só deixa carregar as primeiras 100 músicas da playlist; se faltou alguma, adicione pelo link.",
        );
      if (!allSkipped) parts.push("Revise, edite e salve.");
      const notice = {
        tone: cut ? ("warning" as const) : ("success" as const),
        text: parts.join(" "),
        source,
      };
      setPlaylist({ loading: false, error: null, notice });
      setLookup({ loading: false, error: null });
      if (source === "playlist") setPlaylistLink("");
      else setLink("");
    } catch {
      setError("Falha de conexão. Tente de novo.");
    }
  }

  async function addFromSpotify() {
    if (isSpotifyPlaylistLink(link)) return importPlaylist(link, "song");
    if (!link.trim()) {
      setLookup({ loading: false, error: "Cole o link da música no Spotify." });
      return;
    }
    setLookup({ loading: true, error: null });
    try {
      const res = await fetch("/api/spotify/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLookup({
          loading: false,
          error:
            typeof data.error === "string"
              ? data.error
              : "Não foi possível buscar.",
        });
        return;
      }
      add({
        key: newKey(),
        title: data.title ?? "",
        artists: data.artists ?? "",
        spotifyUrl: data.spotifyUrl ?? null,
        imageUrl: data.imageUrl ?? null,
        durationMs: data.durationMs ?? null,
        notes: "",
      });
      setLink("");
      setLookup({ loading: false, error: null });
      setAnnounce(`${data.title} adicionada ao repertório.`);
    } catch {
      setLookup({
        loading: false,
        error: "Falha de conexão. Tente de novo ou preencha à mão.",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name,
      description,
      songs: songs.map((s) => ({
        id: s.id,
        title: s.title,
        artists: s.artists,
        spotifyUrl: s.spotifyUrl,
        imageUrl: s.imageUrl,
        durationMs: s.durationMs,
        notes: s.notes,
      })),
    };
    const data = await submit<{ id: string }>(
      mode === "create"
        ? "/api/repertoires"
        : `/api/repertoires/${repertoire!.id}`,
      mode === "create" ? "POST" : "PATCH",
      body,
    );
    if (!data) return;
    router.push(`/repertorios/${mode === "create" ? data.id : repertoire!.id}`);
    router.refresh();
  }

  const cancelHref = repertoire
    ? `/repertorios/${repertoire.id}`
    : "/repertorios";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      {error ? <Alert>{error}</Alert> : null}
      {mode === "create" ? (
        <section
          aria-labelledby="playlist-titulo"
          className="flex flex-col gap-3 rounded-lg border border-line bg-surface-muted p-4"
        >
          <div>
            <h2
              id="playlist-titulo"
              className="flex items-center gap-2 text-base font-semibold text-fg"
            >
              <PlaylistIcon className="size-4 text-fg-subtle" aria-hidden />
              Começar de uma playlist do Spotify
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Opcional. Cole o link de uma playlist pública: as músicas entram
              na lista abaixo e você edita antes de salvar.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <TextField
              label="Link da playlist"
              className="flex-1"
              inputMode="url"
              placeholder="https://open.spotify.com/playlist/…"
              value={playlistLink}
              onChange={(e) => setPlaylistLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void importPlaylist(playlistLink, "playlist");
                }
              }}
            />
            <Button
              type="button"
              icon={PlaylistIcon}
              loading={playlist.loading}
              onClick={() => void importPlaylist(playlistLink, "playlist")}
            >
              Carregar músicas
            </Button>
          </div>
          {playlist.error ? (
            <Alert tone="warning">{playlist.error}</Alert>
          ) : null}
          {playlist.notice?.source === "playlist" ? (
            <Alert tone={playlist.notice.tone}>{playlist.notice.text}</Alert>
          ) : null}
          <p className="text-xs text-fg-subtle">
            No Spotify: na playlist, Compartilhar → Copiar link da playlist.
          </p>
        </section>
      ) : null}
      <div className="grid gap-4">
        <TextField
          label="Nome"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextAreaField
          label="Descrição"
          rows={2}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          hint="Opcional. Ex.: show de casamento, set acústico."
        />
      </div>

      <section aria-labelledby="musicas-titulo" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="musicas-titulo" className="text-base font-semibold text-fg">
            Músicas{" "}
            <span className="font-normal text-fg-subtle">({songs.length})</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-muted p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <TextField
              label="Link da música (ou playlist) no Spotify"
              className="flex-1"
              inputMode="url"
              placeholder="https://open.spotify.com/track/…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                // Enter busca a música em vez de enviar o formulário inteiro.
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addFromSpotify();
                }
              }}
            />
            <Button
              type="button"
              icon={SearchIcon}
              loading={lookup.loading}
              onClick={() => void addFromSpotify()}
            >
              Buscar e adicionar
            </Button>
          </div>
          {lookup.error ? <Alert tone="warning">{lookup.error}</Alert> : null}
          <p className="text-xs text-fg-subtle">
            No Spotify: Compartilhar → Copiar link da música. Nome, artistas e
            capa vêm sozinhos.{" "}
            <button
              type="button"
              className={linkClass}
              onClick={() =>
                add({
                  key: newKey(),
                  title: "",
                  artists: "",
                  spotifyUrl: null,
                  imageUrl: null,
                  durationMs: null,
                  notes: "",
                })
              }
            >
              Adicionar sem link
            </button>
          </p>
        </div>

        {playlist.notice?.source === "song" ? (
          <Alert tone={playlist.notice.tone}>{playlist.notice.text}</Alert>
        ) : null}

        {songs.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 text-sm text-fg-muted">
            <SongIcon className="size-4 text-fg-subtle" aria-hidden />
            Nenhuma música ainda. Busque pelo link do Spotify ou adicione sem
            link.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={songs.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="flex flex-col gap-2">
                {songs.map((song, index) => (
                  <SongItem
                    key={song.key}
                    song={song}
                    index={index}
                    total={songs.length}
                    autoFocus={lastAdded === song.key && !song.title}
                    onChange={(patch) => update(song.key, patch)}
                    onMove={(delta) => move(index, delta)}
                    onRemove={() => {
                      setSongs((list) =>
                        list.filter((s) => s.key !== song.key),
                      );
                      setAnnounce(`${song.title || "Música"} removida.`);
                    }}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </section>

      <FormActions
        loading={loading}
        submitLabel={
          mode === "create" ? "Criar repertório" : "Salvar alterações"
        }
        cancelHref={cancelHref}
      />
    </form>
  );
}

function SongItem({
  song,
  index,
  total,
  autoFocus,
  onChange,
  onMove,
  onRemove,
}: {
  song: SongRow;
  index: number;
  total: number;
  autoFocus: boolean;
  onChange: (patch: Partial<SongRow>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: song.key,
  });
  const label = song.title || `Música ${index + 1}`;
  const duration = formatDuration(song.durationMs);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "rounded-lg border border-line bg-surface p-3",
        isDragging && "relative z-10 shadow-lg ring-1 ring-focus",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${label} (posição ${index + 1} de ${total})`}
          className={cx(
            iconButtonClass("sm"),
            "mt-1 cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <DragIcon aria-hidden />
        </button>
        <span
          className="tabular mt-2.5 w-5 shrink-0 text-right text-sm font-medium text-fg-subtle"
          aria-hidden
        >
          {index + 1}
        </span>
        <SongCover src={song.imageUrl} className="mt-0.5" />

        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <TextField
            label="Nome da música"
            required
            maxLength={200}
            autoFocus={autoFocus}
            value={song.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <TextField
            label="Artistas"
            maxLength={300}
            value={song.artists}
            onChange={(e) => onChange({ artists: e.target.value })}
          />
          <TextField
            label="Observação"
            className="sm:col-span-2"
            maxLength={300}
            placeholder="Ex.: toca em um tom a menos"
            value={song.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
          {song.spotifyUrl ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle sm:col-span-2">
              <a
                href={song.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className={cx(linkClass, "inline-flex items-center gap-1")}
              >
                Ouvir no Spotify
                <ExternalLinkIcon className="size-3" aria-hidden />
              </a>
              {duration ? <span>{duration}</span> : null}
              <button
                type="button"
                className="underline underline-offset-2 hover:no-underline"
                onClick={() =>
                  onChange({
                    spotifyUrl: null,
                    imageUrl: null,
                    durationMs: null,
                  })
                }
              >
                Tirar o link
              </button>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            className={iconButtonClass("sm")}
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Subir ${label}`}
            title="Subir"
          >
            <MoveUpIcon aria-hidden />
          </button>
          <button
            type="button"
            className={iconButtonClass("sm")}
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Descer ${label}`}
            title="Descer"
          >
            <MoveDownIcon aria-hidden />
          </button>
          <button
            type="button"
            className={cx(iconButtonClass("sm"), "text-danger-fg")}
            onClick={onRemove}
            aria-label={`Remover ${label}`}
            title="Remover"
          >
            <DeleteIcon aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
