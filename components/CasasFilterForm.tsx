import Link from "next/link";
import { buttonPrimaryClass, buttonSecondaryClass, inputSmClass as inputClass } from "@/components/ui/styles";
import { SEND_STATUS_OPTIONS } from "@/lib/send-status";

type CasasFilterFormProps = {
  cities: string[];
  defaultCidade: string;
  defaultStatus: string;
};


export function CasasFilterForm({ cities, defaultCidade, defaultStatus }: CasasFilterFormProps) {
  return (
    <form
      method="get"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-cidade" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Cidade
        </label>
        <select
          id="filtro-cidade"
          name="cidade"
          defaultValue={defaultCidade}
          className={inputClass}
        >
          <option value="">Todas</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-status" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Status de envio
        </label>
        <select
          id="filtro-status"
          name="status"
          defaultValue={defaultStatus}
          className={inputClass}
        >
          <option value="">Todos</option>
          {SEND_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
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
          href="/casas"
          className={buttonSecondaryClass}
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
