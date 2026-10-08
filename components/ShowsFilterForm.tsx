import Link from "next/link";
import { buttonPrimaryClass, buttonSecondaryClass, inputSmClass as inputClass } from "@/components/ui/styles";

type SelectOption = { value: string; label: string };

type ShowsFilterFormProps = {
  venues: Array<{ id: string; name: string }>;
  yearOptions: SelectOption[];
  monthOptions: SelectOption[];
  defaultVenueId: string;
  defaultAno: string;
  defaultMes: string;
  /** Link rápido para filtrar ano/mês UTC atual (preserva casa se houver). */
  mesShortcutHref: string;
};


export function ShowsFilterForm({
  venues,
  yearOptions,
  monthOptions,
  defaultVenueId,
  defaultAno,
  defaultMes,
  mesShortcutHref,
}: ShowsFilterFormProps) {
  const mesDisabled = defaultAno === "";

  return (
    <form
      method="get"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-casa" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Casa de show
        </label>
        <select id="filtro-casa" name="casaId" defaultValue={defaultVenueId} className={inputClass}>
          <option value="">Todas</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[140px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-ano" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Ano
        </label>
        <select id="filtro-ano" name="ano" defaultValue={defaultAno} className={inputClass}>
          {yearOptions.map((o) => (
            <option key={o.value || "todos-ano"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[160px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-mes" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Mês
        </label>
        <select
          id="filtro-mes"
          name="mes"
          defaultValue={defaultMes}
          className={inputClass}
          disabled={mesDisabled}
          aria-disabled={mesDisabled}
        >
          {monthOptions.map((o) => (
            <option key={`${o.value || "todos-mes"}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 sm:pb-0.5">
        <button
          type="submit"
          className={buttonPrimaryClass}
        >
          Aplicar
        </button>
        <Link
          href={mesShortcutHref}
          className={buttonSecondaryClass}
        >
          Mês atual
        </Link>
      </div>
    </form>
  );
}
