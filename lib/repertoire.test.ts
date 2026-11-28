import { describe, expect, it } from "vitest";
import {
  orderSetlistSongs,
  repertoireFileName,
  repertoireShareText,
  repertoireSummary,
  resolveSongOrder,
  shareHeading,
} from "./repertoire";

const songs = [
  { title: "Garota de Ipanema", artists: "Tom Jobim", durationMs: 200_000, notes: "toca em um tom a menos" },
  { title: "Música *própria*", artists: null, durationMs: 100_000, notes: null },
];

describe("repertoireShareText", () => {
  it("monta a lista para o WhatsApp", () => {
    expect(
      repertoireShareText({ bandName: "Banda Demo", name: "Show de sábado", description: "Set acústico", songs }),
    ).toBe(
      [
        "*Repertório: Show de sábado*",
        "Banda Demo",
        "_Set acústico_",
        "",
        "1. Garota de Ipanema — Tom Jobim",
        "   ↳ toca em um tom a menos",
        "2. Música própria",
        "",
        "2 músicas · 5:00",
      ].join("\n"),
    );
  });

  it("respeita as opções", () => {
    const text = repertoireShareText({
      bandName: "B",
      name: "R",
      description: null,
      songs,
      options: { title: true, eventName: true, artists: false, notes: false, durations: true },
    });
    expect(text).toContain("1. Garota de Ipanema (3:20)\n2. Música própria (1:40)");
    expect(text).not.toContain("Tom Jobim");
    expect(text).not.toContain("↳");
  });
});

describe("repertoireShareText sem título", () => {
  it("abre com o nome da banda em negrito", () => {
    const text = repertoireShareText({
      bandName: "Banda Demo",
      name: "Show de sábado",
      description: null,
      songs,
      options: { title: false, eventName: true, artists: true, notes: true, durations: false },
    });
    expect(text.split("\n").slice(0, 3)).toEqual(["*Banda Demo*", "", "1. Garota de Ipanema — Tom Jobim"]);
    expect(text).not.toContain("Show de sábado");
  });
});

describe("título com nome do evento", () => {
  it("nome do evento marcado vira o título (no lugar do repertório)", () => {
    expect(
      shareHeading({ name: "Pop", eventName: " Festa junina ", options: { title: true, eventName: true } }),
    ).toEqual({ kind: "event", text: "Festa junina" });
    const text = repertoireShareText({
      bandName: "Banda Demo",
      name: "Pop",
      description: null,
      songs,
      eventName: "Festa junina",
    });
    expect(text.split("\n").slice(0, 2)).toEqual(["*Festa junina*", "Banda Demo"]);
    expect(text).not.toContain("Repertório: Pop");
  });
  it("desmarcado ou vazio: segue a opção do repertório", () => {
    expect(shareHeading({ name: "Pop", eventName: "Festa", options: { title: true, eventName: false } })).toEqual({
      kind: "repertoire",
      text: "Pop",
    });
    expect(shareHeading({ name: "Pop", eventName: "  ", options: { title: false, eventName: true } })).toEqual({
      kind: "band",
      text: null,
    });
  });
});

describe("helpers", () => {
  it("resumo com duração aproximada quando falta alguma", () => {
    expect(repertoireSummary([])).toBe("0 músicas");
    expect(repertoireSummary([{ ...songs[0] }, { ...songs[1], durationMs: null }])).toBe("2 músicas · ≈ 3:20");
  });
  it("nome de arquivo sem acento", () => {
    expect(repertoireFileName("Show de Sábado!", "png")).toBe("repertorio-show-de-sabado.png");
    expect(repertoireFileName("***", "png")).toBe("repertorio.png");
  });
});

describe("resolveSongOrder", () => {
  const ids = ["a", "b", "c"];
  it("ordem diferente é salva", () => {
    expect(resolveSongOrder(["c", "a", "b"], ids)).toEqual({ ok: true, songOrder: ["c", "a", "b"] });
  });
  it("vazia ou igual à do repertório = segue o repertório", () => {
    expect(resolveSongOrder([], ids)).toEqual({ ok: true, songOrder: [] });
    expect(resolveSongOrder(["a", "b", "c"], ids)).toEqual({ ok: true, songOrder: [] });
  });
  it.each([
    [["a", "b"]], // faltou música
    [["a", "b", "c", "d"]], // música de fora
    [["a", "a", "b"]], // repetida
    [["a", "b", "x"]], // id desconhecido
  ])("recusa %j", (songIds) => expect(resolveSongOrder(songIds, ids)).toEqual({ ok: false }));
});

describe("orderSetlistSongs", () => {
  const songs = ["a", "b", "c", "d"].map((id) => ({ id }));
  const ids = (list: { id: string }[]) => list.map((s) => s.id);
  it("sem ordem salva = ordem do repertório", () => {
    expect(ids(orderSetlistSongs(songs, []))).toEqual(["a", "b", "c", "d"]);
  });
  it("aplica a ordem; novas no fim; ids removidos ignorados", () => {
    expect(ids(orderSetlistSongs(songs, ["c", "x", "a"]))).toEqual(["c", "a", "b", "d"]);
  });
});
