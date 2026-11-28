import { BandForm } from "@/components/BandForm";
import { BandLogoField } from "@/components/BandLogoField";
import { Card } from "@/components/ui/Card";
import { bandLogoUrl } from "@/lib/band-logo";
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
    select: { name: true, responsible: true, phone: true, logo: { select: { updatedAt: true } } },
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
        <BandForm initial={{ name: band.name, responsible: band.responsible, phone: band.phone }} />
      ) : (
        <DetailList>
          <DetailItem label="Nome da banda" wide>
            {band.name}
          </DetailItem>
          <DetailItem label="Responsável">{band.responsible}</DetailItem>
          <DetailItem label="Telefone">{band.phone}</DetailItem>
        </DetailList>
      )}
      <Card
        title="Logo da banda"
        description="Aparece no canto superior direito das imagens e PDFs gerados em Compartilhar (repertórios e shows)."
        className="mt-8 max-w-xl"
      >
        <BandLogoField logoUrl={bandLogoUrl(band.logo?.updatedAt)} canEdit={canEdit} />
      </Card>
    </div>
  );
}
