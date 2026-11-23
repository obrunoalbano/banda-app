# Financeiro (V1)

Módulo do menu **Financeiro**: controla o dinheiro de cada banda — cachês dos shows, despesas e receitas extras. Feito para ser simples: sem contas bancárias, sem conciliação.

## Telas

| Rota | O que mostra |
| --- | --- |
| `/financeiro` | **Visão geral** do período (mês ou ano): Receitas, Recebido, A receber (com atrasado), Despesas (com a pagar), Resultado. Listas de **Atrasados** (qualquer período), **Próximos recebimentos** (30 dias) e **Despesas por categoria**. |
| `/financeiro/lancamentos` | Lista de lançamentos com filtro de período, tipo e situação (pendente/atrasado/pago). |
| `/financeiro/lancamentos/nova` | Novo lançamento. `?showId=…&tipo=DESPESA\|RECEITA` pré-preenche (botões "+ Despesa"/"+ Receita" no detalhe do show). |
| `/financeiro/lancamentos/[id]/editar` | Alterar ou remover. |
| `/financeiro/exportar?ano&mes` | Download CSV do período (cachês + lançamentos). `;` como separador, vírgula decimal, BOM UTF-8 (abre direto no Excel em pt-BR); despesas negativas; texto que começa com `= + - @` é prefixado com `'` (anti-fórmula). |
| `/shows/[id]` | Seção **Financeiro do show**: lançamentos ligados, cachê e resultado. Status "Atrasado" quando vencido. |

## Regras (`lib/finance.ts`, com teste)

- **Receitas = cachês dos shows + lançamentos de receita.** O cachê fica em `Show.cacheCents` e **nunca** vira lançamento (sem duplicar). Show **cancelado** não entra em total nenhum.
- **Despesas = lançamentos de despesa.** Categorias por tipo em `lib/finance-categories.ts` (validado no schema Zod e no PATCH contra o estado final).
- **Período por competência:** o show entra pela data do show; o lançamento, pela data dele. `paidAt` registra quando foi pago/recebido (aparece no CSV; base para uma futura visão de caixa).
- **Vencimento do cachê:** `Show.paymentDueDate` ou, se vazio, a data do show. **Atrasado** = aguardando pagamento, com cachê > 0, vencimento antes de hoje (fuso `America/Sao_Paulo`, `todayDateOnly`).
- **Lançamento:** `paidAt` vazio = pendente; pendente com data antes de hoje = atrasado.
- **Marcar show como pago** sem informar data → `paidAt` = hoje; voltar para "aguardando" limpa a data (`resolveShowPaidAt` em `lib/shows.ts`). A migration `20261123120000_finance` preencheu `paidAt` = data do show para os que já estavam pagos.
- **Resultado do show** = cachê (0 se cancelado) + receitas ligadas − despesas ligadas.
- Apagar um show **mantém** os lançamentos (viram avulsos: `showId` → `null`).

## Fora da V1 (próximos passos)

Sinal/pagamento parcial do cachê · divisão entre integrantes (precisa de cadastro de integrantes) · comissão de produtor automática (%) · recibo/PDF · visão de caixa (por data de pagamento) · recorrências · nota fiscal/Pix/conciliação.
