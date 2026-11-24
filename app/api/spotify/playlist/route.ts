import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { MAX_REPERTOIRE_SONGS } from "@/lib/repertoire";
import { fetchSpotifyPlaylist, parseSpotifyPlaylistId } from "@/lib/spotify";
import { spotifyPlaylistSchema } from "@/lib/validations";

/**
 * Músicas de uma playlist pública do Spotify (criar repertório a partir dela). Não grava nada:
 * devolve as músicas para o formulário, onde a pessoa revisa e salva. Só monta URLs do Spotify.
 */
export const POST = withBand(async (request, { bandId }) => {
  const limited = rateLimit(
    `spotify-playlist:${bandId}`,
    RATE_LIMITS.spotifyPlaylist,
  );
  if (!limited.ok)
    return jsonError(429, "Muitas importações seguidas. Aguarde um minuto.");

  const parsed = await parseBody(request, spotifyPlaylistSchema);
  if (!parsed.ok) return parsed.response;
  const playlistId = parseSpotifyPlaylistId(parsed.data.url);
  if (!playlistId)
    return jsonError(
      400,
      "Link inválido. Use o link de uma playlist do Spotify (Compartilhar → Copiar link da playlist).",
    );

  try {
    const playlist = await fetchSpotifyPlaylist(
      playlistId,
      MAX_REPERTOIRE_SONGS,
    );
    if (!playlist)
      return jsonError(
        404,
        "Playlist não encontrada. Confira se ela é pública no Spotify.",
      );
    if (playlist.tracks.length === 0)
      return jsonError(422, "Essa playlist não tem músicas para importar.");
    return NextResponse.json(playlist);
  } catch {
    return jsonError(
      502,
      "Não foi possível falar com o Spotify agora. Tente de novo em instantes.",
    );
  }
});
