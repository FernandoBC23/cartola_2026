// scripts/4_fase_final_sula.js

const classificacaoFinalSulaData = (() => {
  if (typeof classificacao_final_sula !== "undefined") return classificacao_final_sula;
  const classificados = typeof classificadosFase3 !== "undefined" ? classificadosFase3 : [];
  const perdedores = typeof perdedoresFase3 !== "undefined" ? perdedoresFase3 : [];
  const montarTabela = itens => itens.map((time, index) => ({
    posicao: index + 1,
    nome: time.nome,
    pontos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    totalCartola: 0
  }));

  const fallback = {};
  if (classificados.length >= 2) {
    fallback["Final"] = montarTabela([
      { id: classificados[0].classificado_id, nome: classificados[0].classificado_nome },
      { id: classificados[1].classificado_id, nome: classificados[1].classificado_nome }
    ]);
  }
  if (perdedores.length >= 2) {
    fallback["Decisão 3º Lugar"] = montarTabela([
      { id: perdedores[0].perdedor_id, nome: perdedores[0].perdedor_nome },
      { id: perdedores[1].perdedor_id, nome: perdedores[1].perdedor_nome }
    ]);
  }
  return fallback;
})();

const confrontosFinalSulaData = (() => {
  if (typeof confrontos_final_sula !== "undefined") return confrontos_final_sula;
  const classificados = typeof classificadosFase3 !== "undefined" ? classificadosFase3 : [];
  const perdedores = typeof perdedoresFase3 !== "undefined" ? perdedoresFase3 : [];
  const fallback = [];

  if (classificados.length >= 2) {
    fallback.push({
      jogo: "Final",
      rodada: 19,
      mandante: { id: classificados[0].classificado_id, nome: classificados[0].classificado_nome },
      visitante: { id: classificados[1].classificado_id, nome: classificados[1].classificado_nome }
    });
  }

  if (perdedores.length >= 2) {
    fallback.push({
      jogo: "Decisão 3º Lugar",
      rodada: 19,
      mandante: { id: perdedores[0].perdedor_id, nome: perdedores[0].perdedor_nome },
      visitante: { id: perdedores[1].perdedor_id, nome: perdedores[1].perdedor_nome }
    });
  }

  return fallback;
})();

