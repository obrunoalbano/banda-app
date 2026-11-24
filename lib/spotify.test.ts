import { describe, expect, it } from "vitest";
import {
  formatDuration,
  fromWebApiPlaylistItems,
  fromWebApiTrack,
  isSpotifyPlaylistLink,
  parsePlaylistEmbed,
  parseSpotifyPlaylistId,
  parseSpotifyTrackId,
  parseTrackPage,
  safeSpotifyImage,
} from "./spotify";

const ID = "4uLU6hMCjMI75M1A2tKUQC";

describe("parseSpotifyTrackId", () => {
  it.each([
    `https://open.spotify.com/track/${ID}`,
    `https://open.spotify.com/track/${ID}?si=abc123`,
    `https://open.spotify.com/intl-pt/track/${ID}`,
    `https://open.spotify.com/embed/track/${ID}`,
    `spotify:track:${ID}`,
    ID,
    `  https://open.spotify.com/track/${ID}/  `,
  ])("%s", (input) => expect(parseSpotifyTrackId(input)).toBe(ID));

  it.each([
    `https://open.spotify.com/album/${ID}`,
    `https://evil.example/track/${ID}`,
    `https://open.spotify.com.evil.example/track/${ID}`,
    `javascript:alert(1)`,
    "",
    "não é link",
  ])("recusa %s", (input) => expect(parseSpotifyTrackId(input)).toBeNull());
});

describe("parseTrackPage", () => {
  it("lê nome, artistas, capa e duração das metatags", () => {
    const html = `<html><head>
      <meta property="og:title" content="Garota de Ipanema"/>
      <meta property="og:description" content="Tom Jobim, Vinicius de Moraes &amp; Cia · Getz/Gilberto · Song · 1964"/>
      <meta property="og:image" content="https://i.scdn.co/image/ab67616d0000b273255e131abc1410833be95673"/>
      <meta name="music:duration" content="321"/>
    </head></html>`;
    expect(parseTrackPage(html, ID)).toEqual({
      trackId: ID,
      spotifyUrl: `https://open.spotify.com/track/${ID}`,
      title: "Garota de Ipanema",
      artists: "Tom Jobim, Vinicius de Moraes & Cia",
      imageUrl:
        "https://i.scdn.co/image/ab67616d0000b273255e131abc1410833be95673",
      durationMs: 321000,
    });
  });
  it("página sem og:title → null", () => {
    expect(parseTrackPage("<html></html>", ID)).toBeNull();
  });
});

describe("fromWebApiTrack", () => {
  it("junta artistas e escolhe a capa", () => {
    const track = fromWebApiTrack(
      {
        name: "Música",
        duration_ms: 200000,
        artists: [{ name: "A" }, { name: "B" }],
        album: {
          images: [
            { url: "https://i.scdn.co/image/big", width: 640 },
            { url: "https://i.scdn.co/image/mid", width: 300 },
            { url: "https://i.scdn.co/image/small", width: 64 },
          ],
        },
      },
      ID,
    );
    expect(track.artists).toBe("A, B");
    expect(track.imageUrl).toBe("https://i.scdn.co/image/small");
    expect(track.durationMs).toBe(200000);
  });
});

describe("helpers", () => {
  it("só aceita capas do CDN do Spotify", () => {
    expect(safeSpotifyImage("https://i.scdn.co/image/abc123")).toBe(
      "https://i.scdn.co/image/abc123",
    );
    expect(safeSpotifyImage("https://evil.example/x.png")).toBeNull();
    expect(safeSpotifyImage(null)).toBeNull();
  });
  it("formata duração", () => {
    expect(formatDuration(212000)).toBe("3:32");
    expect(formatDuration(59000)).toBe("0:59");
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(3_900_000)).toBe("1h05");
  });
});

