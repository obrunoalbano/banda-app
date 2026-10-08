import { NextResponse } from "next/server";
import { parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { venueCreateSchema } from "@/lib/validations";

export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, venueCreateSchema);
  if (!parsed.ok) return parsed.response;

  const { email, ...data } = parsed.data;
  const venue = await prisma.venue.create({
    data: { ...data, email: email ?? "", bandId },
  });

  return NextResponse.json(venue, { status: 201 });
});
