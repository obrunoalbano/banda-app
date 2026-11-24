import type { MetadataRoute } from "next";
import { PRODUCT_NAME } from "@/components/ui/Brand";

/**
 * Manifesto do app instalável (PWA): ícone na tela inicial, abre em tela cheia (sem barra do
 * navegador). Ícones gerados por `node scripts/generate-pwa-icons.mjs`. Ver docs/mobile.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: "Casas de show, agenda, financeiro e contatos da sua banda",
    lang: "pt-BR",
    start_url: "/casas?origem=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["business", "music", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shows", url: "/shows", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Novo show", url: "/shows/nova", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Financeiro", url: "/financeiro", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
