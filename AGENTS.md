# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Banda — contexto do projeto

App multi-tenant (com painel de superadmin para a equipe — `docs/admin.md`) para bandas gerenciarem **casas de show** (prospecção), **shows** (agenda + pagamento) e **contatos/leads** recebidos de sites externos, e publicarem sua **agenda de shows** (página pública, widget e API). Cada cliente é uma `Band` (a banda é quem faz login no app); a equipe do produto entra pelo painel `/admin` com contas `AdminUser`.

Toda a UI, rotas e mensagens são em **português (pt-BR)**. Identificadores de código e campos do banco são em inglês (exceto enums e rotas de página).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Auth | next-auth v5 (beta) — Credentials (email + senha bcrypt), sessão **JWT** com `role` (`band` \| `superadmin`) |
| Banco | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` (pool `pg` próprio em `lib/prisma.ts`) |
| Validação | Zod 4 (`lib/validations.ts`) |
| UI | Tailwind CSS 4 com **tokens semânticos** (`app/globals.css`), componentes em `components/ui/`, ícones `lucide-react` — ver **`docs/design-system.md`** |
| Testes | Vitest (unitários em `lib/*.test.ts`; contraste dos tokens em `tests/`) |
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
    contatos/              Lead: lista (paginada, coluna Fluxo), detalhe ("Adicionar ao fluxo"), editar
    fluxo/                 Fluxo de contatos: quadro por etapa (Deal) — docs/modulos-marketing.md §4.4
    explorar/              Explorar Palcos: diretório curado (só PUBLISHED), "Adicionar ao fluxo"
    integracoes/           submenu no menu lateral; /integracoes → /integracoes/agenda (next.config.ts)
      agenda/              Integrações → Agenda: agenda pública (ativar, slug, divulgar)
      contato/             Integrações → Contatos: status, formulário pronto, domínios, token de servidor
    banda/                 dados da conta
  api/                     só ESCRITA (leitura é feita direto nos Server Components)
    auth/[...nextauth]     next-auth
    register               cadastro público (rate limit por IP)
    band (PATCH), band/ingest-token (POST), band/public-agenda (PATCH: opt-in + slug),
    band/lead-form (PATCH: opt-in + domínios), band/lead-form/test (POST: lead de teste), band/password (POST)
    admin/*                SUPERADMIN (withAdmin): stages, bands (+reset-password), admins, password
    venues (POST), venues/[id] (PATCH, DELETE)
    deals (POST), deals/[id] (PATCH, DELETE)  Fluxo de contatos (incluir contato/palco, mover etapa, tirar)
    shows (POST), shows/[id] (PATCH, DELETE)
    leads/[id] (PATCH, DELETE)
    leads/ingest           PÚBLICO — recebe leads de sites externos via token
    public/v1/bands/[slug]/shows  PÚBLICO — API da agenda (GET, CORS *, cache CDN)
    public/v1/bands/[slug]/leads  PÚBLICO — envio do formulário (origem do app ou domínio cadastrado, anti-spam)
  b/[slug]/                PÚBLICO — página da agenda da banda (opt-in); contato/ = formulário público
  embed/[slug]/shows|contato/  PÚBLICO — widgets (agenda e formulário) para iframe em sites externos
  admin/                   PAINEL SUPERADMIN (docs/admin.md): login/ + (painel)/ palcos, usuarios/bandas, usuarios/administradores, senha
  design-system/           galeria viva do design system (só em dev: /design-system)
  not-found.tsx            404 global
components/
  ui/                      design system (docs/design-system.md): styles.ts (receitas/tokens), icons.ts,
                           Button, Badge, Card, Alert, fields, PageHeader, DetailList, Table, FilterBar,
                           Pagination, EmptyState, CodeBlock, ConfirmButton, StatusPage, Brand, AuthLayout
  public/                  PublicShowList, EmbedAutoResize (página pública e widget)
  explore/                 StageCard, ExploreFilterForm (Explorar Palcos)
  deals/                   DealBoard (client: arrastar e soltar com @dnd-kit/core, estado local), DealCard, DealDetails (painel), DealStepBadge, AddToFlowButton
  *Form.tsx                formulários client (POST/PATCH na API)
  DashboardShell.tsx       menu lateral (gaveta no mobile) + header
hooks/                     useJsonSubmit (envio de formulário), useIbgeCities (municípios c/ cache)
lib/
  api.ts                   withBand, parseBody, jsonError, zodError, isUniqueViolation
  session.ts               getSession; requireBandId/requireBandSession; requireAdminId/requireAdminSession (papel + conta ativa)
  access.ts                regras de acesso por rota e papel (proxy.ts) — função pura com teste
  passwords.ts             senha provisória + hash · change-password.ts: troca da própria senha
  stages.ts                labels/tons de Stage, reverificação
  explore.ts               Explorar Palcos: filtros, where (sempre PUBLISHED), ordem
  deals.ts                 Fluxo de contatos: etapas/labels/tons, origem, canAddToVenues, pré-preenchimento da casa
  validations.ts           schemas Zod que validam E normalizam
  shows.ts                 regras de domínio de Show (local, snapshot de cachê, datas)
  money.ts / format.ts     formatação (moeda, datas, telefone, links wa.me/Instagram)
  rate-limit.ts            rate limit em memória
  lead-ingest-auth.ts      extração/geração/hash do token de ingestão
  public-agenda.ts         toPublicShow (saída pública de show — PRIVACIDADE), JSON-LD
  public-agenda-query.ts   getPublicAgenda (opt-in, isPublic, só futuros)
  slug.ts / band-slug.ts   regras e geração do slug público da banda
  public-lead.ts           regras do envio público: classifyOrigin, spamVerdict (com teste)
  lead-form-token.ts       token anti-robô do formulário (HMAC com AUTH_SECRET)
  origins.ts               normalização de domínios autorizados
proxy.ts                   proteção de rotas (páginas → redirect /login, API → 401)
prisma/schema.prisma       modelo de dados
docs/design-system.md      tokens, componentes, modelos de página, microcopy, acessibilidade
docs/integracoes.md        agenda pública + formulário: contratos, privacidade, fases futuras
docs/admin.md              painel superadmin: papéis, acesso, senhas provisórias, bootstrap, palcos
docs/modulos-marketing.md  engenharia reversa (Palcos do Brasil) + desenho de EPK, Explorar Palcos e Abordagem com IA
public/embed.js            script de auto-altura do widget (contrato público)
tests/                     testes fora de lib/ (contraste WCAG dos tokens)
```

## Modelo de dados (resumo)

- **Band** — conta. `email` único, `passwordHash`, `leadIngestTokenHash` (SHA-256 do token; o token em si nunca é salvo), `slug` único (endereço público `/b/<slug>`), `publicAgendaEnabled` (opt-in da agenda pública), `leadFormEnabled` (opt-in do formulário público), `leadAllowedOrigins` (domínios autorizados a enviar o formulário pelo navegador).
- **Venue** (casa de show) — `sendStatus`: `NAO_ENVIADO | ENVIADO | FINALIZADO` (status do envio de material/proposta). `valorCacheCents` opcional = cachê de **referência** da casa. `stageId?` = palco do diretório de onde veio (`@@unique([bandId, stageId])`, `onDelete: SetNull`).
- **Show** — pode ser em uma `Venue` (`venueId`) **ou** um *evento particular* (`venueId = null` + `privateCity`, `privateState`, `privateEventDetails`). Todo show tem o próprio `cacheCents` (**snapshot**): na criação, se não vier no payload, copia o `valorCacheCents` da casa; ao trocar de casa no PATCH sem enviar cachê, copia o da nova casa (`resolveShowCache` em `lib/shows.ts`). Exibir sempre `show.cacheCents`, nunca `show.venue.valorCacheCents`. A regra "sem casa ⇒ cidade e UF obrigatórias" está em `showCreateSchema.superRefine`. `date` é **data pura armazenada em UTC 00:00**; `time` é string `HH:mm`. `paymentStatus`: `PAGO | AGUARDANDO_PAGAMENTO`. Agenda pública: `isPublic` (padrão: casa = true, particular = false — `resolveShowVisibility`), `ticketUrl`, `cancelledAt` (cancelado continua listado).
- **AdminUser** — equipe do produto (painel `/admin`), separado de `Band`. `mustChangePassword`, `disabledAt`, `lastLoginAt`.
- **Stage** — palco da base curada (Explorar Palcos), global. Campos de contato: `whatsapp`, `publicPhone`, `publicEmail`, `instagram` (institucionais); `neighborhood`, `imageUrl` (link de ORIGEM, nunca exibido), `imageThumbUrl` (única imagem servida), `lastActivityAt`; `externalSource`+`externalId` (únicos) para reimportação. `status` `DRAFT|PUBLISHED|ARCHIVED`, `verifiedAt/By`. Só canais institucionais (LGPD).
- **Band** (conta): `disabledAt` (desativada pelo painel; corta acesso na hora) e `mustChangePassword` (senha provisória).
- **Lead** — contato recebido pela ingestão. Campos livres (`eventDate` é string, não data). `metadata` JSON arbitrário.
- **Deal** — negociação do Fluxo de contatos. `step` (`PRIMEIRO_CONTATO | PROPOSTA | PERDEU | GANHOU`, fixas), `source` (`CONTATO | EXPLORADOR`), `leadId?`/`stageId?` (uma negociação por contato/palco por banda), `venueId?` (casa criada ao ganhar), `notes` (observações da banda), cópia de `name/city/state` (origens com `SetNull`). **Casa a partir do fluxo só com etapa Ganhou** — regra `canAddToVenues`, conferida também em `POST /api/venues` (`dealId`).

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
- Rotas públicas precisam ser liberadas explicitamente em `proxy.ts` (`/`, `/login`, `/cadastro`, `/api/auth/*`, `/api/register`, `/api/leads/ingest` e, em `isPublicIntegrationPath`, `/b/*`, `/embed/*`, `/embed.js`, `/api/public/*`). Qualquer nova rota é protegida por padrão.
- **Privacidade da agenda:** toda saída pública de show passa por `toPublicShow` (lista fechada; cachê, pagamento, detalhes de evento particular e contatos da casa nunca saem). Detalhes e contratos em `docs/integracoes.md`.
- Endpoints públicos ou de autenticação usam `rateLimit` (`lib/rate-limit.ts`). É por instância (em memória); para limite global, trocar a implementação por Redis/Upstash mantendo a assinatura.
- Segredos de integração: guardar só hash (ver `lead-ingest-auth.ts`).
- Nunca versionar `.env*` (só `.env.example`). Novas variáveis de ambiente devem ser adicionadas ao `.env.example`.

### Papéis (banda × superadmin) — ver `docs/admin.md`
- Regras de acesso só em `lib/access.ts` (`decideAccess`) — o `proxy.ts` apenas executa. Mudou regra? Atualize `lib/access.test.ts`.
- Rotas de banda: `withBand`/`requireBandId`; do painel: `withAdmin`/`requireAdminId`. Ambos conferem **papel e conta ativa no banco**.
- Primeiro superadmin: `npm run admin:create -- --email … --name …` (recusa banco remoto sem `--confirm-remote`).
- Login do painel é Server Action (`app/admin/login/actions.ts`): falhas não podem cair em `/login` (das bandas).

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

### Integrações (contratos públicos) — ver `docs/integracoes.md`
- `/api/leads/ingest`: token em `Authorization: Bearer` ou `X-Lead-Token` (lookup por `leadIngestTokenHash`); aliases legados `phone`→`whatsapp`, `message`→`eventDescription` (teste em `lib/validations.test.ts`); CORS só para `LEADS_INGEST_ALLOWED_ORIGINS`; rate limit 60/min por token.
- `GET /api/public/v1/bands/<slug>/shows`, widget `/embed/<slug>/shows?tema&fundo&limite` e `public/embed.js` (mensagem `agenda-banda:resize`) são usados por sites de terceiros: **só adicione** campos/parâmetros; mudança incompatível = nova versão (`/v2`).
- Agenda desligada ou slug inexistente → mesmo 404 (não revela existência).
- Formulário público (`POST /api/public/v1/bands/<slug>/leads`): só aceita `Origin` do próprio app ou de `leadAllowedOrigins`; anti-spam por honeypot `website` + token de formulário (`lib/lead-form-token.ts`, ≥ 3 s) + rate limit; spam responde 201 sem gravar. Páginas com formulário usam `await connection()` (token por request). Detalhes em `docs/integracoes.md` §2.

### UI — design system
**Leia `docs/design-system.md` antes de criar ou alterar qualquer tela.** Resumo das regras obrigatórias:
- Use componentes de `components/ui/`; se nada serve, estenda/crie lá (e adicione à galeria `app/design-system/Gallery.tsx` e ao doc).
- Cores só por **token semântico** (`bg-surface`, `text-fg-muted`, `border-line`, `toneClass`…). Paleta crua (`zinc-500`, `bg-black/50`) e `dark:` são **erro de lint** em `app/` e `components/`.
- Status → `Badge` com tom fixo por significado (info = em andamento, success = concluído/pago, warning = pendente, danger = erro).
- Página: `metadata.title` + `containerClass` + `PageHeader` (único `<h1>`, ações à direita, no máx. 1 `primary`).
- Formulário: `*Field` (label ligado), `CurrencyField`/`PhoneField` para máscaras, `Alert` para erro, `FormActions` com `cancelHref`.
- Listagem: `FilterBar` → `EmptyState` → `Table` (todo `Td` com `label`; vira card no mobile) → `Pagination`.
- Confirmação/exclusão: `ConfirmButton`/`ConfirmDeleteButton` (nunca `window.confirm`/`alert`); bloqueios com `disabledReason`.
- Ícones de `components/ui/icons.ts` por nome semântico (`VenueIcon`, `ShowIcon`…). Nome do produto: `PRODUCT_NAME`/`Brand`.
- Menu por **módulos** (`NAV_GROUPS` em `components/DashboardShell.tsx`): Administrativo (Casas, Shows) · Financeiro (em breve) · Marketing (Contatos, Fluxo de contatos, Redes Sociais, EPK Profissional, Explorar Palcos, Abordagem com IA) · Configurações (Integrações, Minha banda). URLs não têm prefixo de módulo. Item não lançado = `soon: true` (desabilitado, "Em breve"); módulo não lançado = `soon: { icon }`. `matchNova: false` se houver sub-rota `nova`; `children` para submenu (cada filho é uma rota com `PageHeader eyebrow`).
- Microcopy em pt-BR, botões com verbo, vocabulário fixo (Casa de show, Show, Contato, Cachê…). Teste em 390px e no tema escuro.

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

npm run admin:create -- --email … --name …   # primeiro superadmin (painel /admin)
npm run stages:import -- --file <json> --dry-run   # importação em lote de palcos (docs/admin.md §6)
npm run stages:images -- --hosts <bucket> --dry-run  # gera miniaturas (WebP 400×300) dos palcos no storage (docs/admin.md §6.1)

# Banco LOCAL (PGlite, .local-db/) — valide migrations e features sem tocar em produção:
npm run db:local          # sobe o banco (deixe rodando)
npm run db:local:migrate  # prisma migrate deploy no banco local
npm run db:local:seed     # banda demo: demo@local.test / senha-local-123, agenda /b/banda-demo
npm run dev:local         # next dev apontando para o banco local
```

**Antes de `npm run db:deploy` em produção, rode a migration no banco local** (`db:local:migrate`) e valide o fluxo com `dev:local`. `scripts/with-local-db.mjs <cmd>` roda qualquer comando apontando para o banco local. O `.env.local` aponta para o Supabase de produção — nunca rode seed/testes destrutivos sem o wrapper local.

CI: `.github/workflows/ci.yml` (lint, typecheck, testes, `prisma validate`, build) em push/PR para `main`.
Testes: funções puras em `lib/` têm `*.test.ts` ao lado. Ao criar regra de negócio, extraia para `lib/` e teste lá.

## Débitos técnicos conhecidos

- **Vazamento:** um SQLite criado por `.env` malformado (path `dev.db"AUTH_SECRET=…`) foi versionado em `7d4e466` e removido depois; **continua no histórico do GitHub** até reescrever o histórico. O `AUTH_SECRET` e os dados desse banco devem ser considerados vazados.
- Rate limit é em memória (por instância serverless), não global.
- Não há testes E2E (Playwright) nem de integração com banco; os testes cobrem só `lib/`.
- Escritas via route handlers + `fetch`; migrar para Server Actions (`useActionState`) é opcional, mas manteria `/api/leads/ingest` como REST.
- Sem página inicial com resumo (próximos shows, valores a receber) — `/` redireciona para `/casas`.
- Débitos de UX detalhados: seção 12 de `docs/design-system.md`.
- Marketing: EPK Profissional, Explorar Palcos e Abordagem com IA desenhados em `docs/modulos-marketing.md`. Feito: painel superadmin com cadastro de palcos (base do Explorar). Feito: Explorar Palcos das bandas (`/explorar`, §4.2.1) e Fluxo de contatos (`/fluxo`, §4.4). Pendente: EPK (Supabase Storage), Abordagem com IA (Claude com cota).
- Painel: sem log de auditoria das ações da equipe; importação em lote só por script (sem upload no painel); superadmin não redefine senha de outro admin pela tela (usar `npm run admin:create -- --reset`).
- Integrações — fase 3 (iCal, redirecionamento de slug antigo, webhooks, email de novo lead, captcha): `docs/integracoes.md`.
