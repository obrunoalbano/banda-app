import { ShareRepertoireButton } from "@/components/repertoire/ShareRepertoireButton";
import { SongList } from "@/components/repertoire/SongList";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { EditIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { containerClass, linkClass } from "@/components/ui/styles";
import { formatDuration } from "@/lib/spotify";
import { prisma } from "@/lib/prisma";
import { requireBandContext } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Repertório" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RepertorioPage({ params }: PageProps) {
  const { bandId, bandName, canEdit } = await requireBandContext();
  const { id } = await params;
  const repertoire = await prisma.repertoire.findFirst({
    where: { id, bandId },
    select: {
      id: true,
      name: true,
      description: true,
      songs: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          artists: true,
          spotifyUrl: true,
          imageUrl: true,
          durationMs: true,
          notes: true,
        },
      },
      rehearsals: { select: { id: true, name: true }, orderBy: { date: "desc" }, take: 10 },
    },
  });
  if (!repertoire) notFound();

  const totalMs = repertoire.songs.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  const allTimed = repertoire.songs.length > 0 && repertoire.songs.every((s) => s.durationMs);

  return (
    <div className={containerClass}>
      <PageHeader
        title={repertoire.name}
        description={repertoire.description ?? undefined}
        back={{ href: "/repertorios", label: "Voltar à listagem" }}
        actions={
          <>
            {repertoire.songs.length ? (
              <ShareRepertoireButton
                bandName={bandName}
                name={repertoire.name}
                description={repertoire.description}
                songs={repertoire.songs}
              />
            ) : null}
            {canEdit ? (
              <>
                <ButtonLink href={`/repertorios/${repertoire.id}/editar`} icon={EditIcon}>
                  Alterar
                </ButtonLink>
                <ConfirmDeleteButton
                  endpoint={`/api/repertoires/${repertoire.id}`}
                  redirectTo="/repertorios"
                  itemLabel={`o repertório "${repertoire.name}"${repertoire.rehearsals.length ? " (os ensaios que o usam ficam sem repertório)" : ""}`}
                />
              </>
            ) : null}
          </>
        }
      >
        <Badge>
          {repertoire.songs.length} {repertoire.songs.length === 1 ? "música" : "músicas"}
        </Badge>
        {totalMs > 0 ? (
          <Badge>
            {allTimed ? "" : "≈ "}
            {formatDuration(totalMs)} de música
          </Badge>
        ) : null}
      </PageHeader>

      <SongList songs={repertoire.songs} />

      {repertoire.rehearsals.length ? (
        <p className="mt-6 text-sm text-fg-muted">
          Usado nos ensaios:{" "}
          {repertoire.rehearsals.map((r, i) => (
            <span key={r.id}>
              {i ? ", " : ""}
              <Link href={`/ensaios/${r.id}`} className={linkClass}>
                {r.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
