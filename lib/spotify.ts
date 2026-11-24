/**
 * Dados de uma música do Spotify a partir do link (Repertórios). Ver docs/ensaios.md.
 *
 * Nunca buscamos a URL colada pelo usuário: extraímos o ID da faixa e montamos a URL do Spotify
 * (sem SSRF). Com SPOTIFY_CLIENT_ID/SECRET usa a Web API oficial; sem elas, lê as metatags
 * públicas da página da faixa (og:title = nome, og:description = "Artista · Álbum · Song · Ano").
 */

export type SpotifyTrack = {
  trackId: string;
  spotifyUrl: string;
  title: string;
  artists: string | null;
  imageUrl: string | null;
  durationMs: number | null;
};

const TRACK_ID = /^[A-Za-z0-9]{22}$/;

/** ID da faixa: open.spotify.com/(intl-xx/)track/<id>, spotify:track:<id> ou o próprio ID. */
export function parseSpotifyTrackId(input: string): string | null {
  const value = input.trim();
  if (TRACK_ID.test(value)) return value;
  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(value);
  if (uri) return uri[1];
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (
    url.hostname !== "open.spotify.com" &&
    url.hostname !== "play.spotify.com"
  )
    return null;
  const match =
    /^\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]{22})\/?$/.exec(
      url.pathname,
    );
  return match ? match[1] : null;
}

export function spotifyTrackUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`;
}

/** Só capas servidas pelo CDN do Spotify (o resto é descartado). */
export function safeSpotifyImage(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  return /^https:\/\/i\.scdn\.co\/image\/[A-Za-z0-9]+$/.test(url) ? url : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function meta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`,
    "i",
  );
  const m = re.exec(html);
  return m ? decodeEntities(m[1]).trim() || null : null;
}

/** Lê nome/artistas/capa/duração das metatags da página pública da faixa. */
export function parseTrackPage(
  html: string,
  trackId: string,
): SpotifyTrack | null {
  const title = meta(html, "og:title");
  if (!title) return null;
  const description = meta(html, "og:description");
  // "Rick Astley · Whenever You Need Somebody · Song · 1987" → primeiro trecho = artistas.
  const artists = description?.split(" · ")[0]?.trim() || null;
  const duration = Number(meta(html, "music:duration"));
  return {
    trackId,
    spotifyUrl: spotifyTrackUrl(trackId),
    title,
    artists,
    imageUrl: safeSpotifyImage(meta(html, "og:image")),
    durationMs:
      Number.isFinite(duration) && duration > 0 ? duration * 1000 : null,
  };
}

type WebApiTrack = {
  name: string;
  duration_ms?: number;
  artists?: { name: string }[];
  album?: { images?: { url: string; width?: number }[] };
};

export function fromWebApiTrack(
  data: WebApiTrack,
  trackId: string,
): SpotifyTrack {
  const images = data.album?.images ?? [];
  // Menor capa com ≥ 64px (lista do Spotify vem da maior para a menor).
  const image =
    [...images].reverse().find((i) => (i.width ?? 0) >= 64) ?? images[0];
  return {
    trackId,
    spotifyUrl: spotifyTrackUrl(trackId),
    title: data.name,
    artists: data.artists?.map((a) => a.name).join(", ") || null,
    imageUrl: safeSpotifyImage(image?.url),
    durationMs: data.duration_ms ?? null,
  };
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function webApiToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000)
    return tokenCache.token;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

/** Busca a faixa (Web API se configurada; senão metatags da página pública). `null` = não encontrada. */
export async function fetchSpotifyTrack(
  trackId: string,
): Promise<SpotifyTrack | null> {
  if (!TRACK_ID.test(trackId)) return null;
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    const token = await webApiToken(clientId, clientSecret).catch(() => null);
    if (token) {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null);
      if (res?.ok)
        return fromWebApiTrack((await res.json()) as WebApiTrack, trackId);
      if (res?.status === 404 || res?.status === 400) return null;
    }
  }
  const res = await fetch(spotifyTrackUrl(trackId), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; banda-app)",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
    signal: AbortSignal.timeout(5_000),
    redirect: "follow",
  });
  if (!res.ok) return null;
  return parseTrackPage(await res.text(), trackId);
}

