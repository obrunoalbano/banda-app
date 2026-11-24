import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { fetchSpotifyTrack, parseSpotifyTrackId } from "@/lib/spotify";
import { spotifyLookupSchema } from "@/lib/validations";

/** Dados da música pelo link do Spotify (Repertórios). Só monta URLs do Spotify a partir do ID. */
export const POST = withBand(async (request, { bandId }) => {
  const limited = rateLimit(`spotify:${bandId}`, RATE_LIMITS.spotifyLookup);
  if (!limited.ok) return jsonError(429, "Muitas buscas seguidas. Aguarde um minuto.");

  const parsed = await parseBody(request, spotifyLookupSchema);
  if (!parsed.ok) return parsed.response;
  const trackId = parseSpotifyTrackId(parsed.data.url);
  if (!trackId)
    return jsonError(400, "Link inválido. Use o link de uma música do Spotify (Compartilhar → Copiar link).");

  try {
    const track = await fetchSpotifyTrack(trackId);
    if (!track) return jsonError(404, "Música não encontrada no Spotify. Preencha os dados à mão.");
    return NextResponse.json(track);
  } catch {
    return jsonError(502, "Não foi possível falar com o Spotify agora. Preencha os dados à mão.");
  }
});
