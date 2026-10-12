import { NextResponse } from "next/server";
import { parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { leadFormSettingsSchema } from "@/lib/validations";

/** Liga/desliga o formulário público e define os domínios autorizados (CORS). */
export const PATCH = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, leadFormSettingsSchema);
  if (!parsed.ok) return parsed.response;
  const { enabled, allowedOrigins } = parsed.data;

  const band = await prisma.band.update({
    where: { id: bandId },
    data: {
      ...(enabled !== undefined && { leadFormEnabled: enabled }),
      ...(allowedOrigins !== undefined && { leadAllowedOrigins: allowedOrigins }),
    },
    select: { leadFormEnabled: true, leadAllowedOrigins: true },
  });
  return NextResponse.json(band);
});
