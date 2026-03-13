function escudoSrc(nome) {
  if (!nome) return "";
  const direto = window.escudosTimes?.[nome];
  if (direto) return direto;
  const base = window.ESCUDOS_BASE_PATH || "../imagens/";
  const padrao = window.ESCUDO_PADRAO || "escudo_default.png";
  if (padrao.startsWith("http") || padrao.startsWith("/") || padrao.includes("/")) {
    return padrao;
  }
  return `${base}${padrao}`;
}

const PONTOS_POR_POSICAO = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 10,
};

function calcularPontuacaoRanking(posicoes) {
  if (!Array.isArray(posicoes)) return 0;
  return posicoes.reduce((total, item) => total + (PONTOS_POR_POSICAO[item.posicao] || 0), 0);
}

function getRankingLigaClassicaRaw() {
  return (
    (typeof rankingTop5Mensal !== "undefined" && Array.isArray(rankingTop5Mensal) && rankingTop5Mensal)
    || (Array.isArray(window.rankingTop5Mensal) && window.rankingTop5Mensal)
    || []
  );
}

function normalizarLigaClassica() {
  return getRankingLigaClassicaRaw().map((time) => ({
    time: time.time,
    pontuacao: calcularPontuacaoRanking(time.posicoes),
    premiacoes: Number(time.aparicoes || 0),
    detalhes: Array.isArray(time.posicoes) ? time.posicoes : [],
    competicoes: ["Liga Clássica"],
  }));
}

function agregarRankingGeral(rankingsPorCompeticao) {
  const agregado = {};

  rankingsPorCompeticao.forEach((competicao) => {
    competicao.ranking.forEach((item) => {
      if (!item.time) return;

      if (!agregado[item.time]) {
        agregado[item.time] = {
          time: item.time,
          pontuacao: 0,
          premiacoes: 0,
          detalhes: [],
          competicoes: new Set(),
        };
      }

      agregado[item.time].pontuacao += Number(item.pontuacao || 0);
      agregado[item.time].premiacoes += Number(item.premiacoes || 0);
      if (Array.isArray(item.detalhes)) {
        agregado[item.time].detalhes.push(...item.detalhes);
      }
      agregado[item.time].competicoes.add(competicao.nome);
    });
  });

  return Object.values(agregado).map((item) => ({
    time: item.time,
    pontuacao: item.pontuacao,
    premiacoes: item.premiacoes,
    detalhes: item.detalhes,
    competicoes: [...item.competicoes].sort((a, b) => a.localeCompare(b, "pt-BR")),
  }));
}

function ordenarRanking(ranking) {
  return [...ranking].sort((a, b) => {
    if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
    if (b.premiacoes !== a.premiacoes) return b.premiacoes - a.premiacoes;
    return String(a.time || "").localeCompare(String(b.time || ""), "pt-BR");
  });
}

const COMPETICOES = [
  {
    id: "liga_classica",
    nome: "Liga Clássica",
    tipo: "competicao",
    obterRanking: normalizarLigaClassica,
  },
  {
    id: "geral",
    nome: "Ranking Geral",
    tipo: "geral",
    obterRanking: (competicoesDisponiveis) => agregarRankingGeral(
      competicoesDisponiveis.filter((competicao) => competicao.id !== "geral")
    ),
  },
];

function montarCompeticoesDisponiveis() {
  const competicoesBase = COMPETICOES
    .filter((competicao) => competicao.tipo !== "geral")
    .map((competicao) => {
      const ranking = competicao.obterRanking([]);
      return {
        ...competicao,
        ranking,
        disponivel: Array.isArray(ranking) && ranking.length > 0,
      };
    })
    .filter((competicao) => competicao.disponivel);

  const competicoes = [...competicoesBase];
  const configGeral = COMPETICOES.find((competicao) => competicao.tipo === "geral");

  if (configGeral && competicoesBase.length > 0) {
    const rankingGeral = configGeral.obterRanking(competicoesBase);
    competicoes.unshift({
      ...configGeral,
      ranking: rankingGeral,
      disponivel: rankingGeral.length > 0,
    });
  }

  return competicoes;
}

function renderCabecalhoTabela(tipo) {
  const head = document.querySelector(".tabela-classificacao thead");
  if (!head) return;

  const ultimaColuna = tipo === "geral" ? "Competições" : "Meses";
  const penultimaColuna = tipo === "geral" ? "Premiações" : "Aparições";

  head.innerHTML = `
    <tr>
      <th>Posição</th>
      <th>Time</th>
      <th>Pontos</th>
      <th>${penultimaColuna}</th>
      <th>${ultimaColuna}</th>
    </tr>
  `;
}

function renderTabelaCompeticao(corpoTabela, ranking) {
  corpoTabela.innerHTML = "";

  ordenarRanking(ranking).forEach((time, index) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${index + 1}º</td>
      <td><span class="time-info"><img src="${escudoSrc(time.time)}" alt="Escudo" class="escudo"> ${time.time}</span></td>
      <td>${Number(time.pontuacao || 0)}</td>
      <td>${Number(time.premiacoes || 0)}</td>
      <td>${(time.detalhes || []).map((item) => `${item.mes} (${item.posicao}º)`).join(", ") || "-"}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function renderTabelaGeral(corpoTabela, ranking) {
  corpoTabela.innerHTML = "";

  ordenarRanking(ranking).forEach((time, index) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${index + 1}º</td>
      <td><span class="time-info"><img src="${escudoSrc(time.time)}" alt="Escudo" class="escudo"> ${time.time}</span></td>
      <td>${Number(time.pontuacao || 0)}</td>
      <td>${Number(time.premiacoes || 0)}</td>
      <td>${(time.competicoes || []).join(", ") || "-"}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpo-ranking-campeoes");
  const selectCompeticao = document.getElementById("select-competicao");
  const competicoes = montarCompeticoesDisponiveis();

  if (!corpoTabela || !selectCompeticao) return;

  selectCompeticao.innerHTML = "";

  if (!competicoes.length) {
    renderCabecalhoTabela("competicao");
    corpoTabela.innerHTML = `<tr><td colspan="5">Nenhum ranking de campeões disponível.</td></tr>`;
    return;
  }

  competicoes.forEach((competicao) => {
    const option = document.createElement("option");
    option.value = competicao.id;
    option.textContent = competicao.nome;
    selectCompeticao.appendChild(option);
  });

  const atualizarCompeticao = () => {
    const competicao = competicoes.find((item) => item.id === selectCompeticao.value);
    if (!competicao) return;

    renderCabecalhoTabela(competicao.tipo);
    if (competicao.tipo === "geral") {
      renderTabelaGeral(corpoTabela, competicao.ranking);
      return;
    }
    renderTabelaCompeticao(corpoTabela, competicao.ranking);
  };

  selectCompeticao.addEventListener("change", atualizarCompeticao);
  selectCompeticao.value = competicoes[0].id;
  atualizarCompeticao();
});
