# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Banda — contexto do projeto

App multi-tenant para bandas gerenciarem **casas de show** (prospecção), **shows** (agenda + pagamento) e **contatos/leads** recebidos de sites externos. Cada conta é uma `Band`; não existe "usuário" separado — a banda é quem faz login.

Toda a UI, rotas e mensagens são em **português (pt-BR)**. Identificadores de código e campos do banco são em inglês (exceto enums e rotas de página).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Auth | next-auth v5 (beta) — Credentials (email + senha bcrypt), sessão **JWT** |
| Banco | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` (pool `pg` próprio em `lib/prisma.ts`) |
| Validação | Zod 4 (`lib/validations.ts`) |
| Estilo | Tailwind CSS 4, paleta `zinc` com variantes `dark:`, componentes próprios em `components/ui/` |
| Testes | Vitest (unitários em `lib/*.test.ts`) |
| Deploy | Vercel (ver comentários sobre cookie `__Secure-` em `proxy.ts`) |

O client Prisma é gerado em `app/generated/prisma` (gitignored). Importe tipos/enums de `@/app/generated/prisma/client` e `@/app/generated/prisma/enums`.

## Mapa do código

```
app/
  page.tsx                 landing (redireciona p/ /casas se logado)
  login/, cadastro/        páginas públicas
  (dashboard)/             área autenticada (layout com DashboardShell, loading.tsx, error.tsx)
    casas/                 Venue: lista (filtro cidade/status, paginada), detalhe, nova, editar
    shows/                 Show: lista (filtro casa/ano/mês, paginada), detalhe, nova, editar
    contatos/              Lead: lista (paginada), detalhe, editar
    integracoes/           geração do token de ingestão de leads
    banda/                 dados da conta
  api/                     só ESCRITA (leitura é feita direto nos Server Components)
    auth/[...nextauth]     next-auth
    register               cadastro público (rate limit por IP)
    band (PATCH), band/ingest-token (POST)
    venues (POST), venues/[id] (PATCH, DELETE)
    shows (POST), shows/[id] (PATCH, DELETE)
    leads/[id] (PATCH, DELETE)
    leads/ingest           PÚBLICO — recebe leads de sites externos via token
components/
  ui/                      design system: styles.ts (classes), fields (inputs c/ label), PageHeader,
                           DetailList, Table, EmptyState, Pagination, Alert, ConfirmDeleteButton
  *Form.tsx                formulários client (POST/PATCH na API)
  DashboardShell.tsx       menu lateral (gaveta no mobile) + header
hooks/                     useJsonSubmit (envio de formulário), useIbgeCities (municípios c/ cache)
lib/
  api.ts                   withBand, parseBody, jsonError, zodError, isUniqueViolation
  session.ts               getSession (cache por request), requireBandId (pages), requireBandSession (API)
  validations.ts           schemas Zod que validam E normalizam
  shows.ts                 regras de domínio de Show (local, snapshot de cachê, datas)
  money.ts / format.ts     formatação (moeda, datas, telefone, links wa.me/Instagram)
  rate-limit.ts            rate limit em memória
  lead-ingest-auth.ts      extração/geração/hash do token de ingestão
proxy.ts                   proteção de rotas (páginas → redirect /login, API → 401)
prisma/schema.prisma       modelo de dados
```

## Modelo de dados (resumo)

- **Band** — conta. `email` único, `passwordHash`, `leadIngestTokenHash` (SHA-256 do token; o token em si nunca é salvo).
- **Venue** (casa de show) — `sendStatus`: `NAO_ENVIADO | ENVIADO | FINALIZADO` (status do envio de material/proposta). `valorCacheCents` opcional = cachê de **referência** da casa.
- **Show** — pode ser em uma `Venue` (`venueId`) **ou** um *evento particular* (`venueId = null` + `privateCity`, `privateState`, `privateEventDetails`). Todo show tem o próprio `cacheCents` (**snapshot**): na criação, se não vier no payload, copia o `valorCacheCents` da casa; ao trocar de casa no PATCH sem enviar cachê, copia o da nova casa (`resolveShowCache` em `lib/shows.ts`). Exibir sempre `show.cacheCents`, nunca `show.venue.valorCacheCents`. A regra "sem casa ⇒ cidade e UF obrigatórias" está em `showCreateSchema.superRefine`. `date` é **data pura armazenada em UTC 00:00**; `time` é string `HH:mm`. `paymentStatus`: `PAGO | AGUARDANDO_PAGAMENTO`.
- **Lead** — contato recebido pela ingestão. Campos livres (`eventDate` é string, não data). `metadata` JSON arbitrário.

Todas as entidades pertencem a uma banda (`bandId`, `onDelete: Cascade`). Exceção: `Show.venueId` é `onDelete: NoAction` — **casa com shows não pode ser apagada** (a API devolve 409 e a UI desabilita o botão). Não troque para `Restrict`: quebraria o cascade Band → Venue/Show.

Índices são compostos começando por `bandId` (todas as queries filtram por banda). Ao criar query nova com filtro/ordenação diferente, avalie um índice `(bandId, campo)`.

### Dinheiro
Sempre **centavos em `Int`** (campos com sufixo `Cents`), máx. `MAX_CENTS` (Postgres INTEGER é 32 bits). Nunca `Float`. Exiba com `formatCents`; nos formulários use `<CurrencyField>` (máscara, estado já em centavos).

### Datas
- `Show.date` (data pura) → `formatDateOnly` (UTC). Form → API como `YYYY-MM-DD`, convertido por `parseDateOnly`.
- Timestamps (`createdAt`…) → `formatDateTimeShort/Full`, no fuso `America/Sao_Paulo`.
- Nunca crie `new Intl.*Format` dentro de componente/loop; adicione em `lib/format.ts`.

## Convenções obrigatórias

### Multi-tenant / segurança
- **Toda** query de Venue/Show/Lead deve filtrar por `bandId` da sessão. Por id: `findFirst({ where: { id, bandId } })`, ou `updateMany`/`deleteMany({ where: { id, bandId } })` checando `count` (uma query só). Nunca `findUnique/update/delete({ where: { id } })` sem checar posse antes.
- Ao associar um Show a uma Venue, validar que a venue pertence à mesma banda (ver `app/api/shows/route.ts`).
- Rotas públicas precisam ser liberadas explicitamente em `proxy.ts` (`/`, `/login`, `/cadastro`, `/api/auth/*`, `/api/register`, `/api/leads/ingest`). Qualquer nova rota é protegida por padrão.
- Endpoints públicos ou de autenticação usam `rateLimit` (`lib/rate-limit.ts`). É por instância (em memória); para limite global, trocar a implementação por Redis/Upstash mantendo a assinatura.
- Segredos de integração: guardar só hash (ver `lead-ingest-auth.ts`).
- Nunca versionar `.env*` (só `.env.example`). Novas variáveis de ambiente devem ser adicionadas ao `.env.example`.

### Leitura e escrita
- **Server Components** leem com Prisma direto: `const bandId = await requireBandId();` (redireciona se não logado). Use `select` só com os campos exibidos.
- **Escrita**: formulários client usam `useJsonSubmit()` → `app/api/*` → `router.push(...)` + `router.refresh()`.
- **Route handler** padrão:
  ```ts
  export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
    const parsed = await parseBody(request, algumSchema);
    if (!parsed.ok) return parsed.response;           // 400 JSON inválido / Dados inválidos
    const { count } = await prisma.x.updateMany({ where: { id, bandId }, data: parsed.data });
    if (count === 0) return jsonError(404, "X não encontrado");
    return NextResponse.json({ id });
  });
  ```
  Erros sempre `{ error: string }` em pt-BR (`jsonError`). Unique violation → `isUniqueViolation(e)` → 409.
- **Normalização fica no schema Zod** (trim, email minúsculo, UF maiúscula, "" → `null` via `optionalText`). Route handlers gravam `parsed.data` sem re-normalizar.
- Regras de domínio que valem para POST e PATCH ficam em `lib/<entidade>.ts` (ex.: `lib/shows.ts`), com teste.

### Enums e labels
- Labels e opções de select de enums ficam em `lib/` (`send-status.ts`, `show-payment-status.ts`) com `Record<Enum, string>` — ao criar um enum novo, siga o mesmo padrão e crie um `*Badge` correspondente.
- UFs: `lib/brazil-states.ts`. UF + cidade: `<CitySelectFields>` (IBGE com cache; se a API falhar, vira campo de texto).

### Ingestão de leads (`/api/leads/ingest`)
- Autenticação por token da banda em `Authorization: Bearer <token>` ou `X-Lead-Token`; lookup por `leadIngestTokenHash`.
- Aceita aliases legados `phone` → `whatsapp` e `message` → `eventDescription` (`normalizeLeadIngestBody`). Não quebre esse contrato: sites externos já dependem dele (há teste em `lib/validations.test.ts`).
- CORS só para origens em `LEADS_INGEST_ALLOWED_ORIGINS`. Rate limit por token (60/min).

### UI
- Use os componentes de `components/ui/` — não copie classes Tailwind. Novas variações visuais entram em `components/ui/styles.ts`.
- Página do dashboard: `<div className={containerClass}>` + `<PageHeader title back? actions?>` (é o único `<h1>` da página; o header do shell é só marca).
- Formulário: `TextField`/`SelectField`/`TextAreaField`/`PhoneField`/`CurrencyField` (label ligado via `useId`), `Alert` para erro, `FormActions` com `cancelHref` explícito (não usar `router.back()`).
- Detalhe: `DetailList` + `DetailItem` (vazio vira "—"); email/telefone/Instagram viram links (`mailto:`, `whatsappHref`, `instagramHref`).
- Listagem: `Table`/`Tr`/`Td`, `EmptyState`, `Pagination` (`?pagina=N`, 50 por página; preserve os filtros em `searchParams`). Filtros são `<form method="get">` (estado na URL).
- Exclusão: `ConfirmDeleteButton` (modal `<dialog>`; `disabledReason` quando houver bloqueio). Nada de `window.confirm`/`alert` novos.
- Nova seção no menu: adicione em `NAV` de `components/DashboardShell.tsx` (`matchNova: false` se houver sub-rota `nova`).

## Banco e migrations

- `prisma.config.ts` usa `DIRECT_URL` (se existir) para o CLI e `DATABASE_URL` no runtime. Supabase: `DATABASE_URL` = pooler modo transaction (6543); `DIRECT_URL` = pooler modo session (5432). Não usar `db.<ref>.supabase.co` (só IPv6 → P1001). Em serverless, `DATABASE_URL` deve ser a URL do pooler; o pool por instância é 3 na Vercel (`DATABASE_POOL_MAX`).
- Fluxo para alterar o schema: editar `schema.prisma` → `npm run db:migrate -- --name <descricao>` → commitar a pasta da migration. Em produção: `npm run db:deploy`.
- Migrations que transformam dados são escritas/ajustadas à mão (ex.: `20261007120000_money_cents_show_snapshot`, `20261007130000_token_hash_composite_indexes`). Confira se o resultado bate com o schema: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`.
- TLS do Postgres é configurável por env (`DATABASE_SSL_REJECT_UNAUTHORIZED`, `PGSSLMODE`, `sslmode` na URL) — ver `lib/prisma.ts`.

## Comandos

```bash
npm install          # roda prisma generate no postinstall
npm run dev
npm run check        # lint + typecheck + testes (mesmo que o CI)
npm run test         # Vitest
npm run build        # prisma generate + next build
```

CI: `.github/workflows/ci.yml` (lint, typecheck, testes, `prisma validate`, build) em push/PR para `main`.
Testes: funções puras em `lib/` têm `*.test.ts` ao lado. Ao criar regra de negócio, extraia para `lib/` e teste lá.

## Débitos técnicos conhecidos

- **Vazamento:** um SQLite criado por `.env` malformado (path `dev.db"AUTH_SECRET=…`) foi versionado em `7d4e466` e removido depois; **continua no histórico do GitHub** até reescrever o histórico. O `AUTH_SECRET` e os dados desse banco devem ser considerados vazados.
- Rate limit é em memória (por instância serverless), não global.
- Não há testes E2E (Playwright) nem de integração com banco; os testes cobrem só `lib/`.
- `LeadsIntegrationPanel` ainda usa `window.confirm` ao regenerar token.
- Escritas via route handlers + `fetch`; migrar para Server Actions (`useActionState`) é opcional, mas manteria `/api/leads/ingest` como REST.
- Sem página inicial com resumo (próximos shows, valores a receber) — `/` redireciona para `/casas`.
