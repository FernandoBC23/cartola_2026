// scripts/pontos_corridos.js
(function () {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {

    // ================================
    // Config do Turno (1? turno: 1..19)
    // ================================
    const TURNO_INICIO = 1;
    const TURNO_FIM    = 19;

    // Se voc? reaproveitar esse mesmo arquivo no 2? turno depois:
    // const TURNO_INICIO = 20;
    // const TURNO_FIM    = 38;

    // Offset para ajustar "Rodada X" (quando voc? estivesse usando UI 0-> real 1).
    // Aqui estamos trabalhando com rodada real (1..19), ent?o offset fica 0 no 1? turno.
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
    // Utilit?rios
    // ================================
    const formatPts = (n) => Number.isFinite(n) ? n.toFixed(2) : "?";

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

    function getParcial(nomeTime, rodadaReal) {
      // rodadaReal = 1..19
      const col = `Rodada ${rodadaReal + TURNO_OFFSET}`;
      const mapa = window.pontuacoesPorRodada || {};
      return toNum(mapa?.[nomeTime]?.[col]);
    }

    function isParcial(rodadaReal) {
      const col = `Rodada ${rodadaReal + TURNO_OFFSET}`;
      const mapa = window.pontuacoesPorRodada || {};

      const times = Object.values(mapa);
      if (!times.length) return false;

      const vals = times.map(m => toNum(m?.[col]));
      const filled = vals.filter(Number.isFinite).length;

      return filled > 0 && filled < vals.length;
    }

    function renderBannerParcial(container, rodadaReal) {
      if (!isParcial(rodadaReal)) return;

      const aviso = document.createElement("div");
      aviso.id = "aviso-parcial-rodada";
      aviso.className = "aviso-parcial";
      aviso.innerHTML = `
        <span style="font-size:1.1rem;margin-right:.5rem">â³</span>
        <strong>Rodada ${rodadaReal} em andamento:</strong>
        pontuações <strong>parciais</strong> — o resultado ainda não é definitivo.
      `;
      aviso.style.cssText = [
        "margin:0 0 16px 0",
        "padding:10px 14px",
        "background:#ffe7cc",
        "border:1px solid #ffcf91",
        "color:#4a2d00",
        "border-radius:10px",
        "font-weight:600"
      ].join(";");

      container.appendChild(aviso);
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

      // 4) Se nada ainda (pr? rodada 1), come?a em TURNO_INICIO
      return (
        Number.isFinite(guess) &&
        guess >= TURNO_INICIO &&
        guess <= RODADA_MAXIMA
      ) ? guess : TURNO_INICIO;
    })();

    // ================================
    // Renderiza??o
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
        pick("participantesLigaSerieA"),
        pick("participantesLiga_pontos_corridos"),
        pick("participantesLigaSerie_A"),
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
      return { "S?rie A": times };
    }

    function getClassificacaoFonte() {
      const fonte = (typeof classificacaoSerieA === "object" && classificacaoSerieA) ? classificacaoSerieA : null;
      const temTimes = fonte && Object.values(fonte).some((times) => Array.isArray(times) && times.length > 0);
      if (temTimes) return fonte;

      const nomes = getParticipantesSerieA();
      if (nomes.length > 0) return buildClassificacaoFallback(nomes);

      return { "S?rie A": [] };
    }
    // ================================
    function renderPainelCompleto(numeroRodada) {
      painelGrupos.innerHTML = "";

      // banner de rodada parcial (se aplic?vel)
      renderBannerParcial(painelGrupos, numeroRodada);

      const tituloBadge = isParcial(numeroRodada) ? " â€¢ PARCIAL" : "";

      // --- agrupamento de confrontos por grupo ---
      const confrontosRodada = (confrontosFase1 || []).filter(j => +j.rodada === +numeroRodada);
      const resultadosRodadaFinal = (resultadosFase1 || []).filter(j => +j.rodada === +numeroRodada);

      const confrontosPorGrupo = {};
      confrontosRodada.forEach(j => {
        const g = j.grupo || "S?rie A";
        (confrontosPorGrupo[g] ||= []).push(j);
      });

      // --- cada grupo (tabela + confrontos) ---
      const classificacaoFonte = getClassificacaoFonte();
      Object.entries(classificacaoFonte).forEach(([grupo, times]) => {
        const linha = document.createElement("div");
        linha.className = "linha-grupo";

        // ===== coluna esquerda: classifica??o =====
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

        // navega??o (topo da coluna esquerda)
        const navTop = document.createElement("div");
        navTop.className = "rodada-container";
        navTop.innerHTML = `
          <div class="navegacao-rodada">
            <button id="btn-anterior-top">◀️ Rodada Anterior</button>
            <div class="titulo-rodada" id="titulo-rodada-top">Rodada ${numeroRodada}${tituloBadge}</div>
            <button id="btn-proxima-top">Próxima Rodada ▶️</button>
          </div>`;
        colunaEsq.prepend(navTop);

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

            const pMand = Number.isFinite(final?.mandante?.pontos)
              ? final.mandante.pontos
              : getParcial(mand, numeroRodada);

            const pVis = Number.isFinite(final?.visitante?.pontos)
              ? final.visitante.pontos
              : getParcial(visi, numeroRodada);

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

            if (!Number.isFinite(pMand) || !Number.isFinite(pVis)) {
              span.textContent = "🕒 Aguardando Confronto";
              span.style.backgroundColor = "#ffc107";
              span.style.color = "#000";
            } else if (pMand > pVis) {
              span.textContent = `âœ… ${mand} venceu`;
            } else if (pMand < pVis) {
              span.textContent = `âœ… ${visi} venceu`;
            } else {
              span.textContent = "ðŸ¤ Empate";
            }

            if (isParcial(numeroRodada)) {
              const badge = document.createElement("div");
              badge.textContent = "PARCIAL";
              badge.style.cssText = "margin-top:4px;font-size:.8rem;opacity:.85;";
              resDiv.appendChild(badge);
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

      // navega??o (rodap? da p?gina)
      const navBottom = document.createElement("div");
      navBottom.className = "rodada-container";
      navBottom.innerHTML = `
        <div class="navegacao-rodada">
          <button id="btn-anterior-bottom">◀️ Rodada Anterior</button>
          <div class="titulo-rodada" id="titulo-rodada-bottom">Rodada ${numeroRodada}${tituloBadge}</div>
          <button id="btn-proxima-bottom">Próxima Rodada ▶️</button>
        </div>`;
      painelGrupos.appendChild(navBottom);

      // === resumo da rodada (usa final OU parcial) ===
      const jogosResumo = (confrontosFase1 || []).filter(j => +j.rodada === +numeroRodada);
      let maiorPontuacao = "", maiorTotal = -Infinity;
      let maiorDiferenca = "", difMax = -Infinity;
      let soma = 0, jogosValidos = 0;

      jogosResumo.forEach(j => {
        const mand = j.mandante?.nome, visi = j.visitante?.nome;

        const final = (resultadosFase1 || []).find(r =>
          +r.rodada === +numeroRodada &&
          r?.mandante?.nome === mand &&
          r?.visitante?.nome === visi
        );

        const a = Number.isFinite(final?.mandante?.pontos) ? final.mandante.pontos : getParcial(mand, numeroRodada);
        const b = Number.isFinite(final?.visitante?.pontos) ? final.visitante.pontos : getParcial(visi, numeroRodada);

        if (!Number.isFinite(a) || !Number.isFinite(b)) return;

        const tot = a + b;
        const dif = Math.abs(a - b);

        if (tot > maiorTotal) {
          maiorTotal = tot;
          maiorPontuacao = `${mand} ${formatPts(a)} x ${formatPts(b)} ${visi}`;
        }
        if (dif > difMax) {
          difMax = dif;
          maiorDiferenca = `${mand} ${formatPts(a)} x ${formatPts(b)} ${visi}`;
        }

        soma += tot;
        jogosValidos += 1;
      });

      const media = jogosValidos ? (soma / (jogosValidos * 2)).toFixed(2) : "-";
      const resumo = document.createElement("div");
      resumo.className = "resumo-rodada";
      resumo.innerHTML = `
        <h3>Resumo da Rodada ${numeroRodada}${tituloBadge}</h3>
        <ul>
          <li><strong>Maior pontuação total:</strong> ${maiorPontuacao || "Aguardando..."}</li>
          <li><strong>Vitória mais elástica:</strong> ${maiorDiferenca || "Aguardando..."}</li>
          <li><strong>Média de pontos por time:</strong> ${media}</li>
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



