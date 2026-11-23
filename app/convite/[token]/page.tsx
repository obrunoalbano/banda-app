import { AcceptInviteButton } from "@/components/AcceptInviteButton";
import { LogoutButton } from "@/components/LogoutButton";
import { Alert } from "@/components/ui/Alert";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { ButtonLink } from "@/components/ui/Button";
import { linkClass } from "@/components/ui/styles";
import { findPendingInvite } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

// O token vai na URL: sem Referer para links externos da página.
export const metadata: Metadata = { title: "Convite", referrer: "no-referrer" };

type PageProps = { params: Promise<{ token: string }> };

/**
 * PÚBLICO — link do convite para uma banda. Decide o caminho:
 * logado com o email convidado → aceitar · sem conta → cadastro · com conta → entrar.
 */
export default async function ConvitePage({ params }: PageProps) {
  const token = decodeURIComponent((await params).token).trim();
  const invite = await findPendingInvite(token);
  const footer = (
    <Link href="/login" className={linkClass}>
      Ir para o login
    </Link>
  );

  if (!invite || invite.band.disabledAt) {
    return (
      <AuthLayout title="Convite" footer={footer}>
        <Alert tone="warning" title="Convite inválido ou expirado">
          O link pode ter sido usado, substituído por um novo ou passado do prazo. Peça um novo convite à banda.
        </Alert>
      </AuthLayout>
    );
  }

  const bandName = invite.band.name;
  const session = await getSession();
  const loggedEmail = session?.user?.role === "user" ? session.user.email : null;
  const self = `/convite/${encodeURIComponent(token)}`;

  if (loggedEmail && loggedEmail === invite.email) {
    return (
      <AuthLayout title={`Convite para a ${bandName}`} description={`Você foi convidado(a) como integrante da ${bandName}.`}>
        <AcceptInviteButton token={token} bandName={bandName} />
      </AuthLayout>
    );
  }

  if (loggedEmail) {
    return (
      <AuthLayout title={`Convite para a ${bandName}`}>
        <div className="flex flex-col gap-4">
          <Alert tone="warning" title="Este convite é para outra conta">
            O convite foi enviado para {invite.email}, mas você está conectado(a) como {loggedEmail}. Saia e entre com a
            conta do convite.
          </Alert>
          <LogoutButton redirectTo={self} />
        </div>
      </AuthLayout>
    );
  }

  const hasAccount = !!(await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } }));
  const loginHref = `/login?${new URLSearchParams({ email: invite.email, callbackUrl: self })}`;

  return (
    <AuthLayout
      title={`Convite para a ${bandName}`}
      description={
        hasAccount
          ? `Entre com ${invite.email} para aceitar o convite.`
          : `Crie sua conta com ${invite.email} para acessar a banda.`
      }
      footer={footer}
    >
      <ButtonLink href={hasAccount ? loginHref : `/cadastro?convite=${encodeURIComponent(token)}`} className="w-full">
        {hasAccount ? "Entrar para aceitar" : "Criar minha conta"}
      </ButtonLink>
    </AuthLayout>
  );
}
