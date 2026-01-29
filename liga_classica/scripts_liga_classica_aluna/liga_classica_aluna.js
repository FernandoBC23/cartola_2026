// =========================
// liga_classica.js
// (Sem meses: apenas Geral, 1º Turno e 2º Turno)
// + Rodada atual inteligente
// + Fallback de turnos calculados pelo "geral" se vierem vazios
// + Regras de premiação:
//   - Geral: top 3 (Zona até R37, Premiados na R38)
//   - Turnos: top 1 (Zona durante o turno, Campeão no fim do turno)
// =========================

// (Opcional) Controle simples de logs
const DEBUG = false;
function logDebug(...args) {
  if (DEBUG) console.log(...args);
}

function getParcialPayload() {
  return (typeof pontuacaoParcialRodadaAtual === "object" && pontuacaoParcialRodadaAtual)
    ? pontuacaoParcialRodadaAtual
    : { rodada: null, times: {} };
}

function getParcialRodada() {
  const payload = getParcialPayload();
  if (!payload || !payload.rodada || !payload.times) return null;
  return Object.keys(payload.times).length ? payload.rodada : null;
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  criarAbas();
  exibirClassificacaoPor("geral", "geral");
});

// =========================
// UI - ABAS (Sem meses)
// =========================
function criarAbas() {
  const container = document.getElementById("tabs-container");
  container.innerHTML = "";

  const abas = [
    { label: "Geral", type: "geral", key: "geral" },
    { label: "1º Turno", type: "turnos", key: "turno_1" },
    { label: "2º Turno", type: "turnos", key: "turno_2" }
  ];

  // Botões (desktop)
  abas.forEach((aba, index) => {
    const btn = document.createElement("button");
    btn.className = "tab" + (index === 0 ? " active" : "");
    btn.textContent = aba.label;
    btn.dataset.type = aba.type;
    btn.dataset.key = aba.key;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      exibirClassificacaoPor(aba.type, aba.key);
    });

    container.appendChild(btn);
  });

  // Select (mobile)
  if (window.innerWidth < 768) {
    const select = document.createElement("select");
    select.className = "tab-select";

    abas.forEach(aba => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify(aba);
      opt.textContent = aba.label;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const aba = JSON.parse(select.value);
      exibirClassificacaoPor(aba.type, aba.key);
    });

    container.appendChild(select);
  }
}

// =========================
// RODADA ATUAL (inteligente)
// =========================
function obterRodadaAtual() {
  const rodadaParcial = getParcialRodada();
  if (Number.isFinite(rodadaParcial)) return rodadaParcial;

  const geral = classificacaoLigaClassica?.geral;
  if (!geral) return null;

  const umTimeQualquer = Object.keys(geral)[0];
  if (!umTimeQualquer) return null;

  const rodadas = geral[umTimeQualquer] || {};

  let ultimaRodadaValida = 0;

  // Última rodada com pontos (>0)
  for (const rodada in rodadas) {
    const numero = parseInt(rodada.match(/\d+/)?.[0], 10);
    const pontos = Number(rodadas[rodada]);

    if (!isNaN(numero) && pontos > 0) {
      ultimaRodadaValida = Math.max(ultimaRodadaValida, numero);
    }
  }

  // Se ninguém pontuou ainda, mas existe Rodada 1 no dataset => rodada aberta = 1
  if (ultimaRodadaValida === 0) {
    const existeRodada1 = Object.keys(rodadas).some(r => {
      const n = parseInt(r.match(/\d+/)?.[0], 10);
      return n === 1;
    });
    if (existeRodada1) return 1;

    return null; // nada detectável
  }

  return ultimaRodadaValida;
}

// =========================
// Fallback: calcula turno pelo "geral" (sem notebook)
// =========================
function calcularTurnoPeloGeral(inicio, fim) {
  const geral = classificacaoLigaClassica?.geral || {};
  const resultado = {};

  for (const time in geral) {
    const rodadasObj = geral[time] || {};
    let soma = 0;

    for (const chaveRodada in rodadasObj) {
      const n = parseInt(chaveRodada.match(/\d+/)?.[0], 10);
      if (!isNaN(n) && n >= inicio && n <= fim) {
        soma += Number(rodadasObj[chaveRodada]) || 0;
      }
    }

    resultado[time] = soma;
  }

  return resultado;
}

