# Integrações — agenda pública e formulário de contato

Como a banda conecta o app ao mundo externo. Leia antes de mexer em `app/b/`, `app/embed/`, `app/api/public/`, `app/api/leads/ingest/`, `public/embed.js` ou nos campos públicos de `Band`/`Show`.

| Integração | Direção | Estado |
| --- | --- | --- |
| **Agenda de shows** — publicar shows no site/redes da banda | app → mundo (leitura pública) | ✅ Fase 1 implementada |
| **Formulário de contato** — receber pedidos de orçamento do site | mundo → app (escrita autenticada) | ✅ API com token secreto · ⏳ Fase 2 (formulário público) |

---

## 1. Agenda de shows

### 1.1 Como a banda usa (menu Integrações → **Agenda**, `/integracoes/agenda`)
1. **Ativa** a agenda pública (opt-in, `Band.publicAgendaEnabled`).
2. Opcionalmente ajusta o **endereço** (`Band.slug`, ex.: `os-incriveis`).
3. Divulga por um (ou mais) dos três formatos:

| Formato | URL | Para quem |
| --- | --- | --- |
| **Página pública** | `/b/<slug>` | Bio do Instagram, WhatsApp, quem não tem site. SSR, indexável, com JSON-LD `MusicEvent`. |
| **Widget** | `/embed/<slug>/shows` em `<iframe>` + `/embed.js` | Sites em Wix, WordPress, Squarespace, HTML. |
| **API pública v1** | `GET /api/public/v1/bands/<slug>/shows` | Sites com desenvolvedor. JSON, sem token, CORS `*`. |

### 1.2 O que aparece
- Só se `Band.publicAgendaEnabled = true` (senão: página/widget/API respondem como inexistente — **mesmo 404**, não revela se a banda existe).
- Só shows com `Show.isPublic = true`, de **hoje em diante** (fuso `America/Sao_Paulo`, `todayDateOnly`), em ordem cronológica.
- **Visibilidade padrão** (`resolveShowVisibility` em `lib/shows.ts`): show em casa → público; evento particular → oculto. Virar evento particular sem informar `isPublic` → oculta (privacidade). A banda muda por show no formulário ("Mostrar na agenda pública").
- **Cancelado** (`Show.cancelledAt`) continua listado com status `cancelled` ("Cancelado" na UI) — avisar o público é melhor que sumir.
- **Ingressos** (`Show.ticketUrl`, só http/https) viram botão "Ingressos".

### 1.3 Privacidade — regra obrigatória
Toda saída pública de show passa por **`toPublicShow`** (`lib/public-agenda.ts`), que monta uma **lista fechada** de campos. Nunca serialize `Show`/`Venue` direto numa rota pública.

| Sai | Nunca sai |
| --- | --- |
| data, hora, status, nome da casa (ou "Evento particular"), cidade, UF, link de ingressos | cachê, status de pagamento, detalhes do evento particular, contatos/email/telefone da casa, ids de banda/casa |

O teste `lib/public-agenda.test.ts` falha se uma chave nova aparecer na saída. Para expor um campo novo: adicione ao `select` (`publicShowSelect`), ao tipo `PublicShow`, ao `toPublicShow` **e** ao teste — e documente aqui (contrato).

### 1.4 Contrato da API pública v1

`GET /api/public/v1/bands/<slug>/shows?limit=20`

- `slug`: case-insensitive. `limit`: 1–100 (padrão 20).
- Headers: `Access-Control-Allow-Origin: *`, `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (CDN da Vercel absorve o tráfego; mudanças levam até ~1 min para aparecer).
- Rate limit: 120 req/min por IP (`RATE_LIMITS.publicAgenda`).
- Erros: `404 { "error": "Agenda não encontrada." }` (slug inexistente **ou** agenda desligada), `429` com `Retry-After`.

```json
{
  "band": { "name": "Os Incríveis", "slug": "os-incriveis", "url": "https://app/b/os-incriveis" },
  "shows": [
    {
      "id": "cm…",
      "date": "2026-10-20",
      "time": "21:00",
      "status": "scheduled",
      "title": "Bar do Zé",
      "venue": { "name": "Bar do Zé", "city": "Santos", "state": "SP" },
      "city": "Santos",
      "state": "SP",
      "ticketUrl": "https://www.sympla.com.br/evento/…"
    }
  ],
  "generatedAt": "2026-10-12T15:27:01.547Z"
}
```
`status`: `"scheduled" | "cancelled"`. `venue` é `null` em evento particular (`title` = "Evento particular"). `date`/`time` são locais da cidade do show (sem fuso).

**Evolução:** é contrato com sites de terceiros. Pode **adicionar** campos; não remova, renomeie nem mude o tipo — para isso, crie `/api/public/v2/…` e mantenha a v1.

### 1.5 Contrato do widget

```html
<iframe src="https://APP/embed/SLUG/shows?tema=claro" title="Agenda de shows" loading="lazy"
        style="width:100%;border:0;height:420px"></iframe>
