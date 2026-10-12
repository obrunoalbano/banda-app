# Banda

App para bandas organizarem **casas de show** (prospecção e status de envio), **agenda de shows** (cachê e pagamento) e **contatos** recebidos pelo site da banda.

Next.js 16 · React 19 · Prisma 7 + PostgreSQL · next-auth v5 · Tailwind 4 · Zod 4 · lucide-react · Vitest

## Rodando localmente

Pré-requisitos: Node 20.9+ e um PostgreSQL (local, Supabase, Neon…).

```bash
cp .env.example .env.local   # preencha DATABASE_URL, DIRECT_URL e AUTH_SECRET
npm install                  # também gera o Prisma Client
npm run db:migrate           # aplica as migrations no banco de desenvolvimento
npm run dev                  # http://localhost:3000
```

Gere o `AUTH_SECRET` com `openssl rand -base64 32`. Uma variável por linha, com aspas fechadas.

## Validar localmente sem tocar em produção

Banco Postgres local (PGlite, dados em `.local-db/`, fora do git). Não precisa de Docker.

```bash
npm run db:local           # terminal 1 — sobe o banco (deixe rodando; Ctrl+C para parar)
npm run db:local:migrate   # terminal 2 — aplica as migrations (o mesmo prisma migrate deploy de produção)
npm run db:local:seed      # banda de exemplo (recria a cada execução)
npm run dev:local          # app em http://localhost:3000 usando o banco local
```

- Login de exemplo: `demo@local.test` / `senha-local-123` · agenda pública: `/b/banda-demo`.
- `npm run dev` (sem `:local`) continua usando o banco do `.env.local`. Só um `next dev` pode rodar por vez nesta pasta.
- Começar do zero: pare o banco e apague `.local-db/`.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run check` | lint + typecheck + testes (o mesmo que o CI roda) |
| `npm run test` / `test:watch` | testes unitários (Vitest) |
| `npm run db:migrate` | cria/aplica migration em dev (`prisma migrate dev`) |
| `npm run db:deploy` | aplica migrations pendentes em produção (`prisma migrate deploy`) |
| `npm run admin:create -- --email … --name …` | cria o primeiro superadmin do painel `/admin` ([docs/admin.md](docs/admin.md)) |
| `npm run stages:import -- --file <json> --dry-run` | importa palcos em lote para a base curada (relatório com `--dry-run`) |
| `npm run stages:images -- --hosts <bucket> --dry-run` | copia as imagens dos palcos para o storage em WebP otimizado |

## Deploy (Vercel)

1. Configure `DATABASE_URL` (pooler do Supabase, modo transaction, porta 6543) e `AUTH_SECRET`. `DIRECT_URL` só é usada pelo Prisma CLI.
2. Antes de publicar código que depende de schema novo, rode `npm run db:deploy` apontando para o banco de produção (faça backup antes de migrations que alteram dados). O `DIRECT_URL` deve ser o pooler em modo **session** (porta 5432), não a conexão direta `db.<ref>.supabase.co`, que é só IPv6 (erro P1001 em redes sem IPv6).

## Integrações

- **Agenda pública:** a banda ativa em **Integrações → Agenda** e divulga a página `/b/<slug>`, o widget (iframe + `embed.js`) ou a API `GET /api/public/v1/bands/<slug>/shows`.
- **Formulário de contato:** a banda ativa em **Integrações → Contatos** e usa o formulário pronto (`/b/<slug>/contato` ou widget), o formulário do próprio site (domínios autorizados) ou a integração pelo servidor (`POST /api/leads/ingest` com token). Os pedidos aparecem em **Contatos**.

Contratos, privacidade e próximas fases: [docs/integracoes.md](docs/integracoes.md).

## Para quem vai desenvolver

- Arquitetura, convenções e débitos técnicos: [AGENTS.md](AGENTS.md).
- UI/UX: [docs/design-system.md](docs/design-system.md) — tokens, componentes e padrões. Galeria viva em `npm run dev` → `/design-system`.
