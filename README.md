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

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run check` | lint + typecheck + testes (o mesmo que o CI roda) |
| `npm run test` / `test:watch` | testes unitários (Vitest) |
| `npm run db:migrate` | cria/aplica migration em dev (`prisma migrate dev`) |
| `npm run db:deploy` | aplica migrations pendentes em produção (`prisma migrate deploy`) |

## Deploy (Vercel)

1. Configure `DATABASE_URL` (pooler do Supabase, modo transaction, porta 6543) e `AUTH_SECRET`. `DIRECT_URL` só é usada pelo Prisma CLI.
2. Antes de publicar código que depende de schema novo, rode `npm run db:deploy` apontando para o banco de produção (faça backup antes de migrations que alteram dados). O `DIRECT_URL` deve ser o pooler em modo **session** (porta 5432), não a conexão direta `db.<ref>.supabase.co`, que é só IPv6 (erro P1001 em redes sem IPv6).

## Integrações

- **Agenda pública:** a banda ativa em **Integrações** e divulga a página `/b/<slug>`, o widget (iframe + `embed.js`) ou a API `GET /api/public/v1/bands/<slug>/shows`.
- **Formulário de contato:** o site envia `POST /api/leads/ingest` com `Authorization: Bearer <token>`; o lead aparece em **Contatos**.

Contratos, privacidade e próximas fases: [docs/integracoes.md](docs/integracoes.md).

## Para quem vai desenvolver

- Arquitetura, convenções e débitos técnicos: [AGENTS.md](AGENTS.md).
- UI/UX: [docs/design-system.md](docs/design-system.md) — tokens, componentes e padrões. Galeria viva em `npm run dev` → `/design-system`.
