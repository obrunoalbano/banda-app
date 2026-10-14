# Design system — Agenda da banda

Fonte única de verdade para **qualquer UI** do projeto. Antes de criar ou alterar uma tela, leia este documento; ao terminar, rode `npm run check` (o lint barra cores fora do sistema e o teste de tokens barra contraste insuficiente).

- **Tokens:** `app/globals.css`
- **Componentes:** `components/ui/` (exporta receitas de classe em `components/ui/styles.ts`)
- **Ícones:** `components/ui/icons.ts` (lucide-react com nomes semânticos)
- **Galeria viva:** `npm run dev` → <http://localhost:3000/design-system> (só existe em desenvolvimento)
- **Garantias automáticas:** `eslint.config.mjs` (proíbe paleta crua e `dark:`) e `tests/design-tokens.test.ts` (WCAG AA nos dois temas)

---

## 1. Regras de ouro

1. **Use um componente de `components/ui/` antes de escrever classes.** Se nenhum serve, estenda o componente (ou crie um novo lá) em vez de estilizar na página.
2. **Cores só por token semântico** (`bg-surface`, `text-fg-muted`, `border-line`, `toneClass.success`…). Nunca `zinc-500`, `red-600`, `bg-black/50`, nem `dark:` — o tema escuro é resolvido nas variáveis. O lint falha se você tentar.
3. **Cor = significado**, não decoração. A interface é monocromática; cor aparece só em status e feedback (seção 3.2).
4. **Um único `<h1>` por página**, sempre via `PageHeader` (ou `AuthLayout`/`StatusPage`).
5. **Uma ação `primary` por área.** As demais são `secondary`/`ghost`; destrutivas são `danger`.
6. **Mobile primeiro.** Toda tela precisa funcionar em 390px sem rolagem horizontal (tabelas viram cards automaticamente).
7. **Interface em pt-BR**, tom direto e sem jargão (seção 7).
8. **Acessível por padrão:** label em todo campo, foco visível, contraste AA, ícones decorativos com `aria-hidden`, botão só-ícone com `aria-label`.

---

## 2. Princípios

| Princípio | Na prática |
| --- | --- |
| **Calmo e funcional** | Paleta neutra (zinc), sem gradientes nem sombras pesadas. O conteúdo (casas, shows, valores) é o protagonista. |
| **Consistente > criativo** | Mesma entidade = mesmo ícone, mesmo rótulo, mesmo lugar. Mesma ação = mesmo verbo e mesmo botão. |
| **Previsível** | Listagem → Detalhe → Alterar. "Voltar" sempre acima do título. Ações sempre à direita do título. |
| **Feedback sempre** | Todo envio mostra carregando (`loading`), erro (`Alert`) e resultado (redireciona ou `Alert` de sucesso). Ações irreversíveis pedem confirmação. |
| **Inclusivo** | WCAG 2.1 AA: contraste, teclado, leitores de tela, `prefers-reduced-motion`. |

---

## 3. Tokens

Definidos como variáveis CSS em `app/globals.css`, cada uma no formato **`--x: light-dark(<claro>, <escuro>)`**, e expostos ao Tailwind via `@theme inline`. Cada variável `--x` vira utilitários `bg-x`, `text-x`, `border-x`, `ring-x`…

**Tema:** o valor efetivo vem de `color-scheme`. Por padrão segue o sistema operacional (`:root { color-scheme: light dark }`). Qualquer elemento com `data-theme="light"` ou `data-theme="dark"` força o tema daquele trecho (os widgets usam isso via `?tema=`). Ao criar um token, use sempre `light-dark()` — o teste `tests/design-tokens.test.ts` falha se um token de cor tiver valor só para um tema.

### 3.1 Cores base

