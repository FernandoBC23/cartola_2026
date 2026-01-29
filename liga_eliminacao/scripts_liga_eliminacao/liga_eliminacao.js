// liga_eliminacao.js

const TURNO_INICIO = 1;
const TURNO_FIM = 19;
const RODADA_INICIO = TURNO_INICIO;
const RODADA_FIM = TURNO_FIM;
let totalRodadas = TURNO_FIM;

const getFontePontuacoes = () => (
  (typeof pontuacoesPorRodada === "object" && pontuacoesPorRodada) ? pontuacoesPorRodada : {}
);

const getParcialPayload = () => (
  (typeof pontuacaoParcialRodadaAtual === "object" && pontuacaoParcialRodadaAtual)
    ? pontuacaoParcialRodadaAtual
    : { rodada: null, times: {} }
);

function getParcialRodada(rodada) {
  const payload = getParcialPayload();
  if (!payload || payload.rodada !== rodada || !payload.times) return null;
  const keys = Object.keys(payload.times || {});
  return keys.length ? payload.times : null;
}

const getCampeonatoComecou = () => (
  typeof window.campeonato_comecou === "boolean" ? window.campeonato_comecou : true
);

const clampRodada = (rodada) => Math.min(RODADA_FIM, Math.max(RODADA_INICIO, rodada));

const getRodadaQuery = () => {
  if (!window.location?.search) return null;
  const valor = new URLSearchParams(window.location.search).get("rodada");
  const rodada = parseInt(valor, 10);
  return Number.isFinite(rodada) ? rodada : null;
};

const getRodadaDados = () => {
  const rodada = window.rodada_atual ?? window.rodadaAtual;
  return typeof rodada === "number" ? rodada : null;
};

const getRodadasComPontuacao = () => {
  const fonte = getFontePontuacoes();
  return Object.values(fonte)
    .flatMap((p) => Object.entries(p)
      .filter(([_, pontos]) => typeof pontos === "number")
      .map(([rodada]) => parseInt(rodada.replace("Rodada ", ""), 10))
    )
    .filter((n) => Number.isFinite(n));
};

const getRodadaInicial = () => {
  const rodadaQuery = getRodadaQuery();
  if (Number.isFinite(rodadaQuery)) return clampRodada(rodadaQuery);
  if (!getCampeonatoComecou()) return RODADA_INICIO;
  const rodadaDados = getRodadaDados();
  if (Number.isFinite(rodadaDados)) return clampRodada(rodadaDados);
  const rodadasComPontuacao = getRodadasComPontuacao();
  return rodadasComPontuacao.length ? clampRodada(Math.max(...rodadasComPontuacao)) : RODADA_INICIO;
};

function getTimesBase() {
  const fonte = getFontePontuacoes();
  const ids = Object.keys(fonte);
  if (ids.length) {
    return ids.map((id) => ({ id, nome: fonte[id]?.Time || id }));
  }

  const listaTimes = window.times_confirmados || window.timesConfirmados || window.times;
  if (Array.isArray(listaTimes)) {
    return listaTimes.map((time) => {
      if (typeof time === "string") return { id: time, nome: time };
      return {
        id: String(time.id ?? time.time_id ?? time.nome ?? time.name ?? ""),
        nome: String(time.nome ?? time.name ?? time.apelido ?? time.id ?? time.time_id ?? ""),
      };
    }).filter((time) => time.nome);
  }

  const idsTimes = window.ids_times || window.idsTimes;
  if (Array.isArray(idsTimes)) {
    return idsTimes.map((id) => ({ id: String(id), nome: String(id) }));
  }
  if (idsTimes && typeof idsTimes === "object") {
    return Object.entries(idsTimes).map(([nome, id]) => ({ id: String(id), nome }));
  }

  return [];
}

