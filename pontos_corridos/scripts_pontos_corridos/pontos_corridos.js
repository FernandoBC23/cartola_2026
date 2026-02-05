// scripts/pontos_corridos.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    window.renderCompeticao({
      nome: "Pontos Corridos",
      grupoPadrao: "Pontos Corridos",
      painelId: "painel-grupos",
      meta: window.pontosCorridosMeta,
      rodadaAtualGlobal: window.rodada_atual ?? window.rodadaAtual,
      parcialGlobal: window.pontuacaoParcialRodadaAtual,
      turnoInicio: 1,
      turnoFim: 19,
      confrontos: confrontosFase1,
      resultados: resultadosFase1,
      pontuacoesPorRodada: window.pontuacoesPorRodada,
      classificacao: classificacaoPontosCorridos,
      participantesFontes: [
        "participantesLigaSerieA",
        "participantesLiga_pontos_corridos",
        "participantesLigaSerie_A",
        "participantesLiga",
        "participantesSerieA",
        "participantes",
      ],
    });
  });
})();
