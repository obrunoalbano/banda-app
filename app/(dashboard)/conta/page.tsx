import { AccountForm } from "@/components/AccountForm";
import { InstallAppButton } from "@/components/InstallAppButton";
import { ButtonLink } from "@/components/ui/Button";
import { KeyIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minha conta" };

export default async function ContaPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        title="Minha conta"
        description="Seus dados de acesso. Valem para todas as suas bandas."
        actions={
          <>
            <InstallAppButton />
            <ButtonLink href="/conta/senha" variant="secondary" icon={KeyIcon}>
              Alterar senha
            </ButtonLink>
          </>
        }
      />
      <AccountForm initial={{ ...user, phone: user.phone ?? "" }} />
    </div>
  );
}
