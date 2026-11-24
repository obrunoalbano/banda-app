import { AcceptInviteButton } from "@/components/AcceptInviteButton";
import { Alert } from "@/components/ui/Alert";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { ButtonLink } from "@/components/ui/Button";
import { linkClass } from "@/components/ui/styles";
import { findBandByLink } from "@/lib/band-access";
import { BAND_ROLE_SHORT } from "@/lib/band-roles";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

// O token vai na URL: sem Referer para links externos da página.
export const metadata: Metadata = { title: "Convite", referrer: "no-referrer" };

type PageProps = { params: Promise<{ token: string }> };

/**
 * PÚBLICO — link de convite da banda (para o grupo, reutilizável).
 * Logado → entrar na banda · sem sessão → criar conta ou entrar e voltar para cá.
 */
export default async function ConviteBandaPage({ params }: PageProps) {
  const token = decodeURIComponent((await params).token).trim();
  const band = await findBandByLink(token);
  const footer = (
    <Link href="/login" className={linkClass}>
      Ir para o login
    </Link>
  );

  if (!band) {
    return (
      <AuthLayout title="Convite" footer={footer}>
        <Alert tone="warning" title="Link de convite inválido ou desativado">
          A banda pode ter gerado um novo link ou desativado este. Peça o link atual a um administrador da banda.
        </Alert>
      </AuthLayout>
    );
  }

  const description = `Você foi convidado(a) para a ${band.name} com acesso de ${BAND_ROLE_SHORT[band.inviteLinkRole].toLowerCase()}.`;
  const session = await getSession();
  if (session?.user?.role === "user") {
    return (
      <AuthLayout title={`Convite para a ${band.name}`} description={description}>
        <AcceptInviteButton token={token} bandName={band.name} kind="band" />
      </AuthLayout>
    );
  }

  const self = `/convite/banda/${encodeURIComponent(token)}`;
  return (
    <AuthLayout title={`Convite para a ${band.name}`} description={description} footer={footer}>
      <div className="flex flex-col gap-3">
        <ButtonLink href={`/cadastro?banda=${encodeURIComponent(token)}`} className="w-full">
          Criar minha conta
        </ButtonLink>
        <ButtonLink
          href={`/login?${new URLSearchParams({ callbackUrl: self })}`}
          variant="secondary"
          className="w-full"
        >
          Já tenho conta
        </ButtonLink>
      </div>
    </AuthLayout>
  );
}
