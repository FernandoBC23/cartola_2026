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

const PONTOS_LIGA_CLASSICA = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 10,
};

const PONTOS_COPA_LEON = {
  1: 100,
  2: 60,
  3: 40,
};

const PONTOS_CAMPEAO_TURNO = 100;

const MESES_ABREVIADOS = {
  Janeiro: "Jan",
  Fevereiro: "Fev",
  Marco: "Mar",
  Abril: "Abr",
  Maio: "Mai",
  Junho: "Jun",
  Julho: "Jul",
  Agosto: "Ago",
  Setembro: "Set",
  Outubro: "Out",
  Novembro: "Nov",
  Dezembro: "Dez",
};

function calcularPontuacaoRanking(posicoes) {
  if (!Array.isArray(posicoes)) return 0;
  return posicoes.reduce((total, item) => total + (PONTOS_LIGA_CLASSICA[item.posicao] || 0), 0);
}

function getRankingLigaClassicaRaw() {
  const datasetVersionado = window.rankingCampeoesDatasets?.liga_classica_2026_01;
  return (
    (datasetVersionado && Array.isArray(datasetVersionado.ranking) && datasetVersionado.ranking)
    || (typeof rankingTop5Mensal2026_01 !== "undefined" && Array.isArray(rankingTop5Mensal2026_01) && rankingTop5Mensal2026_01)
    || (typeof rankingTop5Mensal !== "undefined" && Array.isArray(rankingTop5Mensal) && rankingTop5Mensal)
    || (Array.isArray(window.rankingTop5Mensal) && window.rankingTop5Mensal)
    || []
  );
}

function getRankingCopaLeonRaw() {
  const datasetVersionado = window.rankingCampeoesDatasets?.copa_leon_2026_01;
  return (
    (datasetVersionado && Array.isArray(datasetVersionado.ranking) && datasetVersionado.ranking)
    || (typeof campeoesCopaLeon2026_01 !== "undefined" && Array.isArray(campeoesCopaLeon2026_01) && campeoesCopaLeon2026_01)
    || (typeof campeoesCopaLeon !== "undefined" && Array.isArray(campeoesCopaLeon) && campeoesCopaLeon)
    || (Array.isArray(window.campeoesCopaLeon) && window.campeoesCopaLeon)
    || []
  );
}

function normalizarLigaClassica() {
  const datasetVersionado = window.rankingCampeoesDatasets?.liga_classica_2026_01;
  const rankingBase = getRankingLigaClassicaRaw().map((time) => ({
    time: time.time,
    pontuacao: calcularPontuacaoRanking(time.posicoes),
    premiacoes: Number(time.aparicoes || 0),
    detalhes: Array.isArray(time.posicoes)
      ? time.posicoes.map((item) => ({ ...item, tipo: "mensal" }))
      : [],
    competicoes: ["Liga Classica"],
  }));

  const campeaoTurno = datasetVersionado?.campeao_turno;
  if (campeaoTurno && campeaoTurno.time) {
    const existente = rankingBase.find((item) => item.time === campeaoTurno.time);
    if (existente) {
      existente.pontuacao += PONTOS_CAMPEAO_TURNO;
      existente.premiacoes += 1;
      existente.detalhes.push({
        tipo: "turno",
        nome: campeaoTurno.nome || "Campeao Turno",
        posicao: 1,
      });
    } else {
      rankingBase.push({
        time: campeaoTurno.time,
        pontuacao: PONTOS_CAMPEAO_TURNO,
        premiacoes: 1,
        detalhes: [
          {
            tipo: "turno",
            nome: campeaoTurno.nome || "Campeao Turno",
            posicao: 1,
          },
        ],
        competicoes: ["Liga Classica"],
      });
    }
  }

  return rankingBase;
}

