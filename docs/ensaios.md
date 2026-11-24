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

## Ensaios (`/ensaios`)

- Campos: nome, descrição, local, data, horário (`HH:mm`), repetição (`NONE | WEEKLY | BIWEEKLY | MONTHLY`), "repetir até" (opcional) e repertório (opcional).
- Recorrência (`lib/rehearsals.ts`, com teste): o dia da semana (ou do mês) sai da data do primeiro ensaio. Mensal no dia 31 cai no último dia dos meses curtos. `nextOccurrence`, `isOccurrence`, `upcomingOccurrences`.
- Lista: próximos ensaios pela próxima data + "Anteriores" (únicos que já passaram ou recorrências encerradas).

## Presença e aviso aos integrantes

- **Ao criar** um ensaio (`POST /api/rehearsals`), depois da resposta (`after()`), todos os integrantes **com conta** — menos quem criou — recebem email pedindo confirmação, com link para `/ensaios/<id>` (`lib/rehearsal-notify.ts`). Rate limit: 20 ensaios/hora por banda.
- **No app**: selo com a quantidade de ensaios sem resposta no item "Ensaios" do menu (`pendingRehearsalCount`, calculado no layout), aviso no topo da lista e botões **Vou / Não vou** na lista e na tela do ensaio.
- Resposta (`RehearsalAttendance`) é **por ocorrência** (`occurrenceDate`): num ensaio recorrente cada data tem sua confirmação; mudar o dia do ensaio faz as novas datas aparecerem sem resposta. `POST /api/rehearsals/<id>/attendance` aceita visualizador (`withBand({ viewer: true })`), só para o próprio integrante, só datas válidas da série e de hoje em diante.
- Convite pendente (sem conta) não recebe aviso nem aparece na presença.

## Pendências possíveis (v2)

- Avisar os integrantes quando o ensaio muda ou é cancelado; lembrete na véspera.
- Notificação push no app instalado (PWA) — ver docs/mobile.md.
- Exceções na recorrência (cancelar uma data só), presença de convidados, setlist por ensaio diferente do repertório.
