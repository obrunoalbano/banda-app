import { withUser } from "@/lib/api";
import { changeOwnPassword } from "@/lib/change-password";
import { prisma } from "@/lib/prisma";

/** Usuário troca a própria senha (obrigatório quando a senha é provisória). */
export const POST = withUser(async (request, { userId }) =>
  changeOwnPassword(request, {
    load: () => prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
    // Trocar a senha também invalida um link de "esqueci minha senha" pendente.
    save: (data) =>
      prisma.user.update({
        where: { id: userId },
        data: { ...data, passwordResetTokenHash: null, passwordResetExpiresAt: null },
      }),
  }),
);
