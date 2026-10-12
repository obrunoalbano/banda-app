/*!
 * Agenda da banda — script de widget.
 * Ajusta a altura dos iframes de /embed/... ao conteúdo (sem barra de rolagem).
 * Uso: <iframe src="https://SEU-APP/embed/SLUG/shows" ...></iframe>
 *      <script src="https://SEU-APP/embed.js" async></script>
 * Contrato público: mantenha compatível (docs/integracoes.md).
 */
(function () {
  if (window.__agendaBandaEmbed) return;
  window.__agendaBandaEmbed = true;

  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src).origin : null;
  if (!origin) return;

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (event.origin !== origin || !data || data.type !== "agenda-banda:resize") return;
    var height = Number(data.height);
    if (!(height > 0)) return;
    var frames = document.querySelectorAll("iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.height = Math.ceil(height) + "px";
        break;
      }
    }
  });
})();
