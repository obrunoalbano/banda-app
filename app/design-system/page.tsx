import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

export const metadata: Metadata = { title: "Design system" };

/**
 * Galeria viva do design system (docs/design-system.md).
 * Só em desenvolvimento: `npm run dev` → http://localhost:3000/design-system
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
