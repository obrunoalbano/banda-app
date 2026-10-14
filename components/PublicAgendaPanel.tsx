"use client";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { TextField } from "@/components/ui/fields";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { slugError } from "@/lib/slug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmbedWidgetSection } from "@/components/EmbedWidgetSection";

type PublicAgendaPanelProps = {
  baseUrl: string;
  initialSlug: string;
  initialEnabled: boolean;
  /** Shows futuros marcados como públicos (o que a agenda mostra hoje). */
  publicUpcomingCount: number;
};


export function PublicAgendaPanel({
  baseUrl,
  initialSlug,
  initialEnabled,
  publicUpcomingCount,
}: PublicAgendaPanelProps) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [slug, setSlug] = useState(initialSlug);
  const [slugDraft, setSlugDraft] = useState(initialSlug);
  const [saved, setSaved] = useState<string | null>(null);
  const pageUrl = `${baseUrl}/b/${slug}`;
  const apiUrl = `${baseUrl}/api/public/v1/bands/${slug}/shows`;

  const draftNormalized = slugDraft.trim().toLowerCase();
  const draftError = draftNormalized === slug ? null : slugError(draftNormalized);

  async function save(body: { enabled?: boolean; slug?: string }, message: string): Promise<string | null> {
    setSaved(null);
    const data = await submit<{ slug: string; publicAgendaEnabled: boolean }>(
      "/api/band/public-agenda",
      "PATCH",
      body,
      "Não foi possível salvar.",
    );
    if (!data) return "Não foi possível salvar.";
    setEnabled(data.publicAgendaEnabled);
    setSlug(data.slug);
    setSlugDraft(data.slug);
    setSaved(message);
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        titleAs="h3"
        title="Agenda pública"
        description="Uma página com seus próximos shows para divulgar no Instagram, além de widget e API para o seu site."
        actions={enabled ? <Badge tone="success">Ativa</Badge> : <Badge>Desativada</Badge>}
      >
        <div className="flex flex-col gap-4">
          {error ? <Alert>{error}</Alert> : null}
          {saved ? <Alert tone="success">{saved}</Alert> : null}

          <p className="text-sm text-fg-muted">
            {publicUpcomingCount === 0 ? (
              <>Nenhum show futuro marcado como público. </>
            ) : (
              <>
                <span className="tabular font-medium text-fg">{publicUpcomingCount}</span> show(s) futuro(s) marcado(s)
                como público(s).{" "}
              </>
            )}
            Shows em casas entram por padrão; eventos particulares ficam ocultos.{" "}
            <Link href="/shows" className={linkClass}>
              Gerenciar shows
            </Link>
          </p>

          <div>
            {enabled ? (
              <ConfirmButton
                label="Desativar agenda pública"
                variant="secondary"
                title="Desativar a agenda pública?"
                description="A página, o widget e a API deixam de mostrar seus shows imediatamente. Dá para reativar depois."
                confirmLabel="Desativar"
                tone="danger"
                onConfirm={() => save({ enabled: false }, "Agenda pública desativada.")}
              />
            ) : (
              <Button loading={loading} onClick={() => void save({ enabled: true }, "Agenda pública ativada.")}>
                Ativar agenda pública
              </Button>
            )}
          </div>

          <form
            className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-start"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draftError && draftNormalized !== slug) {
                void save({ slug: draftNormalized }, "Endereço atualizado.");
              }
            }}
          >
            <TextField
              label="Endereço da agenda"
              className="flex-1"
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
              hint={
                draftError ?? (
                  <>
                    {baseUrl}/b/<strong className="font-medium text-fg">{draftNormalized || "…"}</strong>. Trocar o
                    endereço quebra links e widgets já publicados.
                  </>
                )
              }
              aria-invalid={draftError ? true : undefined}
            />
            <Button
              type="submit"
              variant="secondary"
              className="sm:mt-6"
              disabled={!!draftError || draftNormalized === slug || loading}
            >
              Salvar endereço
            </Button>
          </form>
        </div>
      </Card>

      <Card
        titleAs="h3"
        title="Divulgar"
        description={
          enabled
            ? "Escolha como mostrar a agenda. Tudo se atualiza sozinho quando você cadastra ou altera shows."
            : "Ative a agenda pública para que estes links funcionem."
        }
      >
        <div className="flex flex-col gap-8">
          <section aria-labelledby="divulgar-link" className="flex flex-col gap-3">
            <h4 id="divulgar-link" className="text-sm font-semibold text-fg">
              1. Link da página <span className="font-normal text-fg-subtle">— para bio do Instagram, WhatsApp</span>
            </h4>
            <CodeBlock copyable>{pageUrl}</CodeBlock>
            {enabled ? (
              <div>
                <ButtonLink
                  href={pageUrl}
                  variant="secondary"
                  size="sm"
                  icon={ExternalLinkIcon}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir página
                </ButtonLink>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="divulgar-widget" className="flex flex-col gap-3">
            <h4 id="divulgar-widget" className="text-sm font-semibold text-fg">
              2. Widget no seu site <span className="font-normal text-fg-subtle">— Wix, WordPress, Squarespace, HTML</span>
            </h4>
            <EmbedWidgetSection
              baseUrl={baseUrl}
              embedPath={`/embed/${slug}/shows`}
              iframeTitle="Agenda de shows"
              snippetLabel="Cole este código onde a agenda deve aparecer"
              showPreview={enabled}
            />
          </section>

          <section aria-labelledby="divulgar-api" className="flex flex-col gap-3">
            <h4 id="divulgar-api" className="text-sm font-semibold text-fg">
              3. API <span className="font-normal text-fg-subtle">— para desenvolvedores</span>
            </h4>
            <p className="text-sm text-fg-muted">
              <code className="rounded bg-surface-sunken px-1 font-mono text-xs">GET</code> público em JSON, sem
              token, liberado para qualquer site (CORS). Parâmetro opcional{" "}
              <code className="rounded bg-surface-sunken px-1 font-mono text-xs">?limit=1..100</code>.
            </p>
            <CodeBlock label="Endpoint" copyable>
              {apiUrl}
            </CodeBlock>
          </section>
        </div>
      </Card>
    </div>
  );
}
