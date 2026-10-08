"use client";

import { useState } from "react";

/**
 * Envia JSON para a API e padroniza loading/erro.
 * Retorna o corpo da resposta em caso de sucesso, ou `null` (com `error` preenchido).
 */
export function useJsonSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit<T = Record<string, unknown>>(
    url: string,
    method: "POST" | "PATCH",
    body: unknown,
    fallbackError = "Erro ao salvar.",
  ): Promise<T | null> {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : fallbackError);
        return null;
      }
      return data as T;
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error, setError };
}