function montarListaRodada(rodada) {
  const fonte = getFontePontuacoes();
  const parcial = getParcialRodada(rodada);
  const lista = getTimesBase().map(({ id, nome }) => {
    const row = fonte[id] || {};
    let pontosRodadaRaw = row[`Rodada ${rodada}`];
    if (parcial && Object.prototype.hasOwnProperty.call(parcial, String(id))) {
      const parcialVal = parcial[String(id)];
      if (typeof parcialVal === "number") pontosRodadaRaw = parcialVal;
    }
    const pontosRodada = typeof pontosRodadaRaw === "number" ? pontosRodadaRaw : 0;
    let totalTurno = 0;
    for (let r = RODADA_INICIO; r <= rodada; r++) {
      const pts = row[`Rodada ${r}`];
      if (typeof pts === "number") totalTurno += pts;
    }
    return { id, nome, pontosRodada, totalTurno };
  });

  return lista;
}

function coletarPontuacoesRodada(rodada) {
  return montarListaRodada(rodada);
}
let rodadaAtual = RODADA_INICIO;

document.addEventListener("DOMContentLoaded", () => {
  totalRodadas = RODADA_FIM;

  // Topo
  const tituloRodadaTop = document.getElementById("titulo-rodada");
  const btnAnteriorTop = document.getElementById("btn-anterior");
  const btnProximaTop = document.getElementById("btn-proxima");

  // Rodape
  const tituloRodadaBottom = document.getElementById("titulo-rodada-bottom");
  const btnAnteriorBottom = document.getElementById("btn-anterior-bottom");
  const btnProximaBottom = document.getElementById("btn-proxima-bottom");

  // Atualiza UI com rodada atual
  function atualizarRodada(novaRodada) {
    rodadaAtual = novaRodada;

    exibirPontuacoesRodada(rodadaAtual);
    exibirUltimoColocadoRodada(rodadaAtual);
    exibirResumoEliminacao(rodadaAtual);

    if (tituloRodadaTop) tituloRodadaTop.textContent = `Rodada ${rodadaAtual}`;
    if (tituloRodadaBottom) tituloRodadaBottom.textContent = `Rodada ${rodadaAtual}`;

    const desabilitarAnterior = rodadaAtual <= RODADA_INICIO;

    const desabilitarProxima = rodadaAtual >= RODADA_FIM;

    if (btnAnteriorTop) btnAnteriorTop.disabled = desabilitarAnterior;
    if (btnProximaTop) btnProximaTop.disabled = desabilitarProxima;
    if (btnAnteriorBottom) btnAnteriorBottom.disabled = desabilitarAnterior;
    if (btnProximaBottom) btnProximaBottom.disabled = desabilitarProxima;
  }

  // Acoes dos botoes
  const configurarBotao = (botao, direcao) => {
    if (botao) {
      botao.addEventListener("click", () => {
        const novaRodada = rodadaAtual + direcao;
        if (novaRodada >= RODADA_INICIO && novaRodada <= RODADA_FIM) {
          atualizarRodada(novaRodada);
        }
      });
    }
  };

  configurarBotao(btnAnteriorTop, -1);
  configurarBotao(btnProximaTop, +1);
  configurarBotao(btnAnteriorBottom, -1);
  configurarBotao(btnProximaBottom, +1);

  atualizarRodada(getRodadaInicial());
});

// Escudos centralizados (usa scripts/escudos_times.js)
let _escudosMap = null;

