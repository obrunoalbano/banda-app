"use client";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CheckboxField, SelectField, TextField } from "@/components/ui/fields";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { slugError } from "@/lib/slug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EMBED_RESIZE_MESSAGE } from "@/components/public/EmbedAutoResize";

type PublicAgendaPanelProps = {
  baseUrl: string;
  initialSlug: string;
  initialEnabled: boolean;
  /** Shows futuros marcados como públicos (o que a agenda mostra hoje). */
  publicUpcomingCount: number;
};

const THEME_OPTIONS = [
  { value: "claro", label: "Claro" },
  { value: "escuro", label: "Escuro" },
  { value: "auto", label: "Automático (segue o visitante)" },
];

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
  const [theme, setTheme] = useState("claro");
  const [transparent, setTransparent] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(320);

  // A pré-visualização se ajusta à altura do widget (mesmo protocolo do public/embed.js).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== EMBED_RESIZE_MESSAGE) return;
      const height = Number(event.data.height);
      if (height > 0) setPreviewHeight(Math.ceil(height));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const pageUrl = `${baseUrl}/b/${slug}`;
  const embedParams = new URLSearchParams({ tema: theme, ...(transparent && { fundo: "transparente" }) });
  const embedUrl = `${baseUrl}/embed/${slug}/shows?${embedParams.toString()}`;
  const apiUrl = `${baseUrl}/api/public/v1/bands/${slug}/shows`;
  const widgetSnippet = `<iframe src="${embedUrl}" title="Agenda de shows" loading="lazy" style="width:100%;border:0;height:420px"></iframe>
<script src="${baseUrl}/embed.js" async></script>`;

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
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Tema" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {THEME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
              <CheckboxField
                label="Fundo transparente"
                className="sm:pt-7"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
              />
            </div>
            <CodeBlock label="Cole este código onde a agenda deve aparecer" copyable wrap>
              {widgetSnippet}
            </CodeBlock>
            {enabled ? (
              <div>
                <p className="mb-1 text-xs font-medium text-fg-subtle">Pré-visualização</p>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title="Pré-visualização do widget de agenda"
                  style={{ height: previewHeight }}
                  className="w-full rounded-md border border-line"
                />
              </div>
            ) : null}
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
