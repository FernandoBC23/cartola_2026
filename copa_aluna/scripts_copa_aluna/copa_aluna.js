const LABEL_FASES = {
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semi: "Semifinal",
  final: "Final",
  terceiro: "Decisão do 3º Lugar",
};

const ESCUDO_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>" +
  "<rect width='64' height='64' rx='12' fill='%23e3e7e7'/>" +
  "<text x='32' y='36' text-anchor='middle' font-family='Arial' font-size='16' fill='%23636f6f'>TBD</text>" +
  "</svg>";

const FASES_POR_RODADA = {
  16: ["oitavas"],
  17: ["quartas"],
  18: ["semi"],
  19: ["final", "terceiro"],
};

const RODADA_COPA_MAXIMA = Math.max(...Object.keys(FASES_POR_RODADA).map(Number));

const DEFAULT_MATCH = () => ({
  casaId: null,
  foraId: null,
  casaPts: null,
  foraPts: null,
});

const CACHE_KEY = "copa_aluna_fases_cache";

const getCopaDados = () => window.copaDados || { times: [], fases: {} };

const normalizarNomeEscudo = (nome) =>
  String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();

let _escudosMap = null;

const getEscudosMap = () => {
  if (_escudosMap) return _escudosMap;
  const base = window.escudosTimes || {};
  _escudosMap = {};
  Object.keys(base).forEach((k) => {
    _escudosMap[normalizarNomeEscudo(k)] = base[k];
  });
  return _escudosMap;
};

const resolveEscudoArquivo = (nome) => {
  const direto = window.escudosTimes?.[nome];
  if (direto) return direto;
  const map = getEscudosMap();
  const norm = normalizarNomeEscudo(nome);
  if (map[norm]) return map[norm];
  return window.ESCUDO_PADRAO || "escudo_default.png";
};

const escudoSrc = (nome) => {
  const base = window.ESCUDOS_BASE_PATH || "../imagens/";
  const arquivo = resolveEscudoArquivo(nome);
  if (arquivo === "escudo_default.png") {
    return ESCUDO_PLACEHOLDER;
  }
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
};

const criarMapaTimes = (times) => {
  const map = {};
  times.forEach((time) => {
    if (!time || !time.id) return;
    map[String(time.id)] = time;
  });
  return map;
};

const normalizarMatch = (match) => ({
  casaId: match?.casaId ?? null,
  foraId: match?.foraId ?? null,
  casaPts: Number.isFinite(match?.casaPts) ? match.casaPts : null,
  foraPts: Number.isFinite(match?.foraPts) ? match.foraPts : null,
});

const matchTemPontuacao = (match) =>
  Number.isFinite(match?.casaPts) || Number.isFinite(match?.foraPts);

const carregarCacheFases = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const salvarCacheFases = (fases) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(fases));
  } catch {
    // ignore
  }
};

const mesclarFasesComCache = (fases) => {
  const cache = carregarCacheFases();
  if (!cache) return fases;
  const resultado = { ...fases };

  Object.keys(fases).forEach((fase) => {
    const atual = fases[fase] || [];
    const cached = cache[fase] || [];
    const temPontuacaoAtual = atual.some(matchTemPontuacao);
    const temPontuacaoCache = cached.some(matchTemPontuacao);
    if (!temPontuacaoAtual && temPontuacaoCache && cached.length === atual.length) {
      resultado[fase] = cached.map(normalizarMatch);
    }
  });

  return resultado;
};

const garantirLista = (lista, tamanho) => {
  const result = [];
  for (let i = 0; i < tamanho; i += 1) {
    result.push(normalizarMatch(lista?.[i] || DEFAULT_MATCH()));
  }
  return result;
};

const definirTimesPorResultado = (alvo, timesOrdenados) => {
  const copia = alvo.map((match) => ({ ...match }));
  for (let i = 0; i < copia.length; i += 1) {
    const casaIdx = i * 2;
    const foraIdx = i * 2 + 1;
    if (!copia[i].casaId && timesOrdenados[casaIdx]) {
      copia[i].casaId = timesOrdenados[casaIdx];
    }
    if (!copia[i].foraId && timesOrdenados[foraIdx]) {
      copia[i].foraId = timesOrdenados[foraIdx];
    }
  }
  return copia;
};