function normalizarNomeEscudo(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function getEscudosMap() {
  if (_escudosMap) return _escudosMap;
  const base = window.escudosTimes || {};
  _escudosMap = {};
  Object.keys(base).forEach((k) => {
    _escudosMap[normalizarNomeEscudo(k)] = base[k];
  });
  return _escudosMap;
}

function resolveEscudoArquivo(nome) {
  const direto = window.escudosTimes?.[nome];
  if (direto) return direto;
  const map = getEscudosMap();
  const norm = normalizarNomeEscudo(nome);
  if (map[norm]) return map[norm];
  return window.ESCUDO_PADRAO || "escudo_default.png";
}

function escudoSrc(nome) {
  const base = window.ESCUDOS_BASE_PATH || "../imagens/";
  const arquivo = resolveEscudoArquivo(nome);
  if (
    arquivo.startsWith("http://") ||
    arquivo.startsWith("https://") ||
    arquivo.startsWith("../") ||
    arquivo.startsWith("./") ||
    arquivo.startsWith("/")
  ) {
    return arquivo;
  }
  return base + arquivo;
}


function exibirPontuacoesRodada(rodada) {
  const tbody = document.getElementById("classificacao-corpo");
  if (!tbody) return;

  tbody.innerHTML = "";
  const lista = montarListaRodada(rodada);

  lista.sort((a, b) => {
    if (b.pontosRodada !== a.pontosRodada) return b.pontosRodada - a.pontosRodada;
    if (b.totalTurno !== a.totalTurno) return b.totalTurno - a.totalTurno;
    return a.nome.localeCompare(b.nome);
  });

  const eliminadosFonte = (typeof eliminadosPorRodada === "object" && eliminadosPorRodada) ? eliminadosPorRodada : {};
  let eliminadosRodada = eliminadosFonte[rodada] || eliminadosFonte[String(rodada)] || [];
  if (!Array.isArray(eliminadosRodada)) eliminadosRodada = [];

  lista.forEach((item, index) => {
    const escudo = escudoSrc(item.nome);
    const isEliminado = eliminadosRodada.includes(item.id);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="time-info">
          <img src="${escudo}" class="escudo" alt="${item.nome}" />
          ${item.nome}
          ${isEliminado ? '<span class="eliminado-tag">Eliminado</span>' : ''}
        </div>
      </td>
      <td>${item.pontosRodada.toFixed(2)}</td>
    `;

    if (isEliminado) row.classList.add("eliminado-atual");
    tbody.appendChild(row);
  });
}

function exibirUltimoColocadoRodada(rodadaAtual) {
  const avisoContainer = document.getElementById("aviso-eliminado");
  if (!avisoContainer) return;

  const usandoParcial = !!getParcialRodada(rodadaAtual);
  if (usandoParcial) {
    avisoContainer.classList.add("aviso-parcial");
    avisoContainer.innerHTML = `
      <strong>Rodada ${rodadaAtual} em andamento:</strong>
      pontuacoes parciais (nao definitivas).
    `;
    return;
  }

  avisoContainer.classList.remove("aviso-parcial");
  const pontuacoesRodada = montarListaRodada(rodadaAtual);
  if (pontuacoesRodada.length > 0 && pontuacoesRodada.every((item) => item.pontosRodada === 0)) {
    avisoContainer.innerHTML = `
      <strong>Aguardando inicio do campeonato:</strong>
      todos os times estao com 0 pontos na rodada ${rodadaAtual}.
    `;
    return;
  }

  const eliminadosFonte = (typeof eliminadosPorRodada === "object" && eliminadosPorRodada) ? eliminadosPorRodada : {};
  let eliminadosRodada = eliminadosFonte[rodadaAtual] || eliminadosFonte[String(rodadaAtual)] || [];
  if (!Array.isArray(eliminadosRodada) || eliminadosRodada.length === 0) {
    avisoContainer.innerHTML = "";
    return;
  }

  const eliminadosDetalhe = eliminadosRodada.map((id) => {
    const row = (typeof pontuacoesPorRodada === "object" && pontuacoesPorRodada) ? (pontuacoesPorRodada[id] || {}) : {};
    const nome = row.Time || id;
    const pontosRodada = row[`Rodada ${rodadaAtual}`];
    let totalTurno = 0;
    for (let r = RODADA_INICIO; r <= rodadaAtual; r++) {
      const pts = row[`Rodada ${r}`];
      if (typeof pts === "number") totalTurno += pts;
    }
    return {
      nome,
      pontosRodada: typeof pontosRodada === "number" ? pontosRodada : 0,
      totalTurno,
    };
  });

  if (eliminadosDetalhe.length === 1) {
    const elim = eliminadosDetalhe[0];
    avisoContainer.innerHTML = `
      Aviso: <strong>Eliminado da Rodada ${rodadaAtual}:</strong>
      ${elim.nome} com ${elim.pontosRodada.toFixed(2)} pts (Total no turno: ${elim.totalTurno.toFixed(2)})
    `;
  } else {
    const linhas = eliminadosDetalhe.map((e) =>
      `${e.nome} - ${e.pontosRodada.toFixed(2)} pts (Turno: ${e.totalTurno.toFixed(2)})`
    );
    avisoContainer.innerHTML = `
      Aviso: <strong>Eliminados da Rodada ${rodadaAtual}:</strong><br>
      ${linhas.join("<br>")}
    `;
  }
}

function exibirResumoEliminacao(rodadaAtual) {
  const container = document.getElementById("resumo-eliminacao");
  if (!container) return;

  const fonte = getFontePontuacoes();
  const pontuacoesRodada = montarListaRodada(rodadaAtual);

  let estatisticasHTML = "";
  if (pontuacoesRodada.length > 0) {
    const todosZero = pontuacoesRodada.every((item) => item.pontosRodada === 0);
    pontuacoesRodada.sort((a, b) => {
      if (b.pontosRodada !== a.pontosRodada) return b.pontosRodada - a.pontosRodada;
      return b.totalTurno - a.totalTurno;
    });
    const maior = pontuacoesRodada[0];
    const menor = pontuacoesRodada[pontuacoesRodada.length - 1];
    const total = pontuacoesRodada.reduce((sum, obj) => sum + obj.pontosRodada, 0);
    const media = (total / pontuacoesRodada.length).toFixed(2);

    if (todosZero) {
      estatisticasHTML = `
        <h3>Resumo da Rodada ${rodadaAtual}</h3>
        <p><strong>Aguardando inicio do campeonato:</strong> todos os times estao com 0 pontos.</p>
      `;
    } else {
      estatisticasHTML = `
        <h3>Resumo da Rodada ${rodadaAtual}</h3>
        <ul>
          <li><strong>Maior pontuacao:</strong> ${maior.nome} (${maior.pontosRodada.toFixed(2)} pts)</li>
          <li><strong>Menor pontuacao:</strong> ${menor.nome} (${menor.pontosRodada.toFixed(2)} pts)</li>
          <li><strong>Media geral:</strong> ${media} pts</li>
        </ul>
      `;
    }
  }

  const eliminadosFonte = (typeof eliminadosPorRodada === "object" && eliminadosPorRodada) ? eliminadosPorRodada : {};
  const chaves = Object.keys(eliminadosFonte)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n) && n <= rodadaAtual)
    .sort((a, b) => a - b);

  let eliminacoesHTML = `<h3>Eliminacoes</h3>`;

  const temEliminacoes = chaves.some((r) => {
    const lista = eliminadosFonte[r] || eliminadosFonte[String(r)] || [];
    return Array.isArray(lista) && lista.length > 0;
  });

  if (!temEliminacoes) {
    eliminacoesHTML += `<p>Ainda nao ha eliminacoes registradas.</p>`;
    container.innerHTML = `${estatisticasHTML}${eliminacoesHTML}`;
    return;
  }

  eliminacoesHTML += `<ul>`;
  chaves.forEach((r) => {
    let lista = eliminadosFonte[r] || eliminadosFonte[String(r)] || [];
    if (!Array.isArray(lista) || lista.length === 0) return;
    const nomes = lista.map((id) => fonte?.[id]?.Time || id);
    eliminacoesHTML += `<li><strong>Rodada ${r}:</strong> ${nomes.join(", ")}</li>`;
  });
  eliminacoesHTML += `</ul>`;

  container.innerHTML = `${estatisticasHTML}${eliminacoesHTML}`;
}
