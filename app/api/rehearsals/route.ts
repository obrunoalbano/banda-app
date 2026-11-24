import { after, NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { appBaseUrl } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { notifyRehearsalCreated } from "@/lib/rehearsal-notify";
import { parseDateOnly, parseOptionalDateOnly } from "@/lib/shows";
import { rehearsalCreateSchema } from "@/lib/validations";

/** Novo ensaio. Depois de responder, avisa os integrantes por email pedindo confirmação. */
export const POST = withBand(async (request, { bandId, userId }) => {
  const limited = rateLimit(`rehearsal:${bandId}`, RATE_LIMITS.rehearsalCreate);
  if (!limited.ok) return jsonError(429, "Muitos ensaios criados seguidos. Tente de novo mais tarde.");

  const parsed = await parseBody(request, rehearsalCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, recurrenceUntil, repertoireId, ...data } = parsed.data;

  const dateValue = parseDateOnly(date);
  if (!dateValue) return jsonError(400, "Data inválida");
  const until = parseOptionalDateOnly(recurrenceUntil);
  if (!until.ok) return jsonError(400, "Data final inválida");
  if (
    repertoireId &&
    !(await prisma.repertoire.findFirst({ where: { id: repertoireId, bandId }, select: { id: true } }))
  ) {
    return jsonError(400, "Repertório inválido");
  }

  const rehearsal = await prisma.rehearsal.create({
    data: {
      ...data,
      bandId,
      date: dateValue,
      recurrenceUntil: data.recurrence === "NONE" ? null : (until.value ?? null),
      repertoireId: repertoireId ?? null,
    },
    select: { id: true, name: true, location: true, date: true, time: true, recurrence: true },
  });

  const baseUrl = appBaseUrl(request);
  after(() => notifyRehearsalCreated({ rehearsal, bandId, creatorUserId: userId, baseUrl }));
  return NextResponse.json({ id: rehearsal.id }, { status: 201 });
});
