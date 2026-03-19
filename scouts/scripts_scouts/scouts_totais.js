const ORDEM_SCOUTS = ["G", "A", "FT", "FD", "FF", "DS", "PC", "PS", "FS", "SG", "DE", "DP", "GS", "FC", "GC", "PP", "I", "CA", "CV"];
const SCOUTS_POSITIVOS = ["G", "A", "FT", "FD", "FF", "DS", "FS", "SG", "DE", "DP", "PS"];
const SCOUTS_NEGATIVOS = ["GS", "FC", "GC", "PP", "I", "CA", "CV"];

const PESOS_SCOUTS = {
  G: 8.0,
  A: 5.0,
  FT: 3.0,
  FD: 1.2,
  FF: 0.8,
  FS: 0.5,
  PS: 1.0,
  DS: 1.5,
  DE: 1.3,
  DP: 7.0,
  SG: 5.0,
  GC: -3.0,
  CV: -3.0,
  CA: -1.0,
  GS: -1.0,
  FC: -0.3,
  PC: -1.0,
  I: -0.1,
};

const selectPosicao = document.getElementById("filtro-posicao");
const selectClube = document.getElementById("filtro-clube");
const inputNome = document.getElementById("filtro-nome");
const filtroScoutsPositivos = document.getElementById("filtro-scouts-positivos");
const filtroScoutsNegativos = document.getElementById("filtro-scouts-negativos");
const conteudo = document.getElementById("conteudo-scouts");
const cardsDestaque = document.getElementById("cards-destaque");
const btnSelecionarTodos = document.getElementById("btn-selecionar-todos");
const btnLimparTodos = document.getElementById("btn-limpar-todos");
const comparacaoPanel = document.getElementById("comparacao-jogadores");
const comparacaoSelecionados = document.getElementById("comparacao-selecionados");
const comparacaoTabela = document.getElementById("comparacao-tabela");
const comparacaoBarrasFiltros = document.getElementById("comparacao-barras-filtros");
const comparacaoInsightsCards = document.getElementById("comparacao-insights-cards");
const comparacaoInsightsTabela = document.getElementById("comparacao-insights-tabela");
const btnLimparComparacao = document.getElementById("btn-limpar-comparacao");
const comparacaoRadarCanvas = document.getElementById("comparacao-radar");
const comparacaoBarrasCanvas = document.getElementById("comparacao-barras");
const usarLocalProximoJogoCheckbox = document.getElementById("usar-local-proximo-jogo");
const somenteProvaveisCheckbox = document.getElementById("somente-provaveis");
const usarPesosRadarCheckbox = document.getElementById("usar-pesos-radar");

function obterScoutsTotais() {
  if (typeof scoutsTotais !== "undefined") return scoutsTotais;
  if (typeof window.scoutsTotais !== "undefined") return window.scoutsTotais;
  return {};
}

function obterRodadasLocalData() {
  if (typeof rodadasLocalData !== "undefined") return rodadasLocalData;
  if (typeof window.rodadasLocalData !== "undefined") return window.rodadasLocalData;
  return [];
}

function obterPontuacoesPorRodada() {
  if (typeof pontuacoesPorRodada !== "undefined") return pontuacoesPorRodada;
  if (typeof window.pontuacoesPorRodada !== "undefined") return window.pontuacoesPorRodada;
  return {};
}

function detectarChavePosicao(base) {
  const primeiroGrupo = Object.values(base || {})[0] || [];
  const primeiroJogador = primeiroGrupo[0] || {};
  return (
    Object.keys(primeiroJogador).find((key) => {
      const normalizada = String(key).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizada.includes("posi");
    }) || "Posicao"
  );
}

function detectarProximaRodada(dadosRodadas) {
  const rodadasPendentes = (dadosRodadas || [])
    .filter((jogo) => jogo["Placar Casa"] == null || jogo["Placar Visitante"] == null)
    .map((jogo) => Number(jogo.Rodada))
    .filter((rodada) => Number.isFinite(rodada));

  if (rodadasPendentes.length) return Math.max(...rodadasPendentes);
  return null;
}

function construirMapaMandoProximoJogo() {
  const dadosRodadas = obterRodadasLocalData();
  const proximaRodada = detectarProximaRodada(dadosRodadas);
  if (!proximaRodada) return new Map();

  const mapa = new Map();
  dadosRodadas
    .filter((jogo) => Number(jogo.Rodada) === proximaRodada)
    .forEach((jogo) => {
      if (jogo["Clube Casa"]) mapa.set(jogo["Clube Casa"], "casa");
      if (jogo["Clube Visitante"]) mapa.set(jogo["Clube Visitante"], "fora");
    });

  return mapa;
}

