import { NextResponse } from "next/server";
import { parseBody, withAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { stageCreateSchema } from "@/lib/validations";

/** Superadmin cadastra palco na base curada (padrão: rascunho). */
export const POST = withAdmin(async (request, { adminId }) => {
  const parsed = await parseBody(request, stageCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { status, ...data } = parsed.data;
  const stage = await prisma.stage.create({
    data: {
      ...data,
      status: status ?? "DRAFT",
      createdById: adminId,
      // Publicar já na criação conta como verificação.
      ...(status === "PUBLISHED" && { verifiedAt: new Date(), verifiedById: adminId }),
    },
    select: { id: true },
  });
  return NextResponse.json(stage, { status: 201 });
});
