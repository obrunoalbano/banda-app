"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteVenueButton({ venueId, venueName }: { venueId: string; venueName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Remover a casa "${venueName}"? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setLoading(true);
    const res = await fetch(`/api/venues/${venueId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      alert("Não foi possível remover.");
      return;
    }
    router.push("/casas");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
    >
      {loading ? "Removendo…" : "Remover"}
    </button>
  );
}
