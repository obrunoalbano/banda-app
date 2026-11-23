import type { FinanceCategory, FinanceEntryType } from "@/app/generated/prisma/enums";

export const FINANCE_TYPE_LABELS: Record<FinanceEntryType, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
};

export const FINANCE_TYPE_OPTIONS: { value: FinanceEntryType; label: string }[] = [
  { value: "DESPESA", label: FINANCE_TYPE_LABELS.DESPESA },
  { value: "RECEITA", label: FINANCE_TYPE_LABELS.RECEITA },
];

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  TRANSPORTE: "Transporte",
  ALIMENTACAO: "Alimentação",
  HOSPEDAGEM: "Hospedagem",
  SOM_E_LUZ: "Som e luz",
  MUSICO_FREELANCER: "Músico freelancer",
  EQUIPE: "Equipe (roadie, técnico)",
  COMISSAO: "Comissão (produtor/agente)",
  EQUIPAMENTO: "Equipamento",
  ENSAIO: "Ensaio",
  DIVULGACAO: "Divulgação",
  TAXAS_E_IMPOSTOS: "Taxas e impostos",
  CACHE_EXTRA: "Cachê extra",
  MERCH: "Venda de merch",
  PATROCINIO: "Patrocínio",
  DIREITOS_AUTORAIS: "Direitos autorais",
  OUTROS: "Outros",
};

/** Categorias válidas por tipo, na ordem dos selects. "Outros" vale para os dois. */
export const FINANCE_CATEGORIES_BY_TYPE: Record<FinanceEntryType, FinanceCategory[]> = {
  DESPESA: [
    "TRANSPORTE",
    "ALIMENTACAO",
    "HOSPEDAGEM",
    "SOM_E_LUZ",
    "MUSICO_FREELANCER",
    "EQUIPE",
    "COMISSAO",
    "EQUIPAMENTO",
    "ENSAIO",
    "DIVULGACAO",
    "TAXAS_E_IMPOSTOS",
    "OUTROS",
  ],
  RECEITA: ["CACHE_EXTRA", "MERCH", "PATROCINIO", "DIREITOS_AUTORAIS", "OUTROS"],
};

export function isCategoryAllowed(type: FinanceEntryType, category: FinanceCategory): boolean {
  return FINANCE_CATEGORIES_BY_TYPE[type].includes(category);
}
