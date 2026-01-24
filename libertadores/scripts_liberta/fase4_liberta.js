// scripts/fase4_liberta.js 

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const RODADA_MINIMA = 34;
  const RODADA_MAXIMA = 35;

  let rodadaAtual = (() => {
    // Considera apenas rodadas com pontua??es reais (n?o nulas e > 0)
    const rodadasComPontuacao = resultadosFase4
      .filter(
        r =>
          r.mandante?.pontos != null &&
          r.visitante?.pontos != null &&
          (r.mandante.pontos > 0 || r.visitante.pontos > 0)
      )
      .map(r => r.rodada);

    // Se n?o houver pontua??o v?lida ainda, mant?m em 34
    return rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : RODADA_MINIMA;
  })();

  const painelGrupos = document.getElementById("painel-fase4");
  const aviso = document.getElementById("aviso-liberta");
  const rodadaSistema = Number.isFinite(window.RODADA_ATUAL)
    ? window.RODADA_ATUAL
    : (Number.isFinite(window.rodadaAtual) ? window.rodadaAtual : null);
  const faseNaoIniciou = rodadaSistema !== null && rodadaSistema < RODADA_MINIMA;
  const hasTimes = (() => {
    try {
      return Object.keys(classificacaoFase4 || {}).length > 0;
    } catch {
      return false;
    }
  })();
  const hasConfrontosNaFase =
    Array.isArray(confrontosFase4) &&
    confrontosFase4.some(j => {
      const r = Number(j?.rodada);
      return Number.isFinite(r) && r >= RODADA_MINIMA && r <= RODADA_MAXIMA;
    });
  const temDados = hasTimes || hasConfrontosNaFase;
  if (faseNaoIniciou || !temDados) {
    if (aviso) aviso.style.display = "block";
    if (painelGrupos) painelGrupos.style.display = "none";
    return;
  }
  if (aviso) aviso.style.display = "none";
  if (painelGrupos) painelGrupos.style.display = "";

  // Escudos centralizados (usa scripts/escudos_times.js)
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


  // ===============================
  // Renderiza??o do painel
  // ===============================
  function renderPainelCompleto(numeroRodada) {
    painelGrupos.innerHTML = "";

    const confrontosRodada = confrontosFase4.filter(j => j.rodada === numeroRodada);
    const resultadosRodada = resultadosFase4.filter(j => j.rodada === numeroRodada);

    const confrontosPorGrupo = {};
    confrontosRodada.forEach(jogo => {
      const grupo = jogo.jogo || "Outros";
      if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
      confrontosPorGrupo[grupo].push(jogo);
    });

    Object.entries(classificacaoFase4).forEach(([grupo, times]) => {
      const linha = document.createElement("div");
      linha.className = "linha-grupo";

      // =====================
      // COLUNA ESQUERDA (TABELA)
      // =====================
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

        const escudo = escudoSrc(time.nome);
        tr.innerHTML = `
          <td>${time.posicao}</td>
          <td>
            <div class="time-info">
              <img src="${escudo}" class="escudo" alt="${time.nome}">
              ${time.nome}
            </div>
          </td>
          <td>${time.pontos}</td>
          <td>${time.vitorias + time.empates + time.derrotas}</td>
          <td>${time.vitorias}</td>
          <td>${time.empates}</td>
          <td>${time.derrotas}</td>
          <td>${time.totalCartola.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });

      tabela.appendChild(tbody);
      grupoDiv.appendChild(tabela);
      colunaEsquerda.appendChild(grupoDiv);

      // =====================
      // COLUNA DIREITA (CONFRONTOS)
      // =====================
      const colunaDireita = document.createElement("div");
      colunaDireita.className = "coluna-direita";

      if (confrontosPorGrupo[grupo]) {
        const grupoConfrontos = document.createElement("div");
        grupoConfrontos.className = "grupo-confronto";

        confrontosPorGrupo[grupo].forEach(jogo => {
          const jogoDiv = document.createElement("div");
          jogoDiv.className = "jogo";

          const escudoConfronto = nome => escudoSrc(nome);

          const time1 = document.createElement("div");
          time1.className = "time";
          time1.innerHTML = `
            <img src="${escudoConfronto(jogo.mandante.nome)}" alt="${jogo.mandante.nome}">
          `;

          const time2 = document.createElement("div");
          time2.className = "time";
          time2.innerHTML = `
            <img src="${escudoConfronto(jogo.visitante.nome)}" alt="${jogo.visitante.nome}">
          `;

          const resultado = resultadosRodada.find(
            r =>
              r.mandante.nome === jogo.mandante.nome &&
              r.visitante.nome === jogo.visitante.nome
          );

          const p1 = resultado?.mandante?.pontos ? 0;
          const p2 = resultado?.visitante?.pontos ? 0;

          const placar = document.createElement("div");
          placar.className = "placar";
          placar.innerHTML = `
            <span class="placar-numero">${p1.toFixed(2)}</span>
            <span class="placar-x"> X </span>
            <span class="placar-numero">${p2.toFixed(2)}</span>
          `;

          const resultadoDiv = document.createElement("div");
          resultadoDiv.className = "resultado";
          const span = document.createElement("span");
          span.className = "vencedor";

          const semPontuacao =
            resultado == null ||
            resultado.mandante.pontos == null ||
            resultado.visitante.pontos == null ||
            (resultado.mandante.pontos === 0 && resultado.visitante.pontos === 0);

          if (semPontuacao) {
            span.textContent = "🕒 Aguardando Confronto";
            span.style.backgroundColor = "#ffc107";
            span.style.color = "#000";
            span.style.fontWeight = "600";
          } else if (resultado.mandante.pontos > resultado.visitante.pontos) {
            span.textContent = `âœ… ${resultado.mandante.nome} venceu`;
          } else if (resultado.mandante.pontos < resultado.visitante.pontos) {
            span.textContent = `âœ… ${resultado.visitante.nome} venceu`;
          } else {
            span.textContent = "ðŸ¤ Empate";
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

      const navegacaoRodadaGrupo = criarNavegacaoRodadaGrupo(grupo, numeroRodada);
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

  function criarNavegacaoRodadaGrupo(grupo, rodadaParaExibir) {
    const container = document.createElement("div");
    container.className = "rodada-container";

    const navegacao = document.createElement("div");
    navegacao.className = "navegacao-rodada";

    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "◀️ Rodada Anterior";
    btnAnterior.addEventListener("click", () => {
      if (rodadaAtual > RODADA_MINIMA) atualizarRodada(rodadaAtual - 1);
    });

    const titulo = document.createElement("div");
    titulo.className = "titulo-rodada";
    titulo.textContent = `Rodada ${rodadaParaExibir}`;

    const btnProxima = document.createElement("button");
    btnProxima.textContent = "Próxima Rodada ▶️";
    btnProxima.addEventListener("click", () => {
      if (rodadaAtual < RODADA_MAXIMA) atualizarRodada(rodadaAtual + 1);
    });

    if (rodadaAtual === RODADA_MINIMA) btnAnterior.disabled = true;
    if (rodadaAtual === RODADA_MAXIMA) btnProxima.disabled = true;

    navegacao.appendChild(btnAnterior);
    navegacao.appendChild(titulo);
    navegacao.appendChild(btnProxima);

    container.appendChild(navegacao);
    return container;
  }

  atualizarRodada(rodadaAtual);
});



