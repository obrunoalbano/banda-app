import { describe, expect, it } from "vitest";
import { repertoireFileName, repertoireShareText, repertoireSummary } from "./repertoire";

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
      options: { artists: false, notes: false, durations: true },
    });
    expect(text).toContain("1. Garota de Ipanema (3:20)\n2. Música própria (1:40)");
    expect(text).not.toContain("Tom Jobim");
    expect(text).not.toContain("↳");
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
