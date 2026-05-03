"use client";

import { useState } from "react";

type LeadsIntegrationPanelProps = {
  baseUrl: string;
  ingestPath: string;
  initialHasToken: boolean;
};

const inputMonoClass =
  "w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

export function LeadsIntegrationPanel({
  baseUrl,
  ingestPath,
  initialHasToken,
}: LeadsIntegrationPanelProps) {
  const ingestUrl = `${baseUrl}${ingestPath}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(initialHasToken);
  const [token, setToken] = useState<string | null>(null);

  async function generateToken() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/band/ingest-token", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro ao gerar token.");
      return;
    }
    if (typeof data.token === "string") {
      setToken(data.token);
      setHasToken(true);
    }
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
    <section className="mb-10 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Integração com site (leads)</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Envie um <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">POST</code> com JSON. O ideal é
        chamar a URL a partir do <strong>backend</strong> do site ou de um serverless (o token não deve ir
        parar no front). Para form no browser, defina{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">LEADS_INGEST_ALLOWED_ORIGINS</code> no
        servidor.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Endpoint</span>
          <pre className={`mt-1 overflow-x-auto ${inputMonoClass}`}>{ingestUrl}</pre>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => void generateToken()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Gerando…" : hasToken ? "Regenerar token" : "Gerar token"}
          </button>
          {!hasToken && (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Gere um token antes de integrar o formulário.
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        )}

        {token && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/40">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Copie o token agora — ele não será mostrado de novo nesta tela.
            </p>
            <pre className={`mt-2 overflow-x-auto ${inputMonoClass}`}>{token}</pre>
          </div>
        )}
      </div>

      <div className="mt-6">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Exemplo fetch</span>
        <pre className={`mt-1 overflow-x-auto whitespace-pre-wrap ${inputMonoClass}`}>{fetchExample}</pre>
      </div>
    </section>
  );
}
