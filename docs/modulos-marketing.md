# Módulo Marketing — EPK Profissional, Explorar Palcos e Abordagem com IA

Engenharia reversa (nível de produto) do **Palcos do Brasil** e o desenho da nossa versão. Leia antes de implementar qualquer um dos três recursos.

> **Escopo da engenharia reversa:** analisamos só o que é público (página de vendas, guias, comportamento do app antes do login). Não copiamos código, não extraímos a base de dados deles e não acessamos áreas logadas. A base de palcos deles é um ativo protegido por termos de uso — a nossa precisa ter origem própria (seção 4).

---

## 1. Módulos do app

| Módulo | Itens | Estado |
| --- | --- | --- |
| **Administrativo** | Casas, Shows | ✅ |
| **Financeiro** | — | Em breve |
| **Marketing** | Contatos ✅ · Redes Sociais (em breve) · **EPK Profissional** · **Explorar Palcos** ✅ · **Abordagem com IA** | EPK e Abordagem em desenho (este documento) |
| **Configurações** | Integrações (Agenda, Contatos), Minha banda | ✅ |

Navegação em `NAV_GROUPS` (`components/DashboardShell.tsx`). Recurso não lançado = `soon: true` (aparece desabilitado com "Em breve"); módulo inteiro não lançado = `soon: { icon }` no grupo. URLs não têm prefixo de módulo (`/casas`, `/epk`, `/explorar`, `/abordagem`) — o módulo é só agrupamento visual.

---

## 2. Engenharia reversa — Palcos do Brasil

### 2.1 Produto e modelo de negócio
- **Proposta:** "+5.000 palcos que contratam música ao vivo" — base de bares, pubs, casas de show e espaços culturais nos 27 estados, com contato direto (WhatsApp/Instagram), "verificados em 2025/2026".
- **Venda:** pagamento único **R$ 79,90** (ou 11× R$ 8,87) via **Hotmart** = **1 ano de acesso**; garantia de 7 dias; página com escassez (contador de 24h, "fulano comprou há 28 minutos").
- **"Bônus"** (na prática, as funcionalidades): IA de abordagem, Gerador de EPK, Gerente de Palcos (mapa de palco + rider técnico), Academia de Shows (curso).
- **Empresa:** criado pela agência Palco Digital; guias de conteúdo (SEO) em `/como-conseguir-shows/`, `/epk/`, `/onde-tocar/`, `/rider-tecnico/`, `/mapa-de-palco/`, `/cache-para-musicos/`, `/mapa-da-musica-ao-vivo/`.

### 2.2 Fluxo do usuário (anunciado)
1. **Prospecção** — filtra a base por estado, cidade e estilo musical.
2. **Abordagem** — gera texto com IA e contata via WhatsApp/Instagram/e-mail.
3. **Contratação** — apresenta o EPK e fecha o show.

### 2.3 Funcionalidades inferidas
| Recurso | O que fazem (público) | Lacunas observadas |
| --- | --- | --- |
| **Diretório** (`/app/#/directory`) | Lista de locais por estado/cidade/estilo, com WhatsApp/Instagram/e-mail; "Mapa da Música ao Vivo" com contagens agregadas (estado, cidade, tipo) | Lista estática: não registra o que o artista fez com cada contato (sem CRM/funil); dados centralizados numa curadoria única |
| **Gerador de EPK** | "Material de divulgação em segundos". O guia de EPK recomenda: nome + proposta, bio curta, **vídeo ao vivo**, fotos (retrato + horizontal, com crédito), **formatos do show** (solo/duo/banda, duração, repertório), destaques verificáveis, links, contato; versão **web** principal + PDF leve; rider e mapa de palco como documentos separados | Formato de saída não informado; sem integração com agenda/contatos |
| **IA de abordagem** | "Scripts de abordagem" adaptados ao estilo do artista, "treinada com os scripts de maior conversão da agência". O guia define a estrutura: saudação → contexto real do local → proposta (formato e por que combina) → prova (vídeo ao vivo curto) → chamada simples (em que mês avaliam atrações). Follow-up: 2–3 tentativas espaçadas por dias úteis, breve, com saída educada | Não registra envio nem lembra do follow-up |

