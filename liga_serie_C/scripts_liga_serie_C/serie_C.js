// scripts/serie_C.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    window.renderCompeticao({
      nome: "Serie C",
      grupoPadrao: "Série C",
      painelId: "painel-grupos",
      meta: window.ligaSerieCMeta,
      rodadaAtualGlobal: window.rodada_atual ?? window.rodadaAtual,
      parcialGlobal: window.pontuacaoParcialRodadaAtual,
      turnoInicio: 1,
      turnoFim: 19,
      confrontos: confrontosFase1,
      resultados: resultadosFase1,
      pontuacoesPorRodada: window.pontuacoesPorRodada,
      classificacao: classificacaoSerieC,
      participantesFontes: [
        "participantesLigaSerieC",
        "participantesLiga_serie_C",
        "participantesLigaSerie_C",
        "participantesLiga",
        "participantesSerieA",
        "participantes",
      ],
    });
  });
})();
