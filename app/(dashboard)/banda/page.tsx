import { BandForm } from "@/components/BandForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BandaPage() {
  const bandId = await requireBandId();
  const band = await prisma.band.findUnique({
    where: { id: bandId },
    select: { name: true, responsible: true, phone: true, email: true },
  });
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader title="Dados da banda" description="Atualize as informações do seu cadastro." />
      <BandForm initial={band} />
    </div>
  );
}
