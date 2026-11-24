# Painel superadmin (`/admin`)

Área da **equipe do produto** — separada do app das bandas. Hoje cadastra **palcos** (base curada do Explorar Palcos) e **usuários** (bandas, contas de usuário e outros administradores). Leia antes de mexer em `app/admin/`, `app/api/admin/`, `lib/access.ts`, `auth.ts` ou nos modelos `AdminUser`/`Stage`/`User`/`BandMember`. O acesso das pessoas às bandas (multi-bandas, integrantes, convites) está na §8.

---

## 1. Papéis e acesso

| Papel | Tabela | Login | Área | APIs |
| --- | --- | --- | --- | --- |
| `user` | `User` (pessoa; acessa N bandas via `BandMember` — §8) | `/login` (provider `credentials`, client) | `/casas`, `/shows`, … | `/api/*` |
| `superadmin` | `AdminUser` (equipe) | `/admin/login` (provider `admin`, **Server Action**) | `/admin/*` | `/api/admin/*` |

- Tabelas separadas de propósito: o superadmin não é cliente nem tenant; uma falha numa área não dá acesso à outra.
- O JWT carrega `role` e `mustChangePassword` (`auth.ts`). Tokens antigos (sem `role` ou com `role: "band"`, de antes de multi-bandas) contam como `user` — a migração criou cada `User` com o **mesmo id** da banda, então essas sessões continuam válidas.
- **Regras em `lib/access.ts` (`decideAccess`, função pura com teste)**, executadas pelo `proxy.ts`:
  - superadmin em página de banda → `/admin`; em API de banda → 403;
  - usuário em `/admin/*` → `/casas`; em `/api/admin/*` → 403;
  - sem sessão: páginas do painel → `/admin/login`; APIs → 401;
  - `mustChangePassword`: tudo redireciona para `/conta/senha` ou `/admin/senha` (APIs → 403), exceto a própria troca de senha.
- **Defesa em profundidade** no servidor: `requireUserSession`/`requireBandContext` e `requireAdminSession`/`requireAdminId` (`lib/session.ts`) conferem papel **e conta ativa no banco** (deduplicado por request); `requireBandContext` também confere que o usuário é integrante da banda ativa e que ela não está desativada. Rotas do painel usam `withAdmin` (`lib/api.ts`).
- Desativar conta (`disabledAt`) corta o acesso **na hora**, mesmo com JWT válido (a checagem no banco nega e redireciona para `/login?code=disabled_or_expired`); o login mostra "conta desativada" só depois da senha correta (não confirma emails a terceiros).

## 2. Senhas
- Conta criada ou redefinida pelo painel recebe **senha provisória** (`generateTempPassword`, `xxxx-xxxx-xxxx`, sem caracteres ambíguos), exibida **uma única vez** (`TempPasswordReveal`); só o hash é salvo; `mustChangePassword = true`.
- Troca da própria senha: `POST /api/account/password` (`/conta/senha`) e `POST /api/admin/password` (`lib/change-password.ts`): confere a atual, grava a nova, limpa `mustChangePassword` e atualiza o JWT (`unstable_update`).
- **Esqueci minha senha (usuários do app):** `/esqueci-senha` → `POST /api/password/forgot` (resposta igual exista ou não a conta; rate limit por IP e por email) envia por email um link `/redefinir-senha?token=…` → `POST /api/password/reset`. Token de 256 bits; o banco guarda só o SHA-256 (`User.passwordResetTokenHash`), vale 1 hora, uso único, um por vez (pedir de novo invalida o anterior; trocar a senha logado também). Regras em `lib/password-reset.ts` (com teste). Em produção o link usa **só** `NEXT_PUBLIC_APP_URL` (nunca o Host da requisição — evita *reset poisoning*); sem ela, nada é enviado. Email: `lib/email.ts` (API da Resend, `RESEND_API_KEY` + `EMAIL_FROM`); sem essas variáveis, em desenvolvimento o email sai no console do `npm run dev`. Sessões JWT já abertas continuam válidas após a redefinição (mesma limitação da troca de senha).
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
| `/admin/usuarios/bandas` | Bandas: busca (nome ou email de integrante), situação, administradores, nº de integrantes |
| `/admin/usuarios/bandas/nova` · `/[id]` | Criar banda + administrador (email existente → só ganha a banda; novo → conta com senha provisória) · dados, integrantes, integrações, uso, **Desativar/Reativar banda** |
| `/admin/usuarios/contas` · `/[id]` | Contas de usuário: busca, situação (ativas, desativadas, senha provisória) · bandas da conta, **Redefinir senha**, **Desativar/Reativar conta** |
| `/admin/usuarios/administradores` (+`/novo`) | Equipe; desativar/reativar (ninguém desativa a si mesmo) |
| `/admin/senha` | Troca da própria senha |