const getTurnoPts = (id, timesMap) => {
  const time = timesMap?.[String(id)];
  return Number.isFinite(time?.turnoPts) ? time.turnoPts : null;
};

const vencedorDoMatch = (match, timesMap) => {
  if (match.casaPts == null || match.foraPts == null) return null;
  if (match.casaPts !== match.foraPts) {
    return match.casaPts > match.foraPts ? match.casaId : match.foraId;
  }

  const casaTurno = getTurnoPts(match.casaId, timesMap);
  const foraTurno = getTurnoPts(match.foraId, timesMap);

  if (casaTurno == null || foraTurno == null || casaTurno === foraTurno) return null;
  return casaTurno > foraTurno ? match.casaId : match.foraId;
};

const perdedorDoMatch = (match, timesMap) => {
  if (match.casaPts == null || match.foraPts == null) return null;
  if (match.casaPts !== match.foraPts) {
    return match.casaPts > match.foraPts ? match.foraId : match.casaId;
  }

  const casaTurno = getTurnoPts(match.casaId, timesMap);
  const foraTurno = getTurnoPts(match.foraId, timesMap);

  if (casaTurno == null || foraTurno == null || casaTurno === foraTurno) return null;
  return casaTurno > foraTurno ? match.foraId : match.casaId;
};

const coletarVencedores = (lista, timesMap, participantesProxFase) =>
  lista
    .map((match) => {
      const direto = vencedorDoMatch(match, timesMap);
      if (direto) return direto;
      if (!participantesProxFase || !match) return null;
      if (participantesProxFase.has(match.casaId)) return match.casaId;
      if (participantesProxFase.has(match.foraId)) return match.foraId;
      return null;
    })
    .filter((id) => id);

const coletarPerdedores = (lista, timesMap, participantesProxFase) =>
  lista
    .map((match) => {
      const direto = perdedorDoMatch(match, timesMap);
      if (direto) return direto;
      if (!participantesProxFase || !match) return null;
      if (participantesProxFase.has(match.casaId)) return match.foraId;
      if (participantesProxFase.has(match.foraId)) return match.casaId;
      return null;
    })
    .filter((id) => id);

const aplicarParciaisNaFase = (lista, parciais) => {
  if (!Array.isArray(lista) || !parciais) return lista;
  return lista.map((match) => {
    const copia = { ...match };
    if (copia.casaId != null && !Number.isFinite(copia.casaPts)) {
      const val = parciais[String(copia.casaId)];
      if (Number.isFinite(val)) copia.casaPts = val;
    }
    if (copia.foraId != null && !Number.isFinite(copia.foraPts)) {
      const val = parciais[String(copia.foraId)];
      if (Number.isFinite(val)) copia.foraPts = val;
    }
    return copia;
  });
};

