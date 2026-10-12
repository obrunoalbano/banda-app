# Painel superadmin (`/admin`)

Área da **equipe do produto** — separada do app das bandas. Hoje cadastra **palcos** (base curada do Explorar Palcos) e **usuários** (contas de banda e outros administradores). Leia antes de mexer em `app/admin/`, `app/api/admin/`, `lib/access.ts`, `auth.ts` ou nos modelos `AdminUser`/`Stage`.

---

## 1. Papéis e acesso

| Papel | Tabela | Login | Área | APIs |
| --- | --- | --- | --- | --- |
| `band` | `Band` (tenant) | `/login` (provider `credentials`, client) | `/casas`, `/shows`, … | `/api/*` |
| `superadmin` | `AdminUser` (equipe) | `/admin/login` (provider `admin`, **Server Action**) | `/admin/*` | `/api/admin/*` |

- Tabelas separadas de propósito: o superadmin não é cliente nem tenant; uma falha numa área não dá acesso à outra.
- O JWT carrega `role` e `mustChangePassword` (`auth.ts`). Tokens antigos sem `role` contam como `band`.
- **Regras em `lib/access.ts` (`decideAccess`, função pura com teste)**, executadas pelo `proxy.ts`:
  - superadmin em página de banda → `/admin`; em API de banda → 403;
  - banda em `/admin/*` → `/casas`; em `/api/admin/*` → 403;
  - sem sessão: páginas do painel → `/admin/login`; APIs → 401;
  - `mustChangePassword`: tudo redireciona para `/banda/senha` ou `/admin/senha` (APIs → 403), exceto a própria troca de senha.
- **Defesa em profundidade** no servidor: `requireBandSession`/`requireBandId` e `requireAdminSession`/`requireAdminId` (`lib/session.ts`) conferem papel **e conta ativa no banco** (deduplicado por request). Rotas do painel usam `withAdmin` (`lib/api.ts`).
- Desativar conta (`disabledAt`) corta o acesso **na hora**, mesmo com JWT válido (a checagem no banco nega e redireciona para `/login?code=disabled_or_expired`); o login mostra "conta desativada" só depois da senha correta (não confirma emails a terceiros).

## 2. Senhas
- Conta criada ou redefinida pelo painel recebe **senha provisória** (`generateTempPassword`, `xxxx-xxxx-xxxx`, sem caracteres ambíguos), exibida **uma única vez** (`TempPasswordReveal`); só o hash é salvo; `mustChangePassword = true`.
- Troca da própria senha: `POST /api/band/password` e `POST /api/admin/password` (`lib/change-password.ts`): confere a atual, grava a nova, limpa `mustChangePassword` e atualiza o JWT (`unstable_update`).
- Depois de trocar, o formulário faz **navegação completa** (`window.location.assign`): o roteador do Next guardou pré-carregamentos feitos durante a senha provisória (todos redirecionando para a troca).

## 3. Primeiro acesso (bootstrap)
Não existe superadmin até alguém criar o primeiro pelo terminal:

```bash
npm run admin:create -- --email voce@empresa.com --name "Seu Nome"               # banco do .env.local
npm run admin:create -- --email voce@empresa.com --name "Seu Nome" --confirm-remote  # obrigatório se o banco não for local
npm run admin:create -- --email voce@empresa.com --reset                          # nova senha provisória (reativa a conta)
node scripts/with-local-db.mjs node scripts/create-superadmin.mjs --email …       # banco local (PGlite)
```
O comando mostra o banco de destino, recusa banco remoto sem `--confirm-remote`, e imprime a senha provisória. Os demais administradores são criados pelo próprio painel (**Usuários → Administradores**). Seed local: `admin@local.test` / `senha-admin-123`.

## 4. Telas
| Rota | O quê |
| --- | --- |
| `/admin/login` | Login da equipe (Server Action: erro volta para a mesma tela; destino decidido na action) |
| `/admin/palcos` | Lista com resumo (publicados, rascunhos, arquivados, **para reverificar**), filtros (nome/cidade, situação, UF), paginação |
| `/admin/palcos/novo` · `/admin/palcos/[id]` | Cadastro/edição + curadoria: **Publicar**, **Marcar como verificado**, **Arquivar**, **Voltar para rascunho**, **Excluir** (só rascunho) |
| `/admin/usuarios/bandas` | Contas de banda: busca, situação (ativas, desativadas, senha provisória) |
| `/admin/usuarios/bandas/nova` · `/[id]` | Criar conta (senha provisória) · dados da conta, integrações ativas, uso (casas/shows/contatos), **Redefinir senha**, **Desativar/Reativar** |
| `/admin/usuarios/administradores` (+`/novo`) | Equipe; desativar/reativar (ninguém desativa a si mesmo) |
| `/admin/senha` | Troca da própria senha |

`/admin` → `/admin/palcos` e `/admin/usuarios` → `/admin/usuarios/bandas` (redirects HTTP no `next.config.ts`). Shell: `DashboardShell variant="admin"` (menu próprio + faixa "Painel administrativo"). Páginas `noindex`.

