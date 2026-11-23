---
name: deploy
description: Deploy completo do banda app em produção (Vercel + Supabase) — verificação, migrations, merge do PR, espera do deploy e smoke test. Use quando o usuário pedir "deploy", "faz o deploy", "sobe para produção", "publica", "manda pra produção" ou "release".
---

# Deploy em produção — banda app

Produção = **Vercel** (deploy automático a cada push na `main`, via integração com o GitHub) + **Supabase Postgres** (migrations com Prisma). Domínio: `https://banda-app.vercel.app` (ou `DEPLOY_PRODUCTION_URL`). Referência humana: `docs/deploy.md`.

Siga os passos **em ordem**. Pare no primeiro bloqueio e explique ao usuário. Escreva para o usuário em pt-BR.

## 0. O que vai subir
- `git status`, branch atual e PR aberto (`gh pr list --repo obrunoalbano/banda-app --state open`).
- Alterações não commitadas → pergunte se devem entrar; se sim, commit + push no PR (nunca commit direto na `main`).
- Sem PR → abra um (branch nova a partir do trabalho, `gh pr create --base main`).
- Mais de um PR aberto → pergunte quais entram.

## 1. Verificação (somente leitura)
```bash
npm run deploy:check -- --pr <número>
```
Confere: árvore limpa e com push, PR aberto/sem conflito, **CI verde**, `npm run check` local, migrations pendentes em produção (e comandos não retrocompatíveis), variáveis novas/alteradas no `.env.example`, produção no ar.
- ❌ → pare e resolva (CI rodando: espere com `gh pr checks <n> --repo obrunoalbano/banda-app --watch` em background, um comando só).
- ⚠️ migration não retrocompatível (DROP, RENAME, SET NOT NULL…) → **não siga**: proponha dividir em duas etapas (expandir agora, contrair num deploy seguinte).

## 2. Migrations validadas no banco local
Só se houver migration pendente:
```bash
npm run db:local            # em background, se não estiver rodando (porta 54329)
npm run db:local:migrate
node scripts/with-local-db.mjs prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script   # deve dizer "empty migration"
```

## 3. Confirmação do usuário (obrigatória)
Mostre um resumo e **espere um "sim" explícito** — os passos seguintes escrevem em produção:
- PR (link) e commits que entram;
- migrations que vão rodar em produção (e se alguma transforma dados);
- variáveis novas/alteradas: o usuário confirma que já estão na Vercel (Settings → Environment Variables → Production). Variável faltando que o código exige = bloqueio;
- passos manuais pós-deploy, se houver (ex.: script de dados).

Aprovação de um deploy não vale para o próximo.

## 4. Migrations em produção (antes do merge)
```bash
npm run db:deploy
```
O `.env.local` aponta para produção (`DIRECT_URL`). Rodar antes do merge garante que o código novo nunca rode sem as tabelas/colunas; por isso migrations precisam ser aditivas (passo 1). Falhou → **pare**, não faça merge; mostre o erro (`prisma migrate status`) e discuta a correção.

## 5. Merge
```bash
gh pr merge <número> --repo obrunoalbano/banda-app --merge
```
Merge commit (padrão do repositório). Não apague a branch nem force push. Anote o SHA do merge: `gh pr view <número> --repo obrunoalbano/banda-app --json mergeCommit --jq .mergeCommit.oid`.

## 6. Deploy na Vercel + smoke test
```bash
npm run deploy:check -- post --sha <sha-do-merge>
```
Rode em background (espera até 10 min, um comando só). Espera o deploy de produção daquele commit ficar `success` e testa rotas públicas, proteção de rotas privadas e o título de `/login`.
- Falhou o build na Vercel → produção continua na versão anterior (a Vercel só promove build bom). Mostre o link do deploy e investigue; corrija num novo PR.
- Smoke test falhou → avalie com o usuário o rollback (abaixo).

## 7. Depois
- Atualize a `main` local: `git switch main && git pull --ff-only`.
- Relate: o que subiu (PR, SHA), migrations aplicadas, resultado do smoke test, pendências manuais.
- Se o usuário pedir, rode scripts de dados (ex.: `stages:import`) — sempre com confirmação própria.

## Rollback
- **Código:** Vercel → Deployments → deploy anterior → "Promote to Production" (instantâneo; ação do usuário no painel), ou `git revert -m 1 <sha-do-merge>` num PR novo e repetir este processo.
- **Banco:** migrations não são desfeitas automaticamente. Como são aditivas, o código anterior continua funcionando com o banco novo. Desfazer uma migration exige SQL escrito à mão + `prisma migrate resolve` — só com o usuário.

## Nunca
- Deploy sem CI verde, sem `deploy:check` ou sem o "sim" do usuário.
- `prisma migrate dev`, `db push` ou `migrate reset` contra produção.
- Seed/testes destrutivos sem `scripts/with-local-db.mjs`.
- Push direto na `main`, force push, mexer em variáveis/configurações da Vercel ou do Supabase.
