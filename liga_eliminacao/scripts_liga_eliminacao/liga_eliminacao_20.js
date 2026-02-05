// liga_eliminacao.js

const RODADA_INICIO = 1;
const RODADA_FIM = 19;
let totalRodadas = RODADA_FIM;

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

const getRodadaDados = () => {
  const rodada = window.rodada_atual ?? window.rodadaAtual;
  return typeof rodada === "number" ? rodada : null;
};

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

function coletarPontuacoesExibicao(rodada) {
  const lista = [];
  const fonte = getFontePontuacoes();
  const parcial = getParcialRodada(rodada);
  const aguardando = rodadaAguardandoConfrontos(rodada);
  const rodadaEmAndamento = getRodadaDados();

  for (const id in fonte) {
    const row = fonte[id] || {};
    const nome = row.Time || id;
    let pontosRodada = row[`Rodada ${rodada}`];
    const parcialArquivada = row[`Parcial Rodada ${rodada}`];
    const parcialVal = parcial && Object.prototype.hasOwnProperty.call(parcial, String(id))
      ? parcial[String(id)]
      : null;

    if (aguardando) {
      pontosRodada = 0;
    } else if (
      typeof pontosRodada !== "number"
      && typeof parcialArquivada === "number"
      && Number.isFinite(rodadaEmAndamento)
      && rodada < rodadaEmAndamento
    ) {
      pontosRodada = parcialArquivada;
    } else if (typeof parcialVal === "number") {
      pontosRodada = parcialVal;
    }

    if (typeof pontosRodada === "number") {
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
      lista.push({ id, nome, pontosRodada, totalTurno });
    }
  }

  return { lista, usandoParcial: !!parcial };
}

function coletarPontuacoesRodada(rodada, ativosSet = null, parcial = null, aguardando = false) {
  const lista = [];
  const fonte = getFontePontuacoes();
  const rodadaEmAndamento = getRodadaDados();
  for (const id in fonte) {
    if (ativosSet && !ativosSet.has(id)) continue;
    const row = fonte[id] || {};
    const nome = row.Time || id;
    let pontosRodada = row[`Rodada ${rodada}`];
    const parcialArquivada = row[`Parcial Rodada ${rodada}`];
    const parcialVal = parcial && Object.prototype.hasOwnProperty.call(parcial, String(id))
      ? parcial[String(id)]
      : null;
    if (aguardando) {
      pontosRodada = 0;
    } else if (
      typeof pontosRodada !== "number"
      && typeof parcialArquivada === "number"
      && Number.isFinite(rodadaEmAndamento)
      && rodada < rodadaEmAndamento
    ) {
      pontosRodada = parcialArquivada;
    } else if (typeof parcialVal === "number") {
      pontosRodada = parcialVal;
    }
    if (typeof pontosRodada === "number") {
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
      lista.push({ id, nome, pontosRodada, totalTurno });
    }
  }
  return lista;
}