| Token | Uso | Claro | Escuro |
| --- | --- | --- | --- |
| `canvas` | Fundo da página | `#ffffff` | `#09090b` |
| `surface` | Cards, tabelas, inputs, modal | `#ffffff` | `#09090b` |
| `surface-muted` | Menu lateral, cabeçalho de tabela, barra de filtros, hover de linha | `#fafafa` | `#111113` |
| `surface-sunken` | Hover de botão ghost/menu, bloco de código, skeleton | `#f4f4f5` | `#1f1f23` |
| `fg` | Texto principal, títulos, valores | `#18181b` | `#fafafa` |
| `fg-muted` | Descrições, texto secundário, células de tabela | `#52525b` | `#a1a1aa` |
| `fg-subtle` | Labels de detalhe, placeholders, metadados, ícones decorativos | `#6b6b74` | `#8b8b94` |
| `line` | Bordas de card/tabela, divisórias | `#e4e4e7` | `#27272a` |
| `line-strong` | Borda de input e botão secundário | `#d4d4d8` | `#52525b` |
| `primary` / `primary-hover` / `on-primary` | Botão principal (monocromático) | preto / branco | branco / preto |
| `danger` / `danger-hover` / `on-danger` | Botão destrutivo sólido (confirmar remoção) | `#dc2626` | `#dc2626` |
| `focus` | Anel de foco de teclado | `#71717a` | `#a1a1aa` |
| `overlay` | Fundo escurecido atrás de modal/gaveta | preto 50% | preto 50% |

### 3.2 Tons de feedback

Cada tom tem três tokens: `{tom}-bg` (fundo suave), `{tom}-fg` (texto sobre o fundo) e `{tom}-line` (borda). Use pelo mapa `toneClass[tom]` de `styles.ts` ou pelos componentes `Badge`/`Alert`.

| Tom | Significado | Exemplos no app |
| --- | --- | --- |
| `neutral` | Informativo, sem estado | contagens, rótulos genéricos |
| `info` | Em andamento | casa com proposta **Enviada** |
| `success` | Concluído / positivo | **Pago**, **Finalizado**, "Dados atualizados" |
| `warning` | Pendente / requer atenção | **Aguardando pagamento**, **Não enviado**, "Copie o token agora" |
| `danger` | Erro / destrutivo | erros de formulário, botão Remover |

> Ao criar um enum novo com status, mapeie cada valor para um destes tons (ver `components/StatusBadge.tsx`) — não invente cores.

### 3.3 Tipografia

Fonte: **Geist** (sans) e **Geist Mono** (código, tokens, URLs). Escala usada:

| Papel | Classes |
| --- | --- |
| Título da landing | `text-4xl sm:text-5xl font-semibold tracking-tight` |
| Título de página (`h1`) | `text-2xl font-semibold tracking-tight text-fg` (via `PageHeader`) |
| Título de seção / modal (`h2`) | `text-lg font-semibold` |
| Título de card (`h2` do `Card`) | `text-base font-semibold` |
| Corpo (padrão da interface) | `text-sm text-fg` |
| Texto secundário | `text-sm text-fg-muted` |
| Label de campo | `text-sm font-medium text-fg` |
| Label de detalhe / grupo de menu | `text-xs font-medium uppercase tracking-wide text-fg-subtle` |
| Dica / metadado | `text-xs text-fg-subtle` |
| Números (dinheiro, data, hora, contagem) | adicionar `tabular` (algarismos alinhados) |

### 3.4 Espaçamento e layout

Escala do Tailwind (múltiplos de 4px). Valores padronizados:

| Contexto | Valor |
| --- | --- |
| Container de página | `containerClass` = `mx-auto max-w-5xl px-4 py-8` (`containerNarrowClass` = `max-w-3xl`) |
| Cabeçalho → conteúdo | `mb-8` (no `PageHeader`) |
| Entre seções/cards | `gap-6` |
| Campos de formulário | grid `gap-4` (`sm:grid-cols-2`, campos largos com `sm:col-span-2`); largura máx. do form `max-w-xl` |
| Label → campo → dica | `gap-1` |
| Grupo de botões | `gap-3` (`gap-2` em barras compactas) |
| Padding de card | `p-4 sm:p-5` |

### 3.5 Raio, borda, sombra, movimento

- **Raio:** `rounded-md` em controles (botão, input, alerta, código); `rounded-lg` em contêineres (card, tabela, modal, estado vazio); `rounded-full` em badges.
- **Borda:** 1px `border-line` em contêineres; `border-line-strong` em controles; estado vazio usa `border-dashed`.
- **Sombra:** só `shadow-sm` (inputs, card de autenticação) e `shadow-xl` (modal). Nada além disso.
- **Movimento:** `transition-colors` em hover; `animate-spin` no spinner; `animate-pulse` no skeleton; gaveta mobile 200ms. `prefers-reduced-motion` desliga tudo (global).

### 3.6 Ícones

`lucide-react`, sempre importado de `components/ui/icons.ts` pelo **nome semântico**:

| Nome | Uso |
| --- | --- |
| `VenueIcon` | Casas de show |
| `ShowIcon` | Shows / agenda |
| `LeadIcon` | Contatos (leads) |
| `IntegrationIcon` | Integrações |
| `BandIcon` | Minha banda / marca |
| `AddIcon`, `EditIcon`, `DeleteIcon` | Criar, Alterar, Remover |
| `CopyIcon`/`CheckIcon`, `RetryIcon`, `BackIcon`, `PrevIcon`/`NextIcon` | Ações utilitárias |
| `EmailIcon`, `WhatsappIcon`, `PhoneIcon`, `ExternalLinkIcon` | Links de contato |
| `InfoIcon`, `SuccessIcon`, `WarningIcon`, `DangerIcon`, `NotFoundIcon` | Feedback e estados |

Tamanhos: **16px** dentro de botões (automático), **20px** no menu, **24px** em cards da landing, **40px** (`strokeWidth={1.5}`) em estado vazio e páginas de status. Ícone ao lado de texto é decorativo → `aria-hidden`. Precisa de um ícone novo? Adicione-o em `icons.ts` com nome semântico.

---

## 4. Componentes (`components/ui/`)

### Ações

| Componente | Quando usar | API essencial |
| --- | --- | --- |
| `Button` | Ações em formulários e na página (submit, gerar, aplicar). | `variant` `primary`·`secondary`·`ghost`·`danger`·`danger-solid`; `size` `sm`(32px)·`md`(40px)·`lg`(48px); `icon`; `loading`; `type` padrão `"button"` |
| `ButtonLink` | Navegação com cara de botão ("Nova casa", "Alterar", "Entrar"). | mesmas `variant`/`size`/`icon` + props de `next/link` |
| `ConfirmButton` | Qualquer ação que precise de confirmação (irreversível ou com efeito colateral). | `label`, `title`, `description`, `confirmLabel`, `tone` `primary`·`danger`, `onConfirm(): Promise<string \| null>` (retorne a mensagem de erro para manter aberto), `disabledReason` |
| `ConfirmDeleteButton` | Remover um registro via `DELETE` na API. | `endpoint`, `redirectTo`, `itemLabel` (ex.: `a casa "Bar X"`), `disabledReason` |

Hierarquia de variantes: `primary` = a ação principal da área (uma só) · `secondary` = alternativas (Cancelar, Mês atual) · `ghost` = ações discretas (Limpar, Copiar, itens de toolbar) · `danger` = abre fluxo destrutivo · `danger-solid` = confirma a destruição (só dentro do modal).

```tsx
<ButtonLink href="/shows/nova" icon={AddIcon}>Novo show</ButtonLink>
<Button type="submit" loading={loading}>Salvar alterações</Button>
<ConfirmDeleteButton endpoint={`/api/shows/${id}`} redirectTo="/shows" itemLabel={`o show "${label}"`} />
```

### Formulário (`fields.tsx`)

Todos ligam `<label htmlFor>` via `useId`, mostram `*` quando `required` e aceitam `hint` (ligado por `aria-describedby`). `className` vai no wrapper (para `sm:col-span-2`); o resto vai no controle.

| Componente | Uso |
| --- | --- |
| `TextField` | Texto, email, data, hora, senha (`type`). |
| `TextAreaField` | Textos longos (observações, descrição). |
| `SelectField` | Opções fechadas (`<option>` como filhos). |
| `PhoneField` | Telefone/WhatsApp com máscara BR `(11) 99999-0000`. `value` + `onValueChange`. |
| `CurrencyField` | Dinheiro com máscara (digita só números). Estado **em centavos** (`number \| null`), igual ao banco. |
| `CheckboxField` | Opção liga/desliga dentro de formulário (label à direita + `hint`). Para ações que valem na hora, use um botão. |
| `CitySelectFields` (em `components/`) | Par UF + cidade (IBGE com cache; vira texto livre se a API falhar). |

Complementos: `Alert` (erro/sucesso no topo do form), `FormActions` (rodapé com Salvar + Cancelar via `cancelHref`), hook `useJsonSubmit` (loading/erro do envio).

### Exibição

| Componente | Uso |
| --- | --- |
| `PageHeader` | Topo de toda página do dashboard: `title` (h1), `description`, `back` {href,label}, `actions`, `children` (badges). |
| `PageHeader` `eyebrow` | Em sub-páginas de um item com submenu, o nome da seção-mãe acima do título (ex.: `eyebrow="Integrações"`). |