function normalizarCopaLeon() {
  return getRankingCopaLeonRaw()
    .filter((item) => Number(item.posicao) >= 1 && Number(item.posicao) <= 3)
    .map((item) => ({
      time: item.time,
      pontuacao: Number(PONTOS_COPA_LEON[item.posicao] || 0),
      premiacoes: 1,
      detalhes: [
        {
          titulo: item.titulo,
          fase: item.fase,
          adversario: item.adversario,
        },
      ],
      competicoes: ["Copa Leon"],
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

function abreviarMes(nomeMes) {
  return MESES_ABREVIADOS[nomeMes] || nomeMes;
}

const COMPETICOES = [
  {
    id: "liga_classica",
    nome: "Liga Cl\u00E1ssica",
    tipo: "competicao",
    rotuloPremiacoes: "Premia\u00E7\u00F5es",
    rotuloDetalhes: "Meses",
    obterRanking: normalizarLigaClassica,
    formatarDetalhes: (item) =>
      (item.detalhes || []).map((detalhe) => {
        if (detalhe.tipo === "turno") {
          return `${detalhe.nome || "Campe\u00E3o do Turno"} (1&ordm;)`;
        }
        return `${abreviarMes(detalhe.mes)} (${detalhe.posicao}&ordm;)`;
      }).join(", ") || "-",
    cardPontuacaoHtml: `
      <h3>Liga Cl&aacute;ssica</h3>
      <div class="card-pontuacao-secao">
        <h4>Pontua&ccedil;&otilde;es dos Campe&otilde;es do M&ecirc;s</h4>
        <ul>
          <li>1&ordm; Lugar - 50 Pontos</li>
          <li>2&ordm; Lugar - 40 Pontos</li>
          <li>3&ordm; Lugar - 30 Pontos</li>
          <li>4&ordm; Lugar - 20 Pontos</li>
          <li>5&ordm; Lugar - 10 Pontos</li>
        </ul>
      </div>
      <div class="card-pontuacao-secao">
        <h4>Pontua&ccedil;&otilde;es do Campe&atilde;o do Turno</h4>
        <ul>
          <li>1&ordm; Lugar - 100 Pontos</li>
        </ul>
      </div>
    `,
  },
  {
    id: "copa_leon",
    nome: "Copa Leon",
    tipo: "competicao",
    rotuloPremiacoes: "Premia\u00E7\u00F5es",
    rotuloDetalhes: "Resultados",
    obterRanking: normalizarCopaLeon,
    formatarDetalhes: (item) =>
      (item.detalhes || []).map((detalhe) => detalhe.titulo).join(", ") || "-",
    cardPontuacaoHtml: `
      <h3>Copa Leon</h3>
      <div class="card-pontuacao-secao">
        <h4>Pontua&ccedil;&otilde;es</h4>
        <ul>
          <li>1&ordm; Lugar - 100 Pontos</li>
          <li>2&ordm; Lugar - 60 Pontos</li>
          <li>3&ordm; Lugar - 40 Pontos</li>
        </ul>
      </div>
    `,
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

function renderCabecalhoTabela(competicao) {
  const head = document.querySelector(".tabela-classificacao thead");
  if (!head) return;
  const isMobile = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

  const ultimaColuna = competicao.tipo === "geral"
    ? "Competi\u00E7\u00F5es"
    : (competicao.rotuloDetalhes || "Detalhes");
  const penultimaColuna = competicao.tipo === "geral"
    ? "Premia\u00E7\u00F5es"
    : (competicao.rotuloPremiacoes || "Premia\u00E7\u00F5es");
  const primeiraColuna = isMobile ? "Pos" : "Posi\u00E7\u00E3o";

  head.innerHTML = `
    <tr>
      <th>${primeiraColuna}</th>
      <th>Time</th>
      <th>Pontos</th>
      <th>${penultimaColuna}</th>
      <th>${ultimaColuna}</th>
    </tr>
  `;
}

function renderTabelaCompeticao(corpoTabela, competicao) {
  corpoTabela.innerHTML = "";
  const ranking = Array.isArray(competicao.ranking) ? competicao.ranking : [];
  const formatarDetalhes = typeof competicao.formatarDetalhes === "function"
    ? competicao.formatarDetalhes
    : () => "-";

  ordenarRanking(ranking).forEach((time, index) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${index + 1}&ordm;</td>
      <td><span class="time-info"><img src="${escudoSrc(time.time)}" alt="Escudo" class="escudo"> ${time.time}</span></td>
      <td>${Number(time.pontuacao || 0)}</td>
      <td>${Number(time.premiacoes || 0)}</td>
      <td>${formatarDetalhes(time)}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function renderTabelaGeral(corpoTabela, ranking) {
  corpoTabela.innerHTML = "";

  ordenarRanking(ranking).forEach((time, index) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${index + 1}&ordm;</td>
      <td><span class="time-info"><img src="${escudoSrc(time.time)}" alt="Escudo" class="escudo"> ${time.time}</span></td>
      <td>${Number(time.pontuacao || 0)}</td>
      <td>${Number(time.premiacoes || 0)}</td>
      <td>${(time.competicoes || []).join(", ") || "-"}</td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function renderCardPontuacao(competicao) {
  const card = document.getElementById("card-pontuacao");
  const conteudo = document.getElementById("card-pontuacao-conteudo");
  if (!card || !conteudo) return;

  if (!competicao || !competicao.cardPontuacaoHtml) {
    conteudo.innerHTML = "";
    card.hidden = true;
    return;
  }

  conteudo.innerHTML = competicao.cardPontuacaoHtml;
  card.hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpo-ranking-campeoes");
  const selectCompeticao = document.getElementById("select-competicao");
  const competicoes = montarCompeticoesDisponiveis();

  if (!corpoTabela || !selectCompeticao) return;

  selectCompeticao.innerHTML = "";

  if (!competicoes.length) {
    renderCabecalhoTabela({ tipo: "competicao", rotuloPremiacoes: "Premia\u00E7\u00F5es", rotuloDetalhes: "Detalhes" });
    corpoTabela.innerHTML = `<tr><td colspan="5">Nenhum ranking de campe\u00F5es dispon\u00EDvel.</td></tr>`;
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

    renderCabecalhoTabela(competicao);
    if (competicao.tipo === "geral") {
      renderTabelaGeral(corpoTabela, competicao.ranking);
      renderCardPontuacao(null);
      return;
    }
    renderTabelaCompeticao(corpoTabela, competicao);
    renderCardPontuacao(competicao);
  };

  selectCompeticao.addEventListener("change", atualizarCompeticao);
  selectCompeticao.value = competicoes[0].id;
  atualizarCompeticao();
});