function construirMapaAdversarioProximoJogo() {
  const dadosRodadas = obterRodadasLocalData();
  const proximaRodada = detectarProximaRodada(dadosRodadas);
  if (!proximaRodada) return new Map();

  const mapa = new Map();
  dadosRodadas
    .filter((jogo) => Number(jogo.Rodada) === proximaRodada)
    .forEach((jogo) => {
      if (jogo["Clube Casa"] && jogo["Clube Visitante"]) {
        mapa.set(jogo["Clube Casa"], jogo["Clube Visitante"]);
        mapa.set(jogo["Clube Visitante"], jogo["Clube Casa"]);
      }
    });

  return mapa;
}

function chaveScoutPorMando(scout, mando) {
  if (mando === "casa") return `${scout} Casa`;
  if (mando === "fora") return `${scout} Fora`;
  return scout;
}

function normalizarJogadores() {
  const base = obterScoutsTotais();
  const posKey = detectarChavePosicao(base);

  return Object.entries(base).flatMap(([posicaoGrupo, jogadores]) =>
    (jogadores || []).map((jogador) => ({
      nome: jogador["Nome do Jogador"],
      clube: jogador.Clube,
      posicao: jogador[posKey] || posicaoGrupo,
      statusId: Number(jogador.Status_ID ?? -1),
      status: jogador.Status || "Status indisponivel",
      bruto: jogador,
    }))
  );
}

const jogadoresBase = normalizarJogadores();
let scoutsSelecionados = [];
let jogadoresComparados = [];
let jogadoresComparadosBarras = [];
let radarChart = null;
let barrasChart = null;
const mandoProximoJogoPorClube = construirMapaMandoProximoJogo();
const adversarioProximoJogoPorClube = construirMapaAdversarioProximoJogo();
const pontuacoesPorRodadaBase = obterPontuacoesPorRodada();

const CORES_RADAR = [
  { border: "#ff7604", background: "rgba(255, 118, 4, 0.18)" },
  { border: "#2e86de", background: "rgba(46, 134, 222, 0.18)" },
  { border: "#27ae60", background: "rgba(39, 174, 96, 0.18)" },
  { border: "#8e44ad", background: "rgba(142, 68, 173, 0.18)" },
  { border: "#e74c3c", background: "rgba(231, 76, 60, 0.18)" },
];

function getScoutsSelecionados() {
  return [
    ...document.querySelectorAll("#filtro-scouts-positivos input[type='checkbox']:checked"),
    ...document.querySelectorAll("#filtro-scouts-negativos input[type='checkbox']:checked"),
  ].map((checkbox) => checkbox.value);
}

function usarLocalProximoJogo() {
  return Boolean(usarLocalProximoJogoCheckbox?.checked);
}

function somenteProvaveis() {
  return Boolean(somenteProvaveisCheckbox?.checked);
}

