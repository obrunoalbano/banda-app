# App no celular (PWA)

O banda app é um **PWA** (Progressive Web App): a pessoa instala pelo navegador e ele vira um ícone na tela de início, abrindo em tela cheia, como um aplicativo. Não passa por loja (App Store/Play Store) e toda atualização no deploy chega na hora.

## Como a pessoa instala
- **Android (Chrome/Edge/Samsung):** botão **Instalar app** (login, Minha conta e menu do celular) abre o diálogo nativo. Sem o diálogo (outros navegadores), mostra o passo a passo pelo menu do navegador.
- **iPhone/iPad (Safari):** o Safari não tem diálogo de instalação; o botão mostra o passo a passo **Compartilhar → Adicionar à Tela de Início**.
- O botão some quando o app já está instalado (aberto em tela cheia) e no desktop sem suporte — `components/InstallAppButton.tsx`.

## Peças
| Peça | Arquivo | Observação |
| --- | --- | --- |
| Manifesto | `app/manifest.ts` (servido em `/manifest.webmanifest`) | nome, cores, `start_url: /casas?origem=app`, atalhos (Shows, Novo show, Financeiro) |
| Ícones | `public/icons/*.png`, `app/apple-icon.png` | gerados por `node scripts/generate-pwa-icons.mjs` (versionados); `maskable` tem margem para o recorte do Android |
| Metadata/viewport | `app/layout.tsx` | `appleWebApp`, `themeColor` por tema, `viewportFit: cover`, `interactiveWidget: resizes-content` |
| Service worker | `public/sw.js` + `components/PwaRegister.tsx` | **não guarda páginas nem API em cache** (dados privados e por usuário); sem internet mostra `/offline`. Mudou o arquivo? suba `CACHE` |
| Página sem conexão | `app/offline/page.tsx` | pública e estática |
| Acesso | `lib/access.ts` | `/offline`, `/manifest.webmanifest`, `/sw.js`, `/apple-icon.png` são públicos (o navegador busca sem sessão) |
| Cabeçalhos | `next.config.ts` | `/sw.js` sem cache (o navegador sempre pega a versão nova) |

## Experiência mobile (UI)
- **Barra de abas** fixa embaixo (Casas, Shows, Financeiro, Contatos, Menu) no app da banda — `MOBILE_TABS` em `components/DashboardShell.tsx`. O conteúdo ganha `padding-bottom` para não ficar atrás dela.
- **Topo fixo** (sticky) com o botão do menu; gaveta lateral com `overscroll-contain`.
- **Áreas seguras** (notch, barra de gestos): `env(safe-area-inset-*)` no topo, na barra de abas e na gaveta.
- **Sem zoom ao focar campos no iPhone:** campos com no mínimo 16px no celular (`inputSmClass` = `text-base sm:text-sm`).
- **Toque:** `touch-action: manipulation` e sem destaque cinza ao tocar (`app/globals.css`).
- **Filtros recolhidos** no celular atrás do botão "Filtros (n)" — `FilterDisclosure` dentro do `FilterBar`.
- **Resumo do Financeiro** em 2 colunas no celular (`Stat` aceita `className`).
- Altura da tela com `min-h-dvh` (barras do navegador móvel).

## Testar
- Chrome DevTools → Application → Manifest (erros/instalabilidade) e Service Workers.
- Modo celular (390px) e tema escuro; offline: DevTools → Network → Offline e navegar.
- iPhone real: Safari → Compartilhar → Adicionar à Tela de Início (PWA exige HTTPS — use o domínio de produção ou um preview da Vercel).

## Fora do escopo (próximos passos possíveis)
- **Publicar nas lojas:** Play Store via TWA (Bubblewrap/PWABuilder, reaproveita este PWA); App Store exige app nativo/wrapper (ex.: Capacitor) e conta de desenvolvedor Apple.
- **Notificações push** (iOS 16.4+ com o app instalado): exigiria chaves VAPID, tabela de inscrições e envio no servidor.
