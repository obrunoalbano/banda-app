import { AddStageButton } from "@/components/explore/AddStageButton";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ExploreIcon, ExternalLinkIcon, VerifiedIcon, WhatsappIcon } from "@/components/ui/icons";
import { formatMonthYear, instagramHref, whatsappHref } from "@/lib/format";
import { STAGE_TYPE_LABELS } from "@/lib/stages";
import type { StageType } from "@/app/generated/prisma/enums";
import Image from "next/image";

export type ExploreStage = {
  id: string;
  name: string;
  type: StageType;
  city: string;
  neighborhood: string | null;
  state: string;
  genres: string[];
  instagram: string | null;
  whatsapp: string | null;
  imageThumbUrl: string | null;
  verifiedAt: Date | null;
  lastActivityAt: Date | null;
  notes: string | null;
};

/** Card de palco no Explorar Palcos (só dados institucionais do diretório curado). */
export function StageCard({ stage, venueId }: { stage: ExploreStage; venueId: string | null }) {
  const wa = whatsappHref(stage.whatsapp);
  const ig = instagramHref(stage.instagram);
  const place = [stage.neighborhood, `${stage.city}/${stage.state}`].filter(Boolean).join(" · ");

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="relative aspect-[4/3] bg-surface-sunken">
        {stage.imageThumbUrl ? (
          <Image
            src={stage.imageThumbUrl}
            alt={`Foto de ${stage.name}`}
            width={400}
            height={300}
            unoptimized
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center" aria-hidden>
            <ExploreIcon className="size-10 text-fg-subtle" strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{STAGE_TYPE_LABELS[stage.type]}</Badge>
          {stage.verifiedAt ? (
            <span title={`Verificado pela nossa equipe em ${formatMonthYear(stage.verifiedAt)}`}>
              <Badge tone="success">
                <VerifiedIcon className="mr-1 size-3" aria-hidden />
                Verificado
              </Badge>
            </span>
          ) : null}
        </div>
        <div>
          <h2 className="text-base font-semibold text-fg">{stage.name}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">{place}</p>
          {stage.lastActivityAt ? (
            <p className="mt-1 text-xs text-fg-subtle">Atividade registrada em {formatMonthYear(stage.lastActivityAt)}</p>
          ) : null}
        </div>
        {stage.notes ? <p className="line-clamp-2 text-sm text-fg-muted">{stage.notes}</p> : null}
        {stage.genres.length ? <p className="text-xs text-fg-subtle">Estilos: {stage.genres.join(", ")}</p> : null}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {wa || ig ? (
            <div className="flex flex-wrap gap-2">
              {wa ? (
                <ButtonLink href={wa} variant="secondary" size="sm" icon={WhatsappIcon} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </ButtonLink>
              ) : null}
              {ig ? (
                <ButtonLink href={ig} variant="ghost" size="sm" icon={ExternalLinkIcon} target="_blank" rel="noopener noreferrer">
                  {stage.instagram}
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-fg-subtle">Sem canal de contato cadastrado.</p>
          )}
          <AddStageButton stageId={stage.id} venueId={venueId} />
        </div>
      </div>
    </article>
  );
}