function jogadorProvavel(jogador) {
  if (Number(jogador.statusId) === 7) return true;
  const statusNormalizado = String(jogador.status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return statusNormalizado.includes("provavel");
}

function mandoEfetivoJogador(jogador) {
  if (!usarLocalProximoJogo()) return "total";
  return mandoProximoJogoPorClube.get(jogador.clube) || "total";
}

function valorScout(jogador, scout) {
  const mando = mandoEfetivoJogador(jogador);
  const chave = chaveScoutPorMando(scout, mando);
  return Number(jogador.bruto?.[chave] ?? jogador.bruto?.[scout] ?? 0);
}

function jogosEfetivosJogador(jogador) {
  const mando = mandoEfetivoJogador(jogador);
  if (mando === "casa") return Number(jogador.bruto?.["Jogos Casa"] ?? 0);
  if (mando === "fora") return Number(jogador.bruto?.["Jogos Fora"] ?? 0);
  return Number(jogador.bruto?.Jogos ?? 0);
}

function adversarioEfetivoJogador(jogador) {
  return adversarioProximoJogoPorClube.get(jogador.clube) || "-";
}

function jogadorId(jogador) {
  return [jogador.nome, jogador.clube, jogador.posicao].join("|");
}

function buscarJogadorPorId(id) {
  return jogadoresBase.find((jogador) => jogadorId(jogador) === id) || null;
}

function historicoPontuacaoJogador(jogador) {
  return pontuacoesPorRodadaBase[jogadorId(jogador)] || [];
}

function historicoPontuacaoFiltrado(jogador) {
  const historico = historicoPontuacaoJogador(jogador);
  if (!usarLocalProximoJogo()) return historico;
  const mando = mandoEfetivoJogador(jogador);
  if (!["casa", "fora"].includes(mando)) return historico;
  return historico.filter((item) => item.local === mando);
}

function media(valores) {
  if (!valores.length) return 0;
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

function mediana(valores) {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 0) return (ordenados[meio - 1] + ordenados[meio]) / 2;
  return ordenados[meio];
}

function thresholdConstancia(posicao) {
  if (["Goleiro", "Lateral", "Zagueiro"].includes(posicao)) return 5;
  if (["Meia", "Atacante"].includes(posicao)) return 6;
  return 5;
}

function resumoEscalacaoJogador(jogador) {
  const historico = historicoPontuacaoJogador(jogador)
    .map((item) => {
      const gols = Number(item.g ?? item.G ?? 0);
      const assistencias = Number(item.a ?? item.A ?? 0);
      const saldoDeGol = Number(item.sg ?? item.SG ?? 0);
      const golsSofridos = Number(item.gs ?? item.GS ?? 0);
      const faltasCometidas = Number(item.fc ?? item.FC ?? 0);
      const golsContra = Number(item.gc ?? item.GC ?? 0);
      const penaltisPerdidos = Number(item.pp ?? item.PP ?? 0);
      const impedimentos = Number(item.i ?? item.I ?? 0);
      const amarelos = Number(item.ca ?? item.CA ?? 0);
      const vermelhos = Number(item.cv ?? item.CV ?? 0);
      return {
        rodada: Number(item.rodada),
        pontuacao: Number(item.pontuacao),
        local: item.local,
        pontuacaoBasica: Number(item.pontuacao) - (
          (gols * (PESOS_SCOUTS.G || 0)) +
          (assistencias * (PESOS_SCOUTS.A || 0)) +
          (saldoDeGol * (PESOS_SCOUTS.SG || 0)) +
          (golsSofridos * (PESOS_SCOUTS.GS || 0)) +
          (faltasCometidas * (PESOS_SCOUTS.FC || 0)) +
          (golsContra * (PESOS_SCOUTS.GC || 0)) +
          (penaltisPerdidos * (PESOS_SCOUTS.PP || 0)) +
          (impedimentos * (PESOS_SCOUTS.I || 0)) +
          (amarelos * (PESOS_SCOUTS.CA || 0)) +
          (vermelhos * (PESOS_SCOUTS.CV || 0))
        ),
      };
    })
    .filter((item) => Number.isFinite(item.pontuacao))
    .sort((a, b) => a.rodada - b.rodada);

  const pontuacoes = historico.map((item) => item.pontuacao);
  const pontuacoesBasicas = historico.map((item) => item.pontuacaoBasica);
  const localAtual = mandoEfetivoJogador(jogador);
  const historicoLocal = ["casa", "fora"].includes(localAtual)
    ? historico.filter((item) => item.local === localAtual).map((item) => item.pontuacao)
    : [];
  const ultimas4 = historico.slice(-4).map((item) => item.pontuacao);
  const menor3 = [...pontuacoes].sort((a, b) => a - b).slice(0, 3);
  const maior2 = [...pontuacoes].sort((a, b) => b - a).slice(0, 2);
  const corteConstancia = thresholdConstancia(jogador.posicao);
  const jogosAcimaCorte = pontuacoes.filter((valor) => valor >= corteConstancia).length;
  const mediaGeral = media(pontuacoes);
  const mediaBasica = media(pontuacoesBasicas);
  const mediaLocal = historicoLocal.length ? media(historicoLocal) : 0;
  const mediaUltimas4 = media(ultimas4);
  const piso = media(menor3);
  const teto = media(maior2);
  const medianaGeral = mediana(pontuacoes);
  const melhor = pontuacoes.length ? Math.max(...pontuacoes) : 0;
  const pior = pontuacoes.length ? Math.min(...pontuacoes) : 0;
  const variacao = melhor - pior;
  const constancia = pontuacoes.length ? (jogosAcimaCorte / pontuacoes.length) * 100 : 0;
  const jogosLocal = ["casa", "fora"].includes(localAtual) ? historicoLocal.length : 0;
  const confiancaLocal = Math.min(jogosLocal / 3, 1);
  const baseContexto = confiancaLocal > 0
    ? (mediaLocal * confiancaLocal) + (mediaGeral * (1 - confiancaLocal))
    : mediaGeral;
  const indiceEscalacao =
    (baseContexto * 0.28) +
    (mediaBasica * 0.22) +
    (mediaUltimas4 * 0.2) +
    (piso * 0.15) +
    ((constancia / 100) * 10 * 0.08) +
    (teto * 0.07) -
    (variacao * 0.04);

  return {
    mediaGeral,
    mediaBasica,
    mediaLocal,
    mediaUltimas4,
    piso,
    teto,
    medianaGeral,
    melhor,
    pior,
    variacao,
    constancia,
    corteConstancia,
    localAtual,
    jogosLocal,
    confiancaLocal,
    indiceEscalacao,
  };
}

function fatorConfiancaAmostra(jogador) {
  const jogos = Number(jogador.bruto?.Jogos ?? 0);
  return Math.min(jogos / 4, 1);
}

function calcularPontuacao(jogador) {
  return scoutsSelecionados.reduce((total, scout) => total + valorScout(jogador, scout) * (PESOS_SCOUTS[scout] || 0), 0);
}

function calcularPontuacaoPositiva(jogador) {
  return scoutsSelecionados
    .filter((scout) => (PESOS_SCOUTS[scout] || 0) > 0)
    .reduce((total, scout) => total + valorScout(jogador, scout) * PESOS_SCOUTS[scout], 0);
}

function calcularPontuacaoNegativa(jogador) {
  return scoutsSelecionados
    .filter((scout) => (PESOS_SCOUTS[scout] || 0) < 0)
    .reduce((total, scout) => total + valorScout(jogador, scout) * PESOS_SCOUTS[scout], 0);
}

function popularFiltros() {
  const posicoes = [...new Set(jogadoresBase.map((jogador) => jogador.posicao))].sort();
  const clubes = [...new Set(jogadoresBase.map((jogador) => jogador.clube))].sort();

  selectPosicao.innerHTML = ['<option value="todas">Todas</option>']
    .concat(posicoes.map((posicao) => `<option value="${posicao}">${posicao}</option>`))
    .join("");

  selectClube.innerHTML = ['<option value="todos">Todos</option>']
    .concat(clubes.map((clube) => `<option value="${clube}">${clube}</option>`))
    .join("");

  filtroScoutsPositivos.innerHTML = ORDEM_SCOUTS.filter((scout) => SCOUTS_POSITIVOS.includes(scout))
    .map((scout) => `<label><input type="checkbox" value="${scout}" checked /> ${scout}</label>`)
    .join("");

  filtroScoutsNegativos.innerHTML = ORDEM_SCOUTS.filter((scout) => SCOUTS_NEGATIVOS.includes(scout))
    .map((scout) => `<label><input type="checkbox" value="${scout}" checked /> ${scout}</label>`)
    .join("");

  scoutsSelecionados = [...ORDEM_SCOUTS];
}

function salvarFiltros() {
  const filtros = {
    posicao: selectPosicao.value,
    clube: selectClube.value,
    nome: inputNome.value,
    scouts: scoutsSelecionados,
    usarLocalProximoJogo: usarLocalProximoJogo(),
    somenteProvaveis: somenteProvaveis(),
  };
  localStorage.setItem("filtrosScoutsTotais", JSON.stringify(filtros));
}

function carregarFiltros() {
  const filtrosSalvos = localStorage.getItem("filtrosScoutsTotais");
  if (!filtrosSalvos) return;

  try {
    const filtros = JSON.parse(filtrosSalvos);
    if (filtros.posicao) selectPosicao.value = filtros.posicao;
    if (filtros.clube) selectClube.value = filtros.clube;
    if (filtros.nome) inputNome.value = filtros.nome;
    if (typeof filtros.usarLocalProximoJogo === "boolean" && usarLocalProximoJogoCheckbox) {
      usarLocalProximoJogoCheckbox.checked = filtros.usarLocalProximoJogo;
    }
    if (typeof filtros.somenteProvaveis === "boolean" && somenteProvaveisCheckbox) {
      somenteProvaveisCheckbox.checked = filtros.somenteProvaveis;
    }
    if (Array.isArray(filtros.scouts)) {
      scoutsSelecionados = filtros.scouts;
      document.querySelectorAll("#filtro-scouts-positivos input, #filtro-scouts-negativos input").forEach((checkbox) => {
        checkbox.checked = scoutsSelecionados.includes(checkbox.value);
      });
    }
  } catch {
    // ignore local parse errors
  }
}

function filtrarJogadores() {
  const posicao = selectPosicao.value;
  const clube = selectClube.value;
  const nomeBusca = inputNome.value.trim().toLowerCase();

  return jogadoresBase.filter((jogador) => {
    if (posicao !== "todas" && jogador.posicao !== posicao) return false;
    if (clube !== "todos" && jogador.clube !== clube) return false;
    if (nomeBusca && !String(jogador.nome || "").toLowerCase().includes(nomeBusca)) return false;
    if (somenteProvaveis() && !jogadorProvavel(jogador)) return false;
    return true;
  });
}

function renderCards(jogadores) {
  const cards = [
    { titulo: "Goleadores", scout: "G" },
    { titulo: "Assistências", scout: "A" },
    { titulo: "Mais Desarmes", scout: "DS" },
    { titulo: "Defesas", scout: "DE" },
    { titulo: "Pontuação Total", scout: null },
  ];

  cardsDestaque.innerHTML = cards
    .map((card) => {
      const top = [...jogadores]
        .map((jogador) => ({
          ...jogador,
          valorCard: card.scout ? valorScout(jogador, card.scout) : calcularPontuacao(jogador),
        }))
        .sort((a, b) => b.valorCard - a.valorCard)
        .slice(0, 3);

      return `
        <article class="scout-card">
          <h3>${card.titulo}</h3>
          <ol>
            ${top
              .map(
                (jogador) => `
                  <li>
                    <strong>${jogador.nome}</strong> - ${jogador.clube}<br />
                    <span class="valor">${card.scout ? jogador.valorCard : jogador.valorCard.toFixed(2)}${card.scout ? "" : " pts"}</span>
                  </li>
                `
              )
              .join("")}
          </ol>
        </article>
      `;
    })
    .join("");
}

function renderTabela(jogadores) {
  if (!scoutsSelecionados.length) {
    conteudo.innerHTML = '<div class="scouts-empty">Selecione ao menos um scout para montar a tabela.</div>';
    return;
  }

  if (!jogadores.length) {
    conteudo.innerHTML = '<div class="scouts-empty">Nenhum jogador encontrado com os filtros atuais.</div>';
    return;
  }

  const jogadoresOrdenados = [...jogadores]
    .map((jogador) => ({
      ...jogador,
      pontuacaoPositiva: calcularPontuacaoPositiva(jogador),
      pontuacaoNegativa: calcularPontuacaoNegativa(jogador),
      pontuacaoTotal: calcularPontuacao(jogador),
    }))
    .sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  conteudo.innerHTML = `
    <div class="scouts-table-wrap">
      <table class="scouts-table">
        <thead>
          <tr>
            <th>Comparar</th>
            <th>Jogador</th>
            <th>Clube</th>
            <th>Posição</th>
            <th>Status</th>
            <th>${usarLocalProximoJogo() ? "Jogos Local" : "Jogos"}</th>
            ${usarLocalProximoJogo() ? "<th>Próx.</th><th>Adv.</th>" : ""}
            ${scoutsSelecionados.map((scout) => `<th>${scout}</th>`).join("")}
            <th>Pont. Positiva</th>
            <th>Pont. Negativa</th>
            <th>Pontuação Total</th>
          </tr>
        </thead>
        <tbody>
          ${jogadoresOrdenados
            .map(
              (jogador) => `
                <tr>
                  <td><input class="compare-check" type="checkbox" data-jogador-id="${jogadorId(jogador)}" ${jogadoresComparados.includes(jogadorId(jogador)) ? "checked" : ""} /></td>
                  <td class="name-cell">${jogador.nome}</td>
                  <td><span class="club-pill">${jogador.clube}</span></td>
                  <td><span class="pos-pill">${jogador.posicao}</span></td>
                  <td><span class="status-pill ${jogadorProvavel(jogador) ? "status-pill-provavel" : "status-pill-outro"}">${jogador.status || "-"}</span></td>
                  <td>${jogosEfetivosJogador(jogador)}</td>
                  ${usarLocalProximoJogo() ? `<td>${mandoEfetivoJogador(jogador) === "casa" ? "Casa" : mandoEfetivoJogador(jogador) === "fora" ? "Fora" : "-"}</td><td>${adversarioEfetivoJogador(jogador)}</td>` : ""}
                  ${scoutsSelecionados.map((scout) => `<td>${valorScout(jogador, scout)}</td>`).join("")}
                  <td>${jogador.pontuacaoPositiva.toFixed(2)}</td>
                  <td>${jogador.pontuacaoNegativa.toFixed(2)}</td>
                  <td>${jogador.pontuacaoTotal.toFixed(2)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  conteudo.querySelectorAll(".compare-check").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const { jogadorIdSelecionado } = { jogadorIdSelecionado: event.target.dataset.jogadorId };
      if (event.target.checked) {
        if (!jogadoresComparados.includes(jogadorIdSelecionado)) {
          jogadoresComparados = jogadoresComparados.concat(jogadorIdSelecionado).slice(0, 5);
        }
      } else {
        jogadoresComparados = jogadoresComparados.filter((id) => id !== jogadorIdSelecionado);
      }
      atualizarComparacao();
      atualizarVisualizacao();
    });
  });
}