/* ── Playlist pública (importar repertório) ───────────────────────── */

export type SpotifyPlaylist = {
  playlistId: string;
  name: string;
  description: string | null;
  tracks: SpotifyTrack[];
  /** Playlist tem mais músicas do que vieram (limite do repertório ou da página pública). */
  truncated: boolean;
};

const PLAYLIST_ID = /^[A-Za-z0-9]{22}$/;

/** ID da playlist: open.spotify.com/(intl-xx/)(embed/)playlist/<id> ou spotify:playlist:<id>. */
export function parseSpotifyPlaylistId(input: string): string | null {
  const value = input.trim();
  const uri = /^spotify:playlist:([A-Za-z0-9]{22})$/.exec(value);
  if (uri) return uri[1];
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (
    url.hostname !== "open.spotify.com" &&
    url.hostname !== "play.spotify.com"
  )
    return null;
  const match =
    /^\/(?:intl-[a-z-]+\/)?(?:embed\/)?playlist\/([A-Za-z0-9]{22})\/?$/.exec(
      url.pathname,
    );
  return match ? match[1] : null;
}

/** Link de playlist? (o campo de link do formulário aceita música ou playlist). */
export function isSpotifyPlaylistLink(input: string): boolean {
  return parseSpotifyPlaylistId(input) !== null;
}

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** Monta a faixa com os limites do schema do repertório (nome 200, artistas 300). */
function playlistTrack(
  trackId: string,
  title: string,
  artists: string | null,
  imageUrl: string | null,
  durationMs: number | null,
): SpotifyTrack {
  return {
    trackId,
    spotifyUrl: spotifyTrackUrl(trackId),
    title: clip(title.trim(), 200),
    artists: artists
      ? clip(artists.replace(/\s*,\s*/g, ", ").trim(), 300) || null
      : null,
    imageUrl,
    durationMs: durationMs && durationMs > 0 ? Math.round(durationMs) : null,
  };
}

type EmbedEntity = {
  name?: string;
  title?: string;
  trackList?: {
    uri?: string;
    title?: string;
    subtitle?: string;
    duration?: number;
    entityType?: string;
  }[];
};

/**
 * Lê a playlist do JSON da página do player incorporável (`/embed/playlist/<id>`, campo
 * `__NEXT_DATA__`). Só faixas (episódios de podcast ficam de fora); sem capa por música.
 * O Spotify entrega no máximo 100 músicas nessa página.
 */
export function parsePlaylistEmbed(
  html: string,
  playlistId: string,
  max: number,
): SpotifyPlaylist | null {
  const m =
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(
      html,
    );
  if (!m) return null;
  let entity: EmbedEntity | undefined;
  try {
    entity = JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity;
  } catch {
    return null;
  }
  const name = (entity?.name ?? entity?.title)?.trim();
  if (!entity || !name || !Array.isArray(entity.trackList)) return null;
  const tracks: SpotifyTrack[] = [];
  for (const item of entity.trackList) {
    const id = /^spotify:track:([A-Za-z0-9]{22})$/.exec(item.uri ?? "")?.[1];
    if (
      !id ||
      (item.entityType && item.entityType !== "track") ||
      !item.title?.trim()
    )
      continue;
    tracks.push(
      playlistTrack(
        id,
        item.title,
        item.subtitle ?? null,
        null,
        item.duration ?? null,
      ),
    );
  }
  return {
    playlistId,
    name: clip(name, 120),
    description: null,
    tracks: tracks.slice(0, max),
    truncated: tracks.length > max || entity.trackList.length >= 100,
  };
}