<script src="https://APP/embed.js" async></script>
```

| Parâmetro | Valores | Padrão |
| --- | --- | --- |
| `tema` | `claro`, `escuro`, `auto` (segue o visitante) | `claro` |
| `fundo` | `transparente` (o fundo do site aparece em volta da lista) | fundo do tema |
| `limite` | 1–100 | 20 |

- **Tema forçado:** a página do widget marca `data-embed` + `data-theme`; `app/globals.css` aplica o `color-scheme` à página inteira do iframe (`:root:has([data-embed][data-theme=…])`). Funciona porque os tokens usam `light-dark()`.
- **Auto-altura:** `components/public/EmbedAutoResize.tsx` mede o elemento `[data-embed]` (não o documento — dentro de iframe o `scrollHeight` nunca encolhe) e envia `postMessage({ type: "agenda-banda:resize", height }, "*")`. `public/embed.js` (no site hospedeiro) só aceita mensagens da origem do próprio script e ajusta o `iframe` correspondente. Sem o script, o iframe fica com a altura fixa do snippet.
- `noindex` no widget (quem indexa é `/b/<slug>`).
- Não remova parâmetros nem mude o tipo de mensagem: snippets já colados em sites dependem disso.

### 1.6 Slug (endereço público)
- Formato `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–50 caracteres, sem palavras reservadas (`lib/slug.ts`).
- Cadastro gera do nome (`findAvailableSlug`: `os-incriveis`, `os-incriveis-2`…). A migration `20261012120000_public_agenda` gerou para bandas existentes com a mesma regra.
- Editável em Integrações (`PATCH /api/band/public-agenda`, 409 se em uso). **Trocar quebra links e widgets publicados** — a UI avisa. (Redirecionamento do slug antigo é débito da fase 3.)

### 1.7 Arquivos
```
app/b/[slug]/page.tsx                    página pública (SSR, JSON-LD, metadata)
app/embed/[slug]/shows/page.tsx          widget (iframe)
app/api/public/v1/bands/[slug]/shows/    API pública v1
app/api/band/public-agenda/route.ts      liga/desliga + slug (autenticado)
public/embed.js                          script de auto-altura para sites externos
components/public/PublicShowList.tsx     lista usada pela página e pelo widget
components/public/EmbedAutoResize.tsx    envia a altura do widget
app/(dashboard)/integracoes/agenda/      página de configuração (submenu Integrações → Agenda)
components/PublicAgendaPanel.tsx         painel de configuração da agenda
lib/public-agenda.ts                     toPublicShow, JSON-LD (privacidade — com teste)
lib/public-agenda-query.ts               getPublicAgenda (opt-in, isPublic, futuro)
lib/slug.ts · lib/band-slug.ts           regras e geração de slug
proxy.ts                                 libera /b/*, /embed/*, /embed.js, /api/public/*
```

---

## 2. Formulário de contato (leads)

### 2.1 Hoje (menu Integrações → **Contatos**, `/integracoes/contato`)
- `POST /api/leads/ingest` com token **secreto** da banda (`Authorization: Bearer` ou `X-Lead-Token`), guardado só como hash (`Band.leadIngestTokenHash`).
- Pensado para o **backend** do site (o token não pode ir para o navegador).
- CORS só para origens em `LEADS_INGEST_ALLOWED_ORIGINS` (variável **global** de ambiente).
- Aliases legados `phone`→`whatsapp`, `message`→`eventDescription` (contrato — há teste).
- Rate limit 60/min por token.

### 2.2 Fase 2 (planejada)
Problema: a maioria das bandas não tem backend (Wix/WordPress/HTML) e a lista de origens é global (exige redeploy por banda).

1. **Chave pública** por banda (`Band.leadFormPublicKey`, pode ir no HTML) + **domínios permitidos por banda** no banco, editáveis na tela (substitui a env global para o fluxo público). O token secreto continua para integrações server-to-server.
2. **Anti-spam** no fluxo público: honeypot, tempo mínimo de preenchimento, rate limit por IP + banda; ponto de extensão para Cloudflare Turnstile.
3. **Formulário hospedado** em `/b/<slug>/contato` (e seção na página pública) e **widget** `/embed/<slug>/contato` reutilizando o mesmo protocolo de auto-altura.
4. **Status na tela:** último lead recebido, total do mês, botão "Enviar lead de teste".
5. Rota nova versionada: `POST /api/public/v1/bands/<slug>/leads` (chave pública). `/api/leads/ingest` permanece como está.

---

## 3. Fase 3 (ideias)
- Feed **iCal** (`/b/<slug>/agenda.ics`) para assinar no Google Agenda/Apple.
- **Redirecionamento** de slug antigo após troca (tabela `BandSlugHistory`).
- **Aviso por email** a cada lead (Resend) e **webhooks** de saída (`lead.created`, `show.updated`).
- Personalização do widget (cor de destaque, mostrar/ocultar cidade).
- Proteção contra *clickjacking* nas páginas do app (`frame-ancestors 'none'`), mantendo `/embed/*` embutível.

---

## 4. Checklist ao mexer em integrações
- [ ] Saída pública de show passa por `toPublicShow`? Teste de chaves atualizado?
- [ ] Rota pública nova liberada em `proxy.ts` (`isPublicIntegrationPath`) e com rate limit?
- [ ] Contratos (API v1, parâmetros do widget, `embed.js`, `/api/leads/ingest`) continuam compatíveis?
- [ ] Opt-in respeitado (agenda desligada = 404 igual a inexistente)?
- [ ] Página/widget testados em 390px, tema claro/escuro e dentro de um site de terceiros?
- [ ] Este documento atualizado.
