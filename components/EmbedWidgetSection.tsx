"use client";

import { EMBED_RESIZE_MESSAGE } from "@/components/public/EmbedAutoResize";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { CheckboxField, SelectField } from "@/components/ui/fields";
import { useEffect, useId, useState } from "react";

const THEME_OPTIONS = [
  { value: "claro", label: "Claro" },
  { value: "escuro", label: "Escuro" },
  { value: "auto", label: "Automático (segue o visitante)" },
];

/**
 * Configurador de widget embutível (tema, fundo, snippet e pré-visualização com auto-altura).
 * Usado em Integrações → Agenda (/embed/<slug>/shows) e → Contatos (/embed/<slug>/contato).
 */
export function EmbedWidgetSection({
  baseUrl,
  embedPath,
  iframeTitle,
  snippetLabel,
  showPreview,
  initialHeight = 420,
}: {
  baseUrl: string;
  /** Ex.: `/embed/os-incriveis/shows`. */
  embedPath: string;
  /** `title` do iframe no snippet (acessibilidade no site da banda). */
  iframeTitle: string;
  snippetLabel: string;
  /** Pré-visualização só quando a integração está ativa (senão o widget mostra "indisponível"). */
  showPreview: boolean;
  initialHeight?: number;
}) {
  const id = useId();
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

  const params = new URLSearchParams({ tema: theme, ...(transparent && { fundo: "transparente" }) });
  const embedUrl = `${baseUrl}${embedPath}?${params.toString()}`;
  const snippet = `<iframe src="${embedUrl}" title="${iframeTitle}" loading="lazy" style="width:100%;border:0;height:${initialHeight}px"></iframe>
<script src="${baseUrl}/embed.js" async></script>`;

  return (
    <div className="flex flex-col gap-3">
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
      <CodeBlock label={snippetLabel} copyable wrap>
        {snippet}
      </CodeBlock>
      {showPreview ? (
        <div>
          <p id={`${id}-preview`} className="mb-1 text-xs font-medium text-fg-subtle">
            Pré-visualização
          </p>
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={`Pré-visualização: ${iframeTitle}`}
            style={{ height: previewHeight }}
            className="w-full rounded-md border border-line"
          />
        </div>
      ) : null}
    </div>
  );
}