describe("playlist", () => {
  const PID = "37i9dQZF1DXcBWIGoYBM5M";
  const T1 = "4HCOHRCSQelz2GPX8iTamO";
  const T2 = "2sFepQNyl1WjpROruP8bJ0";

  it.each([
    `https://open.spotify.com/playlist/${PID}`,
    `https://open.spotify.com/playlist/${PID}?si=abc`,
    `https://open.spotify.com/intl-pt/playlist/${PID}`,
    `https://open.spotify.com/embed/playlist/${PID}`,
    `spotify:playlist:${PID}`,
  ])("lê o ID de %s", (input) => {
    expect(parseSpotifyPlaylistId(input)).toBe(PID);
    expect(isSpotifyPlaylistLink(input)).toBe(true);
  });

  it.each([
    `https://open.spotify.com/track/${PID}`,
    `https://evil.example/playlist/${PID}`,
    PID, // ID solto é tratado como música
    "",
  ])("recusa %s", (input) => expect(parseSpotifyPlaylistId(input)).toBeNull());

  function embed(entity: unknown) {
    return `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      {
        props: { pageProps: { state: { data: { entity } } } },
      },
    )}</script></html>`;
  }

  it("lê músicas da página do player (sem episódios)", () => {
    const html = embed({
      name: "Ensaio de sábado",
      trackList: [
        {
          uri: `spotify:track:${T1}`,
          title: "Música A",
          subtitle: "Artista 1, Artista 2",
          duration: 224877,
          entityType: "track",
        },
        {
          uri: "spotify:episode:xxxxxxxxxxxxxxxxxxxxxx",
          title: "Podcast",
          subtitle: "X",
          duration: 1,
          entityType: "episode",
        },
        {
          uri: `spotify:track:${T2}`,
          title: "Música B",
          subtitle: "Artista 3",
          duration: 208810,
          entityType: "track",
        },
      ],
    });
    expect(parsePlaylistEmbed(html, PID, 200)).toEqual({
      playlistId: PID,
      name: "Ensaio de sábado",
      description: null,
      truncated: false,
      tracks: [
        {
          trackId: T1,
          spotifyUrl: `https://open.spotify.com/track/${T1}`,
          title: "Música A",
          artists: "Artista 1, Artista 2",
          imageUrl: null,
          durationMs: 224877,
        },
        {
          trackId: T2,
          spotifyUrl: `https://open.spotify.com/track/${T2}`,
          title: "Música B",
          artists: "Artista 3",
          imageUrl: null,
          durationMs: 208810,
        },
      ],
    });
  });

  it("corta no limite e avisa", () => {
    const html = embed({
      name: "Grande",
      trackList: [T1, T2].map((id) => ({
        uri: `spotify:track:${id}`,
        title: id,
        subtitle: "A",
        duration: 1000,
      })),
    });
    const playlist = parsePlaylistEmbed(html, PID, 1);
    expect(playlist?.tracks).toHaveLength(1);
    expect(playlist?.truncated).toBe(true);
  });

  it("página sem dados → null", () => {
    expect(parsePlaylistEmbed("<html></html>", PID, 200)).toBeNull();
    expect(parsePlaylistEmbed(embed({}), PID, 200)).toBeNull();
  });

  it("itens da Web API: ignora removidas, locais e episódios", () => {
    const tracks = fromWebApiPlaylistItems([
      {
        track: {
          id: T1,
          type: "track",
          name: "A",
          duration_ms: 1000,
          artists: [{ name: "X" }],
          album: {
            images: [{ url: "https://i.scdn.co/image/abc", width: 300 }],
          },
        },
      },
      { track: null },
      { track: { id: null, type: "track", name: "Local" } },
      { track: { id: T2, type: "episode", name: "Ep" } },
    ]);
    expect(tracks).toEqual([
      {
        trackId: T1,
        spotifyUrl: `https://open.spotify.com/track/${T1}`,
        title: "A",
        artists: "X",
        imageUrl: "https://i.scdn.co/image/abc",
        durationMs: 1000,
      },
    ]);
  });
});
