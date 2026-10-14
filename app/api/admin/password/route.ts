import { withAdmin } from "@/lib/api";
import { changeOwnPassword } from "@/lib/change-password";
import { prisma } from "@/lib/prisma";

/** Superadmin troca a própria senha (obrigatório quando a senha é provisória). */
export const POST = withAdmin(async (request, { adminId }) =>
  changeOwnPassword(request, {
    load: () => prisma.adminUser.findUnique({ where: { id: adminId }, select: { passwordHash: true } }),
    save: (data) => prisma.adminUser.update({ where: { id: adminId }, data }),
  }),
);