const resultadosFinalSulaData = typeof resultados_final_sula !== "undefined" ? resultados_final_sula : [];

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const RODADA_MINIMA = 19;
  const RODADA_MAXIMA = 19;

  let rodadaAtual = (() => {
    const rodadasComPontuacao = resultadosFinalSulaData
      .filter(r =>
        r.mandante?.pontos != null &&
        r.visitante?.pontos != null &&
        (r.mandante.pontos > 0 || r.visitante.pontos > 0)
      )
      .map(r => r.rodada)
      .filter(r => r >= RODADA_MINIMA && r <= RODADA_MAXIMA);

    const rodadaDetectada = rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : RODADA_MINIMA;
    return Math.min(Math.max(rodadaDetectada, RODADA_MINIMA), RODADA_MAXIMA);
  })();

  const painelGrupos = document.getElementById("painel-sula-final");
  const aviso = document.getElementById("aviso-sula");
  const hasTimes = (() => {
    try {
      return Object.keys(classificacaoFinalSulaData || {}).length > 0;
    } catch {
      return false;
    }
  })();
  const hasConfrontos = Array.isArray(confrontosFinalSulaData) && confrontosFinalSulaData.length > 0;
  const temDados = hasTimes || hasConfrontos;

  if (!temDados) {
    if (aviso) aviso.style.display = "block";
    if (painelGrupos) painelGrupos.style.display = "none";
    return;
  }

  if (aviso) aviso.style.display = "none";
  if (painelGrupos) painelGrupos.style.display = "";

  function escudoSrc(nome) {
    const base = window.ESCUDOS_BASE_PATH || "../imagens/";
    const arquivo = window.escudosTimes?.[nome] || window.ESCUDO_PADRAO || "escudo_default.png";
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

  const clubesTimes = {
    "Rolo Compressor ZN": "CBB",
    "Fedato Futebol Clube": "EST",
    "SUPER VASCÃO F.C": "UCH",
    "seralex": "BOT",
    "lsauer fc": "BSC",
    "FBC Colorado": "IDV",
    "MauHumor F.C.": "UNI",
    "Analove10 ITAQUI GRANDE!!": "RIV",
    "Pity10": "CCO",
    "SERGRILLO": "LDU",
    "Paulo Virgili FC": "TAC",
    "Gig@ntte": "FLA",
    "cartola scheuer": "ALI",
    "KillerColorado": "LIB",
    "pura bucha /botafogo": "TAL",
    "Super Vasco f.c": "SAO",
    "Laranjja Mecannica": "BUC",
    "Texas Club 2025": "COL",
    "Gremiomaniasm": "FOR",
    "Dom Camillo68": "RAC",
    "FC Los Castilho": "BAH",
    "Noah A 10": "INT",
    "Real SCI": "ATN",
    "Lá do Itaqui": "NAC",
    "teves_futsal20 f.c": "CCP",
    "S.E.R. GRILLO": "BOL",
    "KING LEONN": "SCR",
    "Tatols Beants F.C": "PAL",
    "RHANKA DENTY FC25": "SAB",
    "A Lenda Super Vasco F.c": "OLI",
    "TEAM LOPES 99": "VEL",
    "BORGES ITAQUI F.C.": "PEN"
  };

  function renderPainelCompleto(numeroRodada) {
    painelGrupos.innerHTML = "";

    const confrontosRodada = confrontosFinalSulaData.filter(j => j.rodada === numeroRodada);
    const resultadosRodada = resultadosFinalSulaData.filter(j => j.rodada === numeroRodada);

    const confrontosPorGrupo = {};
    confrontosRodada.forEach(jogo => {
      const grupo = jogo.jogo || "Outros";
      if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
      confrontosPorGrupo[grupo].push(jogo);
    });

    Object.entries(classificacaoFinalSulaData).forEach(([grupo, times]) => {
      const linha = document.createElement("div");
      linha.className = "linha-grupo";

      const colunaEsquerda = document.createElement("div");
      colunaEsquerda.className = "coluna-esquerda";

      const grupoDiv = document.createElement("div");
      grupoDiv.className = "tabela-grupo";

      const titulo = document.createElement("div");
      titulo.className = "titulo-grupo";
      titulo.textContent = grupo;
      grupoDiv.appendChild(titulo);

      const tabela = document.createElement("table");
      tabela.className = "tabela-classificacao";
      tabela.innerHTML = `
        <thead>
          <tr>
            <th>Pos</th>
            <th>Time</th>
            <th>Pts</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>Total</th>
          </tr>
        </thead>
      `;
      const tbody = document.createElement("tbody");

      times.forEach((time, index) => {
        const tr = document.createElement("tr");
        if (index === 0 || index === 1) tr.classList.add("lider-grupo");

        tr.innerHTML = `
          <td>${time.posicao}</td>
          <td>
            <div class="time-info">
              <img src="${escudoSrc(time.nome)}" class="escudo" alt="${time.nome}">
              <span class="tag-clube">${clubesTimes[time.nome] || ""}</span>
              ${time.nome}
            </div>
          </td>
          <td>${time.pontos}</td>
          <td>${time.vitorias + time.empates + time.derrotas}</td>
          <td>${time.vitorias}</td>
          <td>${time.empates}</td>
          <td>${time.derrotas}</td>
          <td>${Number(time.totalCartola || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });

      tabela.appendChild(tbody);
      grupoDiv.appendChild(tabela);
      colunaEsquerda.appendChild(grupoDiv);

      const colunaDireita = document.createElement("div");
      colunaDireita.className = "coluna-direita";

      if (confrontosPorGrupo[grupo]) {
        const grupoConfrontos = document.createElement("div");
        grupoConfrontos.className = "grupo-confronto";

        confrontosPorGrupo[grupo].forEach(jogo => {
          const jogoDiv = document.createElement("div");
          jogoDiv.className = "jogo";

          const time1 = document.createElement("div");
          time1.className = "time";
          time1.innerHTML = `
            <img src="${escudoSrc(jogo.mandante.nome)}" alt="${jogo.mandante.nome}">
            <span class="tag-escudo">${clubesTimes[jogo.mandante.nome] || ""}</span>
          `;

          const time2 = document.createElement("div");
          time2.className = "time";
          time2.innerHTML = `
            <span class="tag-escudo">${clubesTimes[jogo.visitante.nome] || ""}</span>
            <img src="${escudoSrc(jogo.visitante.nome)}" alt="${jogo.visitante.nome}">
          `;

          const resultado = resultadosRodada.find(
            r =>
              r.mandante.nome === jogo.mandante.nome &&
              r.visitante.nome === jogo.visitante.nome
          );

          const p1Raw = resultado?.mandante?.pontos;
          const p2Raw = resultado?.visitante?.pontos;
          const p1Num = Number(p1Raw);
          const p2Num = Number(p2Raw);
          const temPontos = Number.isFinite(p1Num) && Number.isFinite(p2Num) && (p1Num + p2Num) > 0;
          const p1 = temPontos ? p1Num.toFixed(2) : "0.00";
          const p2 = temPontos ? p2Num.toFixed(2) : "0.00";

          const placar = document.createElement("div");
          placar.className = "placar";
          placar.innerHTML = `
            <span class="placar-numero">${p1}</span>
            <span class="placar-x"> X </span>
            <span class="placar-numero">${p2}</span>
          `;

          const resultadoDiv = document.createElement("div");
          resultadoDiv.className = "resultado";
          const span = document.createElement("span");
          span.className = "vencedor";

          if (!resultado || !temPontos) {
            span.textContent = "🕒 Aguardando Confronto";
            span.style.backgroundColor = "#ffc107";
            span.style.color = "#000";
            span.style.fontWeight = "600";
          } else if (p1Num > p2Num) {
            span.textContent = `✅ ${resultado.mandante.nome} venceu`;
          } else if (p1Num < p2Num) {
            span.textContent = `✅ ${resultado.visitante.nome} venceu`;
          } else {
            span.textContent = "🤝 Empate";
          }

          jogoDiv.appendChild(time1);
          jogoDiv.appendChild(placar);
          jogoDiv.appendChild(time2);
          resultadoDiv.appendChild(span);

          grupoConfrontos.appendChild(jogoDiv);
          grupoConfrontos.appendChild(resultadoDiv);
        });

        const separador = document.createElement("div");
        separador.className = "separador-grupo";
        grupoConfrontos.appendChild(separador);
        colunaDireita.appendChild(grupoConfrontos);
      }

      const navegacaoRodadaGrupo = criarNavegacaoRodadaGrupo(numeroRodada);
      colunaDireita.appendChild(navegacaoRodadaGrupo);

      linha.appendChild(colunaEsquerda);
      linha.appendChild(colunaDireita);
      painelGrupos.appendChild(linha);
    });
  }

  function atualizarRodada(novaRodada) {
    rodadaAtual = novaRodada;
    renderPainelCompleto(novaRodada);
  }

  function criarNavegacaoRodadaGrupo(rodadaParaExibir) {
    const container = document.createElement("div");
    container.className = "rodada-container";

    const navegacao = document.createElement("div");
    navegacao.className = "navegacao-rodada";

    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "◀️ Rodada Anterior";
    btnAnterior.disabled = true;

    const titulo = document.createElement("div");
    titulo.className = "titulo-rodada";
    titulo.textContent = `Rodada ${rodadaParaExibir}`;

    const btnProxima = document.createElement("button");
    btnProxima.textContent = "Próxima Rodada ▶️";
    btnProxima.disabled = true;

    navegacao.appendChild(btnAnterior);
    navegacao.appendChild(titulo);
    navegacao.appendChild(btnProxima);
    container.appendChild(navegacao);
    return container;
  }

  atualizarRodada(rodadaAtual);
});
