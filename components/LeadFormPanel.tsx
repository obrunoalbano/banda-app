"use client";

import { EmbedWidgetSection } from "@/components/EmbedWidgetSection";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { TextAreaField } from "@/components/ui/fields";
import { ExternalLinkIcon, LeadIcon } from "@/components/ui/icons";
import { linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LeadFormPanelProps = {
  baseUrl: string;
  slug: string;
  initialEnabled: boolean;
  initialOrigins: string[];
  status: {
    /** Já formatado no servidor ("há 2 dias") — evita divergência de hidratação. */
    lastLeadRelative: string | null;
    lastLeadSource: string | null;
    last30Days: number;
  };
};

type Settings = { leadFormEnabled: boolean; leadAllowedOrigins: string[] };

export function LeadFormPanel({ baseUrl, slug, initialEnabled, initialOrigins, status }: LeadFormPanelProps) {
  const router = useRouter();
  const settings = useJsonSubmit();
  const test = useJsonSubmit();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [origins, setOrigins] = useState(initialOrigins);
  const [originsDraft, setOriginsDraft] = useState(initialOrigins.join("\n"));
  const [saved, setSaved] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const pageUrl = `${baseUrl}/b/${slug}/contato`;
  const endpoint = `${baseUrl}/api/public/v1/bands/${slug}/leads`;

  async function save(body: { enabled?: boolean; allowedOrigins?: string[] }, message: string) {
    setSaved(null);
    const data = await settings.submit<Settings>("/api/band/lead-form", "PATCH", body, "Não foi possível salvar.");
    if (!data) return "Não foi possível salvar.";
    setEnabled(data.leadFormEnabled);
    setOrigins(data.leadAllowedOrigins);
    setOriginsDraft(data.leadAllowedOrigins.join("\n"));
    setSaved(message);
    router.refresh();
    return null;
  }

  async function sendTest() {
    setTestSent(false);
    const data = await test.submit("/api/band/lead-form/test", "POST", {}, "Não foi possível enviar o teste.");
    if (data) {
      setTestSent(true);
      router.refresh();
    }
  }

  const draftList = originsDraft.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  const draftChanged = draftList.join("\n") !== origins.join("\n");

  const customFormSnippet = `<form id="orcamento">
  <input name="name" required placeholder="Seu nome">
  <input name="email" type="email" required placeholder="Email">
  <input name="whatsapp" placeholder="WhatsApp">
  <input name="eventDate" type="date">
  <input name="city" placeholder="Cidade">
  <textarea name="eventDescription" placeholder="Conte sobre o evento"></textarea>
  <!-- Anti-spam: mantenha este campo escondido e vazio -->
  <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
  <button>Pedir orçamento</button>
</form>
<script>
  document.getElementById("orcamento").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const res = await fetch("${endpoint}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, source: "site" }),
    });
    alert(res.ok ? "Pedido enviado! Entraremos em contato." : "Não foi possível enviar. Tente novamente.");
    if (res.ok) event.target.reset();
  });
</script>`;

  return (
    <div className="flex flex-col gap-6">
      {settings.error ? <Alert>{settings.error}</Alert> : null}
      {saved ? <Alert tone="success">{saved}</Alert> : null}

      <Card
        title="Status"
        description="Pedidos de orçamento recebidos por qualquer formulário ou integração."
        actions={
          <ButtonLink href="/contatos" variant="ghost" size="sm" icon={LeadIcon}>
            Ver contatos
          </ButtonLink>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            {status.lastLeadRelative ? (
              <>
                Último contato recebido <span className="font-medium text-fg">{status.lastLeadRelative}</span>
                {status.lastLeadSource ? <> (origem: {status.lastLeadSource})</> : null}.{" "}
              </>
            ) : (
              <>Nenhum contato recebido ainda. </>
            )}
            <span className="tabular font-medium text-fg">{status.last30Days}</span> nos últimos 30 dias.
          </p>
          {test.error ? <Alert>{test.error}</Alert> : null}
          {testSent ? (
            <Alert tone="success">
              Contato de teste criado.{" "}
              <Link href="/contatos" className={linkClass}>
                Ver em Contatos
              </Link>
            </Alert>
          ) : null}
          <div>
            <Button variant="secondary" loading={test.loading} onClick={() => void sendTest()}>
              Enviar lead de teste
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Formulário pronto"
        description="Uma página com formulário de orçamento para divulgar, ou um widget para colar no seu site. Não precisa de programador."
        actions={
          <>
            <Badge tone="info">Recomendado</Badge>
            {enabled ? <Badge tone="success">Ativo</Badge> : <Badge>Desativado</Badge>}
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <div>
            {enabled ? (
              <ConfirmButton
                label="Desativar formulário público"
                variant="secondary"
                title="Desativar o formulário público?"
                description="A página, o widget e os formulários do seu site param de aceitar pedidos imediatamente. A integração pelo servidor (token) continua funcionando."
                confirmLabel="Desativar"
                tone="danger"
                onConfirm={() => save({ enabled: false }, "Formulário público desativado.")}
              />
            ) : (
              <Button
                loading={settings.loading}
                onClick={() => void save({ enabled: true }, "Formulário público ativado.")}
              >
                Ativar formulário público
              </Button>
            )}
          </div>

          <section aria-labelledby="form-link" className="flex flex-col gap-3">
            <h3 id="form-link" className="text-sm font-semibold text-fg">
              1. Link do formulário <span className="font-normal text-fg-subtle">— bio do Instagram, WhatsApp</span>
            </h3>
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
                  Abrir formulário
                </ButtonLink>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="form-widget" className="flex flex-col gap-3">
            <h3 id="form-widget" className="text-sm font-semibold text-fg">
              2. Widget no seu site <span className="font-normal text-fg-subtle">— Wix, WordPress, Squarespace, HTML</span>
            </h3>
            <EmbedWidgetSection
              baseUrl={baseUrl}
              embedPath={`/embed/${slug}/contato`}
              iframeTitle="Pedir orçamento"
              snippetLabel="Cole este código onde o formulário deve aparecer"
              showPreview={enabled}
              initialHeight={640}
            />
          </section>
        </div>
      </Card>

      <Card
        title="Formulário do seu site"
        description="Para quem já tem um formulário próprio e quer enviá-lo direto do navegador. Requer o formulário público ativo."
      >
        <div className="flex flex-col gap-5">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void save({ allowedOrigins: draftList }, "Domínios atualizados.");
            }}
          >
            <TextAreaField
              label="Domínios autorizados"
              rows={3}
              value={originsDraft}
              onChange={(e) => setOriginsDraft(e.target.value)}
              placeholder={"meusite.com.br\nwww.meusite.com.br"}
              spellCheck={false}
              hint="Um por linha. Só estes sites podem enviar o formulário pelo navegador (até 10). Inclua a versão com e sem www, se usar as duas."
            />
            <div>
              <Button type="submit" variant="secondary" disabled={!draftChanged || settings.loading}>
                Salvar domínios
              </Button>
            </div>
          </form>
          <CodeBlock label="Exemplo de formulário (HTML + JavaScript)" copyable wrap>
            {customFormSnippet}
          </CodeBlock>
          <p className="text-xs text-fg-subtle">
            Campos aceitos: name e email (obrigatórios), whatsapp, eventDate, city, eventType, eventDescription,
            source. O campo website é a isca anti-spam: mantenha escondido e vazio.
          </p>
        </div>
      </Card>
    </div>
  );
}
