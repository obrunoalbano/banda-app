import { withBand } from "@/lib/api";
import { changeOwnPassword } from "@/lib/change-password";
import { prisma } from "@/lib/prisma";

/** Banda troca a própria senha (obrigatório quando a senha é provisória). */
export const POST = withBand(async (request, { bandId }) =>
  changeOwnPassword(request, {
    load: () => prisma.band.findUnique({ where: { id: bandId }, select: { passwordHash: true } }),
    // Trocar a senha também invalida um link de "esqueci minha senha" pendente.
    save: (data) =>
      prisma.band.update({
        where: { id: bandId },
        data: { ...data, passwordResetTokenHash: null, passwordResetExpiresAt: null },
      }),
  }),
);
