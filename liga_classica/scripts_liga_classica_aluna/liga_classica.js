// =========================
// liga_classica_premiacoes.js
// - Premiacoes: Top 5 de cada mes + Campeao do turno
// - Geral sem premiacao especifica
// - Rodada atual inteligente
// =========================

const DEBUG = false;
function logDebug(...args) {
  if (DEBUG) console.log(...args);
}

// =========================
// CONFIGURACAO DE MESES
// Ajuste os intervalos de rodadas conforme o calendario da temporada.
// =========================
const MESES = [
  { key: "janeiro", label: "Janeiro", inicio: 1, fim: 1 },
  { key: "fevereiro", label: "Fevereiro", inicio: 2, fim: 4 },
  { key: "marco", label: "Março", inicio: 5, fim: 8 },
  { key: "abril", label: "Abril", inicio: 9, fim: 13 },
  { key: "maio", label: "Maio", inicio: 14, fim: 18 },
  { key: "julho", label: "Julho", inicio: 19, fim: 21 }
];

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  criarAbas();
  exibirClassificacaoPor("geral", "geral");
});

// =========================
// UI - ABAS
// =========================
function criarAbas() {
  const container = document.getElementById("tabs-container");
  container.innerHTML = "";

  const abas = [
    { label: "Geral", type: "geral", key: "geral" },
    ...MESES.map(mes => ({ label: mes.label, type: "mes", key: mes.key })),
    { label: "1o Turno", type: "turnos", key: "turno_1" }
  ];

  // Botoes (desktop)
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
  const geral = classificacaoLigaClassica?.geral;
  if (!geral) return null;

  const umTimeQualquer = Object.keys(geral)[0];
  if (!umTimeQualquer) return null;

  const rodadas = geral[umTimeQualquer] || {};

  let ultimaRodadaValida = 0;

  // Ultima rodada com pontos (>0)
  for (const rodada in rodadas) {
    const numero = parseInt(rodada.match(/\d+/)?.[0], 10);
    const pontos = Number(rodadas[rodada]);

    if (!isNaN(numero) && pontos > 0) {
      ultimaRodadaValida = Math.max(ultimaRodadaValida, numero);
    }
  }

  // Se ninguem pontuou ainda, mas existe Rodada 1 no dataset => rodada aberta = 1
  if (ultimaRodadaValida === 0) {
    const existeRodada1 = Object.keys(rodadas).some(r => {
      const n = parseInt(r.match(/\d+/)?.[0], 10);
      return n === 1;
    });
    if (existeRodada1) return 1;

    return null;
  }

  return ultimaRodadaValida;
}

// =========================
// UTIL - soma por periodo
// =========================
function calcularPeriodoPeloGeral(inicio, fim) {
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
// EXIBICAO
// =========================
function exibirClassificacaoPor(tipo, chave) {
  let dados = [];
  const rodadaAtual = obterRodadaAtual();
  const infoDiv = document.getElementById("info-atualizacao");
  const hoje = new Date();
  const dataAtualizacao = hoje.toLocaleDateString("pt-BR");
  const rodadaTexto = (rodadaAtual === null) ? "-" : rodadaAtual;

  let periodoInfo = "";
  let periodoAtual = null;

  // Monta dados
  if (tipo === "geral") {
    const geral = classificacaoLigaClassica?.geral || {};
    for (const time in geral) {
      const rodadas = geral[time] || {};
      const totalPontos = Object.values(rodadas).reduce((acc, val) => acc + (Number(val) || 0), 0);
      dados.push({ time, totalPontos });
    }
  } else if (tipo === "mes") {
    periodoAtual = MESES.find(mes => mes.key === chave);
    if (periodoAtual) {
      const registros = calcularPeriodoPeloGeral(periodoAtual.inicio, periodoAtual.fim);
      periodoInfo = `${periodoAtual.label} (R${periodoAtual.inicio} a R${periodoAtual.fim})`;
      for (const time in registros) {
        dados.push({ time, totalPontos: Number(registros[time]) || 0 });
      }
    }
  } else if (tipo === "turnos") {
    let registros = classificacaoLigaClassica?.turnos?.[chave];

    // Se o dataset nao trouxe o turno_1 (ou veio vazio), calcula pelo "geral"
    const vazioOuInexistente = !registros || Object.keys(registros).length === 0;
    if (vazioOuInexistente) {
      registros = calcularPeriodoPeloGeral(1, 19);
    }

    periodoInfo = "1o Turno (R1 a R19)";

    for (const time in registros) {
      dados.push({ time, totalPontos: Number(registros[time]) || 0 });
    }
  }

  const periodoTexto = periodoInfo ? ` | Periodo: <strong>${periodoInfo}</strong>` : "";
  infoDiv.innerHTML = `Rodada Atual: <strong>${rodadaTexto}</strong> | Ultima atualizacao: <strong>${dataAtualizacao}</strong>${periodoTexto}`;

  // Status da competicao (texto/cor do selo)
  const { texto, cor } = gerarStatusDaTag(tipo, chave, rodadaAtual, periodoAtual);

  // Ordena ranking
  dados.sort((a, b) => b.totalPontos - a.totalPontos);

  logDebug("Rodada Atual:", rodadaAtual, "Tipo:", tipo, "Chave:", chave);
  logDebug("Tag:", texto, "Cor:", cor);

  renderizarTabela(dados, texto, cor, tipo);
}

// =========================
// STATUS (REGRAS DE PREMIACAO)
// =========================
function gerarStatusDaTag(tipo, chave, rodadaAtual, periodoAtual) {
  if (rodadaAtual === null) return { texto: "", cor: "" };

  // Meses: Top 5
  if (tipo === "mes" && periodoAtual) {
    if (rodadaAtual < periodoAtual.inicio) return { texto: "", cor: "" };
    if (rodadaAtual <= periodoAtual.fim) return { texto: "Zona de Premiacao", cor: "amarela" };
    return { texto: "Premiados do Mes", cor: "verde" };
  }

  // Turnos: Campeao do turno
  if (tipo === "turnos" && chave === "turno_1") {
    if (rodadaAtual < 19) return { texto: "Zona de Premiacao", cor: "amarela" };
    return { texto: "Campeao do Turno", cor: "verde" };
  }

  return { texto: "", cor: "" };
}

// =========================
// TABELA (EXIBICAO DE TAG)
// =========================
function renderizarTabela(classificacao, tagTexto = "", tagCor = "", tipo = "") {
  const tbody = document.getElementById("classificacao-corpo");
  tbody.innerHTML = "";

  classificacao.forEach((item, index) => {
    const base = window.ESCUDOS_BASE_PATH || "../imagens/";
    const arquivo = window.escudosTimes?.[item.time] || window.ESCUDO_PADRAO || "escudo_default.png";
    const escudo = base + arquivo;

    const posicao = index + 1;
    let destaque = "";
    const icone = "";

    if (tipo === "turnos" && posicao === 1) {
      destaque = "primeiro";
    }

    const row = document.createElement("tr");
    if (destaque) row.classList.add(destaque);

    // Exibicao das tags
    let exibirTag = false;
    if (tagTexto) {
      if (tipo === "mes" && posicao <= 5) exibirTag = true;
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

