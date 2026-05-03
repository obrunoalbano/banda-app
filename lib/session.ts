import { auth } from "@/auth";

export async function requireBandSession() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return { bandId: id, session };
}
