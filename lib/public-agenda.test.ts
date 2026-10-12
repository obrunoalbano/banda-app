import { describe, expect, it } from "vitest";
import { jsonLdScript, toMusicEventJsonLd, toPublicShow, type PublicShowSource } from "./public-agenda";

const venueShow: PublicShowSource = {
  id: "s1",
  date: new Date(Date.UTC(2026, 11, 15)),
  time: "21:00",
  ticketUrl: "https://ingressos.com/x",
  cancelledAt: null,
  privateCity: null,
  privateState: null,
  venue: { name: "Bar do Zé", city: "Santos", state: "SP" },
};

describe("toPublicShow (privacidade)", () => {
  it("expõe só a lista fechada de campos", () => {
    // Mesmo que o objeto de origem traga dados internos, eles não podem sair.
    const leaky = {
      ...venueShow,
      cacheCents: 150000,
      paymentStatus: "PAGO",
      privateEventDetails: "Casamento da Fulana",
      bandId: "b1",
      venue: { ...venueShow.venue!, phone: "11999990000", email: "dono@bar.com", valorCacheCents: 1 },
    } as unknown as PublicShowSource;
    const out = toPublicShow(leaky);
    expect(Object.keys(out).sort()).toEqual(
      ["city", "date", "id", "state", "status", "ticketUrl", "time", "title", "venue"].sort(),
    );
    expect(Object.keys(out.venue!).sort()).toEqual(["city", "name", "state"]);
    expect(JSON.stringify(out)).not.toMatch(/150000|PAGO|Fulana|dono@bar|11999990000/);
  });

  it("show em casa", () => {
    expect(toPublicShow(venueShow)).toEqual({
      id: "s1",
      date: "2026-12-15",
      time: "21:00",
      status: "scheduled",
      title: "Bar do Zé",
      venue: { name: "Bar do Zé", city: "Santos", state: "SP" },
      city: "Santos",
      state: "SP",
      ticketUrl: "https://ingressos.com/x",
    });
  });

  it("evento particular sai como 'Evento particular' + cidade", () => {
    const out = toPublicShow({ ...venueShow, venue: null, privateCity: "Campinas", privateState: "SP", ticketUrl: null });
    expect(out).toMatchObject({ title: "Evento particular", venue: null, city: "Campinas", state: "SP" });
  });

  it("cancelado", () => {
    expect(toPublicShow({ ...venueShow, cancelledAt: new Date() }).status).toBe("cancelled");
  });
});

describe("JSON-LD", () => {
  it("MusicEvent com status, local e ingresso", () => {
    const ld = toMusicEventJsonLd(toPublicShow(venueShow), { name: "Os Incríveis", url: "https://x/b/os" });
    expect(ld).toMatchObject({
      "@type": "MusicEvent",
      startDate: "2026-12-15T21:00",
      eventStatus: "https://schema.org/EventScheduled",
      location: { name: "Bar do Zé", address: { addressLocality: "Santos", addressRegion: "SP" } },
      offers: { url: "https://ingressos.com/x" },
    });
  });
  it("não permite fechar a tag <script>", () => {
    expect(jsonLdScript({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
