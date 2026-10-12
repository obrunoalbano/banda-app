import { containerClass } from "@/components/ui/styles";

/** Skeleton exibido durante a navegação entre páginas do dashboard. */
export default function DashboardLoading() {
  return (
    <div className={containerClass} aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="animate-pulse" aria-hidden>
        <div className="mb-3 h-7 w-48 rounded bg-surface-sunken" />
        <div className="mb-8 h-4 w-72 max-w-full rounded bg-surface-sunken" />
        <div className="space-y-3 rounded-lg border border-line p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-5 rounded bg-surface-sunken" />
          ))}
        </div>
      </div>
    </div>
  );
}
