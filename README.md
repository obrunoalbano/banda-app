# Banda

App para bandas organizarem **casas de show** (prospecção e status de envio), **agenda de shows** (cachê e pagamento) e **contatos** recebidos pelo site da banda.

Next.js 16 · React 19 · Prisma 7 + PostgreSQL · next-auth v5 · Tailwind 4 · Zod 4 · Vitest

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

1. Configure `DATABASE_URL` (URL do **pooler**), `DIRECT_URL` (conexão direta) e `AUTH_SECRET`.
2. Antes de publicar código que depende de schema novo, rode `npm run db:deploy` apontando para o banco de produção (faça backup antes de migrations que alteram dados).

## Integração de leads

Na tela **Integrações** a banda gera um token e recebe a URL `POST /api/leads/ingest`. O site envia o JSON com `Authorization: Bearer <token>`; o lead aparece em **Contatos**. Detalhes do contrato em [AGENTS.md](AGENTS.md#ingestão-de-leads-apileadsingest).

## Para quem vai desenvolver

Arquitetura, convenções e débitos técnicos: [AGENTS.md](AGENTS.md).