> **Server × client:** componentes (inclusive ícones) e funções **não podem** ser passados como props de um Server Component para um Client Component — o Next quebra com "Functions cannot be passed directly to Client Components". Componentes do DS que precisam de estado do navegador seguem o padrão: o componente principal é server (renderiza ícones/conteúdo) e só a parte interativa mínima é client. Em client components, passe ícones já renderizados (`children`) ou use-os dentro de outro client component.
| `Card` | Agrupar uma seção: `title` (h2; `titleAs="h3"` quando o card está dentro de uma seção com h2 próprio), `description`, `actions`, `muted`. |
| `DetailList` + `DetailItem` | Tela de detalhe em grid 2 colunas. `wide`, `preserveLines`, `numeric`. Vazio vira "—". |
| `ExternalLink` | `mailto:`, `wa.me`, Instagram, ingressos; `icon` opcional à esquerda (ex.: `EmailIcon`). Links `http(s)` já ganham o ícone de link externo no fim e abrem em nova aba com aviso para leitor de tela — não passe `ExternalLinkIcon` como `icon`. |
| `Table` + `Tr` + `Td` | Listagens. `caption` (sr-only) obrigatório; **todo `Td` recebe `label`** (vira rótulo no mobile). `strong` = coluna principal (link para o detalhe); `numeric`; `align="right"` = ações. |
| `Pagination` + `parsePage`/`pageArgs` | `?pagina=N`, 50 por página, preserva filtros via `searchParams`. |
| `FilterBar` + `FilterField` | Filtros de listagem como `<form method="get">` (estado na URL). Aplicar/Limpar inclusos; `extraActions` para atalhos. |
| `Badge` | Status curto (1–3 palavras) por `tone`. Componentes de domínio: `StatusBadge`, `ShowPaymentBadge`. |
| `Alert` | Feedback em bloco: `tone` `danger`(padrão)·`success`·`warning`·`info`; `title` opcional. |
| `EmptyState` | Lista vazia: `icon`, `title`, `description`, `action` (`primary: true` = criar o primeiro). |
| `CodeBlock` | Valores técnicos (URL, token, JSON) com `copyable` e `wrap`. |
| `StatusPage` | Telas de não encontrado / erro (ícone, título, descrição, ações). |
| `Brand` / `PRODUCT_NAME` | Marca (ícone + "Agenda da banda"). Nunca escreva o nome do produto à mão. |
| `AuthLayout` | Telas públicas de autenticação (marca + card + link alternativo no rodapé). |

Receitas de classe (`styles.ts`) para casos sem componente: `cx`, `buttonClass(variant,size)`, `iconButtonClass(size)`, `inputClass`/`inputSmClass`, `labelClass`, `hintClass`, `linkClass`, `subtleLinkClass`, `containerClass`/`containerNarrowClass`, `toneClass`.

---

## 5. Modelos de página

Toda página do dashboard exporta `metadata = { title: "…" }` (vira "Título · Agenda da banda" na aba) e começa com `<div className={containerClass}>`.

### Listagem (`/casas`, `/shows`, `/contatos`)
```
PageHeader  title + description · actions: ButtonLink primary "Nova X" (AddIcon)
FilterBar   (só se existir ao menos 1 registro)
EmptyState  sem registros → icon da entidade + action primary "Cadastrar a primeira X"
            com filtros sem resultado → title "Nenhuma X corresponde aos filtros" + "Limpar filtros"
Table       caption · Td strong = nome com link para o detalhe · numeric em valores/datas · última coluna "Ações" (align right)
Pagination
```

### Detalhe (`/x/[id]`)
```
PageHeader  back "Voltar à listagem" · title = nome · children = badges de status
            actions: ButtonLink primary "Alterar" (EditIcon) + ConfirmDeleteButton
DetailList  DetailItem por campo; contatos como ExternalLink; relações como linkClass
not-found.tsx  StatusPage (NotFoundIcon) + "Voltar às X"
```

### Formulário (`/x/nova`, `/x/[id]/editar`)
```
PageHeader  back ("Voltar à listagem" na criação, "Voltar aos detalhes" na edição) · title "Nova X" / "Alterar X"
<form className="flex max-w-xl flex-col gap-4">
  Alert (erro)
  grid gap-4 sm:grid-cols-2 com *Field
  FormActions submitLabel ("Cadastrar X" / "Salvar alterações") + cancelHref explícito
```
Após salvar: `router.push` para o detalhe + `router.refresh()`.

