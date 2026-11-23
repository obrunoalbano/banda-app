import { BandForm } from "@/components/BandForm";
import { DetailItem, DetailList } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandContext } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minha banda" };

export default async function BandaPage() {
  const { bandId, canEdit } = await requireBandContext();
  const band = await prisma.band.findUnique({
    where: { id: bandId },
    select: { name: true, responsible: true, phone: true },
  });
  if (!band) redirect("/bandas");

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Minha banda"
        title="Dados da banda"
        description={canEdit ? "Atualize as informações da banda." : "Informações da banda (somente leitura)."}
      />
      {canEdit ? (
        <BandForm initial={band} />
      ) : (
        <DetailList>
          <DetailItem label="Nome da banda" wide>
            {band.name}
          </DetailItem>
          <DetailItem label="Responsável">{band.responsible}</DetailItem>
          <DetailItem label="Telefone">{band.phone}</DetailItem>
        </DetailList>
      )}
    </div>
  );
}