`/admin` → `/admin/palcos` e `/admin/usuarios` → `/admin/usuarios/bandas` (redirects HTTP no `next.config.ts`). Shell: `DashboardShell variant="admin"` (menu próprio + faixa "Painel administrativo"). Páginas `noindex`.

## 5. Palcos (base curada) — `Stage`
- Global (não pertence a banda). Campos: nome, tipo (`StageType`), cidade/UF, estilos (`genres[]`), Instagram (normalizado `@handle`), site, telefone/email **comerciais**, capacidade, programação/observações, **fonte da informação** (interna), situação (`DRAFT` → `PUBLISHED` → `ARCHIVED`), `verifiedAt/By`, `createdBy`.
- **LGPD:** só canais institucionais. Nome/telefone pessoal de responsável **não** entram (ficam na `Venue` privada de cada banda).
- Publicar = verificar agora. **Reverificação** sugerida após 180 dias (`needsReverification`, selo "Reverificar").
- O Explorar Palcos (bandas, `/explorar`) mostra só `PUBLISHED` — ver `docs/modulos-marketing.md` §4.2.1. Arquivar tira o palco do diretório; as casas que bandas já criaram a partir dele continuam (`stageId` vira `null` só se o palco for excluído).

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
Servimos **só a miniatura** otimizada no nosso storage: WebP 400×300, ~16 KB (`imageThumbUrl`) — ~90 MB para ~5,7 mil palcos (originais: ~1,3 GB). `imageUrl` é o **link de origem** (bucket da equipe): nunca exibido, usado para gerar/regerar a miniatura.

```bash
# 1) importar aceitando só imagens do bucket da equipe (as de terceiros são descartadas)
npm run stages:import -- --file venues.json --image-hosts <bucket>.r2.dev …
# 2) gerar miniaturas (retomável; pula quem já tem)
npm run stages:images -- --hosts <bucket>.r2.dev --dry-run
npm run stages:images -- --hosts <bucket>.r2.dev --drop-others --clear-broken --confirm-remote   # produção
node scripts/with-local-db.mjs node scripts/migrate-stage-images.mjs --hosts <bucket>.r2.dev --limit 100  # local
```
- **Destino:** `--storage local` (padrão no banco local) grava em `.local-media/` (fora do git), servido em `/media/…` só em desenvolvimento (ou com `SERVE_LOCAL_MEDIA=1`, ligado pelo `with-local-db.mjs`). `--storage supabase` (padrão no banco remoto) usa o **Supabase Storage**, bucket público `media` (criado automaticamente) — requer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (chave de serviço: nunca no navegador nem no git).
- Caminho `stages/<id>/thumb-<hash>.webp`: o hash muda quando a imagem muda (sem cache antigo na CDN; cache de 1 ano).
- **Imagem de origem trocada** (reimportação ou edição no painel) → `imageThumbUrl` volta a `null` e a próxima execução gera de novo.
- `--drop-others`: remove links de outros hosts (direito de imagem incerto). `--clear-broken`: remove links que dão 404/410.
- Concorrência padrão 6 (o `r2.dev` tem limite de tráfego; o script espera e tenta de novo). ~7 imagens/s.
- Exibição: `components/admin/StageThumb.tsx` (`next/image` com `unoptimized` — o arquivo já é otimizado; não consome a otimização da Vercel). Sem miniatura → placeholder com ícone.

## 7. Checklist ao estender o painel
- [ ] Página nova em `app/admin/(painel)/…` (o layout já exige superadmin) com `requireAdminId()`.
- [ ] Rota de API em `app/api/admin/…` com `withAdmin`.
- [ ] Nada de dado de negócio das bandas (casas, cachês, contatos) exposto sem necessidade — o painel administra **contas**, não o conteúdo delas.
- [ ] Ações destrutivas/irreversíveis com `ConfirmButton`.
- [ ] Item novo no menu: `ADMIN_NAV_GROUPS` em `components/DashboardShell.tsx`.
- [ ] Teste em `lib/access.test.ts` se mudar regra de acesso.

## 8. Acesso multi-bandas (usuários, integrantes e convites)

**Modelo:** `User` (pessoa: email + senha) ⟷ `BandMember` (papel na banda) ⟷ `Band` (tenant, dono dos dados). Um usuário acessa N bandas; cada banda tem N integrantes.