### Configuração (`/integracoes/*`, `/banda`)
`PageHeader` + um `Card` por assunto. Quando uma seção tem sub-páginas independentes (ex.: cada integração), use **submenu no menu lateral** (`children` do item em `NAV_GROUPS`): uma rota por sub-página, cada uma com `PageHeader eyebrow="<seção>"`, e a rota raiz redirecionando para a primeira (em `next.config.ts`, redirect HTTP). Nova integração = nova rota em `app/(dashboard)/integracoes/<nome>/` + novo filho em `NAV_GROUPS`. Sucesso de salvamento sem navegação → `Alert tone="success"` no topo do form.

### Público
- **Landing:** `Brand` no topo, h1 grande, 2 CTAs (`lg`), 3 cards de recurso com ícones das entidades.
- **Login / cadastro:** `AuthLayout` (título, descrição, form com botão `w-full`, link alternativo no `footer`).

### Público (agenda da banda) — ver `docs/integracoes.md`
- **Página `/b/[slug]`:** sem shell do app; `h1` = nome da banda; `PublicShowList`; rodapé "Agenda publicada com" + `Brand`; JSON-LD.
- **Widget `/embed/[slug]/…`:** raiz com `data-embed` + `data-theme` (de `?tema=`), sem cabeçalho/rodapé do app, `EmbedAutoResize` no fim. Conteúdo compacto, link discreto "Agenda completa".
- `PublicShowList` (`components/public/`) recebe **só** `PublicShow` (saída de `toPublicShow`) — nunca dados internos.

### Estados globais
- **Carregando:** `app/(dashboard)/loading.tsx` (skeleton com `bg-surface-sunken animate-pulse`).
- **Erro:** `app/(dashboard)/error.tsx` (`StatusPage` + "Tentar de novo" com `unstable_retry`).
- **Não encontrado:** `not-found.tsx` por entidade + `app/not-found.tsx` global.

---

## 6. Padrões de interação

- **Navegação:** menu lateral em dois grupos — *Gestão* (Casas, Shows, Contatos) e *Configurações* (Integrações → Agenda, Contatos; Minha banda). Itens com `children` mostram submenu indentado (menu expandido); o filho ativo recebe `aria-current`, o pai fica destacado. Com o menu recolhido, só o ícone do pai aparece (ativo para qualquer filho). Recolhível no desktop (só ícones com tooltip; preferência salva), gaveta no mobile (fecha com Esc, clique fora ou ao navegar). Item ativo com `aria-current="page"`. Nova seção → adicionar em `NAV_GROUPS` de `components/DashboardShell.tsx`.
- **Envio de formulário:** botão com `loading` (spinner + "Salvando…"), erro da API em `Alert` no topo, validação nativa (`required`, `type`, `minLength`) + Zod no servidor.
- **Confirmação:** ações irreversíveis ou com efeito externo usam `ConfirmButton` (nunca `window.confirm`/`alert`). O título é uma pergunta curta; a descrição explica a consequência; o botão de confirmação repete o verbo.
- **Bloqueio explicado:** quando uma ação não é permitida, desabilite e explique com `disabledReason` (ex.: casa com shows não pode ser removida).
- **Filtros:** `<form method="get">`; mudar filtro e "Aplicar" atualiza a URL (compartilhável, funciona sem JS). Paginação preserva filtros.
- **Máscaras:** dinheiro (`CurrencyField`) e telefone (`PhoneField`). Datas usam `type="date"`/`"time"` nativos.
- **Links de contato:** email → `mailto:`; telefone/WhatsApp → `whatsappHref`; Instagram → `instagramHref`.
- **Copiar:** `CodeBlock copyable` mostra "Copiado" por 2s.

---

## 7. Conteúdo (microcopy em pt-BR)

- **Tom:** direto, cordial, sem jargão técnico para o usuário final. Trate por "você"/"sua banda".
- **Botões = verbo no infinitivo:** "Cadastrar casa", "Salvar alterações", "Remover", "Gerar token". Evite "OK", "Enviar" genérico, "Clique aqui".
- **Títulos:** sentença com só a primeira letra maiúscula ("Nova casa de show", não "Nova Casa de Show").
- **Vocabulário fixo:** *Casa de show* (Venue), *Show* (Show), *Evento particular*, *Contato* (Lead), *Cachê*, *Status de envio*, *Status de pagamento*, *Integração*, *Token*. Use sempre os mesmos termos.
- **Erros:** diga o que aconteceu e o que fazer ("Email ou senha incorretos.", "Falha de conexão. Verifique sua internet e tente novamente."). Mensagens da API vêm prontas em pt-BR (`{ error }`).
- **Vazio:** diga o que não existe e qual o próximo passo ("Nenhum show cadastrado" + "Cadastrar o primeiro show").
- **Formatos:** dinheiro `R$ 1.500,00` (`formatCents`), data `15/12/2026` (`formatDateOnly`), data-hora no fuso de São Paulo (`formatDateTimeShort`), vazio "—".