type WebApiPlaylistItem = {
  track: (WebApiTrack & { id?: string | null; type?: string }) | null;
};

/** Converte os itens da Web API (ignora episódios, faixas locais e removidas). */
export function fromWebApiPlaylistItems(
  items: WebApiPlaylistItem[],
): SpotifyTrack[] {
  const tracks: SpotifyTrack[] = [];
  for (const { track } of items) {
    if (
      !track ||
      track.type !== "track" ||
      !track.id ||
      !TRACK_ID.test(track.id) ||
      !track.name?.trim()
    )
      continue;
    const t = fromWebApiTrack(track, track.id);
    tracks.push(
      playlistTrack(t.trackId, t.title, t.artists, t.imageUrl, t.durationMs),
    );
  }
  return tracks;
}

async function fetchPlaylistWebApi(
  token: string,
  playlistId: string,
  max: number,
): Promise<SpotifyPlaylist | null | "fallback"> {
  const headers = { Authorization: `Bearer ${token}` };
  const info = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,description,tracks.total`,
    { headers, signal: AbortSignal.timeout(5_000) },
  ).catch(() => null);
  if (info?.status === 404) return null;
  if (!info?.ok) return "fallback";
  const meta = (await info.json()) as {
    name: string;
    description?: string;
    tracks?: { total?: number };
  };
  const tracks: SpotifyTrack[] = [];
  const fields =
    "items(track(id,type,name,duration_ms,artists(name),album(images))),next";
  let next: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=${encodeURIComponent(fields)}`;
  // Teto de páginas: o repertório aceita no máximo `max` músicas.
  for (
    let page = 0;
    next && tracks.length < max && page < Math.ceil(max / 100) + 1;
    page++
  ) {
    if (!next.startsWith("https://api.spotify.com/")) break;
    const res: Response | null = await fetch(next, {
      headers,
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null);
    if (!res?.ok)
      return tracks.length ? { ...build(), truncated: true } : "fallback";
    const data = (await res.json()) as {
      items: WebApiPlaylistItem[];
      next: string | null;
    };
    tracks.push(...fromWebApiPlaylistItems(data.items ?? []));
    next = data.next;
  }
  function build(): SpotifyPlaylist {
    return {
      playlistId,
      name: clip(meta.name?.trim() || "Playlist do Spotify", 120),
      // A descrição da Web API vem com HTML (links); fica só o texto.
      description: meta.description
        ? clip(
            decodeEntities(meta.description.replace(/<[^>]*>/g, "")).trim(),
            1000,
          ) || null
        : null,
      tracks: tracks.slice(0, max),
      truncated: tracks.length > max || Boolean(next),
    };
  }
  return build();
}

/**
 * Busca a playlist pública (Web API se configurada; senão a página do player incorporável).
 * `null` = não encontrada / privada. Nunca busca a URL colada: só monta URLs do Spotify pelo ID.
 */
export async function fetchSpotifyPlaylist(
  playlistId: string,
  max: number,
): Promise<SpotifyPlaylist | null> {
  if (!PLAYLIST_ID.test(playlistId)) return null;
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    const token = await webApiToken(clientId, clientSecret).catch(() => null);
    if (token) {
      const result = await fetchPlaylistWebApi(token, playlistId, max);
      if (result !== "fallback") return result;
    }
  }
  const res = await fetch(
    `https://open.spotify.com/embed/playlist/${playlistId}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; banda-app)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(8_000),
      redirect: "follow",
    },
  );
  if (!res.ok) return null;
  return parsePlaylistEmbed(await res.text(), playlistId, max);
}

/** "3:32" (música) · "1h05" (repertório inteiro, a partir de 1 hora). */
export function formatDuration(ms: number | null | undefined): string | null {
  if (!ms || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  if (total >= 3600) {
    const minutes = Math.round(total / 60);
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