| Papel (`BandRole`) | Pode |
| --- | --- |
| `ADMIN` (Administrador) | tudo na banda: criar/alterar/excluir dados, Integrações, dados da banda, **integrantes** |
| `VIEWER` (Visualizador) | só consultar (inclusive Financeiro e o CSV); não vê Integrações; telas de criar/editar redirecionam |

- **Cadastro** (`/cadastro` → `POST /api/register`): cria o `User` e a **primeira banda** (vira `ADMIN`). Mais bandas em `/bandas` (`POST /api/bands`).
- **Banda ativa:** cookie `banda_atual` (só preferência; a posse é conferida no banco a cada request — `getBandContext`). Sem cookie válido usa a primeira banda; sem nenhuma banda → `/bandas`. Trocar: seletor no topo do menu → `/bandas` → `POST /api/bands/current`.
- **Escrita protegida por padrão:** `withBand` só deixa passar `ADMIN` (403 para visualizador). Rota de leitura para visualizador: `withBand(handler, { viewer: true })`. Rotas da conta (perfil, senha, criar/trocar banda, aceitar convite): `withUser`. Páginas de criar/editar: `requireBandEditor(fallback)`; nas listagens/detalhes os botões de ação aparecem só com `canEdit`.
- **Integrantes** (`/banda/integrantes`, `app/api/band/members/*`): o administrador informa nome, email e acesso.
  - email **já tem conta** → vínculo na hora (a banda aparece no próximo acesso da pessoa);
  - email **sem conta** → convite pendente (`userId` vazio): link `/convite/<token>` enviado por email (Resend) e mostrado para o administrador copiar (WhatsApp). Token de 256 bits, só o SHA-256 no banco, vale 14 dias, uso único; "Novo link" invalida o anterior (e, se a pessoa já tiver criado conta nesse meio-tempo, vincula na hora).
  - `/convite/<token>` decide: logado com o email do convite → **Aceitar**; logado com outro email → sair; sem sessão → **Criar conta** (`/cadastro?convite=…`, email travado no do convite) ou **Entrar** (se o email já tiver conta).
  - O convite só é aceito pelo **link** (não por email igual no cadastro): o app não verifica email no cadastro, então vincular por email permitiria a alguém se cadastrar com o email de outra pessoa e herdar o convite.
  - A banda nunca fica sem administrador com conta (`lastAdminBlock` em `lib/members.ts`, com teste) — vale para remover e para rebaixar (inclusive "Sair da banda").
  - Rate limit: 30 convites/hora por banda (`RATE_LIMITS.bandInvite`).
- **Link de convite da banda (grupo)** — Minha banda → Integrantes → "Link de convite da banda": um link reutilizável (`/convite/banda/<token>`) para mandar no grupo. Quem abre cria a conta (`/cadastro?banda=…`, qualquer email) ou entra, e vira integrante com o acesso escolhido (`Band.inviteLinkRole`, padrão Visualizador; ao escolher Administrador a tela avisa).
  - Token = `<nonce>.<HMAC-SHA256(AUTH_SECRET)>` (`lib/band-link.ts`): o banco guarda só o nonce (`Band.inviteLinkNonce`), então o administrador vê o link de novo a qualquer momento, mas vazar o banco não vaza links. Trocar o `AUTH_SECRET` invalida os links.
  - "Gerar novo link" troca o nonce (o anterior para de funcionar); "Desativar" zera o nonce. Quem já entrou continua na banda. API: `PATCH /api/band/invite-link` (só administrador).
  - Entrada (`joinBandByLink` em `lib/band-access.ts`): já integrante → nada muda; convite individual pendente para o mesmo email → é aceito (vale o acesso daquele convite); senão cria o integrante. Logado: `POST /api/invites/band/<token>`.
- **Email não enviado:** a tela do convite mostra o motivo (ex.: `Resend 403: …`, `EMAIL_FROM` ausente) para diagnóstico — `sendEmailResult` em `lib/email.ts`. Links dos emails usam `NEXT_PUBLIC_APP_URL` ou, na Vercel, `VERCEL_PROJECT_PRODUCTION_URL`.
- **Painel:** desativar uma **banda** corta o acesso de todos a ela; desativar uma **conta** corta o acesso da pessoa a todas as bandas.
- **Legado:** `Band.email`, `passwordHash`, `mustChangePassword`, `passwordReset*` ficaram no schema (anuláveis) só para a migração ser aditiva; nada lê esses campos. Remover numa migration futura (contração).
