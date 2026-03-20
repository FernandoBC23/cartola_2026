function obterDatasetLigaClassica() {
  if (typeof classificacaoLigaClassica !== "undefined") {
    return classificacaoLigaClassica;
  }

  return null;
}

function obterRodadasLigaClassica() {
  const geral = obterDatasetLigaClassica()?.geral || {};
  const times = Object.entries(geral);

  if (!times.length) return [];

  const rodadas = new Set();
  for (const [, pontuacoes] of times) {
    Object.keys(pontuacoes || {}).forEach((rodada) => rodadas.add(rodada));
  }

  return Array.from(rodadas).sort((a, b) => numeroDaRodada(a) - numeroDaRodada(b));
}

function numeroDaRodada(rotulo) {
  const match = String(rotulo).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function obterRodadaAtualLigaClassica() {
  if (typeof pontuacaoParcialRodadaAtual !== "undefined" && Number.isFinite(pontuacaoParcialRodadaAtual?.rodada)) {
    return pontuacaoParcialRodadaAtual.rodada;
  }

  return null;
}

function rodadaTemPontuacaoParcial() {
  if (typeof pontuacaoParcialRodadaAtual === "undefined") return false;

  const times = pontuacaoParcialRodadaAtual?.times || {};
  return Object.keys(times).length > 0;
}

function obterLideresPorRodada() {
  const geral = obterDatasetLigaClassica()?.geral || {};
  const rodadas = obterRodadasLigaClassica();
  const rodadaAtual = obterRodadaAtualLigaClassica();
  const incluirRodadaAtual = rodadaTemPontuacaoParcial();

  return rodadas
    .filter((rodada) => {
      const numero = numeroDaRodada(rodada);
      if (!rodadaAtual) return true;
      if (numero < rodadaAtual) return true;
      return numero === rodadaAtual && incluirRodadaAtual;
    })
    .map((rodada) => {
      let lider = null;

      for (const [time, pontuacoes] of Object.entries(geral)) {
        const pontos = Number(pontuacoes?.[rodada] || 0);
        if (!lider || pontos > lider.pontos) {
          lider = { rodada, time, pontos };
        }
      }

      return lider;
    })
    .filter((item) => item && item.pontos > 0);
}

function obterEscudoDoTime(time) {
  return window.escudosTimes?.[time] || `${window.ESCUDOS_BASE_PATH || "../imagens/"}${window.ESCUDO_PADRAO || "escudo_default.png"}`;
}

function obterMitoDosMitos(lideres) {
  if (!lideres.length) return null;

  return lideres.reduce((maior, item) => {
    if (!maior || item.pontos > maior.pontos) return item;
    return maior;
  }, null);
}

function renderizarCardMaioresPontuadores() {
  const mitoEl = document.getElementById("mito-dos-mitos");
  const tabelaEl = document.getElementById("mito-rodada-tabela");

  if (!mitoEl || !tabelaEl) return;

  const lideres = obterLideresPorRodada();

  if (!lideres.length) {
    mitoEl.innerHTML = '<p class="lideres-rodada-vazio">Aguardando pontuacoes da Liga Classica Aluna.</p>';
    tabelaEl.innerHTML = "";
    return;
  }

  const mitoDosMitos = obterMitoDosMitos(lideres);
  const escudoMito = obterEscudoDoTime(mitoDosMitos.time);

  mitoEl.innerHTML = `
    <div class="mvp-card">
      <p class="mvp-card-label">Mito dos Mitos</p>
      <div class="mvp-card-conteudo">
        <img src="${escudoMito}" alt="${mitoDosMitos.time}" class="mvp-card-escudo" />
        <div class="mvp-card-info">
          <strong>${mitoDosMitos.time}</strong>
          <span>${mitoDosMitos.rodada}</span>
          <span>${mitoDosMitos.pontos.toFixed(2)} pontos</span>
        </div>
      </div>
    </div>
  `;

  tabelaEl.innerHTML = lideres
    .map((item) => {
      return `
        <tr>
          <td>${numeroDaRodada(item.rodada)}</td>
          <td>${item.time}</td>
          <td>${item.pontos.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", renderizarCardMaioresPontuadores);
