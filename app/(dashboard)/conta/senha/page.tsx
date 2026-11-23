import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { USER_PASSWORD_API } from "@/lib/access";
import { getSession, requireUserId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alterar senha" };

export default async function ContaSenhaPage() {
  await requireUserId();
  const forced = (await getSession())?.user.mustChangePassword ?? false;
  return (
    <div className={containerClass}>
      <PageHeader title="Alterar senha" back={forced ? undefined : { href: "/conta", label: "Voltar a Minha conta" }} />
      <ChangePasswordForm endpoint={USER_PASSWORD_API} forced={forced} redirectTo="/conta" />
    </div>
  );
}