const construirFases = (timesMap) => {
  const dados = getCopaDados();
  const fases = mesclarFasesComCache(dados.fases || {});
  const pontuacoesPorFase =
    dados && typeof dados.pontuacoes_por_fase === "object" ? dados.pontuacoes_por_fase : null;
  const participantesPorFase = {};
  if (pontuacoesPorFase) {
    Object.keys(pontuacoesPorFase).forEach((faseKey) => {
      const mapa = pontuacoesPorFase[faseKey];
      if (mapa && typeof mapa === "object") {
        participantesPorFase[faseKey] = new Set(
          Object.keys(mapa).map((id) => Number(id)).filter((id) => Number.isFinite(id))
        );
      }
    });
  }

  let oitavas = garantirLista(fases.oitavas, 8);
  let quartas = garantirLista(fases.quartas, 4);
  let semi = garantirLista(fases.semi, 2);
  let final = garantirLista(fases.final, 1);
  let terceiro = garantirLista(fases.terceiro, 1);

  if (pontuacoesPorFase?.oitavas) {
    oitavas = aplicarParciaisNaFase(oitavas, pontuacoesPorFase.oitavas);
  }

  const winnersOitavas = coletarVencedores(oitavas, timesMap, participantesPorFase.quartas);

  if (winnersOitavas.length) {
    quartas = definirTimesPorResultado(quartas, winnersOitavas);
  }
  if (pontuacoesPorFase?.quartas) {
    quartas = aplicarParciaisNaFase(quartas, pontuacoesPorFase.quartas);
  }

  const winnersQuartas = coletarVencedores(quartas, timesMap, participantesPorFase.semi);

  if (winnersQuartas.length) {
    semi = definirTimesPorResultado(semi, winnersQuartas);
  }
  if (pontuacoesPorFase?.semi) {
    semi = aplicarParciaisNaFase(semi, pontuacoesPorFase.semi);
  }

  const winnersSemis = coletarVencedores(semi, timesMap, participantesPorFase.final);
  const losersSemis = coletarPerdedores(semi, timesMap, participantesPorFase.terceiro);

  if (winnersSemis.length) {
    final = definirTimesPorResultado(final, winnersSemis);
  }
  if (pontuacoesPorFase?.final) {
    final = aplicarParciaisNaFase(final, pontuacoesPorFase.final);
  }

  if (losersSemis.length) {
    terceiro = definirTimesPorResultado(terceiro, losersSemis);
  }
  const pontuacaoTerceiro = pontuacoesPorFase?.terceiro || pontuacoesPorFase?.final;
  if (pontuacaoTerceiro) {
    terceiro = aplicarParciaisNaFase(terceiro, pontuacaoTerceiro);
  }

  const fasesMontadas = { oitavas, quartas, semi, final, terceiro };
  const temQualquerPontuacao = Object.values(fasesMontadas).some(
    (lista) => Array.isArray(lista) && lista.some(matchTemPontuacao)
  );
  if (temQualquerPontuacao) {
    salvarCacheFases(fasesMontadas);
  }

  return fasesMontadas;
};

const formatarScore = (valor) => (Number.isFinite(valor) ? valor.toFixed(2) : "--");

const renderTeamRow = (time, score, status) => {
  const row = document.createElement("div");
  row.className = `team-row ${status || ""}`.trim();

  const meta = document.createElement("div");
  meta.className = "team-meta";

  const escudo = document.createElement("img");
  escudo.className = "team-escudo";
  escudo.alt = time?.nome || "Escudo";
  escudo.src = time?.nome ? escudoSrc(time.nome) : ESCUDO_PLACEHOLDER;

  const nome = document.createElement("span");
  nome.className = "team-name";
  nome.textContent = time?.nome || time?.label || "A definir";

  meta.appendChild(escudo);
  meta.appendChild(nome);

  const pontos = document.createElement("span");
  pontos.className = "team-score";
  pontos.textContent = formatarScore(score);

  row.appendChild(meta);
  row.appendChild(pontos);

  if (!time?.nome && !time?.label) {
    row.classList.add("placeholder");
  }

  return row;
};

const renderMatch = (match, timesMap, isSecondary = false) => {
  const container = document.createElement("div");
  container.className = `match${isSecondary ? " secondary" : ""}`;

  const casa = match.casaId ? timesMap[String(match.casaId)] : null;
  const fora = match.foraId ? timesMap[String(match.foraId)] : null;

  const winnerId = vencedorDoMatch(match, timesMap);
  const loserId = perdedorDoMatch(match, timesMap);

  const rowCasa = renderTeamRow(
    casa || { label: match.casaId ? `ID ${match.casaId}` : "A definir" },
    match.casaPts,
    winnerId && String(winnerId) === String(match.casaId)
      ? "winner"
      : loserId && String(loserId) === String(match.casaId)
        ? "loser"
        : ""
  );
  const rowFora = renderTeamRow(
    fora || { label: match.foraId ? `ID ${match.foraId}` : "A definir" },
    match.foraPts,
    winnerId && String(winnerId) === String(match.foraId)
      ? "winner"
      : loserId && String(loserId) === String(match.foraId)
        ? "loser"
        : ""
  );

  container.appendChild(rowCasa);
  container.appendChild(rowFora);
  return container;
};

