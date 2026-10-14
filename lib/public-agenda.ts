/**
 * Agenda pública: o que pode sair do sistema sobre um show.
 *
 * REGRA DE PRIVACIDADE: toda saída pública de show passa por `toPublicShow`.
 * Lista FECHADA de campos — cachê, status de pagamento, detalhes de evento particular
 * e contatos da casa NUNCA são expostos. Há teste garantindo as chaves.
 */

import { toDateOnlyString } from "@/lib/shows";

/** Campos do banco necessários para montar a saída pública (use como `select`). */
export const publicShowSelect = {
  id: true,
  date: true,
  time: true,
  ticketUrl: true,
  cancelledAt: true,
  privateCity: true,
  privateState: true,
  venue: { select: { name: true, city: true, state: true } },
} as const;

export type PublicShowSource = {
  id: string;
  date: Date;
  time: string;
  ticketUrl: string | null;
  cancelledAt: Date | null;
  privateCity: string | null;
  privateState: string | null;
  venue: { name: string; city: string; state: string } | null;
};

export type PublicShow = {
  id: string;
  /** Data local do show, "YYYY-MM-DD". */
  date: string;
  /** "HH:mm". */
  time: string;
  status: "scheduled" | "cancelled";
  /** Nome da casa ou "Evento particular". */
  title: string;
  venue: { name: string; city: string; state: string } | null;
  city: string | null;
  state: string | null;
  ticketUrl: string | null;
};

export const PRIVATE_EVENT_TITLE = "Evento particular";

export function toPublicShow(show: PublicShowSource): PublicShow {
  return {
    id: show.id,
    date: toDateOnlyString(show.date),
    time: show.time,
    status: show.cancelledAt ? "cancelled" : "scheduled",
    title: show.venue?.name ?? PRIVATE_EVENT_TITLE,
    venue: show.venue ? { name: show.venue.name, city: show.venue.city, state: show.venue.state } : null,
    city: show.venue?.city ?? show.privateCity,
    state: show.venue?.state ?? show.privateState,
    ticketUrl: show.ticketUrl,
  };
}

/** Limite padrão/máximo de shows retornados pela agenda pública. */
export const PUBLIC_SHOWS_DEFAULT_LIMIT = 20;
export const PUBLIC_SHOWS_MAX_LIMIT = 100;

/**
 * JSON-LD (schema.org MusicEvent) para SEO da página pública.
 * Horário sem fuso: o show acontece no fuso local da cidade.
 */
export function toMusicEventJsonLd(show: PublicShow, band: { name: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${band.name} — ${show.title}`,
    startDate: `${show.date}T${show.time}`,
    eventStatus:
      show.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    performer: { "@type": "MusicGroup", name: band.name, url: band.url },
    location: {
      "@type": "Place",
      name: show.title,
      address: {
        "@type": "PostalAddress",
        ...(show.city && { addressLocality: show.city }),
        ...(show.state && { addressRegion: show.state }),
        addressCountry: "BR",
      },
    },
    ...(show.ticketUrl && { offers: { "@type": "Offer", url: show.ticketUrl } }),
  };
}

/** Serializa JSON para dentro de <script type="application/ld+json"> sem permitir fechar a tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