function renderComparacao() {
  const jogadores = jogadoresComparados.map(buscarJogadorPorId).filter(Boolean);
  const usarPesosRadar = Boolean(usarPesosRadarCheckbox?.checked);

  if (!jogadores.length || !scoutsSelecionados.length) {
    comparacaoPanel.classList.add("is-hidden");
    if (comparacaoTabela) comparacaoTabela.innerHTML = "";
    if (comparacaoBarrasFiltros) comparacaoBarrasFiltros.innerHTML = "";
    if (comparacaoInsightsCards) comparacaoInsightsCards.innerHTML = "";
    if (comparacaoInsightsTabela) comparacaoInsightsTabela.innerHTML = "";
    if (radarChart) {
      radarChart.destroy();
      radarChart = null;
    }
    if (barrasChart) {
      barrasChart.destroy();
      barrasChart = null;
    }
    return;
  }

  comparacaoPanel.classList.remove("is-hidden");
  comparacaoSelecionados.innerHTML = jogadores
    .map(
      (jogador) => `
        <span class="comparacao-chip">
          ${jogador.nome} - ${jogador.clube}
          <button type="button" data-remove-id="${jogadorId(jogador)}">×</button>
        </span>
      `
    )
    .join("");

  comparacaoSelecionados.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      jogadoresComparados = jogadoresComparados.filter((id) => id !== button.dataset.removeId);
      jogadoresComparadosBarras = jogadoresComparadosBarras.filter((id) => id !== button.dataset.removeId);
      atualizarComparacao();
      atualizarVisualizacao();
    });
  });

  jogadoresComparadosBarras = jogadoresComparadosBarras.filter((id) => jogadores.some((jogador) => jogadorId(jogador) === id));
  if (!jogadoresComparadosBarras.length) {
    jogadoresComparadosBarras = jogadores.map((jogador) => jogadorId(jogador));
  }

  const jogadoresOrdenadosComparacao = [...jogadores].sort(
    (a, b) => calcularPontuacao(b) - calcularPontuacao(a)
  );

  if (comparacaoTabela) {
    comparacaoTabela.innerHTML = `
      <table class="scouts-table comparacao-table">
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Clube</th>
            <th>Posição</th>
            <th>Status</th>
            <th>${usarLocalProximoJogo() ? "Jogos Local" : "Jogos"}</th>
            ${usarLocalProximoJogo() ? "<th>Próx.</th><th>Adv.</th>" : ""}
            ${scoutsSelecionados.map((scout) => `<th>${scout}</th>`).join("")}
            <th>Pont. Positiva</th>
            <th>Pont. Negativa</th>
            <th>Pontuação Total</th>
          </tr>
        </thead>
        <tbody>
          ${jogadoresOrdenadosComparacao
            .map((jogador) => {
              const pontuacaoPositiva = calcularPontuacaoPositiva(jogador);
              const pontuacaoNegativa = calcularPontuacaoNegativa(jogador);
              const pontuacaoTotal = calcularPontuacao(jogador);
              return `
                <tr>
                  <td class="name-cell">${jogador.nome}</td>
                  <td><span class="club-pill">${jogador.clube}</span></td>
                  <td><span class="pos-pill">${jogador.posicao}</span></td>
                  <td><span class="status-pill ${jogadorProvavel(jogador) ? "status-pill-provavel" : "status-pill-outro"}">${jogador.status || "-"}</span></td>
                  <td>${jogosEfetivosJogador(jogador)}</td>
                  ${usarLocalProximoJogo() ? `<td>${mandoEfetivoJogador(jogador) === "casa" ? "Casa" : mandoEfetivoJogador(jogador) === "fora" ? "Fora" : "-"}</td><td>${adversarioEfetivoJogador(jogador)}</td>` : ""}
                  ${scoutsSelecionados.map((scout) => `<td>${valorScout(jogador, scout)}</td>`).join("")}
                  <td>${pontuacaoPositiva.toFixed(2)}</td>
                  <td>${pontuacaoNegativa.toFixed(2)}</td>
                  <td>${pontuacaoTotal.toFixed(2)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (comparacaoBarrasFiltros) {
    comparacaoBarrasFiltros.innerHTML = jogadores
      .map(
        (jogador) => `
          <label class="scouts-checkbox-inline">
            <input type="checkbox" class="comparacao-barra-check" data-jogador-id="${jogadorId(jogador)}" ${jogadoresComparadosBarras.includes(jogadorId(jogador)) ? "checked" : ""} />
            <span>${jogador.nome} - ${jogador.clube}</span>
          </label>
        `
      )
      .join("");

    comparacaoBarrasFiltros.querySelectorAll(".comparacao-barra-check").forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const id = event.target.dataset.jogadorId;
        if (event.target.checked) {
          if (!jogadoresComparadosBarras.includes(id)) jogadoresComparadosBarras = jogadoresComparadosBarras.concat(id);
        } else {
          jogadoresComparadosBarras = jogadoresComparadosBarras.filter((item) => item !== id);
        }
        renderComparacao();
      });
    });
  }

  const resumosJogadores = jogadoresOrdenadosComparacao.map((jogador) => ({
    jogador,
    resumo: resumoEscalacaoJogador(jogador),
  }));
  const baselinePosicao = resumosJogadores.length
    ? resumosJogadores.reduce((total, item) => total + item.resumo.indiceEscalacao, 0) / resumosJogadores.length
    : 0;
  const resumosJogadoresAjustados = resumosJogadores
    .map(({ jogador, resumo }) => {
      const confiancaAmostra = fatorConfiancaAmostra(jogador);
      const indiceAjustado = (resumo.indiceEscalacao * confiancaAmostra) + (baselinePosicao * (1 - confiancaAmostra));
      return {
        jogador,
        resumo: {
          ...resumo,
          confiancaAmostra,
          indiceEscalacaoAjustado: indiceAjustado,
        },
      };
    })
    .sort((a, b) => b.resumo.indiceEscalacaoAjustado - a.resumo.indiceEscalacaoAjustado);
  const mostrarMediaLocal = usarLocalProximoJogo();

  if (comparacaoInsightsCards) {
    comparacaoInsightsCards.innerHTML = resumosJogadoresAjustados
      .map(({ jogador, resumo }) => `
        <article class="comparacao-insight-card">
          <h4>${jogador.nome} - ${jogador.clube}</h4>
          <dl>
            <dt>Média</dt><dd>${resumo.mediaGeral.toFixed(2)}</dd>
            <dt>Mediana</dt><dd>${resumo.medianaGeral.toFixed(2)}</dd>
            <dt>Média Básica</dt><dd>${resumo.mediaBasica.toFixed(2)}</dd>
            <dt>Últimas 4</dt><dd>${resumo.mediaUltimas4.toFixed(2)}</dd>
            <dt>${mostrarMediaLocal && ["casa", "fora"].includes(resumo.localAtual) ? `Média ${resumo.localAtual === "casa" ? "Casa" : "Fora"}` : "Média Local"}</dt><dd>${mostrarMediaLocal && ["casa", "fora"].includes(resumo.localAtual) ? resumo.mediaLocal.toFixed(2) : "-"}</dd>
            <dt>Piso</dt><dd>${resumo.piso.toFixed(2)}</dd>
            <dt>Teto</dt><dd>${resumo.teto.toFixed(2)}</dd>
            <dt>Constância</dt><dd>${resumo.constancia.toFixed(0)}%</dd>
            <dt>Variação</dt><dd>${resumo.variacao.toFixed(2)}</dd>
            <dt>Confiança</dt><dd>${(resumo.confiancaAmostra * 100).toFixed(0)}%</dd>
            <dt>Índice</dt><dd>${resumo.indiceEscalacaoAjustado.toFixed(2)}</dd>
          </dl>
        </article>
      `)
      .join("");
  }

  if (comparacaoInsightsTabela) {
    comparacaoInsightsTabela.innerHTML = `
      <table class="scouts-table comparacao-table">
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Clube</th>
            <th>Média</th>
            <th>Mediana</th>
            <th>Média Básica</th>
            <th>Últimas 4</th>
            <th>Média Local</th>
            <th>Piso</th>
            <th>Teto</th>
            <th>Constância</th>
            <th>Variação</th>
            <th>Confiança</th>
            <th>Índice</th>
          </tr>
        </thead>
        <tbody>
          ${resumosJogadoresAjustados.map(({ jogador, resumo }) => `
            <tr>
              <td class="name-cell">${jogador.nome}</td>
              <td><span class="club-pill">${jogador.clube}</span></td>
              <td>${resumo.mediaGeral.toFixed(2)}</td>
              <td>${resumo.medianaGeral.toFixed(2)}</td>
              <td>${resumo.mediaBasica.toFixed(2)}</td>
              <td>${resumo.mediaUltimas4.toFixed(2)}</td>
              <td>${mostrarMediaLocal && ["casa", "fora"].includes(resumo.localAtual) ? resumo.mediaLocal.toFixed(2) : "-"}</td>
              <td>${resumo.piso.toFixed(2)}</td>
              <td>${resumo.teto.toFixed(2)}</td>
              <td>${resumo.constancia.toFixed(0)}%</td>
              <td>${resumo.variacao.toFixed(2)}</td>
              <td>${(resumo.confiancaAmostra * 100).toFixed(0)}%</td>
              <td>${resumo.indiceEscalacaoAjustado.toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  const datasets = jogadores.map((jogador, index) => ({
    label: `${jogador.nome} - ${jogador.clube}`,
    data: scoutsSelecionados.map((scout) => {
      const valor = valorScout(jogador, scout);
      return usarPesosRadar ? valor * (PESOS_SCOUTS[scout] || 0) : valor;
    }),
    borderColor: CORES_RADAR[index % CORES_RADAR.length].border,
    backgroundColor: CORES_RADAR[index % CORES_RADAR.length].background,
    pointBackgroundColor: CORES_RADAR[index % CORES_RADAR.length].border,
    borderWidth: 2,
    fill: true,
  }));

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(comparacaoRadarCanvas, {
    type: "radar",
    data: {
      labels: scoutsSelecionados.map((scout) => (usarPesosRadar ? `${scout} (${PESOS_SCOUTS[scout] || 0})` : scout)),
      datasets,
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#DCD7C9",
            font: { weight: "700" },
          },
        },
      },
      scales: {
        r: {
          angleLines: { color: "rgba(220, 215, 201, 0.2)" },
          grid: { color: "rgba(220, 215, 201, 0.2)" },
          pointLabels: {
            color: "#DCD7C9",
            font: { weight: "700" },
          },
          ticks: {
            color: "#DCD7C9",
            backdropColor: "transparent",
          },
        },
      },
    },
  });

  const jogadoresBarras = jogadores.filter((jogador) => jogadoresComparadosBarras.includes(jogadorId(jogador)));
  const rodadasUnicas = [...new Set(
    jogadoresBarras.flatMap((jogador) => historicoPontuacaoFiltrado(jogador).map((item) => Number(item.rodada)))
  )]
    .filter((rodada) => Number.isFinite(rodada))
    .sort((a, b) => a - b);

  const datasetsBarras = jogadoresBarras.map((jogador, index) => {
    const historico = historicoPontuacaoFiltrado(jogador);
    const mapaRodadas = new Map(historico.map((item) => [Number(item.rodada), Number(item.pontuacao)]));
    return {
      label: `${jogador.nome} - ${jogador.clube}`,
      data: rodadasUnicas.map((rodada) => mapaRodadas.get(rodada) ?? null),
      backgroundColor: CORES_RADAR[index % CORES_RADAR.length].background,
      borderColor: CORES_RADAR[index % CORES_RADAR.length].border,
      borderWidth: 2,
    };
  });

  if (barrasChart) barrasChart.destroy();
  barrasChart = new Chart(comparacaoBarrasCanvas, {
    type: "bar",
    data: {
      labels: rodadasUnicas.map((rodada) => `Rod ${rodada}`),
      datasets: datasetsBarras,
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#DCD7C9",
            font: { weight: "700" },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#DCD7C9",
            font: { weight: "700" },
          },
          grid: { color: "rgba(220, 215, 201, 0.12)" },
        },
        y: {
          ticks: {
            color: "#DCD7C9",
          },
          grid: { color: "rgba(220, 215, 201, 0.12)" },
        },
      },
    },
  });
}