const getPontuacoesParciais = (dados, meta) => {
  const rodadaMeta = Number.isFinite(meta?.rodada_copa) ? meta.rodada_copa : meta?.rodada;
  const copaParciais =
    typeof window !== "undefined" && window.copaParciais ? window.copaParciais : null;
  if (
    copaParciais &&
    Number.isFinite(copaParciais.rodada_copa ?? copaParciais.rodada) &&
    Number.isFinite(rodadaMeta) &&
    (copaParciais.rodada_copa ?? copaParciais.rodada) === rodadaMeta &&
    copaParciais.times &&
    typeof copaParciais.times === "object"
  ) {
    return copaParciais.times;
  }

  const mapa =
    (dados && typeof dados.pontuacoes_rodada === "object" && dados.pontuacoes_rodada) ||
    (dados && typeof dados.pontuacoesRodada === "object" && dados.pontuacoesRodada) ||
    null;
  if (mapa) return mapa;

  let payload = null;
  if (typeof pontuacaoParcialRodadaAtual !== "undefined") {
    payload = pontuacaoParcialRodadaAtual;
  } else if (typeof window !== "undefined" && window.pontuacaoParcialRodadaAtual) {
    payload = window.pontuacaoParcialRodadaAtual;
  }
  if (
    payload &&
    Number.isFinite(payload.rodada) &&
    Number.isFinite(rodadaMeta) &&
    payload.rodada === rodadaMeta &&
    typeof payload.times === "object" &&
    payload.times
  ) {
    return payload.times;
  }

  return null;
};

const garantirAvisoParcial = () => {
  const container = document.querySelector(".copa-container");
  const bracketWrap = document.querySelector(".copa-bracket-wrap");
  if (!container || !bracketWrap) return null;
  let aviso = document.getElementById("aviso-parcial-copa");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "aviso-parcial-copa";
    aviso.className = "aviso-parcial";
    aviso.style.display = "none";
    container.insertBefore(aviso, bracketWrap);
  }
  return aviso;
};

const getRodadaEmAndamento = (meta) => {
  const rodadaGlobal = window.rodada_atual ?? window.rodadaAtual;
  if (Number.isFinite(rodadaGlobal)) return rodadaGlobal;
  if (Number.isFinite(meta?.rodada_copa)) return meta.rodada_copa;
  if (Number.isFinite(meta?.rodada)) return meta.rodada;
  return null;
};

const getRodadaCopaEfetiva = (meta) => {
  const rodadaCopa = Number.isFinite(meta?.rodada_copa) ? meta.rodada_copa : meta?.rodada;
  if (!Number.isFinite(rodadaCopa)) return null;
  if (FASES_POR_RODADA[rodadaCopa]) return rodadaCopa;
  if (rodadaCopa > RODADA_COPA_MAXIMA) return RODADA_COPA_MAXIMA;
  return null;
};

