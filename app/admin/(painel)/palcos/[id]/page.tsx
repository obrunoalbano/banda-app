import { StageActions } from "@/components/admin/StageActions";
import { StageThumb } from "@/components/admin/StageThumb";
import { StageForm } from "@/components/admin/StageForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { formatDateOnly, formatDateTimeShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import { needsReverification, STAGE_STATUS_LABELS, STAGE_STATUS_TONES, STAGE_TYPE_LABELS } from "@/lib/stages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Palco" };

type PageProps = { params: Promise<{ id: string }> };

export default async function PalcoDetalhePage({ params }: PageProps) {
  await requireAdminId();
  const { id } = await params;
  const stage = await prisma.stage.findUnique({
    where: { id },
    include: {
      verifiedBy: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!stage) notFound();

  return (
    <div className={containerClass}>
      <PageHeader
        title={stage.name}
        description={`${STAGE_TYPE_LABELS[stage.type]} · ${stage.neighborhood ? `${stage.neighborhood}, ` : ""}${stage.city}/${stage.state}`}
        back={{ href: "/admin/palcos", label: "Voltar aos palcos" }}
      >
        <Badge tone={STAGE_STATUS_TONES[stage.status]}>{STAGE_STATUS_LABELS[stage.status]}</Badge>
        {stage.status === "PUBLISHED" && needsReverification(stage.verifiedAt) ? (
          <Badge tone="danger">Reverificar</Badge>
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-8">
        <figure className="flex flex-col gap-2">
          <StageThumb src={stage.imageThumbUrl} size="lg" />
          {!stage.imageThumbUrl && stage.imageUrl ? (
            <figcaption className="text-xs text-fg-subtle">
              Imagem de origem ainda não processada (npm run stages:images).
            </figcaption>
          ) : null}
        </figure>

        <Card title="Curadoria">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-fg-muted">
              {stage.verifiedAt
                ? `Verificado em ${formatDateTimeShort(stage.verifiedAt)}${stage.verifiedBy ? ` por ${stage.verifiedBy.name}` : ""}.`
                : "Ainda não verificado."}{" "}
              Cadastrado em {formatDateTimeShort(stage.createdAt)}
              {stage.createdBy ? ` por ${stage.createdBy.name}` : ""}
              {stage.externalSource ? ` · importado de "${stage.externalSource}" (id ${stage.externalId})` : ""}
              {stage.lastActivityAt ? ` · última atividade conhecida: ${formatDateOnly(stage.lastActivityAt)}` : ""}.
            </p>
            <StageActions id={stage.id} status={stage.status} name={stage.name} />
          </div>
        </Card>

        <section aria-labelledby="dados-palco">
          <h2 id="dados-palco" className="mb-4 text-lg font-semibold text-fg">
            Dados do palco
          </h2>
          <StageForm mode="edit" stage={stage} />
        </section>
      </div>
    </div>
  );
}
