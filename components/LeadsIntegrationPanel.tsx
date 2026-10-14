"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { RetryIcon } from "@/components/ui/icons";
import { useState } from "react";

type LeadsIntegrationPanelProps = {
  baseUrl: string;
  ingestPath: string;
  initialHasToken: boolean;
};

export function LeadsIntegrationPanel({ baseUrl, ingestPath, initialHasToken }: LeadsIntegrationPanelProps) {
  const ingestUrl = `${baseUrl}${ingestPath}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(initialHasToken);
  const [token, setToken] = useState<string | null>(null);

  /** Gera/regenera o token. Retorna mensagem de erro (para o ConfirmButton) ou null. */
  async function generateToken(): Promise<string | null> {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/band/ingest-token", { method: "POST" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setLoading(false);
    if (!res?.ok || typeof data.token !== "string") {
      const message = typeof data.error === "string" ? data.error : "Erro ao gerar token.";
      setError(message);
      return message;
    }
    setToken(data.token);
    setHasToken(true);
    return null;
  }

  const fetchExample = `await fetch("${ingestUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_TOKEN_AQUI",
  },
  body: JSON.stringify({
    name: "Maria",
    email: "maria@exemplo.com",
    whatsapp: "+55 11 99999-0000",
    eventDate: "2026-12-15",
    city: "São Paulo — SP",
    eventType: "Casamento",
    eventDescription: "Cerimônia e recepção para 120 convidados.",
    source: "landing",
  }),
});`;

  return (
    <Card
      title="Integração pelo servidor"
      description="Para desenvolvedores: envie pedidos a partir do backend do site (ou de uma função serverless) usando um token secreto. Para enviar direto do navegador, use o “Formulário do seu site” acima."
    >
      <div className="flex flex-col gap-4">
        {token ? (
          <Alert tone="warning" title="Copie o token agora">
            Por segurança ele não será mostrado de novo. Se perder, gere outro.
          </Alert>
        ) : null}
        {token ? <CodeBlock label="Token" copyable>{token}</CodeBlock> : null}

        {error && !hasToken ? <Alert>{error}</Alert> : null}

        <div className="flex flex-wrap items-center gap-3">
          {hasToken ? (
            <ConfirmButton
              label="Regenerar token"
              variant="secondary"
              icon={RetryIcon}
              title="Regenerar o token?"
              description="O token atual para de funcionar imediatamente. Atualize o site integrado com o novo token."
              confirmLabel="Regenerar"
              tone="danger"
              onConfirm={generateToken}
            />
          ) : (
            <Button variant="secondary" loading={loading} onClick={() => void generateToken()}>
              Gerar token
            </Button>
          )}
          <span className="text-xs text-fg-subtle">
            {hasToken ? "Token ativo. O valor só é exibido ao gerar." : "Nenhum token gerado."}
          </span>
        </div>

        <CodeBlock label="Endpoint" copyable>
          {ingestUrl}
        </CodeBlock>
        <CodeBlock label="Exemplo (JavaScript no servidor)" copyable wrap>
          {fetchExample}
        </CodeBlock>
      </div>
    </Card>
  );
}
