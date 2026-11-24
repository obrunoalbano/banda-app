"use client";

import type { AttendanceStatus } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/Button";
import { ConfirmIcon, DeclineIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/styles";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * "Vou" / "Não vou" do próprio integrante para uma ocorrência do ensaio. Mostra a resposta atual
 * marcada; tocar de novo troca. Atualiza a tela (selo do menu e contagens) depois de salvar.
 */
export function AttendanceButtons({
  rehearsalId,
  occurrenceDate,
  current,
  size = "md",
}: {
  rehearsalId: string;
  /** YYYY-MM-DD */
  occurrenceDate: string;
  current: AttendanceStatus | null;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, setPending] = useState<AttendanceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function answer(next: AttendanceStatus) {
    setPending(next);
    setError(null);
    try {
      const res = await fetch(`/api/rehearsals/${rehearsalId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceDate, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível salvar.");
        return;
      }
      setStatus(next);
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sua presença">
        <Button
          size={size}
          variant={status === "CONFIRMED" ? "primary" : "secondary"}
          icon={ConfirmIcon}
          loading={pending === "CONFIRMED"}
          aria-pressed={status === "CONFIRMED"}
          onClick={() => void answer("CONFIRMED")}
        >
          Vou
        </Button>
        <Button
          size={size}
          variant={status === "DECLINED" ? "danger-solid" : "secondary"}
          icon={DeclineIcon}
          loading={pending === "DECLINED"}
          aria-pressed={status === "DECLINED"}
          onClick={() => void answer("DECLINED")}
        >
          Não vou
        </Button>
      </div>
      {error ? (
        <p role="alert" className={cx("text-xs font-medium text-danger-fg")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