### 2.4 Observações técnicas
- App SPA em `/app/` (hash routing), backend PHP (`/api/venues.php`), login por e-mail/senha liberado após compra na Hotmart.
- **O app chama `GET /api/venues.php` já na tela de login (antes de autenticar).** Não acessamos o endpoint, mas fica a lição: **nossa base nunca deve ser servida a quem não está autenticado** (rotas de Explorar sempre atrás de `withBand`/`requireBandId`).

### 2.5 Onde ganhamos deles
Eles vendem **uma lista**. Nós já temos o **funil** (Casas com status de envio, Shows, Contatos, agenda pública, formulário). A integração é o diferencial:

```
Explorar Palcos ──"Adicionar às minhas casas"──▶ Casas (funil: Não enviado → Enviado → Finalizado)
       │                                              │
       └──────────── Abordagem com IA ◀───────────────┘   (usa dados da casa + EPK da banda)
                           │
                     envia (WhatsApp/Instagram/e-mail) ──▶ registra contato + lembra follow-up
                           │
                     link do EPK Profissional (/b/<slug>) com agenda + "Pedir orçamento"
```

---

## 3. EPK Profissional

**Objetivo:** página pública que o contratante abre em 10 segundos e entende o show. Reaproveita `/b/<slug>` (já existe com agenda e formulário).

### 3.1 Conteúdo (ordem do guia de EPK — o contratante não deve procurar o essencial)
1. Nome + **frase de posicionamento** (1 linha: artista, gênero, show).
2. **Vídeo ao vivo** em destaque (YouTube/Vimeo embed por URL).
3. **Formatos do show**: lista (ex.: "Acústico duo — 2×1h", "Banda completa — 3h") com formação, duração e repertório resumido.
4. Bio curta (limite de caracteres para forçar objetividade).
5. Fotos (até 6; retrato + horizontal; crédito do fotógrafo).
6. Destaques verificáveis (texto + link de fonte opcional).
7. Links (Spotify, YouTube, Instagram, site) — ícones, sem excesso.
8. **Próximos shows** (já temos: agenda pública) e **Pedir orçamento** (já temos: formulário).
9. Contato (nome, função, canal preferido).
10. Rider técnico / mapa de palco: anexos (fase posterior — "Gerente de Palcos").

### 3.2 Desenho técnico
- Modelo `BandEpk` 1:1 com `Band` (ou campos em `Band`): `tagline`, `bio`, `liveVideoUrl`, `genres[]`, `highlights` (JSON), `links` (JSON), `contactName`, `contactRole`, `epkEnabled`.
- `ShowFormat` (1:N): `name`, `lineup` (solo/duo/trio/banda), `durationMinutes`, `repertoire`, `ord`.
- `EpkPhoto` (1:N): `url`, `credit`, `orientation`, `ord` — **requer storage de arquivos** (decisão D2).
- Página `/b/<slug>` vira o EPK quando `epkEnabled` (seções aparecem só se preenchidas); `/b/<slug>/epk.pdf` via CSS de impressão (fase 2 do EPK).
- Tela `/epk`: editor em seções + pré-visualização + "Copiar link"; checklist de completude ("falta vídeo ao vivo") — o vídeo é a prova principal.
- SEO: JSON-LD `MusicGroup` (+ `MusicEvent` já existentes). Privacidade: só dados que a banda publicar.

---

## 4. Explorar Palcos

**Objetivo:** encontrar casas compatíveis e levá-las ao funil (Casas) com um clique.

### 4.1 O problema central: de onde vêm os dados
Cobertura medida no OpenStreetMap (Brasil, out/2026): **16.661 bares/pubs**, **868 casas de show/boates**, mas só **23 marcados com música ao vivo**. Ou seja, dados abertos dizem **onde** ficam os lugares, quase nunca **se contratam música ao vivo** e **quem decide** — que é exatamente o valor vendido pelo concorrente.