function atualizarComparacao() {
  jogadoresComparados = jogadoresComparados.filter((id) => Boolean(buscarJogadorPorId(id)));
  renderComparacao();
}

function atualizarVisualizacao() {
  scoutsSelecionados = getScoutsSelecionados();
  const jogadores = filtrarJogadores();
  renderCards(jogadores);
  renderTabela(jogadores);
  atualizarComparacao();
  salvarFiltros();
}

function init() {
  popularFiltros();
  carregarFiltros();
  atualizarVisualizacao();

  selectPosicao.addEventListener("change", atualizarVisualizacao);
  selectClube.addEventListener("change", atualizarVisualizacao);
  inputNome.addEventListener("input", atualizarVisualizacao);
  filtroScoutsPositivos.addEventListener("change", atualizarVisualizacao);
  filtroScoutsNegativos.addEventListener("change", atualizarVisualizacao);
  usarLocalProximoJogoCheckbox?.addEventListener("change", atualizarVisualizacao);
  somenteProvaveisCheckbox?.addEventListener("change", atualizarVisualizacao);
  usarPesosRadarCheckbox?.addEventListener("change", atualizarComparacao);

  btnSelecionarTodos.addEventListener("click", () => {
    document.querySelectorAll("#filtro-scouts-positivos input, #filtro-scouts-negativos input").forEach((checkbox) => {
      checkbox.checked = true;
    });
    atualizarVisualizacao();
  });

  btnLimparTodos.addEventListener("click", () => {
    document.querySelectorAll("#filtro-scouts-positivos input, #filtro-scouts-negativos input").forEach((checkbox) => {
      checkbox.checked = false;
    });
    atualizarVisualizacao();
  });

  btnLimparComparacao.addEventListener("click", () => {
    jogadoresComparados = [];
    jogadoresComparadosBarras = [];
    atualizarComparacao();
    atualizarVisualizacao();
  });
}

init();
