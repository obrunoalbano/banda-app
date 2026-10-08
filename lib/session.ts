import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";

/** `auth()` deduplicado por request (layout + page não decodificam o JWT duas vezes). */
export const getSession = cache(auth);

/** Para route handlers: retorna `null` quando não autenticado (o handler responde 401). */
export async function requireBandSession() {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) return null;
  return { bandId: id, session };
}

/** Para Server Components: redireciona para /login quando não autenticado. */
export async function requireBandId(): Promise<string> {
  const ctx = await requireBandSession();
  if (!ctx) redirect("/login");
  return ctx.bandId;
}
