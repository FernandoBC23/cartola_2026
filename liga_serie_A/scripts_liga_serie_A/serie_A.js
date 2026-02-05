// scripts/serie_A.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    window.renderCompeticao({
      nome: "Serie A",
      grupoPadrao: "Série A",
      painelId: "painel-grupos",
      meta: window.ligaSerieAMeta,
      rodadaAtualGlobal: window.rodada_atual ?? window.rodadaAtual,
      parcialGlobal: window.pontuacaoParcialRodadaAtual,
      turnoInicio: 1,
      turnoFim: 19,
      confrontos: confrontosFase1,
      resultados: resultadosFase1,
      pontuacoesPorRodada: window.pontuacoesPorRodada,
      classificacao: classificacaoSerieA,
      participantesFontes: [
        "participantesLigaSerieA",
        "participantesLiga_serie_A",
        "participantesLigaSerie_A",
        "participantesLiga",
        "participantesSerieA",
        "participantes",
      ],
    });
  });
})();
