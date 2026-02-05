// Base engine for Serie A/B/C and Pontos Corridos (same structure).
(function () {
  "use strict";

  function toNum(x) {
    if (typeof x === "number") return Number.isFinite(x) ? x : NaN;
    if (typeof x === "string" && x.trim() !== "") {
      const n = Number(x.replace(",", "."));
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  }

  function normKey(s) {
    if (!s) return "";
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function buildPontuacoesCache(mapa) {
    const cacheNorm = new Map();
    if (mapa && typeof mapa === "object") {
      Object.keys(mapa).forEach((k) => {
        const nk = normKey(k);
        if (nk && !cacheNorm.has(nk)) cacheNorm.set(nk, k);
      });
    }
    return { mapa: mapa || {}, cacheNorm };
  }

  function escudoSrc(nome) {
    const base = window.ESCUDOS_BASE_PATH || "../imagens/";
    const arquivo = window.escudosTimes?.[nome] || window.ESCUDO_PADRAO || "escudo_default.png";
    return base + arquivo;
  }

  function getParcialNome(nomeTime, rodadaReal, cfg) {
    const col = `Rodada ${rodadaReal + (cfg.turnoOffset || 0)}`;
    const { mapa, cacheNorm } = cfg.pontuacoesCache || buildPontuacoesCache(cfg.pontuacoesPorRodada);
    if (!mapa) return NaN;
    if (mapa[nomeTime] && mapa[nomeTime][col] !== undefined) {
      return toNum(mapa[nomeTime][col]);
    }
    const altKey = cacheNorm.get(normKey(nomeTime));
    return altKey ? toNum(mapa?.[altKey]?.[col]) : NaN;
  }

  function getRodadaEmAndamento(cfg) {
    const meta = cfg.meta || {};
    const metaRodada = meta.rodada_atual ?? meta.rodada_parcial ?? cfg.rodadaAtualGlobal;
    if (Number.isFinite(metaRodada)) return metaRodada;

    const rodadaParcialGlobal = Number.isFinite(cfg.parcialGlobal?.rodada)
      ? Number(cfg.parcialGlobal.rodada)
      : null;
    if (Number.isFinite(rodadaParcialGlobal)) return rodadaParcialGlobal;

    const inicio = cfg.turnoInicio || 1;
    const fim = cfg.rodadaMaxima || cfg.turnoFim || 38;
    const completos = (cfg.resultados || [])
      .filter(r => Number.isFinite(r?.mandante?.pontos) && Number.isFinite(r?.visitante?.pontos))
      .map(r => +r.rodada || 0)
      .filter(n => Number.isFinite(n) && n >= inicio && n <= fim);

    const maxFinal = completos.length ? Math.max(...completos) : 0;
    const guess = maxFinal + 1;
    if (guess >= inicio && guess <= fim) return guess;

    return inicio;
  }

  function isParcial(rodadaReal, cfg) {
    const meta = cfg.meta || {};
    const rodadaParcial = meta.rodada_parcial;
    if (Number.isFinite(rodadaParcial)) return rodadaReal === rodadaParcial;

    const rodadaParcialGlobal = Number.isFinite(cfg.parcialGlobal?.rodada)
      ? Number(cfg.parcialGlobal.rodada)
      : null;
    if (Number.isFinite(rodadaParcialGlobal)) return rodadaReal === rodadaParcialGlobal;

    const rodadaEmAndamento = getRodadaEmAndamento(cfg);
    if (meta.parcial_disponivel === true) {
      return Number.isFinite(rodadaEmAndamento) ? rodadaReal === rodadaEmAndamento : false;
    }
    if (Number.isFinite(rodadaEmAndamento) && rodadaReal !== rodadaEmAndamento) return false;

    const resultadosRodada = (cfg.resultados || []).filter(r => +r.rodada === +rodadaReal);
    const temAlgum = resultadosRodada.some(r =>
      Number.isFinite(r?.mandante?.pontos) || Number.isFinite(r?.visitante?.pontos)
    );
    const temNulos = resultadosRodada.some(r =>
      !Number.isFinite(r?.mandante?.pontos) || !Number.isFinite(r?.visitante?.pontos)
    );
    if (!temAlgum) return false;
    if (temNulos) return true;

    const col = `Rodada ${rodadaReal + (cfg.turnoOffset || 0)}`;
    const mapa = cfg.pontuacoesPorRodada || {};
    const times = Object.values(mapa);
    if (!times.length) return false;

    const vals = times.map(m => toNum(m?.[col]));
    const filled = vals.filter(Number.isFinite).length;
    return filled > 0 && filled < vals.length;
  }

  function pickGlobal(name) {
    try {
      if (typeof window !== "undefined" && window[name]) return window[name];
    } catch (e) {}
    try {
      return Function(`return (typeof ${name} !== "undefined") ? ${name} : undefined;`)();
    } catch (e) {
      return undefined;
    }
  }

  function getParticipantes(cfg) {
    const fontes = cfg.participantesFontes || [];
    const nomes = [];
    const chaves = ["nome", "time", "Nome", "nome_time", "time_nome"];

    fontes.forEach((fonte) => {
      const lista = (typeof fonte === "string") ? pickGlobal(fonte) : fonte;
      if (!Array.isArray(lista)) return;
      lista.forEach((item) => {
        if (typeof item === "string") {
          nomes.push(item);
          return;
        }
        if (item && typeof item === "object") {
          for (const k of chaves) {
            if (item[k]) {
              nomes.push(item[k]);
              return;
            }
          }
        }
      });
    });

    const limpos = nomes.map((n) => String(n).trim()).filter((n) => n.length > 0);
    return Array.from(new Set(limpos));
  }

  function buildClassificacaoFallback(nomes, grupoPadrao) {
    const times = (nomes || []).map((nome, idx) => ({
      posicao: idx + 1,
      nome,
      pontos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      totalCartola: 0,
      cartolaSofrido: 0,
      saldoCartola: 0,
    }));
    return { [grupoPadrao]: times };
  }

  function getClassificacaoFonte(cfg) {
    const fonte = (typeof cfg.classificacao === "object" && cfg.classificacao) ? cfg.classificacao : null;
    const temTimes = fonte && Object.values(fonte).some((times) => Array.isArray(times) && times.length > 0);
    if (temTimes) return fonte;

    const nomes = getParticipantes(cfg);
    if (nomes.length > 0) return buildClassificacaoFallback(nomes, cfg.grupoPadrao);

    return { [cfg.grupoPadrao]: [] };
  }

  function renderCompeticao(cfg) {
    const TURNO_INICIO = cfg.turnoInicio || 1;
    const TURNO_FIM = cfg.turnoFim || 19;
    const TURNO_OFFSET = TURNO_INICIO - 1;

    const RODADA_MAXIMA = (() => {
      try {
        const maxCsv = Math.max(...(cfg.confrontos || []).map(j => +j.rodada || 0));
        const maxDetectado = Number.isFinite(maxCsv) && maxCsv > 0 ? maxCsv : TURNO_FIM;
        return Math.min(maxDetectado, TURNO_FIM);
      } catch {
        return TURNO_FIM;
      }
    })();

    const painelGrupos = document.getElementById(cfg.painelId || "painel-grupos");
    if (!painelGrupos) return;

    const formatPts = (n) => Number.isFinite(n) ? n.toFixed(2) : "0.00";

    const getPontuacoesMap = (() => {
      let cacheRef = null;
      let cacheNorm = null;
      return () => {
        const mapa = cfg.pontuacoesPorRodada || {};
        if (mapa !== cacheRef) {
          cacheRef = mapa;
          const built = buildPontuacoesCache(mapa);
          cacheNorm = built.cacheNorm;
        }
        return { mapa, cacheNorm };
      };
    })();

    function getParcial(nomeTime, rodadaReal) {
      return getParcialNome(nomeTime, rodadaReal, {
        turnoOffset: TURNO_OFFSET,
        pontuacoesPorRodada: cfg.pontuacoesPorRodada,
        pontuacoesCache: getPontuacoesMap(),
      });
    }

    function getRodadaAtual() {
      return getRodadaEmAndamento({
        meta: cfg.meta,
        rodadaAtualGlobal: cfg.rodadaAtualGlobal,
        parcialGlobal: cfg.parcialGlobal,
        turnoInicio: TURNO_INICIO,
        turnoFim: TURNO_FIM,
        turnoOffset: TURNO_OFFSET,
        rodadaMaxima: RODADA_MAXIMA,
        resultados: cfg.resultados,
      });
    }

    function rodadaEhParcial(rodadaReal) {
      return isParcial(rodadaReal, {
        meta: cfg.meta,
        rodadaAtualGlobal: cfg.rodadaAtualGlobal,
        parcialGlobal: cfg.parcialGlobal,
        turnoInicio: TURNO_INICIO,
        turnoFim: TURNO_FIM,
        turnoOffset: TURNO_OFFSET,
        rodadaMaxima: RODADA_MAXIMA,
        resultados: cfg.resultados,
        pontuacoesPorRodada: cfg.pontuacoesPorRodada,
      });
    }

    let rodadaAtual = (() => {
      const rodadaAtualMeta = getRodadaAtual();
      if (Number.isFinite(rodadaAtualMeta)) {
        return Math.min(Math.max(rodadaAtualMeta, TURNO_INICIO), RODADA_MAXIMA);
      }
      return TURNO_INICIO;
    })();

    function renderPainelCompleto(numeroRodada) {
      painelGrupos.innerHTML = "";

      const tituloBadge = "";
      const rodadaParcial = cfg.meta?.rodada_parcial;
      const usarAvisoParcial = Number.isFinite(rodadaParcial)
        ? (numeroRodada === rodadaParcial)
        : rodadaEhParcial(numeroRodada);
      let avisoInserido = false;

      const confrontosRodada = (cfg.confrontos || []).filter(j => +j.rodada === +numeroRodada);
      const resultadosRodadaFinal = (cfg.resultados || []).filter(j => +j.rodada === +numeroRodada);

      const confrontosPorGrupo = {};
      confrontosRodada.forEach(j => {
        const g = j.grupo || cfg.grupoPadrao;
        (confrontosPorGrupo[g] ||= []).push(j);
      });

      const classificacaoFonte = getClassificacaoFonte(cfg);
      Object.entries(classificacaoFonte).forEach(([grupo, times]) => {
        const linha = document.createElement("div");
        linha.className = "linha-grupo";

        const colunaEsq = document.createElement("div");
        colunaEsq.className = "coluna-esquerda";

        const grupoDiv = document.createElement("div");
        grupoDiv.className = "tabela-grupo";

        const tabela = document.createElement("table");
        tabela.className = "tabela-classificacao";
        tabela.innerHTML = `
          <thead>
            <tr>
              <th>Pos.</th><th>Time</th><th>Pts</th><th>J</th>
              <th>V</th><th>E</th><th>D</th><th>Total</th>
            </tr>
          </thead>`;

        const tbody = document.createElement("tbody");

        if (!times || times.length === 0) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>-</td>
            <td><div class="time-info">Aguardando participantes...</div></td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0.00</td>`;
          tbody.appendChild(tr);
        }

        (times || []).forEach((time, idx) => {
          const tr = document.createElement("tr");
          if (idx <= 1) tr.classList.add("lider-grupo");
          tr.innerHTML = `
            <td>${time.posicao}</td>
            <td><div class="time-info">
              <img src="${escudoSrc(time.nome)}" class="escudo" alt="${time.nome}">
              ${time.nome}
            </div></td>
            <td>${time.pontos}</td>
            <td>${time.vitorias + time.empates + time.derrotas}</td>
            <td>${time.vitorias}</td>
            <td>${time.empates}</td>
            <td>${time.derrotas}</td>
            <td>${Number(time.totalCartola || 0).toFixed(2)}</td>`;
          tbody.appendChild(tr);
        });

        tabela.appendChild(tbody);
        grupoDiv.appendChild(tabela);
        colunaEsq.appendChild(grupoDiv);

        const navTop = document.createElement("div");
        navTop.className = "rodada-container";
        navTop.innerHTML = `
          <div class="navegacao-rodada">
            <button id="btn-anterior-top">&#9664; Rodada Anterior</button>
            <div class="titulo-rodada" id="titulo-rodada-top">Rodada ${numeroRodada}${tituloBadge}</div>
            <button id="btn-proxima-top">Próxima Rodada &#9654;</button>
          </div>`;
        colunaEsq.prepend(navTop);

        if (usarAvisoParcial && !avisoInserido) {
          const aviso = document.createElement("div");
          aviso.id = "aviso-parcial-rodada";
          aviso.className = "aviso-parcial";
          const rodadaAviso = Number.isFinite(rodadaParcial) ? rodadaParcial : numeroRodada;
          aviso.textContent = `Rodada ${rodadaAviso} em andamento: pontuacoes parciais (nao definitivas).`;
          colunaEsq.insertBefore(aviso, navTop.nextSibling);
          avisoInserido = true;
        }

        const colunaDir = document.createElement("div");
        colunaDir.className = "coluna-direita";

        if (confrontosPorGrupo[grupo]) {
          const grupoConfrontos = document.createElement("div");
          grupoConfrontos.className = "grupo-confronto";

          confrontosPorGrupo[grupo].forEach(jogo => {
            const jDiv = document.createElement("div");
            jDiv.className = "jogo";

            const mand = jogo.mandante?.nome;
            const visi = jogo.visitante?.nome;

            const final = resultadosRodadaFinal.find(r =>
              r?.mandante?.nome === mand && r?.visitante?.nome === visi
            );

            const pMandRaw = Number.isFinite(final?.mandante?.pontos)
              ? final.mandante.pontos
              : getParcial(mand, numeroRodada);

            const pVisRaw = Number.isFinite(final?.visitante?.pontos)
              ? final.visitante.pontos
              : getParcial(visi, numeroRodada);

            const mandOk = Number.isFinite(pMandRaw);
            const visOk = Number.isFinite(pVisRaw);
            const pMand = mandOk ? pMandRaw : 0;
            const pVis = visOk ? pVisRaw : 0;

            const t1 = document.createElement("div");
            t1.className = "time";
            t1.innerHTML = `<img src="${escudoSrc(mand)}" alt="${mand}">`;

            const t2 = document.createElement("div");
            t2.className = "time";
            t2.innerHTML = `<img src="${escudoSrc(visi)}" alt="${visi}">`;

            const placar = document.createElement("div");
            placar.className = "placar";
            placar.innerHTML = `
              <span class="placar-numero">${formatPts(pMand)}</span>
              <span class="placar-x"> X </span>
              <span class="placar-numero">${formatPts(pVis)}</span>`;

            const resDiv = document.createElement("div");
            resDiv.className = "resultado";
            const span = document.createElement("span");
            span.className = "vencedor";

            if (!mandOk && !visOk) {
              span.innerHTML = "&#9203; Aguardando Confronto";
              span.style.backgroundColor = "#ffc107";
              span.style.color = "#000";
            } else if (rodadaEhParcial(numeroRodada)) {
              if (pMand > pVis) {
                span.innerHTML = `&#9203; ${mand} está vencendo`;
              } else if (pMand < pVis) {
                span.innerHTML = `&#9203; ${visi} está vencendo`;
              } else {
                span.innerHTML = "&#9203; Parcial: empate";
              }
            } else if (Number.isFinite(final?.mandante?.pontos) && Number.isFinite(final?.visitante?.pontos)) {
              if (pMand > pVis) {
                span.innerHTML = `&#9989; ${mand} venceu`;
              } else if (pMand < pVis) {
                span.innerHTML = `&#9989; ${visi} venceu`;
              } else {
                span.innerHTML = "&#129309; Empate";
              }
            } else if (pMand > pVis) {
              span.innerHTML = `&#9989; ${mand} venceu`;
            } else if (pMand < pVis) {
              span.innerHTML = `&#9989; ${visi} venceu`;
            } else {
              span.innerHTML = "&#129309; Empate";
            }

            jDiv.appendChild(t1);
            jDiv.appendChild(placar);
            jDiv.appendChild(t2);
            resDiv.appendChild(span);

            grupoConfrontos.appendChild(jDiv);
            grupoConfrontos.appendChild(resDiv);
          });

          const separador = document.createElement("div");
          separador.className = "separador-grupo";
          grupoConfrontos.appendChild(separador);
          colunaDir.appendChild(grupoConfrontos);
        }

        linha.appendChild(colunaEsq);
        linha.appendChild(colunaDir);
        painelGrupos.appendChild(linha);
      });

      const navBottom = document.createElement("div");
      navBottom.className = "rodada-container";
      navBottom.innerHTML = `
        <div class="navegacao-rodada">
          <button id="btn-anterior-bottom">&#9664; Rodada Anterior</button>
          <div class="titulo-rodada" id="titulo-rodada-bottom">Rodada ${numeroRodada}${tituloBadge}</div>
          <button id="btn-proxima-bottom">Próxima Rodada &#9654;</button>
        </div>`;
      painelGrupos.appendChild(navBottom);

      const grupoResumoKey = Object.keys(classificacaoFonte || {}).find(
        (k) => Array.isArray(classificacaoFonte?.[k]) && classificacaoFonte[k].length > 0
      );
      const timesResumo = grupoResumoKey ? classificacaoFonte[grupoResumoKey] : [];
      const usarParcialResumo = rodadaEhParcial(numeroRodada);
      const mapaFinalRodada = new Map();

      if (!usarParcialResumo) {
        (cfg.resultados || [])
          .filter(r => +r.rodada === +numeroRodada)
          .forEach(r => {
            if (Number.isFinite(r?.mandante?.pontos)) {
              mapaFinalRodada.set(r.mandante.nome, r.mandante.pontos);
            }
            if (Number.isFinite(r?.visitante?.pontos)) {
              mapaFinalRodada.set(r.visitante.nome, r.visitante.pontos);
            }
          });
      }

      let maiorTime = null;
      let menorTime = null;
      let soma = 0;
      let count = 0;

      timesResumo.forEach(t => {
        const nome = t?.nome;
        const raw = usarParcialResumo
          ? getParcial(nome, numeroRodada)
          : (mapaFinalRodada.has(nome) ? mapaFinalRodada.get(nome) : getParcial(nome, numeroRodada));
        const pts = Number.isFinite(raw) ? raw : 0;
        if (!maiorTime || pts > maiorTime.pts) maiorTime = { nome, pts };
        if (!menorTime || pts < menorTime.pts) menorTime = { nome, pts };
        soma += pts;
        count += 1;
      });

      const media = count ? (soma / count).toFixed(2) : "-";
      const resumo = document.createElement("div");
      resumo.className = "resumo-rodada";
      resumo.innerHTML = `
        <h3>Resumo da Rodada ${numeroRodada}${tituloBadge}</h3>
        <ul>
          <li><strong>Maior pontuacao:</strong> ${maiorTime ? `${maiorTime.nome} (${formatPts(maiorTime.pts)} pts)` : "Aguardando..."}</li>
          <li><strong>Menor pontuacao:</strong> ${menorTime ? `${menorTime.nome} (${formatPts(menorTime.pts)} pts)` : "Aguardando..."}</li>
          <li><strong>Media geral:</strong> ${media}</li>
        </ul>`;
      painelGrupos.appendChild(resumo);

      const btAT = document.getElementById("btn-anterior-top");
      const btPT = document.getElementById("btn-proxima-top");
      const btAB = document.getElementById("btn-anterior-bottom");
      const btPB = document.getElementById("btn-proxima-bottom");

      const go = (delta) => {
        const nova = Math.min(Math.max(numeroRodada + delta, TURNO_INICIO), RODADA_MAXIMA);
        if (nova !== numeroRodada) atualizarRodada(nova);
      };

      btAT && btAT.addEventListener("click", () => go(-1));
      btPT && btPT.addEventListener("click", () => go(+1));
      btAB && btAB.addEventListener("click", () => go(-1));
      btPB && btPB.addEventListener("click", () => go(+1));

      [btAT, btAB].forEach(b => b && (b.disabled = numeroRodada <= TURNO_INICIO));
      [btPT, btPB].forEach(b => b && (b.disabled = numeroRodada >= RODADA_MAXIMA));
    }

    function atualizarRodada(n) {
      renderPainelCompleto(n);
    }

    document.body.classList.add("loaded");
    atualizarRodada(rodadaAtual);
  }

  window.renderCompeticao = renderCompeticao;
})();