const renderBracket = () => {
  const dados = getCopaDados();
  const timesMap = criarMapaTimes(dados.times || []);
  const fases = construirFases(timesMap);
  const meta = window.copaMeta || {};
  const rodadaCopa = getRodadaCopaEfetiva(meta);
  const fasesAtivas = Number.isFinite(rodadaCopa) ? FASES_POR_RODADA[rodadaCopa] || [] : [];
  const pontuacoesPorFase =
    dados && typeof dados.pontuacoes_por_fase === "object" ? dados.pontuacoes_por_fase : null;
  if (pontuacoesPorFase) {
    Object.keys(pontuacoesPorFase).forEach((faseKey) => {
      if (fases[faseKey]) {
        fases[faseKey] = aplicarParciaisNaFase(fases[faseKey], pontuacoesPorFase[faseKey]);
      }
    });
    if (fases.terceiro && pontuacoesPorFase.final && !pontuacoesPorFase.terceiro) {
      fases.terceiro = aplicarParciaisNaFase(fases.terceiro, pontuacoesPorFase.final);
    }
  }
  const parciais = meta.parcial_disponivel === true ? getPontuacoesParciais(dados, meta) : null;
  fasesAtivas.forEach((faseKey) => {
    if (parciais && fases[faseKey]) {
      fases[faseKey] = aplicarParciaisNaFase(fases[faseKey], parciais);
    }
  });
  const container = document.getElementById("copa-bracket");

  if (!container) return;
  container.innerHTML = "";

  const roundConfigs = [
    { key: "oitavas", title: LABEL_FASES.oitavas, matches: fases.oitavas },
    { key: "quartas", title: LABEL_FASES.quartas, matches: fases.quartas },
    { key: "semi", title: LABEL_FASES.semi, matches: fases.semi },
    { key: "final", title: LABEL_FASES.final, matches: fases.final },
    { key: "terceiro", title: LABEL_FASES.terceiro, matches: fases.terceiro },
  ];

  roundConfigs.forEach((round) => {
    const roundEl = document.createElement("div");
    roundEl.className = `round round-${round.key}`;

    const title = document.createElement("div");
    title.className = "round-title";
    title.textContent = round.title;
    roundEl.appendChild(title);

    round.matches.forEach((match) => {
      roundEl.appendChild(renderMatch(match, timesMap, round.key === "terceiro"));
    });

    container.appendChild(roundEl);
  });
};

const atualizarLinksNavegacao = (fase) => {
  document.querySelectorAll("[data-round-link]").forEach((link) => {
    link.classList.toggle("ativo", link.dataset.roundLink === fase);
  });
};

const atualizarFaseAtiva = (fase, { atualizarHash = true } = {}) => {
  const bracket = document.getElementById("copa-bracket");
  if (bracket) bracket.dataset.view = fase;

  atualizarLinksNavegacao(fase);

  if (atualizarHash) {
    const novoHash = `#${fase}`;
    if (window.location.hash !== novoHash) {
      history.replaceState(null, "", novoHash);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const avisoParcial = garantirAvisoParcial();
  const meta = window.copaMeta || {};
  const rodadaEmAndamento = getRodadaEmAndamento(meta);
  const rodadaCopaAtual = Number.isFinite(meta?.rodada_copa) ? meta.rodada_copa : meta?.rodada;
  const parcialAtiva = meta.parcial_disponivel === true && Number.isFinite(rodadaCopaAtual);
  const mostrarAviso =
    parcialAtiva && (!Number.isFinite(rodadaEmAndamento) || rodadaCopaAtual === rodadaEmAndamento);
  if (avisoParcial) {
    if (mostrarAviso) {
      const rodadaTxt = Number.isFinite(meta.rodada_copa)
        ? meta.rodada_copa
        : Number.isFinite(meta.rodada)
          ? meta.rodada
          : "";
      avisoParcial.textContent = `Rodada ${rodadaTxt} em andamento: pontuações parciais (não definitivas).`;
      avisoParcial.style.display = "block";
    } else {
      avisoParcial.style.display = "none";
    }
  }
  renderBracket();
  const hash = window.location.hash.replace("#", "");
  const rodadaCopa = getRodadaCopaEfetiva(meta);
  const fasesAtivas = Number.isFinite(rodadaCopa) ? FASES_POR_RODADA[rodadaCopa] || [] : [];
  const faseInicial = LABEL_FASES[hash] ? hash : fasesAtivas[0] || "oitavas";
  atualizarFaseAtiva(faseInicial, { atualizarHash: false });

  document.querySelectorAll("[data-round-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const fase = link.dataset.roundLink;
      if (!LABEL_FASES[fase]) return;
      atualizarFaseAtiva(fase);
    });
  });
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (LABEL_FASES[hash]) {
    atualizarFaseAtiva(hash, { atualizarHash: false });
  }
});
