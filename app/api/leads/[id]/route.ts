import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema, normalizeLeadIngestBody } from "@/lib/validations";

type Params = { id: string };

export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, leadUpdateSchema, { normalize: normalizeLeadIngestBody });
  if (!parsed.ok) return parsed.response;

  const { metadata, ...data } = parsed.data;
  const { count } = await prisma.lead.updateMany({
    where: { id, bandId },
    data: {
      ...data,
      ...(metadata !== undefined && {
        metadata: metadata === null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue),
      }),
    },
  });
  if (count === 0) return jsonError(404, "Contato não encontrado");

  return NextResponse.json({ id });
});

export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.lead.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Contato não encontrado");
  return NextResponse.json({ ok: true });
});
