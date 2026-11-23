import { BandPicker } from "@/components/BandPicker";
import { CreateBandForm } from "@/components/CreateBandForm";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BandIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getBandContext, getMemberships, requireUserId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minhas bandas" };

export default async function BandasPage() {
  const userId = await requireUserId();
  const [bands, ctx] = await Promise.all([getMemberships(userId), getBandContext()]);
  const activeBandId = "reason" in ctx ? null : ctx.bandId;

  return (
    <div className={containerClass}>
      <PageHeader title="Minhas bandas" description="Escolha a banda que deseja gerenciar ou crie uma nova." />
      <div className="flex max-w-2xl flex-col gap-8">
        {bands.length > 0 ? (
          <BandPicker bands={bands} activeBandId={activeBandId} />
        ) : (
          <EmptyState
            icon={BandIcon}
            title="Você ainda não faz parte de nenhuma banda"
            description="Crie a sua banda abaixo. Se alguém convidou você, abra o link do convite que chegou no seu email."
          />
        )}
        <Card title="Nova banda" description="Você será o administrador e poderá convidar os integrantes.">
          <CreateBandForm />
        </Card>
      </div>
    </div>
  );
}