| Fonte | Prós | Contras |
| --- | --- | --- |
| **A. Comunidade (recomendado como núcleo)** — bandas compartilham, por opt-in, casas do próprio funil: nome, cidade/UF, tipo, Instagram, estilos, "contrata música ao vivo" confirmado por **show real cadastrado** | Dado validado por quem tocou; efeito de rede; diferencial que o concorrente não tem; custo zero | Começa vazio (precisa de massa crítica); moderação; LGPD dos contatos pessoais (ver 4.3) |
| **B. OpenStreetMap** (ODbL) | Legal com atribuição; ~17 mil locais com coordenadas | Não sabe quem contrata música; contatos esparsos; licença share-alike na base derivada |
| **C. Curadoria própria** (equipe pesquisa e verifica) | Qualidade | Caro e lento; é o modelo do concorrente |
| **D. Google Places API** | Cobertura e telefone | Pago por consulta; termos proíbem armazenar/redistribuir a maior parte dos dados |
| ~~E. Copiar base de terceiros~~ | — | **Não** — viola termos/direitos de base de dados |

**Decisão (D1): C — curadoria própria.** A equipe do produto cadastra e verifica os palcos; as bandas consultam e levam para o próprio funil. Sinais da comunidade (shows cadastrados em casas ligadas ao palco) entram só como **indicador** de atividade para a curadoria, não como fonte de cadastro.

### 4.2 Desenho técnico (curadoria própria)
- **Papel de curador**: ✅ implementado como **superadmin** (`AdminUser`, separado de `Band`), painel `/admin` — ver `docs/admin.md`.
- Modelo `Stage` (global, **não** pertence a uma banda): `name`, `city`, `state`, `type` (bar, pub, casa de show, centro cultural, restaurante, eventos), `genres[]`, `instagram`, `website`, `publicPhone?` (só canal institucional), `capacity?`, `notes` (o que programa), `status` (`draft` | `published` | `archived`), `verifiedAt`, `verifiedBy`, `createdAt/updatedAt`.
- Fluxo de curadoria: cadastrar (rascunho) → verificar (contrata música ao vivo? canal ativo?) → publicar; **reverificar** periodicamente (fila de "verificados há mais de 6 meses"); arquivar quando fechar/parar de contratar. Importação em lote por CSV para a equipe.
- Sinais para a curadoria: `Venue.stageId?` liga a casa privada da banda ao palco; contagem de shows cadastrados nessas casas e de bandas que adicionaram o palco = "atividade recente" (ajuda a priorizar reverificação). Bandas podem **reportar** dado errado/palco fechado (fila para a equipe).
- Tela da banda `/explorar`: só palcos `published`; filtros (UF, cidade, tipo, estilo), cards com "verificado em mês/ano", ações "Adicionar às minhas casas" (cria `Venue` com `stageId`) e "Gerar abordagem". Agregados por UF com supressão de grupos < 5.
- **Sempre autenticado** (nunca expor a base sem login — erro observado no concorrente); rate limit por banda e paginação para impedir raspagem; sem exportação em massa.

### 4.2.1 Implementado (tela da banda)
- **`/explorar`** (`app/(dashboard)/explorar/page.tsx`, Server Component): filtros na URL — busca (`q`: nome, bairro ou cidade), `uf`, `cidade` (só com UF; trocar a UF reenvia o form e recarrega as cidades — `ExploreFilterForm`), `tipo`, `verificados=1`, `whatsapp=1`. Grade de cards (`StageCard`), 24 por página.
- Regras em `lib/explore.ts` (com teste): `buildStageWhere` **sempre** fixa `status: PUBLISHED`; ordem = verificados primeiro → atividade mais recente → nome; `exploreStageSelect` = só campos institucionais.
- Card: miniatura (`imageThumbUrl`; sem foto → ícone), tipo, selo **Verificado** (data no `title`), bairro · cidade/UF, "atividade registrada em mês/ano", observações, estilos, botões **WhatsApp** (`wa.me`) e **Instagram**.
- **"Adicionar às minhas casas"** → `POST /api/explorar/[stageId]` (`withBand`): cria `Venue` com `stageId`, status *Não enviado*, telefone = WhatsApp ou telefone comercial, email comercial, responsável vazio (LGPD — a banda completa). **Idempotente**: `@@unique([bandId, stageId])`; repetir (ou duas requisições simultâneas) devolve a mesma casa (`created: false`). O botão vira **"Nas suas casas"** (link para `/casas/[id]`); o detalhe da casa mostra "Origem: Explorar Palcos".
- `Venue.stageId` é `onDelete: SetNull`: apagar/arquivar palco não mexe na casa da banda (que é dela).
- Rate limit por banda: `explore` (300 páginas/10 min — acima disso a página mostra aviso) e `exploreAdd` (60 adições/h).
- Pendente: estilo (gêneros quase vazios na base), "Gerar abordagem" (Abordagem com IA), reportar dado errado, agregados por UF.