## 5. Palcos (base curada) — `Stage`
- Global (não pertence a banda). Campos: nome, tipo (`StageType`), cidade/UF, estilos (`genres[]`), Instagram (normalizado `@handle`), site, telefone/email **comerciais**, capacidade, programação/observações, **fonte da informação** (interna), situação (`DRAFT` → `PUBLISHED` → `ARCHIVED`), `verifiedAt/By`, `createdBy`.
- **LGPD:** só canais institucionais. Nome/telefone pessoal de responsável **não** entram (ficam na `Venue` privada de cada banda).
- Publicar = verificar agora. **Reverificação** sugerida após 180 dias (`needsReverification`, selo "Reverificar").
- O Explorar Palcos (bandas) mostrará só `PUBLISHED` — ver `docs/modulos-marketing.md` §4.

## 6. Importação em lote de palcos
Script `scripts/import-stages.mjs` (normalização em `lib/stage-import.ts`, com teste). Use para bases **próprias da equipe** (ou com licença de reúso) — a origem fica registrada em cada palco (`sourceNote`).

```bash
npm run stages:import -- --file venues.json --dry-run                                   # relatório, não grava
node scripts/with-local-db.mjs node scripts/import-stages.mjs --file venues.json --admin-email voce@empresa.com   # banco local
npm run stages:import -- --file venues.json --admin-email voce@empresa.com --confirm-remote                      # produção
```
- Formato: lista ou `{ venues: [...] }` com `id, name, type, state, city, phone, whatsapp, instagram, imageUrl, verified, lastActivity, created_at`.
- Normaliza: tipo (Bar, Pub, Casa de Shows, Espaço Cultural, Teatro…), **"Cidade (Bairro)" → cidade + bairro**, telefones `(11) 99999-0000`, Instagram `@perfil`, imagem só https, `lastActivity` (ano, timestamp ou data).
- Descarta sem nome/cidade/UF válida; ignora duplicados (nome + cidade + bairro + UF, sem acento/caixa).
- `--status PUBLISHED` (padrão) ou `DRAFT` para os novos. Publicado: só quem tem `verified=1` na origem recebe `verifiedAt`; os demais entram na fila **Reverificar**.
- **Reimportar** a mesma origem (`--source`, padrão `base-equipe`) atualiza os dados pelo `externalId` sem duplicar e **sem mexer na curadoria** (situação/verificação).
- Arquivos de dados ficam fora do git (`/venues.json`, `/data/` no `.gitignore`) — contêm contatos.

### 6.1 Imagens dos palcos
Imagens ficam **no nosso storage**, otimizadas: capa WebP até 800px (`imageUrl`, ~40 KB) + miniatura 400×300 (`imageThumbUrl`, ~15 KB) — ~70% menores que os originais. `imageThumbUrl` preenchido = imagem já migrada.

```bash
# 1) importar aceitando só imagens do bucket da equipe (as de terceiros são descartadas)
npm run stages:import -- --file venues.json --image-hosts <bucket>.r2.dev …
# 2) copiar/otimizar (retomável; pula o que já migrou)
npm run stages:images -- --hosts <bucket>.r2.dev --dry-run
npm run stages:images -- --hosts <bucket>.r2.dev --drop-others --clear-broken --confirm-remote   # produção
node scripts/with-local-db.mjs node scripts/migrate-stage-images.mjs --hosts <bucket>.r2.dev --limit 100  # local
```
- **Destino:** `--storage local` (padrão no banco local) grava em `.local-media/` (fora do git), servido em `/media/…` só em desenvolvimento (ou com `SERVE_LOCAL_MEDIA=1`, ligado pelo `with-local-db.mjs`). `--storage supabase` (padrão no banco remoto) usa o **Supabase Storage**, bucket público `media` (criado automaticamente) — requer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (chave de serviço: nunca no navegador nem no git).
- Caminho `stages/<id>/cover-<hash>.webp`: o hash muda quando a imagem muda (sem cache antigo na CDN).
- `--drop-others`: remove links de outros hosts (direito de imagem incerto). `--clear-broken`: remove links que dão 404/410.
- Concorrência padrão 6 (o `r2.dev` tem limite de tráfego; o script espera e tenta de novo). ~7 imagens/s.
- Reimportar o JSON **não** sobrescreve imagem já migrada.
- Exibição: `components/admin/StageThumb.tsx` (`next/image` com `unoptimized` — os arquivos já são otimizados; não consome a otimização da Vercel).

## 7. Checklist ao estender o painel
- [ ] Página nova em `app/admin/(painel)/…` (o layout já exige superadmin) com `requireAdminId()`.
- [ ] Rota de API em `app/api/admin/…` com `withAdmin`.
- [ ] Nada de dado de negócio das bandas (casas, cachês, contatos) exposto sem necessidade — o painel administra **contas**, não o conteúdo delas.
- [ ] Ações destrutivas/irreversíveis com `ConfirmButton`.
- [ ] Item novo no menu: `ADMIN_NAV_GROUPS` em `components/DashboardShell.tsx`.
- [ ] Teste em `lib/access.test.ts` se mudar regra de acesso.
