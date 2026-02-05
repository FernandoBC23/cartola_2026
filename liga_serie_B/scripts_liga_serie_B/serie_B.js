// scripts/serie_B.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    window.renderCompeticao({
      nome: "Serie B",
      grupoPadrao: "Série B",
      painelId: "painel-grupos",
      meta: window.ligaSerieBMeta,
      rodadaAtualGlobal: window.rodada_atual ?? window.rodadaAtual,
      parcialGlobal: window.pontuacaoParcialRodadaAtual,
      turnoInicio: 1,
      turnoFim: 19,
      confrontos: confrontosFase1,
      resultados: resultadosFase1,
      pontuacoesPorRodada: window.pontuacoesPorRodada,
      classificacao: classificacaoSerieB,
      participantesFontes: [
        "participantesLigaSerieB",
        "participantesLiga_serie_B",
        "participantesLigaSerie_B",
        "participantesLiga",
        "participantesSerieA",
        "participantes",
      ],
    });
  });
})();