### 4.3 LGPD
Estabelecimento (nome, endereço comercial, Instagram/site/telefone comercial) ≈ dado de empresa: pode ir para o diretório curado. **Nome e telefone pessoal de responsável são dados pessoais**: não entram no diretório; ficam só na `Venue` privada da banda. Registrar a fonte de cada informação da curadoria (para atender pedidos de correção/remoção).

---

## 5. Abordagem com IA

**Objetivo:** mensagem de abordagem personalizada para uma casa, pronta para enviar, e follow-up no momento certo.

### 5.1 Entradas e saídas
- **Entradas:** dados da casa (nome, cidade, tipo, estilos, o que programa — campo livre "o que vi deles"), EPK da banda (posicionamento, formatos, link do vídeo/EPK), **canal** (WhatsApp, Instagram DM, e-mail), **etapa** (primeira mensagem, follow-up 1, follow-up 2), tom (direto, cordial, formal).
- **Estrutura obrigatória** (prompt): saudação → contexto real do local → proposta (formato e por que combina) → prova (link do vídeo/EPK) → chamada simples. Proibido: currículo longo, elogio genérico, cobrança agressiva, anexos. Limites por canal (WhatsApp/DM curtos; e-mail com assunto).
- **Saída:** 2–3 variações editáveis; botões "Abrir no WhatsApp" (`wa.me/?text=`), "Copiar", "Abrir Instagram"; ao enviar → `Venue.sendStatus = ENVIADO` + registro de contato com data; sugere follow-up em N dias úteis.

### 5.2 Desenho técnico
- Modelo `Outreach` (contato realizado): `venueId`, `channel`, `step`, `message`, `sentAt`, `followUpAt?`; lista de "follow-ups de hoje".
- Geração no servidor com a **API da Anthropic (Claude)** — antes de escrever o código, ler a skill `claude-api` (modelo, parâmetros, streaming). Chave `ANTHROPIC_API_KEY` no servidor; nunca no cliente.
- Custos/abuso: cota por banda (ex.: N gerações/dia) + rate limit; prompt e saídas sem dados pessoais desnecessários; log de uso para custo.
- Fallback sem IA: templates determinísticos com a mesma estrutura (útil se a cota acabar ou a API falhar).

---

## 6. Ordem sugerida e dependências
1. **EPK Profissional** — base para os outros (a abordagem envia o link do EPK; o diretório leva ao funil que usa o EPK). Depende de storage de fotos (D2).
2. **Abordagem com IA** — funciona já com as **Casas** existentes (não depende do diretório); entrega valor imediato.
3. **Explorar Palcos** — mais complexo (dados, moderação, LGPD); começa pelo compartilhamento comunitário a partir das Casas.

## 7. Decisões
- **D1 — Fonte do Explorar Palcos:** ✅ **curadoria própria** (equipe cadastra e verifica; área `/admin/palcos` para curadores).
- **D2 — Storage de fotos do EPK:** ✅ **Supabase Storage** (bucket público só para imagens do EPK; upload via servidor com chave de serviço; limite de tamanho/tipo).
- **D3 — IA:** ✅ **Claude (API da Anthropic) com cota por banda** + fallback de templates sem IA. Requer `ANTHROPIC_API_KEY`.
- **D4 — Ordem de construção:** ✅ começar pelo **painel superadmin** (`docs/admin.md`) com cadastro de palcos (modelo `Stage` implementado) e de usuários; em seguida a tela Explorar Palcos das bandas (✅ §4.2.1).
