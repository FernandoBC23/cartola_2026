// liga_eliminacao.js

const TURNO_INICIO = 1;
const TURNO_FIM = 19;
const RODADA_INICIO = TURNO_INICIO;
const RODADA_FIM = TURNO_FIM;
let totalRodadas = TURNO_FIM;

const getFontePontuacoes = () => (
  (typeof pontuacoesPorRodada === "object" && pontuacoesPorRodada) ? pontuacoesPorRodada : {}
);

const getFonteEliminados = () => (
  (typeof eliminadosPorRodada === "object" && eliminadosPorRodada) ? eliminadosPorRodada : {}
);

const temEliminacaoManual = (fonte) => Object.values(fonte).some(
  (lista) => Array.isArray(lista) && lista.length > 0
);

const getParcialPayload = () => (
  (typeof pontuacaoParcialRodadaAtual === "object" && pontuacaoParcialRodadaAtual)
    ? pontuacaoParcialRodadaAtual
    : { rodada: null, times: {} }
);

function getParcialRodada(rodada) {
  const payload = getParcialPayload();
  const rodadaEmAndamento = getRodadaDados();
  if (!payload || payload.rodada !== rodada || !payload.times) return null;
  if (Number.isFinite(rodadaEmAndamento) && rodada !== rodadaEmAndamento) return null;
  const keys = Object.keys(payload.times || {});
  return keys.length ? payload.times : null;
}

