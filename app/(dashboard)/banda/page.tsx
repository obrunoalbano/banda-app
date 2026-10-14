import { BandForm } from "@/components/BandForm";
import { ButtonLink } from "@/components/ui/Button";
import { KeyIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minha banda" };

export default async function BandaPage() {
  const bandId = await requireBandId();
  const band = await prisma.band.findUnique({
    where: { id: bandId },
    select: { name: true, responsible: true, phone: true, email: true },
  });
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        title="Dados da banda"
        description="Atualize as informações do seu cadastro."
        actions={
          <ButtonLink href="/banda/senha" variant="secondary" icon={KeyIcon}>
            Alterar senha
          </ButtonLink>
        }
      />
      <BandForm initial={band} />
    </div>
  );
}
