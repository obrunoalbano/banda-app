import { RegisterForm } from "@/components/RegisterForm";
import { Alert } from "@/components/ui/Alert";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { linkClass } from "@/components/ui/styles";
import { findBandByLink, findPendingInvite } from "@/lib/band-access";
import type { Metadata } from "next";
import Link from "next/link";

// O token do convite pode vir na URL: sem Referer para links externos.
export const metadata: Metadata = { title: "Criar conta", referrer: "no-referrer" };

type PageProps = { searchParams: Promise<{ convite?: string; banda?: string }> };

export default async function CadastroPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const token = query.convite?.trim() ?? "";
  const linkToken = token ? "" : (query.banda?.trim() ?? "");
  const pending = token ? await findPendingInvite(token) : null;
  const invite =
    pending && !pending.band.disabledAt
      ? { token, email: pending.email, name: pending.name, bandName: pending.band.name }
      : undefined;
  const linkBand = linkToken ? await findBandByLink(linkToken) : null;
  const bandLink = linkBand ? { token: linkToken, bandName: linkBand.name } : undefined;
  const joining = invite ?? bandLink;

  return (
    <AuthLayout
      title={joining ? `Entre para a ${joining.bandName}` : "Crie sua conta"}
      description={
        joining ? "Crie sua conta para acessar a banda que convidou você." : "Cadastre-se e crie sua primeira banda."
      }
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href={bandLink ? `/login?${new URLSearchParams({ callbackUrl: `/convite/banda/${linkToken}` })}` : "/login"}
            className={linkClass}
          >
            Entrar
          </Link>
        </>
      }
    >
      {(token && !invite) || (linkToken && !bandLink) ? (
        <div className="mb-4">
          <Alert tone="warning" title="Convite inválido ou expirado">
            Peça um novo link à banda. Você também pode criar sua conta e a sua própria banda abaixo.
          </Alert>
        </div>
      ) : null}
      <RegisterForm invite={invite} bandLink={bandLink} />
    </AuthLayout>
  );
}
