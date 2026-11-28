# Ensaios e Repertórios (módulo Administrativo)

Menu: **Administrativo → Ensaios** e **Administrativo → Repertórios**. Administrador da banda cria/altera/exclui; visualizador consulta e **responde a própria presença**.

## Repertórios (`/repertorios`)

- Campos: nome, descrição e músicas **em ordem** (`RepertoireSong.position`).
- Música: nome*, artistas, observação curta (ex.: "toca em um tom a menos") e, opcionalmente, link do Spotify.
- **Pelo link do Spotify** (`POST /api/spotify/track`, só administrador, rate limit 60/min por banda): nome, artistas, capa e duração vêm sozinhos e continuam editáveis. "Adicionar sem link" = preenchimento manual.
  - `lib/spotify.ts`: extrai o ID da faixa (open.spotify.com/track, intl-xx, embed, `spotify:track:`) e **monta** a URL do Spotify — nunca busca a URL colada (sem SSRF).
  - Com `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` usa a Web API oficial (client credentials); sem elas, lê as metatags públicas da página da faixa (`og:title`, `og:description` = "Artista · Álbum · Song · Ano", `og:image`, `music:duration`). Se o Spotify mudar a página, a busca falha com mensagem e a pessoa preenche à mão.
  - Capa: só `https://i.scdn.co/image/…` é aceita/gravada (`safeSpotifyImage`).
- **A partir de uma playlist pública** (`POST /api/spotify/playlist`, só administrador, rate limit 10/min por banda): em "Novo repertório", o bloco "Começar de uma playlist do Spotify" carrega as músicas na lista do formulário — **nada é gravado** até a pessoa revisar e clicar em "Criar repertório". O campo de link das músicas também aceita link de playlist (serve na edição). Nome/descrição vazios recebem os da playlist; músicas já presentes (mesmo link) ficam de fora; teto de 200 músicas (`MAX_REPERTOIRE_SONGS`, `lib/repertoire.ts`).
  - `parseSpotifyPlaylistId` (open.spotify.com/(intl-xx/)(embed/)playlist/<id>, `spotify:playlist:`) — de novo só montamos URLs do Spotify.
  - Com as chaves da Web API: `/v1/playlists/<id>` + `/tracks` paginado (até 200, com capas). Sem chaves (ou se a Web API recusar): JSON `__NEXT_DATA__` da página do player incorporável `open.spotify.com/embed/playlist/<id>` — **até 100 músicas e sem capa por música**; com 100 músicas o aviso diz que pode ter faltado alguma. Episódios de podcast e faixas locais ficam de fora.
  - Playlist privada/inexistente → 404 "Confira se ela é pública".
- **Ordem**: arrastar (mouse, toque longo no celular, teclado com espaço + setas — `@dnd-kit/sortable`) ou botões Subir/Descer. O formulário salva a lista inteira; o PATCH substitui as músicas numa transação.
- Excluir repertório: os ensaios que o usavam ficam sem repertório (`onDelete: SetNull`).

### Compartilhar (texto ou imagem para o WhatsApp)

Botão **Compartilhar** no detalhe do repertório e do show (administrador e visualizador): painel com opções (artistas, observações, duração de cada música). Tudo no navegador — nada é publicado nem gravado.

- **Texto** (`repertoireShareText` em `lib/repertoire.ts`, com teste): `*negrito*`/`_itálico_` do WhatsApp; marcadores `* _ ~` do texto livre são removidos. Copiar (clipboard; se negado, seleciona o campo e usa `execCommand("copy")`), **Abrir no WhatsApp** (`https://wa.me/?text=`) e, onde houver, o compartilhar do sistema (`navigator.share`).
- **Imagem** PNG desenhada em `<canvas>` (`components/repertoire/repertoire-image.ts`): fundo claro ou escuro, 1 coluna até 24 músicas (1080px), 2 colunas acima disso (1600px). Compartilhar a imagem (`navigator.share({ files })` — no celular abre a lista de apps), copiar (`ClipboardItem`) ou baixar. As cores da imagem ficam no arquivo (a imagem não usa os tokens de tema).
- **PDF** (uma página A4, para imprimir ou mandar como documento): a página é desenhada no mesmo `<canvas>` da imagem (`renderRepertoirePdfPage`), sempre com fundo claro e a lista em **duas colunas** equilibradas pela altura (desce a 1ª coluna e continua na 2ª). Para caber numa página, o desenho é reduzido (escala de 1 até 0,4); se ainda não couber (repertório muito grande), artistas e observações ficam de fora e o painel avisa (`compact`). Gerada a 300 dpi (2480×3508 px) para as letras pequenas saírem nítidas, e montada em PDF por `jpegPagesToPdf` (`lib/pdf.ts`, sem biblioteca: JPEG embutido com `DCTDecode`; com teste). Texto do PDF não é selecionável (é imagem); em troca, qualquer caractere/acento sai igual à tela. Compartilhar (`navigator.share` com `application/pdf`), baixar ou abrir para imprimir.
- **Logo da banda** (Minha banda → Dados da banda, cartão "Logo da banda"): aparece no **canto superior direito** da imagem e do PDF, ajustada numa caixa de 240×120 (unidades de desenho; logo larga ocupa a largura, alta ocupa a altura — `logoPlacement`); o texto do cabeçalho quebra antes da logo. No PDF ela mantém o mesmo tamanho na folha, qualquer que seja a redução da lista. Sem logo, nada muda.
  - Envio: PNG, JPG, WebP ou SVG de até **2 MB** (`LOGO_LIMITS` em `lib/band-logo.ts`). O navegador reduz para no máximo 800 px e envia um PNG (mantém transparência; tenta 600/400 px se passar de 1 MB). `POST /api/band/logo` (corpo = PNG, `Content-Type: image/png`; só administrador; rate limit 20/h por banda) confere assinatura PNG, dimensões (IHDR) e tamanho — o servidor não processa a imagem. `DELETE` remove.
  - Guardada no banco (`BandLogo`, tabela separada para as consultas da banda não carregarem os bytes) e servida por `GET /banda/logo` (sessão de qualquer integrante; `?v=<updatedAt>` versiona e permite cache privado longo; `nosniff`). Prévia da tela sempre em fundo branco (como sai no papel).

