import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { Alert } from "@/components/ui/Alert";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { ButtonLink } from "@/components/ui/Button";
import { linkClass } from "@/components/ui/styles";
import { PASSWORD_RESET_TTL_LABEL, hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

// O token vai na URL: sem Referer para links externos da página.
export const metadata: Metadata = { title: "Criar nova senha", referrer: "no-referrer" };

async function isValidToken(token: string): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const band = await prisma.band.findFirst({
    where: {
      passwordResetTokenHash: hashPasswordResetToken(token),
      passwordResetExpiresAt: { gt: new Date() },
      disabledAt: null,
    },
    select: { id: true },
  });
  return band !== null;
}

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = await isValidToken(token.trim());

  return (
    <AuthLayout
      title="Criar nova senha"
      description={valid ? "Escolha uma nova senha para entrar na sua conta." : undefined}
      footer={
        <Link href="/login" className={linkClass}>
          Voltar para o login
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token.trim()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Alert tone="warning" title="Link inválido ou expirado">
            O link vale por {PASSWORD_RESET_TTL_LABEL} e só pode ser usado uma vez. Peça um novo para continuar.
          </Alert>
          <ButtonLink href="/esqueci-senha" className="w-full">
            Pedir novo link
          </ButtonLink>
        </div>
      )}
    </AuthLayout>
  );
}