// =========================
// EXIBIÇÃO
// =========================
function exibirClassificacaoPor(tipo, chave) {
  let dados = [];
  const rodadaAtual = obterRodadaAtual();

  const infoDiv = document.getElementById("info-atualizacao");
  const hoje = new Date();
  const dataAtualizacao = hoje.toLocaleDateString("pt-BR");

  const rodadaTexto = (rodadaAtual === null) ? "—" : rodadaAtual;

  const rodadaParcial = getParcialRodada();
  const temParcial = Number.isFinite(rodadaParcial);
  if (temParcial) {
    infoDiv.classList.add("parcial");
    infoDiv.innerHTML = `Rodada ${rodadaParcial} em andamento: pontuacoes parciais (nao definitivas).`;
  } else {
    infoDiv.classList.remove("parcial");
    infoDiv.innerHTML = `Rodada Atual: <strong>${rodadaTexto}</strong> | Ultima atualizacao: <strong>${dataAtualizacao}</strong>`;
  }

  // Monta dados
  if (tipo === "geral") {
    const geral = classificacaoLigaClassica?.geral || {};
    for (const time in geral) {
      const rodadas = geral[time] || {};
      const totalPontos = Object.values(rodadas).reduce((acc, val) => acc + (Number(val) || 0), 0);
      dados.push({ time, totalPontos });
    }
  } else if (tipo === "turnos") {
    let registros = classificacaoLigaClassica?.turnos?.[chave];

    // Se o dataset não trouxe o turno_1/turno_2 (ou veio vazio), calcula pelo "geral"
    const vazioOuInexistente = !registros || Object.keys(registros).length === 0;

    if (vazioOuInexistente) {
      if (chave === "turno_1") registros = calcularTurnoPeloGeral(1, 19);
      if (chave === "turno_2") registros = calcularTurnoPeloGeral(20, 38);
    }

    for (const time in registros) {
      dados.push({ time, totalPontos: Number(registros[time]) || 0 });
    }
  }

  // Status da competição (texto/cor do selo)
  const { texto, cor } = gerarStatusDaTag(tipo, chave, rodadaAtual);

  // Ordena ranking
  dados.sort((a, b) => b.totalPontos - a.totalPontos);

  logDebug("Rodada Atual:", rodadaAtual, "Tipo:", tipo, "Chave:", chave);
  logDebug("Tag:", texto, "Cor:", cor);

  renderizarTabela(dados, texto, cor, tipo);
}

// =========================
// STATUS (NOVAS REGRAS DE PREMIAÇÃO)
// =========================
function gerarStatusDaTag(tipo, chave, rodadaAtual) {
  // Se rodadaAtual for null, não exibe status
  if (rodadaAtual === null) return { texto: "", cor: "" };

  // =========================
  // GERAL: Top 3
  // - Zona de Premiação até R37
  // - Premiados na R38
  // =========================
  if (tipo === "geral" && chave === "geral") {
    if (rodadaAtual < 38) return { texto: "Zona de Premiação", cor: "amarela" };
    return { texto: "Premiados", cor: "verde" };
  }

  // =========================
  // TURNOS: Apenas o 1º
  // - Zona durante o turno
  // - Campeão ao final do turno
  // =========================
  if (tipo === "turnos") {
    // 1º Turno: 1..19
    if (chave === "turno_1") {
      if (rodadaAtual < 19) return { texto: "Zona de Premiação", cor: "amarela" };
      return { texto: "Campeão do Turno", cor: "verde" };
    }

    // 2º Turno: 20..38
    if (chave === "turno_2") {
      if (rodadaAtual < 20) return { texto: "", cor: "" }; // ainda não começou
      if (rodadaAtual < 38) return { texto: "Zona de Premiação", cor: "amarela" };
      return { texto: "Campeão do Turno", cor: "verde" };
    }
  }

  return { texto: "", cor: "" };
}

// =========================
// TABELA (NOVAS REGRAS DE EXIBIÇÃO DE TAG)
// =========================
function renderizarTabela(classificacao, tagTexto = "", tagCor = "", tipo = "") {
  const tbody = document.getElementById("classificacao-corpo");
  tbody.innerHTML = "";

  classificacao.forEach((item, index) => {
    // const escudo = escudosTimes[item.time] || "escudos/default.png";
    const base = window.ESCUDOS_BASE_PATH || "../imagens/";
    const arquivo = window.escudosTimes?.[item.time] || window.ESCUDO_PADRAO || "escudo_default.png";
    const escudo = base + arquivo;

    const posicao = index + 1;

    let destaque = "";
    let icone = "";

    // =========================
    // ÍCONES POR POSIÇÃO
    // =========================

    // Geral: 🥇🥈🥉 para os 3 primeiros
    if (tipo === "geral") {
      if (posicao === 1) icone = "🥇";
      if (posicao === 2) icone = "🥈";
      if (posicao === 3) icone = "🥉";
    }

    // Turnos: 🥇 apenas para o campeão do turno
    if (tipo === "turnos") {
      if (posicao === 1) {
        icone = "🥇";
        destaque = "primeiro";
      }
    }

    const row = document.createElement("tr");
    if (destaque) row.classList.add(destaque);

    // =========================
    // EXIBIÇÃO DAS TAGS
    // =========================
    let exibirTag = false;

    if (tagTexto) {
      if (tipo === "geral" && posicao <= 3) exibirTag = true;
      if (tipo === "turnos" && posicao === 1) exibirTag = true;
    }

    const tagSpan = exibirTag
      ? `<span class="tag tag-${tagCor}">${tagTexto}</span>`
      : "";

    row.innerHTML = `
      <td>${posicao} ${icone}</td>
      <td>
        <div class="time-info">
          <img src="${escudo}" class="escudo" alt="${item.time}" />
          ${item.time} ${tagSpan}
        </div>
      </td>
      <td>${Number(item.totalPontos || 0).toFixed(2)}</td>
    `;

    tbody.appendChild(row);
  });
}