function calcularEliminadosDinamico(rodadaLimite, rodadaParcial = null, parcialTimes = null) {
  const eliminados = {};
  const ativos = new Set(Object.keys(getFontePontuacoes()));
  for (let r = RODADA_INICIO; r <= rodadaLimite && r < RODADA_FIM; r++) {
    const usarParcial = rodadaParcial === r ? parcialTimes : null;
    const aguardando = rodadaAguardandoConfrontos(r);
    const pontuacoes = coletarPontuacoesRodada(r, ativos, usarParcial, aguardando);
    if (pontuacoes.length <= 1) continue;
    const todosZero = pontuacoes.every((item) => item.pontosRodada === 0);
    if (todosZero) continue;
    pontuacoes.sort((a, b) => {
      if (a.pontosRodada !== b.pontosRodada) return a.pontosRodada - b.pontosRodada;
      return a.totalTurno - b.totalTurno;
    });
    const eliminado = pontuacoes[0].id;
    eliminados[r] = [eliminado];
    ativos.delete(eliminado);
  }
  return { eliminados, ativos };
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

  const parcialAtual = getParcialRodada(rodadaAtual);
  if (parcialAtual) {
    const limite = Math.min(rodadaAtual, RODADA_FIM - 1);
    const { eliminados, ativos } = calcularEliminadosDinamico(limite, rodadaAtual, parcialAtual);
    const lista = eliminados[rodadaAtual] || eliminados[String(rodadaAtual)] || [];
    return {
      eliminadosRodada: Array.isArray(lista) ? lista.map((id) => String(id)) : [],
      eliminadosFonte: eliminados,
      ativos,
      usarDinamico: true,
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
  const parcial = getParcialRodada(rodadaAtual);
  const { eliminados, ativos } = calcularEliminadosDinamico(limite, parcial ? rodadaAtual : null, parcial);
  const lista = eliminados[rodadaAtual] || eliminados[String(rodadaAtual)] || [];
  return {
    eliminadosRodada: Array.isArray(lista) ? lista.map((id) => String(id)) : [],
    eliminadosFonte: eliminados,
    ativos,
    usarDinamico: true,
  };
}

function getAtivosAteRodada(rodadaLimite, eliminadosFonte) {
  const ativos = new Set(Object.keys(getFontePontuacoes()));
  for (let r = RODADA_INICIO; r <= rodadaLimite; r++) {
    const lista = eliminadosFonte[r] || eliminadosFonte[String(r)] || [];
    if (!Array.isArray(lista)) continue;
    lista.forEach((id) => ativos.delete(String(id)));
  }
  return ativos;
}

function getResultadoFinal(rodadaAtual) {
  if (rodadaAtual !== RODADA_FIM) return null;

  const eliminadosFonte = getFonteEliminados();
  let ativos = null;

  if (temEliminacaoManual(eliminadosFonte)) {
    ativos = getAtivosAteRodada(RODADA_FIM - 1, eliminadosFonte);
  } else {
    ativos = calcularEliminadosDinamico(RODADA_FIM - 1).ativos;
  }

  const pontuacoes = coletarPontuacoesRodada(rodadaAtual, ativos);
  if (pontuacoes.length < 2) return null;
  const todosZero = pontuacoes.every((item) => item.pontosRodada === 0);
  if (todosZero) return null;

  pontuacoes.sort((a, b) => {
    if (b.pontosRodada !== a.pontosRodada) return b.pontosRodada - a.pontosRodada;
    return b.totalTurno - a.totalTurno;
  });

  return {
    campeao: pontuacoes[0],
    vice: pontuacoes[1],
  };
}

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
  if (Number.isFinite(rodadaDados)) return Math.min(RODADA_FIM, Math.max(RODADA_INICIO, rodadaDados));
  const rodadasComPontuacao = getRodadasComPontuacao();
  return rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : RODADA_INICIO;
};

let rodadaAtual = getRodadaMaxExibicao();

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

  atualizarRodada(rodadaAtual);
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
  let { lista } = coletarPontuacoesExibicao(rodada);

  const eliminadosFonte = getFonteEliminados();
  if (temEliminacaoManual(eliminadosFonte)) {
    const ativos = getAtivosAteRodada(rodada - 1, eliminadosFonte);
    lista = lista.filter((item) => ativos.has(String(item.id)));
  } else {
    const ativos = calcularEliminadosDinamico(Math.min(rodada - 1, RODADA_FIM - 1)).ativos;
    lista = lista.filter((item) => ativos.has(String(item.id)));
  }

  lista.sort((a, b) => {
    if (b.pontosRodada !== a.pontosRodada) return b.pontosRodada - a.pontosRodada;
    return b.totalTurno - a.totalTurno;
  });

  const { eliminadosRodada } = getEliminadosRodada(rodada);
  const resultadoFinal = getResultadoFinal(rodada);

  lista.forEach((item, index) => {
    const escudo = escudoSrc(item.nome);
    const isEliminado = eliminadosRodada.includes(item.id);
    const isCampeao = resultadoFinal?.campeao?.id === item.id;
    const isVice = resultadoFinal?.vice?.id === item.id;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="time-info">
          <img src="${escudo}" class="escudo" alt="${item.nome}" />
          ${item.nome}
          ${isCampeao ? '<span class="campeao-tag">Campeao</span>' : ''}
          ${isVice ? '<span class="vice-tag">Vice-campeao</span>' : ''}
          ${(!isCampeao && !isVice && isEliminado) ? '<span class="eliminado-tag">Eliminado</span>' : ''}
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
  avisoContainer.classList.toggle("aviso-parcial", usandoParcial);

  const pontuacoesRodada = coletarPontuacoesExibicao(rodadaAtual).lista;
  const mapaPontuacoes = new Map(pontuacoesRodada.map((item) => [String(item.id), item]));
  const temPontuacao = pontuacoesRodada.some((item) => item.pontosRodada !== 0);
  if (pontuacoesRodada.length > 0 && !temPontuacao) {
    const mensagemAguardando = rodadaAtual === RODADA_INICIO
      ? "Aguardando inicio do campeonato"
      : "Aguardando confrontos da rodada";
    avisoContainer.innerHTML = `
      <strong>${mensagemAguardando}:</strong>
      todos os times estao com 0 pontos na rodada ${rodadaAtual}.
    `;
    return;
  }

  const resultadoFinal = getResultadoFinal(rodadaAtual);
  if (resultadoFinal) {
    avisoContainer.innerHTML = `
      <strong>Final da Rodada ${rodadaAtual}:</strong><br>
      Campeao: ${resultadoFinal.campeao.nome} (${resultadoFinal.campeao.pontosRodada.toFixed(2)} pts)<br>
      Vice-campeao: ${resultadoFinal.vice.nome} (${resultadoFinal.vice.pontosRodada.toFixed(2)} pts)
    `;
    return;
  }

  const { eliminadosRodada } = getEliminadosRodada(rodadaAtual);
  const avisoParcialHTML = usandoParcial ? `
    <strong>Rodada ${rodadaAtual} em andamento:</strong>
    pontuacoes parciais (nao definitivas).<br>
  ` : "";
  if (!Array.isArray(eliminadosRodada) || eliminadosRodada.length === 0) {
    avisoContainer.innerHTML = avisoParcialHTML;
    return;
  }

  const eliminadosDetalhe = eliminadosRodada.map((id) => {
    const key = String(id);
    const item = mapaPontuacoes.get(key);
    if (item) {
      return {
        nome: item.nome,
        pontosRodada: Number.isFinite(item.pontosRodada) ? item.pontosRodada : 0,
        totalTurno: Number.isFinite(item.totalTurno) ? item.totalTurno : 0,
      };
    }
    const row = getFontePontuacoes()?.[id] || {};
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
  const { lista: pontuacoesRodada } = coletarPontuacoesExibicao(rodadaAtual);
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

  const resultadoFinal = getResultadoFinal(rodadaAtual);
  if (resultadoFinal) {
    estatisticasHTML += `
      <h3>Final</h3>
      <ul>
        <li><strong>Campeao:</strong> ${resultadoFinal.campeao.nome} (${resultadoFinal.campeao.pontosRodada.toFixed(2)} pts)</li>
        <li><strong>Vice-campeao:</strong> ${resultadoFinal.vice.nome} (${resultadoFinal.vice.pontosRodada.toFixed(2)} pts)</li>
      </ul>
    `;
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
