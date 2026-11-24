import { NextResponse } from "next/server";
import { parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { repertoireSchema } from "@/lib/validations";

/** Novo repertório com as músicas na ordem enviada. */
export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, repertoireSchema);
  if (!parsed.ok) return parsed.response;
  const { songs, ...data } = parsed.data;
  const repertoire = await prisma.repertoire.create({
    data: {
      ...data,
      bandId,
      songs: { create: songs.map((song, position) => ({ ...song, id: undefined, position })) },
    },
    select: { id: true },
  });
  return NextResponse.json(repertoire, { status: 201 });
});
