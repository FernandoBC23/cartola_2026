// scripts/pontos_corridos.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    const getGlobal = (name) => {
      try {
        return Function(`return (typeof ${name} !== "undefined") ? ${name} : undefined;`)();
      } catch (e) {
        return undefined;
      }
    };

    window.renderCompeticao({
      nome: "Pontos Corridos",
      grupoPadrao: "Pontos Corridos",
      painelId: "painel-grupos",
      meta: window.pontosCorridosMeta,
      rodadaAtualGlobal: window.rodada_atual ?? window.rodadaAtual,
      parcialGlobal: window.pontuacaoParcialRodadaAtual,
      turnoInicio: 1,
      turnoFim: 19,
      confrontos: getGlobal("confrontosFase1"),
      resultados: getGlobal("resultadosFase1"),
      pontuacoesPorRodada: window.pontuacoesPorRodada,
      classificacao: getGlobal("classificacaoPontosCorridos") || getGlobal("classificacaoSerieA"),
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