---

## 8. Acessibilidade (checklist)

- [ ] Todo campo tem label visível ligado (`*Field` faz isso); dicas via `hint`.
- [ ] Foco visível: global `:focus-visible` com `--focus` (não remova `outline` sem substituir).
- [ ] Botão só com ícone tem `aria-label` (e `title` para tooltip).
- [ ] Ícones decorativos com `aria-hidden`.
- [ ] Um `<h1>` por página; seções com `<h2>` (Card faz isso).
- [ ] Tabelas com `caption` e `scope="col"` (Table faz isso).
- [ ] Erros com `role="alert"` (`Alert tone="danger"` faz isso); status com `role="status"`.
- [ ] Modais via `<dialog>` + `showModal()` (foco preso, Esc fecha) com `aria-labelledby`.
- [ ] Contraste AA garantido pelos tokens (teste automatizado) — não use opacidade em texto para "clarear".
- [ ] Link "Pular para o conteúdo" existe no shell; `<main id="conteudo">`.
- [ ] Links externos avisam que abrem em nova aba (`ExternalLink` faz isso).

---

## 9. Responsivo

- Breakpoints do Tailwind; o layout muda em `sm` (640px) e `md` (768px, menu lateral fixo).
- Tabelas viram cards abaixo de `sm` (rótulo = `Td label`).
- Grupos de botões usam `flex-wrap`; botões de modal empilham no mobile (`flex-col-reverse`).
- Teste em **390px**: sem rolagem horizontal, alvos de toque ≥ 32px (botões `md` = 40px).

---

## 10. Checklist para uma tela nova

1. Página com `metadata.title`, `containerClass` e `PageHeader`.
2. Só componentes de `components/ui/` + tokens; nenhuma cor crua (o lint confirma).
3. Ícone da entidade vindo de `icons.ts` (adicione um nome semântico se for entidade nova).
4. Estados: vazio (`EmptyState`), carregando (herdado), erro (`Alert`/`error.tsx`), não encontrado (`not-found.tsx` com `StatusPage`).
5. Formulário com `*Field`, `FormActions` e `cancelHref`.
6. Status novo → `Badge` com tom da tabela 3.2 + labels em `lib/`.
7. Microcopy revisado (seção 7) e vocabulário fixo.
8. Testado em 390px e no tema escuro.
9. Componente novo reutilizável? Coloque em `components/ui/`, adicione à galeria (`app/design-system/Gallery.tsx`) e a este documento.
10. `npm run check` verde.

---

## 11. Evoluindo o sistema

- **Mudar a cor da marca:** altere `--primary`, `--primary-hover`, `--on-primary` (e `--focus`, se quiser) nos dois temas em `globals.css`. Rode `npm run test` — o teste de contraste valida.
- **Novo token:** declare a variável nos dois temas + mapeie em `@theme inline` + documente na seção 3 + (se for par texto/fundo) adicione ao `PAIRS` de `tests/design-tokens.test.ts`.
- **Novo componente:** em `components/ui/`, só com tokens, com JSDoc dizendo quando usar; adicione à galeria e à seção 4.
- **Tema escuro manual (toggle):** já suportado pela base — basta definir `data-theme="light|dark"` no `<html>` (preferência salva em cookie/localStorage). Os componentes não mudam, pois só usam tokens.

---

## 12. Débitos de UX conhecidos

- Sem página inicial com resumo (próximos shows, valores a receber) — `/` logado redireciona para `/casas`.
- Sem toast global: sucesso ao criar/editar é comunicado só pelo redirecionamento para o detalhe.
- Filtro de mês dos shows exige "Aplicar" após escolher o ano (o select de mês depende do ano já aplicado).
- Sem seletor de tema manual na interface (a base com `data-theme` já existe).
- O shell do dashboard não está na galeria (depende de sessão); valide-o rodando o app logado.