function rodadaAguardandoConfrontos(rodada) {
  const payload = getParcialPayload();
  const rodadaEmAndamento = getRodadaDados();
  if (!payload || payload.rodada !== rodada) return false;
  if (Number.isFinite(rodadaEmAndamento) && rodada !== rodadaEmAndamento) return false;
  const times = payload.times || {};
  return Object.keys(times).length === 0;
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

const getRodadaMaxExibicao = () => {
  const rodadaDados = getRodadaDados();
  if (Number.isFinite(rodadaDados)) return clampRodada(rodadaDados);
  const rodadasComPontuacao = getRodadasComPontuacao();
  return rodadasComPontuacao.length ? clampRodada(Math.max(...rodadasComPontuacao)) : RODADA_INICIO;
};

const getRodadaInicial = () => {
  const rodadaQuery = getRodadaQuery();
  if (Number.isFinite(rodadaQuery)) return clampRodada(Math.min(rodadaQuery, getRodadaMaxExibicao()));
  if (!getCampeonatoComecou()) return RODADA_INICIO;
  return getRodadaMaxExibicao();
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
  const aguardando = rodadaAguardandoConfrontos(rodada);
  const rodadaEmAndamento = getRodadaDados();
  const lista = getTimesBase().map(({ id, nome }) => {
    const row = fonte[id] || {};
    let pontosRodadaRaw = row[`Rodada ${rodada}`];
    const parcialArquivada = row[`Parcial Rodada ${rodada}`];
    const parcialVal = parcial && Object.prototype.hasOwnProperty.call(parcial, String(id))
      ? parcial[String(id)]
      : null;
    if (aguardando) {
      pontosRodadaRaw = 0;
    } else if (
      typeof pontosRodadaRaw !== "number"
      && typeof parcialArquivada === "number"
      && Number.isFinite(rodadaEmAndamento)
      && rodada < rodadaEmAndamento
    ) {
      pontosRodadaRaw = parcialArquivada;
    } else if (typeof parcialVal === "number") {
      pontosRodadaRaw = parcialVal;
    }
    const pontosRodada = typeof pontosRodadaRaw === "number" ? pontosRodadaRaw : 0;
    let totalTurno = 0;
    for (let r = RODADA_INICIO; r <= rodada; r++) {
      let pts = row[`Rodada ${r}`];
      const parcialHistorica = row[`Parcial Rodada ${r}`];
      if (r === rodada) {
        if (aguardando) {
          pts = 0;
        } else if (
          typeof pts !== "number"
          && typeof parcialHistorica === "number"
          && Number.isFinite(rodadaEmAndamento)
          && r < rodadaEmAndamento
        ) {
          pts = parcialHistorica;
        } else if (typeof parcialVal === "number") {
          pts = parcialVal;
        }
      }
      if (typeof pts === "number") totalTurno += pts;
    }
    return { id, nome, pontosRodada, totalTurno };
  });

  return lista;
}

function coletarPontuacoesRodada(rodada) {
  return montarListaRodada(rodada);
}

function getQtdEliminados(rodada) {
  if (rodada >= 1 && rodada <= 9) return 1;
  if (rodada >= 10 && rodada <= 18) return 2;
  return 0;
}

function calcularEliminadosDinamico(rodadaLimite) {
  const eliminados = {};
  const ativos = new Set(getTimesBase().map((t) => t.id));
  for (let r = RODADA_INICIO; r <= rodadaLimite && r < RODADA_FIM; r++) {
    const qtd = getQtdEliminados(r);
    if (!qtd || ativos.size <= 1) continue;
    const pontuacoes = montarListaRodada(r).filter((item) => ativos.has(item.id));
    if (pontuacoes.length <= 1) continue;
    const todosZero = pontuacoes.every((item) => item.pontosRodada === 0);
    if (todosZero) continue;
    pontuacoes.sort((a, b) => {
      if (a.pontosRodada !== b.pontosRodada) return a.pontosRodada - b.pontosRodada;
      return a.totalTurno - b.totalTurno;
    });
    const eliminadosRodada = pontuacoes.slice(0, Math.min(qtd, pontuacoes.length)).map((p) => p.id);
    eliminados[r] = eliminadosRodada;
    eliminadosRodada.forEach((id) => ativos.delete(id));
  }
  return { eliminados, ativos };
}

function getAtivosAteRodada(rodadaLimite, eliminadosFonte) {
  const ativos = new Set(getTimesBase().map((t) => t.id));
  for (let r = RODADA_INICIO; r <= rodadaLimite; r++) {
    const lista = eliminadosFonte[r] || eliminadosFonte[String(r)] || [];
    if (!Array.isArray(lista)) continue;
    lista.forEach((id) => ativos.delete(String(id)));
  }
  return ativos;
}

function getEliminadosRodada(rodadaAtual) {
  if (rodadaAguardandoConfrontos(rodadaAtual)) {
    return {
      eliminadosRodada: [],
      eliminadosFonte: getFonteEliminados(),
      ativos: null,
      usarDinamico: false,
    };
  }

  const eliminadosFonte = getFonteEliminados();
  if (temEliminacaoManual(eliminadosFonte)) {
    const lista = eliminadosFonte[rodadaAtual] || eliminadosFonte[String(rodadaAtual)] || [];
    return {
      eliminadosRodada: Array.isArray(lista) ? lista.map((id) => String(id)) : [],
      eliminadosFonte,
      ativos: null,
      usarDinamico: false,
    };
  }

  const limite = Math.min(rodadaAtual, RODADA_FIM - 1);
  const { eliminados, ativos } = calcularEliminadosDinamico(limite);
  const lista = eliminados[rodadaAtual] || eliminados[String(rodadaAtual)] || [];
  return {
    eliminadosRodada: Array.isArray(lista) ? lista.map((id) => String(id)) : [],
    eliminadosFonte: eliminados,
    ativos,
    usarDinamico: true,
  };
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

    const desabilitarProxima = rodadaAtual >= getRodadaMaxExibicao();

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
        if (novaRodada >= RODADA_INICIO && novaRodada <= getRodadaMaxExibicao()) {
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
  let lista = montarListaRodada(rodada);

  const eliminadosFonte = getFonteEliminados();
  if (temEliminacaoManual(eliminadosFonte)) {
    const ativos = getAtivosAteRodada(rodada - 1, eliminadosFonte);
    lista = lista.filter((item) => ativos.has(item.id));
  } else {
    const ativos = calcularEliminadosDinamico(Math.min(rodada - 1, RODADA_FIM - 1)).ativos;
    lista = lista.filter((item) => ativos.has(item.id));
  }

  lista.sort((a, b) => {
    if (b.pontosRodada !== a.pontosRodada) return b.pontosRodada - a.pontosRodada;
    if (b.totalTurno !== a.totalTurno) return b.totalTurno - a.totalTurno;
    return a.nome.localeCompare(b.nome);
  });

  const { eliminadosRodada } = getEliminadosRodada(rodada);

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
  const aguardando = rodadaAguardandoConfrontos(rodadaAtual);
  avisoContainer.classList.toggle("aviso-parcial", usandoParcial);
  const pontuacoesRodada = montarListaRodada(rodadaAtual);
  if (pontuacoesRodada.length > 0 && pontuacoesRodada.every((item) => item.pontosRodada === 0)) {
    const mensagemAguardando = rodadaAtual === RODADA_INICIO
      ? "Aguardando inicio do campeonato"
      : "Aguardando confrontos da rodada";
    avisoContainer.innerHTML = `
      <strong>${mensagemAguardando}:</strong>
      todos os times estao com 0 pontos na rodada ${rodadaAtual}.
    `;
    return;
  }

  const { eliminadosRodada } = getEliminadosRodada(rodadaAtual);
  const avisoParcialHTML = usandoParcial ? `
    <strong>Rodada ${rodadaAtual} em andamento:</strong>
    pontuacoes parciais (nao definitivas).<br>
  ` : "";
  if (!Array.isArray(eliminadosRodada) || eliminadosRodada.length === 0 || aguardando) {
    avisoContainer.innerHTML = avisoParcialHTML;
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
      ${avisoParcialHTML}
      Aviso: <strong>Eliminado da Rodada ${rodadaAtual}:</strong>
      ${elim.nome} com ${elim.pontosRodada.toFixed(2)} pts (Total no turno: ${elim.totalTurno.toFixed(2)})
    `;
  } else {
    const linhas = eliminadosDetalhe.map((e) =>
      `${e.nome} - ${e.pontosRodada.toFixed(2)} pts (Turno: ${e.totalTurno.toFixed(2)})`
    );
    avisoContainer.innerHTML = `
      ${avisoParcialHTML}
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
  const aguardando = rodadaAguardandoConfrontos(rodadaAtual);

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
      const mensagemAguardando = rodadaAtual === RODADA_INICIO
        ? "Aguardando inicio do campeonato"
        : "Aguardando confrontos da rodada";
      estatisticasHTML = `
        <h3>Resumo da Rodada ${rodadaAtual}</h3>
        <p><strong>${mensagemAguardando}:</strong> todos os times estao com 0 pontos.</p>
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

  const { eliminadosFonte } = getEliminadosRodada(rodadaAtual);
  const chaves = Object.keys(eliminadosFonte)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n) && n <= rodadaAtual && n < RODADA_FIM)
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
    if (aguardando && r === rodadaAtual) return;
    let lista = eliminadosFonte[r] || eliminadosFonte[String(r)] || [];
    if (!Array.isArray(lista) || lista.length === 0) return;
    const nomes = lista.map((id) => fonte?.[id]?.Time || id);
    eliminacoesHTML += `<li><strong>Rodada ${r}:</strong> ${nomes.join(", ")}</li>`;
  });
  eliminacoesHTML += `</ul>`;

  container.innerHTML = `${estatisticasHTML}${eliminacoesHTML}`;
}
