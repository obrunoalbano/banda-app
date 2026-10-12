import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { unstable_update } from "@/auth";
import { jsonError, parseBody } from "@/lib/api";
import { hashPassword } from "@/lib/passwords";
import { changePasswordSchema } from "@/lib/validations";

/**
 * Troca de senha do próprio usuário (banda ou superadmin): confere a atual, grava a nova,
 * limpa "senha provisória" e atualiza o JWT (libera o acesso bloqueado pelo proxy).
 */
export async function changeOwnPassword(
  request: Request,
  account: {
    load: () => Promise<{ passwordHash: string } | null>;
    save: (data: { passwordHash: string; mustChangePassword: false }) => Promise<unknown>;
  },
) {
  const parsed = await parseBody(request, changePasswordSchema);
  if (!parsed.ok) return parsed.response;
  const current = await account.load();
  if (!current) return jsonError(404, "Conta não encontrada");
  if (!(await compare(parsed.data.currentPassword, current.passwordHash))) {
    return jsonError(400, "Senha atual incorreta");
  }
  await account.save({ passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false });
  await unstable_update({ user: { mustChangePassword: false } });
  return NextResponse.json({ ok: true });
}
