import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getSession, requireBandId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alterar senha" };

export default async function BandaSenhaPage() {
  await requireBandId();
  const forced = (await getSession())?.user.mustChangePassword ?? false;
  return (
    <div className={containerClass}>
      <PageHeader
        title="Alterar senha"
        back={forced ? undefined : { href: "/banda", label: "Voltar a Minha banda" }}
      />
      <ChangePasswordForm endpoint="/api/band/password" forced={forced} redirectTo="/banda" />
    </div>
  );
}
