import { describe, expect, it } from "vitest";
import {
  entryStatus,
  expensesByCategory,
  financeCsv,
  isShowOverdue,
  parseFinancePeriod,
  periodParams,
  showResultCents,
  summarizeFinance,
  type EntryMoney,
  type ShowMoney,
} from "./finance";
import { FINANCE_CATEGORIES_BY_TYPE, isCategoryAllowed } from "./finance-categories";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const today = d("2026-11-23");

const show = (over: Partial<ShowMoney> = {}): ShowMoney => ({
  cacheCents: 100_000,
  paymentStatus: "AGUARDANDO_PAGAMENTO",
  date: d("2026-11-30"),
  paymentDueDate: null,
  cancelledAt: null,
  ...over,
});
const entry = (over: Partial<EntryMoney> = {}): EntryMoney => ({
  type: "DESPESA",
  amountCents: 10_000,
  date: d("2026-11-10"),
  paidAt: null,
  ...over,
});

describe("vencimento e atraso", () => {
  it("sem vencimento, vence na data do show", () => {
    expect(isShowOverdue(show({ date: d("2026-11-22") }), today)).toBe(true);
    expect(isShowOverdue(show({ date: d("2026-11-23") }), today)).toBe(false);
  });
  it("vencimento informado manda", () => {
    expect(isShowOverdue(show({ date: d("2026-11-01"), paymentDueDate: d("2026-12-01") }), today)).toBe(false);
  });
  it("pago, cancelado ou sem cachê nunca atrasa", () => {
    const past = { date: d("2026-11-01") };
    expect(isShowOverdue(show({ ...past, paymentStatus: "PAGO" }), today)).toBe(false);
    expect(isShowOverdue(show({ ...past, cancelledAt: d("2026-10-01") }), today)).toBe(false);
    expect(isShowOverdue(show({ ...past, cacheCents: null }), today)).toBe(false);
  });
  it("status do lançamento", () => {
    expect(entryStatus(entry({ paidAt: d("2026-11-10") }), today)).toBe("PAGO");
    expect(entryStatus(entry({ date: d("2026-11-22") }), today)).toBe("ATRASADO");
    expect(entryStatus(entry({ date: d("2026-11-23") }), today)).toBe("PENDENTE");
  });
});

describe("summarizeFinance", () => {
  it("soma cachês e lançamentos e ignora show cancelado", () => {
    const s = summarizeFinance({
      today,
      shows: [
        show({ paymentStatus: "PAGO" }), // recebido 1000
        show({ date: d("2026-11-20") }), // a receber 1000, atrasado
        show({ cacheCents: 50_000 }), // a receber 500
        show({ cancelledAt: d("2026-11-01") }), // ignorado
      ],
      entries: [
        entry({ type: "RECEITA", amountCents: 20_000, paidAt: d("2026-11-12") }), // recebido 200
        entry({ type: "RECEITA", amountCents: 5_000, date: d("2026-11-01") }), // a receber 50, atrasado
        entry({ amountCents: 30_000, paidAt: d("2026-11-10") }), // despesa paga 300
        entry({ amountCents: 7_000 }), // despesa pendente 70
      ],
    });
    expect(s).toEqual({
      incomeCents: 275_000,
      receivedCents: 120_000,
      receivableCents: 155_000,
      overdueCents: 105_000,
      expenseCents: 37_000,
      expensePendingCents: 7_000,
      resultCents: 238_000,
    });
  });
  it("vazio = tudo zero", () => {
    expect(summarizeFinance({ shows: [], entries: [], today }).resultCents).toBe(0);
  });
});

describe("resultado e categorias", () => {
  it("resultado do show: cachê + receitas − despesas", () => {
    const entries = [entry({ amountCents: 15_000 }), entry({ type: "RECEITA", amountCents: 4_000 })];
    expect(showResultCents(show(), entries)).toBe(89_000);
    expect(showResultCents(show({ cancelledAt: today }), entries)).toBe(-11_000);
  });
  it("despesas por categoria, maior primeiro, sem receitas", () => {
    expect(
      expensesByCategory([
        { ...entry({ amountCents: 1_000 }), category: "ALIMENTACAO" },
        { ...entry({ amountCents: 5_000 }), category: "TRANSPORTE" },
        { ...entry({ amountCents: 2_000 }), category: "ALIMENTACAO" },
        { ...entry({ type: "RECEITA", amountCents: 9_000 }), category: "MERCH" },
      ]),
    ).toEqual([
      { category: "TRANSPORTE", cents: 5_000 },
      { category: "ALIMENTACAO", cents: 3_000 },
    ]);
  });
  it("categoria por tipo", () => {
    expect(isCategoryAllowed("DESPESA", "TRANSPORTE")).toBe(true);
    expect(isCategoryAllowed("RECEITA", "TRANSPORTE")).toBe(false);
    expect(isCategoryAllowed("RECEITA", "OUTROS")).toBe(true);
    expect(FINANCE_CATEGORIES_BY_TYPE.RECEITA).not.toContain("COMISSAO");
  });
});

describe("financeCsv", () => {
  it("cabeçalho, ; como separador, despesa negativa e texto escapado", () => {
    const csv = financeCsv([
      {
        date: d("2026-11-30"),
        type: "RECEITA",
        category: "CACHE",
        description: "Bar do Zé",
        amountCents: 150_000,
        dueDate: d("2026-12-05"),
        paidAt: null,
      },
      {
        date: d("2026-11-10"),
        type: "DESPESA",
        category: "TRANSPORTE",
        description: '=Van; "ida"',
        amountCents: 8_050,
        dueDate: null,
        paidAt: d("2026-11-10"),
      },
    ]);
    expect(csv.startsWith("﻿Data;Tipo;Categoria;Descrição;Valor (R$);Vencimento;Pago em\r\n")).toBe(true);
    expect(csv).toContain("30/11/2026;Receita;Cachê de show;Bar do Zé;1500,00;05/12/2026;\r\n");
    expect(csv).toContain(`10/11/2026;Despesa;Transporte;"'=Van; ""ida""";-80,50;;10/11/2026\r\n`);
  });
});

describe("parseFinancePeriod", () => {
  it("sem filtro = mês de hoje", () => {
    expect(parseFinancePeriod({}, today)).toEqual({
      year: 2026,
      month: 11,
      gte: d("2026-11-01"),
      lt: d("2026-12-01"),
    });
  });
  it("ano sem mês = ano inteiro; dezembro vira o ano", () => {
    expect(parseFinancePeriod({ ano: "2025", mes: "" }, today)).toMatchObject({
      month: null,
      gte: d("2025-01-01"),
      lt: d("2026-01-01"),
    });
    expect(parseFinancePeriod({ ano: "2025", mes: "12" }, today)).toMatchObject({ gte: d("2025-12-01"), lt: d("2026-01-01") });
  });
  it("valores inválidos caem no padrão", () => {
    expect(parseFinancePeriod({ ano: "abc" }, today).month).toBe(11);
    expect(parseFinancePeriod({ ano: "2025", mes: "13" }, today).month).toBeNull();
  });
  it("periodParams reproduz o filtro", () => {
    expect(periodParams(parseFinancePeriod({ ano: "2026", mes: "3" }, today))).toEqual({ ano: "2026", mes: "03" });
    expect(periodParams(parseFinancePeriod({ ano: "2026" }, today))).toEqual({ ano: "2026" });
  });
});
