import { financeCsv, parseFinancePeriod, showDueDate, type FinanceCsvRow } from "@/lib/finance";
import { fetchPeriodMoney, showLabel } from "@/lib/finance-query";
import { requireBandId } from "@/lib/session";
import { todayDateOnly } from "@/lib/shows";

/**
 * CSV do período (`?ano&mes`, mesmo filtro das telas): cachês dos shows (sem cancelados) + lançamentos.
 * Leitura com sessão da banda — fica fora de /api (que é só escrita) por ser um download de página.
 */
export async function GET(request: Request) {
  const bandId = await requireBandId();
  const params = new URL(request.url).searchParams;
  const period = parseFinancePeriod(
    {
      ano: params.get("ano") ?? undefined,
      mes: params.get("mes") ?? undefined,
    },
    todayDateOnly(),
  );
  const [shows, entries] = await fetchPeriodMoney(bandId, period);

  const rows: FinanceCsvRow[] = [
    ...shows
      .filter((s) => !s.cancelledAt && (s.cacheCents ?? 0) > 0)
      .map((s) => ({
        date: s.date,
        type: "RECEITA" as const,
        category: "CACHE" as const,
        description: showLabel(s),
        amountCents: s.cacheCents!,
        dueDate: showDueDate(s),
        paidAt: s.paymentStatus === "PAGO" ? s.paidAt : null,
      })),
    ...entries.map((e) => ({
      date: e.date,
      type: e.type,
      category: e.category,
      description: e.description,
      amountCents: e.amountCents,
      dueDate: null,
      paidAt: e.paidAt,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const name = `financeiro-${period.year}${period.month ? `-${String(period.month).padStart(2, "0")}` : ""}.csv`;
  return new Response(financeCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
