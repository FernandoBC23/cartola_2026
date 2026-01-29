// copa.js

const LABEL_FASES = {
  primeira_fase: "Primeira Fase",
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semi: "Semifinal",
  final: "Final",
  terceiro: "Decisao do 3o Lugar",
};

const ESCUDO_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>" +
  "<rect width='64' height='64' rx='12' fill='%23e3e7e7'/>" +
  "<text x='32' y='36' text-anchor='middle' font-family='Arial' font-size='16' fill='%23636f6f'>TBD</text>" +
  "</svg>";

const DEFAULT_MATCH = () => ({
  casaId: null,
  foraId: null,
  casaPts: null,
  foraPts: null,
});

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

const coletarVencedores = (lista, timesMap) =>
  lista.map((match) => vencedorDoMatch(match, timesMap)).filter((id) => id);

const coletarPerdedores = (lista, timesMap) =>
  lista.map((match) => perdedorDoMatch(match, timesMap)).filter((id) => id);

const construirFases = (timesMap) => {
  const dados = getCopaDados();
  const fases = dados.fases || {};

  const primeiraFase = garantirLista(fases.primeira_fase, 16);
  const oitavas = garantirLista(fases.oitavas, 8);
  let quartas = garantirLista(fases.quartas, 4);
  let semi = garantirLista(fases.semi, 2);
  let final = garantirLista(fases.final, 1);
  let terceiro = garantirLista(fases.terceiro, 1);

  const winnersPrimeira = coletarVencedores(primeiraFase, timesMap);
  const winnersOitavas = coletarVencedores(oitavas, timesMap);
  const winnersQuartas = coletarVencedores(quartas, timesMap);
  const winnersSemis = coletarVencedores(semi, timesMap);
  const losersSemis = coletarPerdedores(semi, timesMap);

  if (winnersPrimeira.length) {
    const oitavasDefinidas = definirTimesPorResultado(oitavas, winnersPrimeira);
    for (let i = 0; i < oitavas.length; i += 1) {
      oitavas[i] = oitavasDefinidas[i];
    }
  }
  if (winnersOitavas.length) {
    quartas = definirTimesPorResultado(quartas, winnersOitavas);
  }
  if (winnersQuartas.length) {
    semi = definirTimesPorResultado(semi, winnersQuartas);
  }
  if (winnersSemis.length) {
    final = definirTimesPorResultado(final, winnersSemis);
  }
  if (losersSemis.length) {
    terceiro = definirTimesPorResultado(terceiro, losersSemis);
  }

  return { primeiraFase, oitavas, quartas, semi, final, terceiro };
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

const renderBracket = () => {
  const dados = getCopaDados();
  const timesMap = criarMapaTimes(dados.times || []);
  const fases = construirFases(timesMap);
  const container = document.getElementById("copa-bracket");

  if (!container) return;
  container.innerHTML = "";

  const roundConfigs = [
    { key: "primeira_fase", title: LABEL_FASES.primeira_fase, matches: fases.primeiraFase },
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
  const parcialAtiva = meta.parcial_disponivel === true;
  if (avisoParcial) {
    if (parcialAtiva) {
      const rodadaTxt = Number.isFinite(meta.rodada) ? meta.rodada : "";
      avisoParcial.textContent = `Rodada ${rodadaTxt} em andamento: pontuacoes parciais (nao definitivas).`;
      avisoParcial.style.display = "block";
    } else {
      avisoParcial.style.display = "none";
    }
  }
  renderBracket();
  const hash = window.location.hash.replace("#", "");
  const faseInicial = LABEL_FASES[hash] ? hash : "primeira_fase";
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
