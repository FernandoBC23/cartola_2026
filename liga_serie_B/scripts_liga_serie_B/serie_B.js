// scripts/serie_B.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {

    // ================================
    // Config do Turno (1º turno: 1..19)
    // ================================
    const TURNO_INICIO = 1;
    const TURNO_FIM    = 19;

    // Se você reaproveitar esse mesmo arquivo no 2º turno depois:
    // const TURNO_INICIO = 20;
    // const TURNO_FIM    = 38;

    // Offset para ajustar "Rodada X" (quando você estivesse usando UI 0-> real 1).
    // Aqui estamos trabalhando com rodada real (1..19), então offset fica 0 no 1º turno.
    const TURNO_OFFSET = TURNO_INICIO - 1;

    // RODADA_MAXIMA vem do dataset de confrontos, mas respeita o TURNO_FIM
    const RODADA_MAXIMA = (() => {
      try {
        const maxCsv = Math.max(...(confrontosFase1 || []).map(j => +j.rodada || 0));
        const maxDetectado = Number.isFinite(maxCsv) && maxCsv > 0 ? maxCsv : TURNO_FIM;
        return Math.min(maxDetectado, TURNO_FIM);
      } catch {
        return TURNO_FIM;
      }
    })();

    const painelGrupos = document.getElementById("painel-grupos");

    // ================================
    // Utilitários
    // ================================
    const formatPts = (n) => Number.isFinite(n) ? n.toFixed(2) : "0.00";

    // Escudos centralizados (usa scripts/escudos_times.js)
    function escudoSrc(nome) {
      const base = window.ESCUDOS_BASE_PATH || "../imagens/";
      const arquivo = window.escudosTimes?.[nome] || window.ESCUDO_PADRAO || "escudo_default.png";
      return base + arquivo;
    }

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

    const getPontuacoesMap = (() => {
      let cacheRef = null;
      let cacheNorm = null;
      return () => {
        const mapa = window.pontuacoesPorRodada || {};
        if (mapa !== cacheRef) {
          cacheRef = mapa;
          cacheNorm = new Map();
          Object.keys(mapa).forEach((k) => {
            const nk = normKey(k);
            if (nk && !cacheNorm.has(nk)) cacheNorm.set(nk, k);
          });
        }
        return { mapa, cacheNorm };
      };
    })();

    function getParcial(nomeTime, rodadaReal) {
      // rodadaReal = 1..19
      const col = `Rodada ${rodadaReal + TURNO_OFFSET}`;
      const { mapa, cacheNorm } = getPontuacoesMap();
      if (!mapa) return NaN;
      if (mapa[nomeTime] && mapa[nomeTime][col] !== undefined) {
        return toNum(mapa[nomeTime][col]);
      }
      const altKey = cacheNorm.get(normKey(nomeTime));
      return altKey ? toNum(mapa?.[altKey]?.[col]) : NaN;
    }

    function isParcial(rodadaReal) {
      const rodadaParcial = window.ligaSerieBMeta?.rodada_parcial;
      if (Number.isFinite(rodadaParcial)) {
        return rodadaReal === rodadaParcial;
      }
      if (window.ligaSerieBMeta?.parcial_disponivel) return true;

      const resultadosRodada = (resultadosFase1 || []).filter(r => +r.rodada === +rodadaReal);
      const temNulos = resultadosRodada.some(r =>
        !Number.isFinite(r?.mandante?.pontos) || !Number.isFinite(r?.visitante?.pontos)
      );
      if (temNulos) return true;

      const col = `Rodada ${rodadaReal + TURNO_OFFSET}`;
      const mapa = window.pontuacoesPorRodada || {};
      const times = Object.values(mapa);
      if (!times.length) return false;

      const vals = times.map(m => toNum(m?.[col]));
      const filled = vals.filter(Number.isFinite).length;

      return filled > 0 && filled < vals.length;
    }

    // ================================
    // Rodada inicial inteligente
    // - Maior rodada com final OU parcial dentro do intervalo do turno
    // ================================
    let rodadaAtual = (() => {
      // 1) Rodadas com resultado FINAL
      const finals = (resultadosFase1 || [])
        .filter(r => Number.isFinite(r?.mandante?.pontos) && Number.isFinite(r?.visitante?.pontos))
        .map(r => +r.rodada || 0)
        .filter(n => Number.isFinite(n) && n >= TURNO_INICIO && n <= RODADA_MAXIMA);

      const maxFinal = finals.length ? Math.max(...finals) : 0;

      // 2) Rodadas que existem em pontuacoesPorRodada (parcial / preenchida)
      const mapa = window.pontuacoesPorRodada || {};
      const cols = new Set();

      Object.values(mapa).forEach(m => {
        Object.keys(m || {}).forEach(k => {
          const n = parseInt((k || "").replace("Rodada ", ""), 10);
          if (
            Number.isFinite(n) &&
            n >= TURNO_INICIO &&
            n <= RODADA_MAXIMA
          ) {
            cols.add(n);
          }
        });
      });

      const maxParcial = cols.size ? Math.max(...cols) : 0;

      // 3) Chute final: maior entre final e parcial
      const guess = Math.max(maxFinal, maxParcial);

      // 4) Se nada ainda (pré rodada 1), começa em TURNO_INICIO
      return (
        Number.isFinite(guess) &&
        guess >= TURNO_INICIO &&
        guess <= RODADA_MAXIMA
      ) ? guess : TURNO_INICIO;
    })();

    // ================================
    // Renderização
    function getParticipantesSerieA() {
      // pega tanto window.X quanto identificador global X (const/let no top-level)
      const pick = (name) => {
        try {
          if (typeof window !== "undefined" && window[name]) return window[name];
        } catch (e) {}

        try {
          // tenta acessar identificador global sem ReferenceError
          return Function(`return (typeof ${name} !== "undefined") ? ${name} : undefined;`)();
        } catch (e) {
          return undefined;
        }
      };

      const fontes = [
        pick("participantesLigaSerieB"),
        pick("participantesLiga_serie_B"),
        pick("participantesLigaSerie_B"),
        pick("participantesLiga"),
        pick("participantesSerieA"),
        pick("participantes"),
      ];

      const nomes = [];
      const chaves = ["nome", "time", "Nome", "nome_time", "time_nome"];

      fontes.forEach((lista) => {
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

    function buildClassificacaoFallback(nomes) {
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
      return { "Série A": times };
    }

    function getClassificacaoFonte() {
      const fonte = (typeof classificacaoSerieB === "object" && classificacaoSerieB) ? classificacaoSerieB : null;
      const temTimes = fonte && Object.values(fonte).some((times) => Array.isArray(times) && times.length > 0);
      if (temTimes) return fonte;

      const nomes = getParticipantesSerieA();
      if (nomes.length > 0) return buildClassificacaoFallback(nomes);

      return { "Série A": [] };
    }
    // ================================
    function renderPainelCompleto(numeroRodada) {
      painelGrupos.innerHTML = "";

      const tituloBadge = "";
      const rodadaParcial = window.ligaSerieBMeta?.rodada_parcial;
      const usarAvisoParcial = Number.isFinite(rodadaParcial)
        ? (numeroRodada === rodadaParcial)
        : isParcial(numeroRodada);
      let avisoInserido = false;

      // --- agrupamento de confrontos por grupo ---
      const confrontosRodada = (confrontosFase1 || []).filter(j => +j.rodada === +numeroRodada);
      const resultadosRodadaFinal = (resultadosFase1 || []).filter(j => +j.rodada === +numeroRodada);

      const confrontosPorGrupo = {};
      confrontosRodada.forEach(j => {
        const g = j.grupo || "Série A";
        (confrontosPorGrupo[g] ||= []).push(j);
      });

      // --- cada grupo (tabela + confrontos) ---
      const classificacaoFonte = getClassificacaoFonte();
      Object.entries(classificacaoFonte).forEach(([grupo, times]) => {
        const linha = document.createElement("div");
        linha.className = "linha-grupo";

        // ===== coluna esquerda: classificação =====
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

        // navegação (topo da coluna esquerda)
        const navTop = document.createElement("div");
        navTop.className = "rodada-container";
        navTop.innerHTML = `
          <div class="navegacao-rodada">
            <button id="btn-anterior-top">◀️ Rodada Anterior</button>
            <div class="titulo-rodada" id="titulo-rodada-top">Rodada ${numeroRodada}${tituloBadge}</div>
            <button id="btn-proxima-top">Próxima Rodada ▶️</button>
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

        // ===== coluna direita: confrontos da rodada (com parciais) =====
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

            // resultado final (se existir para esta rodada)
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

            // escudos
            const t1 = document.createElement("div");
            t1.className = "time";
            t1.innerHTML = `<img src="${escudoSrc(mand)}" alt="${mand}">`;

            const t2 = document.createElement("div");
            t2.className = "time";
            t2.innerHTML = `<img src="${escudoSrc(visi)}" alt="${visi}">`;

            // placar
            const placar = document.createElement("div");
            placar.className = "placar";
            placar.innerHTML = `
              <span class="placar-numero">${formatPts(pMand)}</span>
              <span class="placar-x"> X </span>
              <span class="placar-numero">${formatPts(pVis)}</span>`;

            // status
            const resDiv = document.createElement("div");
            resDiv.className = "resultado";
            const span = document.createElement("span");
            span.className = "vencedor";

            if (!mandOk && !visOk) {
              span.textContent = "🕒 Aguardando Confronto";
              span.style.backgroundColor = "#ffc107";
              span.style.color = "#000";
            } else if (isParcial(numeroRodada)) {
              if (pMand > pVis) {
                span.textContent = `⏳ ${mand} está vencendo`;
              } else if (pMand < pVis) {
                span.textContent = `⏳ ${visi} está vencendo`;
              } else {
                span.textContent = "⏳ Parcial: empate";
              }
            } else if (Number.isFinite(final?.mandante?.pontos) && Number.isFinite(final?.visitante?.pontos)) {
              if (pMand > pVis) {
                span.textContent = `✅ ${mand} venceu`;
              } else if (pMand < pVis) {
                span.textContent = `✅ ${visi} venceu`;
              } else {
                span.textContent = "🤝 Empate";
              }
            } else if (pMand > pVis) {
              span.textContent = `✅ ${mand} venceu`;
            } else if (pMand < pVis) {
              span.textContent = `✅ ${visi} venceu`;
            } else {
              span.textContent = "🤝 Empate";
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

      // navegação (rodapé da página)
      const navBottom = document.createElement("div");
      navBottom.className = "rodada-container";
      navBottom.innerHTML = `
        <div class="navegacao-rodada">
          <button id="btn-anterior-bottom">◀️ Rodada Anterior</button>
          <div class="titulo-rodada" id="titulo-rodada-bottom">Rodada ${numeroRodada}${tituloBadge}</div>
          <button id="btn-proxima-bottom">Próxima Rodada ▶️</button>
        </div>`;
      painelGrupos.appendChild(navBottom);

      // === resumo da rodada (no padrão da Liga Eliminação) ===
      const grupoResumoKey = Object.keys(classificacaoFonte || {}).find(
        (k) => Array.isArray(classificacaoFonte?.[k]) && classificacaoFonte[k].length > 0
      );
      const timesResumo = grupoResumoKey ? classificacaoFonte[grupoResumoKey] : [];
      const usarParcialResumo = isParcial(numeroRodada);
      const mapaFinalRodada = new Map();

      if (!usarParcialResumo) {
        (resultadosFase1 || [])
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

      // listeners (1 por render)
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

    // bootstrap
    document.body.classList.add("loaded");
    atualizarRodada(rodadaAtual);
  });

})();


