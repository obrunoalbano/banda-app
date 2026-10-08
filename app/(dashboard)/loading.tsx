import { containerClass } from "@/components/ui/styles";

/** Skeleton exibido durante a navegação entre páginas do dashboard. */
export default function DashboardLoading() {
  return (
    <div className={containerClass} aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="animate-pulse">
        <div className="mb-3 h-7 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mb-8 h-4 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-5 rounded bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      </div>
    </div>
  );
}
