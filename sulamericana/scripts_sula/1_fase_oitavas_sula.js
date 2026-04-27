window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const RODADA_MINIMA = 13;
  const RODADA_MAXIMA = 14;

  const painelGrupos = document.getElementById("painel-sula-oitavas");
  const aviso = document.getElementById("aviso-sula");
  const avisoOriginal = aviso ? { html: aviso.innerHTML, className: aviso.className } : null;
  const metaRodada = Number.isFinite(window.sulaMeta?.rodada_atual)
    ? Number(window.sulaMeta.rodada_atual)
    : null;
  const parcialRodadaRaw = Number.isFinite(window.pontuacaoParcialRodadaAtual?.rodada)
    ? Number(window.pontuacaoParcialRodadaAtual.rodada)
    : metaRodada;
  const parcialTimes = window.pontuacaoParcialRodadaAtual?.times || {};
  const parcialRodadaExibida = Number.isFinite(parcialRodadaRaw)
    ? parcialRodadaRaw
    : null;

  const hasTimes = (() => {
    try {
      return Object.keys(classificacao_oitavas_sula || {}).length > 0;
    } catch {
      return false;
    }
  })();

  const hasConfrontos =
    Array.isArray(confrontos_oitavas_sula) &&
    confrontos_oitavas_sula.some(j => {
      const rodada = Number(j?.rodada);
      return Number.isFinite(rodada) && rodada >= RODADA_MINIMA && rodada <= RODADA_MAXIMA;
    });

  const temDados = hasTimes || hasConfrontos;
  if (!temDados) {
    if (aviso && avisoOriginal) {
      aviso.className = avisoOriginal.className;
      aviso.innerHTML = avisoOriginal.html;
      aviso.style.display = "block";
    }
    if (painelGrupos) painelGrupos.style.display = "none";
    return;
  }

  if (aviso) aviso.style.display = "none";
  if (painelGrupos) painelGrupos.style.display = "";

  const rodadasEncerradas = resultados_oitavas_sula
    .filter(r => {
      const p1 = r?.mandante?.pontos;
      const p2 = r?.visitante?.pontos;
      const temPontos = (p1 != null && p2 != null && Number.isFinite(Number(p1)) && Number.isFinite(Number(p2)) && (Number(p1) + Number(p2)) > 0);
      return r?.encerrado === true || temPontos;
    })
    .map(r => r.rodada)
    .filter(r => r >= RODADA_MINIMA && r <= RODADA_MAXIMA);

  const rodadaEncerradaMax = rodadasEncerradas.length ? Math.max(...rodadasEncerradas) : null;
  const rodadaEmAndamento = (() => {
    if (metaRodada !== null && metaRodada >= RODADA_MINIMA && metaRodada <= RODADA_MAXIMA) {
      return metaRodada;
    }
    if (rodadaEncerradaMax !== null) {
      return Math.min(rodadaEncerradaMax + 1, RODADA_MAXIMA);
    }
    return RODADA_MINIMA;
  })();
  const parcialDisponivel = (
    (window.sulaMeta?.parcial_disponivel === true) ||
    (Object.keys(parcialTimes).length > 0)
  ) && parcialRodadaExibida !== null
    && parcialRodadaExibida === rodadaEmAndamento
    && parcialRodadaExibida >= RODADA_MINIMA
    && parcialRodadaExibida <= RODADA_MAXIMA;
  let rodadaAtual = rodadaEmAndamento;
  rodadaAtual = Math.min(Math.max(rodadaAtual, RODADA_MINIMA), RODADA_MAXIMA);

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

  function renderPainelCompleto(numeroRodada) {
    painelGrupos.innerHTML = "";
    const rodadaEmAndamentoAtual = parcialDisponivel && parcialRodadaExibida === numeroRodada;
    if (aviso) {
      if (rodadaEmAndamentoAtual) {
        aviso.className = "aviso-parcial";
        aviso.textContent = `Rodada ${numeroRodada} em andamento: pontuacoes parciais (nao definitivas).`;
        aviso.style.display = "block";
      } else {
        aviso.style.display = "none";
      }
    }

    const confrontosRodada = confrontos_oitavas_sula.filter(j => j.rodada === numeroRodada);
    const resultadosRodada = resultados_oitavas_sula.filter(j => j.rodada === numeroRodada);

    const confrontosPorJogo = {};
    confrontosRodada.forEach(jogo => {
      const chave = jogo.jogo || "Outros";
      if (!confrontosPorJogo[chave]) confrontosPorJogo[chave] = [];
      confrontosPorJogo[chave].push(jogo);
    });

    Object.entries(classificacao_oitavas_sula).forEach(([jogo, times]) => {
      const linha = document.createElement("div");
      linha.className = "linha-grupo";

      const colunaEsquerda = document.createElement("div");
      colunaEsquerda.className = "coluna-esquerda";

      const grupoDiv = document.createElement("div");
      grupoDiv.className = "tabela-grupo";

      const titulo = document.createElement("div");
      titulo.className = "titulo-grupo";
      titulo.textContent = jogo;
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

      if (confrontosPorJogo[jogo]) {
        const grupoConfrontos = document.createElement("div");
        grupoConfrontos.className = "grupo-confronto";

        confrontosPorJogo[jogo].forEach(confronto => {
          const jogoDiv = document.createElement("div");
          jogoDiv.className = "jogo";

          const time1 = document.createElement("div");
          time1.className = "time";
          time1.innerHTML = `<img src="${escudoSrc(confronto.mandante.nome)}" alt="${confronto.mandante.nome}">`;

          const time2 = document.createElement("div");
          time2.className = "time";
          time2.innerHTML = `<img src="${escudoSrc(confronto.visitante.nome)}" alt="${confronto.visitante.nome}">`;

          const resultado = resultadosRodada.find(r =>
            r.mandante.nome === confronto.mandante.nome &&
            r.visitante.nome === confronto.visitante.nome
          );

          const p1Num = Number(resultado?.mandante?.pontos);
          const p2Num = Number(resultado?.visitante?.pontos);
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
            span.textContent = "⏰ Aguardando Confronto";
            span.style.backgroundColor = "#ffc107";
            span.style.color = "#000";
          } else if (rodadaEmAndamentoAtual) {
            span.textContent = (p1Num > p2Num)
              ? `⏳ ${resultado.mandante.nome} está vencendo`
              : (p1Num < p2Num)
                ? `⏳ ${resultado.visitante.nome} está vencendo`
                : "⏳ Parcial: empate";
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

      colunaDireita.appendChild(criarNavegacaoRodadaGrupo(numeroRodada));

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