## Ensaios (`/ensaios`)

- Campos: nome, descrição, local, data, horário (`HH:mm`), repetição (`NONE | WEEKLY | BIWEEKLY | MONTHLY`), "repetir até" (opcional) e repertório (opcional).
- Recorrência (`lib/rehearsals.ts`, com teste): o dia da semana (ou do mês) sai da data do primeiro ensaio. Mensal no dia 31 cai no último dia dos meses curtos. `nextOccurrence`, `isOccurrence`, `upcomingOccurrences`.
- Lista: próximos ensaios pela próxima data + "Anteriores" (únicos que já passaram ou recorrências encerradas).

## Presença e aviso aos integrantes

- **Ao criar** um ensaio (`POST /api/rehearsals`), depois da resposta (`after()`), todos os integrantes **com conta** — menos quem criou — recebem email pedindo confirmação, com link para `/ensaios/<id>` (`lib/rehearsal-notify.ts`). Rate limit: 20 ensaios/hora por banda.
- **No app**: selo com a quantidade de ensaios sem resposta no item "Ensaios" do menu (`pendingRehearsalCount`, calculado no layout), aviso no topo da lista e botões **Vou / Não vou** na lista e na tela do ensaio.
- Resposta (`RehearsalAttendance`) é **por ocorrência** (`occurrenceDate`): num ensaio recorrente cada data tem sua confirmação; mudar o dia do ensaio faz as novas datas aparecerem sem resposta. `POST /api/rehearsals/<id>/attendance` aceita visualizador (`withBand({ viewer: true })`), só para o próprio integrante, só datas válidas da série e de hoje em diante.
- Convite pendente (sem conta) não recebe aviso nem aparece na presença.

## Músicas do ensaio: ordem e ensaiadas

Na tela do ensaio, a seção **Músicas do ensaio** lista o repertório escolhido.

- **Ordem própria do ensaio** (`Rehearsal.songOrder`, ids de `RepertoireSong`): "Organizar ordem" (arrastar ou subir/descer) → `PATCH /api/rehearsals/<id>/songs` com **todas** as músicas na nova ordem (lista diferente da do repertório = 409 "recarregue"). Ordem igual à do repertório (ou "Usar a ordem do repertório") salva vazia = volta a seguir o repertório. O repertório em si não muda.
  - `orderSetlistSongs` (`lib/repertoire.ts`): músicas adicionadas ao repertório depois vão para o fim; ids removidos são ignorados. Validação da ordem enviada: `resolveSongOrder` (mesma regra para ensaio e show).
  - Tela: `components/repertoire/SetlistSongs.tsx` (ensaio e show; a marcação de ensaiada/faltou é a prop opcional `marking`, só no ensaio).
- **Ensaiada / Faltou** por música e **por data** (`RehearsalSongCheck`, único por ensaio + música + `occurrenceDate`): `POST /api/rehearsals/<id>/song-checks` `{ songId, occurrenceDate, status: REHEARSED | MISSED | null }` (`null` tira a marcação). Só datas da série que já chegaram (até hoje). Num recorrente, o seletor "Ensaio de" mostra as últimas 12 datas que já aconteceram (`pastOccurrences`, `?data=YYYY-MM-DD`); padrão = a mais recente. Contagem: ensaiadas · faltaram · sem marcação.
- Organizar e marcar: só administrador (API 403 para visualizador); visualizador vê a ordem e as marcações.
- **Ids estáveis das músicas:** o `PATCH /api/repertoires/<id>` atualiza as músicas enviadas com `id` (em vez de apagar e recriar), cria as novas e remove as que saíram — a ordem e as marcações dos ensaios apontam para esses ids. Música removida do repertório leva as marcações junto (cascade).
- Trocar o repertório do ensaio zera a ordem própria e as marcações.

## Repertório nos shows

O show também pode ter um repertório (`Show.repertoireId`, `SetNull`) com **ordem própria** (`Show.songOrder`), igual ao ensaio:

- Formulário do show: campo **Repertório** (opcional). Trocar o repertório zera a ordem própria (o PATCH de `/api/shows/<id>` faz isso; o formulário avisa).
- Detalhe do show: item "Repertório" + seção **Músicas do show** (`SetlistSongs` sem `marking`) com "Organizar ordem" → `PATCH /api/shows/<id>/songs` `{ songIds }` (mesmas regras do ensaio: todas as músicas, 409 se o repertório mudou, ordem igual à do repertório = segue o repertório) e **Compartilhar** já na ordem do show (texto/imagem, com "Show: casa · data" na descrição).
- Organizar: só administrador (API 403 para visualizador); visualizador vê a lista na ordem do show.

## Pendências possíveis (v2)

- Avisar os integrantes quando o ensaio muda ou é cancelado; lembrete na véspera.
- Notificação push no app instalado (PWA) — ver docs/mobile.md.
- Exceções na recorrência (cancelar uma data só), presença de convidados.
