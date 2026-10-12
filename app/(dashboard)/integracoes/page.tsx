import { redirect } from "next/navigation";

/** Fallback: o redirect principal de /integracoes está em next.config.ts (nível HTTP). */
export default function IntegracoesPage() {
  redirect("/integracoes/agenda");
}
