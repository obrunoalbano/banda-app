# Deploy em produção

**Vercel** publica automaticamente cada push na `main` (integração com o GitHub; PRs ganham preview). O banco é o **Supabase Postgres**, com migrations do Prisma aplicadas à mão. Domínio: `https://banda-app.vercel.app`.

Com o Claude Code, basta pedir **"deploy"**: a skill `.claude/skills/deploy` executa este processo e pede confirmação antes de escrever em produção.

## Passo a passo

| # | Passo | Comando | Escreve em produção? |
| --- | --- | --- | --- |
| 1 | Tudo commitado, com push, num PR para `main` | `gh pr create --base main` | não |
| 2 | Verificação: git, PR/CI verde, testes, migrations pendentes, variáveis | `npm run deploy:check -- --pr <n>` | não (banco em modo leitura) |
| 3 | Migrations pendentes validadas no banco local | `npm run db:local:migrate` | não |
| 4 | Variáveis novas configuradas na Vercel (Settings → Environment Variables → Production) | painel da Vercel | — |
| 5 | Migrations em produção, **antes do merge** | `npm run db:deploy` | **sim** |
| 6 | Merge do PR (merge commit) | `gh pr merge <n> --merge` | **sim** (dispara o deploy) |
| 7 | Espera o deploy do commit e roda o smoke test | `npm run deploy:check -- post --sha <sha>` | não |
| 8 | Atualiza a `main` local | `git switch main && git pull --ff-only` | não |

## Regras
- **Migrations aditivas.** Elas rodam antes do merge: por alguns minutos o código antigo usa o banco novo. Criar tabela/coluna opcional/índice é seguro; remover, renomear, tornar obrigatória ou mudar tipo de coluna precisa de duas etapas (expandir num deploy, contrair no seguinte). O `deploy:check` aponta esses comandos.
- **CI verde** (lint, typecheck, testes, `prisma validate`, build) é obrigatório.
- Variável nova que o código exige precisa estar na Vercel **antes** do merge. O `deploy:check` lista as variáveis novas e as linhas alteradas do `.env.example`.

## Rollback
- **Código:** Vercel → Deployments → deploy anterior → *Promote to Production* (instantâneo). Ou `git revert -m 1 <sha-do-merge>` num PR e repetir o processo.
- **Banco:** migration não é desfeita automaticamente; por ser aditiva, a versão anterior do código continua funcionando. Reverter exige SQL manual + `prisma migrate resolve`.
