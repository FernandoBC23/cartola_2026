// scripts/fase1_liberta.js

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');

  // Descobre MIN/MAX das rodadas existentes no dataset
  const RODADAS_DISPONIVEIS = [...new Set(confrontosFase1.map(j => j.rodada))].sort((a,b)=>a-b);
  const RODADA_MIN_DATA = RODADAS_DISPONIVEIS[0] ?? 1;
  const RODADA_MAX_DATA = RODADAS_DISPONIVEIS[RODADAS_DISPONIVEIS.length - 1] ?? 1;

  // Fase 1 do 1? turno: rodadas 1 a 6
  const RODADA_INICIO = 1;
  const RODADA_FIM = 6;
  const RODADA_OFFSET = (RODADA_MIN_DATA >= 20) ? (RODADA_MIN_DATA - RODADA_INICIO) : 0;
  const RODADA_MIN = RODADA_MIN_DATA - RODADA_OFFSET;
  const RODADA_MAXIMA = Math.min(RODADA_MAX_DATA - RODADA_OFFSET, RODADA_FIM);

  // Uma rodada ? considerada encerrada se tiver flag 'encerrado'
  // ou se a soma dos pontos for > 0 (evita contar 0.00 como jogo encerrado)
  const rodadasEncerradas = resultadosFase1
    .filter(r => {
      const p1 = r?.mandante?.pontos;
      const p2 = r?.visitante?.pontos;
      const temPontos = (p1 != null && p2 != null && (Number(p1) + Number(p2)) > 0);
      return r?.encerrado === true || temPontos;
    })
    .map(r => r.rodada - RODADA_OFFSET)
    .filter(r => r >= RODADA_INICIO && r <= RODADA_FIM);

  // Escolha da rodada a exibir ao abrir:
  // - se houver encerradas, pega a ?ltima encerrada (ou a pr?xima, se preferir, some +1 e fa?a clamp)
  // - sen?o, usa RODADA_INICIO (ex.: 20)
  let rodadaAtual = rodadasEncerradas.length
    ? Math.max(...rodadasEncerradas)
    : RODADA_INICIO;

  // Garante que est? dentro do intervalo do dataset
  rodadaAtual = Math.min(Math.max(rodadaAtual, RODADA_MIN), RODADA_MAXIMA);

  const painelGrupos = document.getElementById("painel-grupos");
  const aviso = document.getElementById("aviso-liberta");
  const rodadaSistema = Number.isFinite(window.RODADA_ATUAL)
    ? window.RODADA_ATUAL
    : (Number.isFinite(window.rodadaAtual) ? window.rodadaAtual : null);
  const faseNaoIniciou = rodadaSistema !== null && rodadaSistema < RODADA_INICIO;
  if (faseNaoIniciou) {
    if (aviso) aviso.style.display = "block";
    if (painelGrupos) painelGrupos.style.display = "none";
    return;
  }
  if (aviso) aviso.style.display = "none";
  if (painelGrupos) painelGrupos.style.display = "";

  // Fun??o para formatar nomes de arquivos de escudos
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

function renderPainelCompleto(numeroRodada) {
  painelGrupos.innerHTML = "";

  const rodadaDataset = numeroRodada + RODADA_OFFSET;
  const confrontosRodada = confrontosFase1.filter(j => j.rodada === rodadaDataset);
  const resultadosRodada = resultadosFase1.filter(j => j.rodada === rodadaDataset);

  const confrontosPorGrupo = {};
  confrontosRodada.forEach(jogo => {
    const grupo = jogo.grupo || "Outros";
    if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
    confrontosPorGrupo[grupo].push(jogo);
  });

  // ðŸ”¹ Se classifica??oFase1 vier vazia, monta placeholder zerado
  let dadosClassificacao = {};
  if (Object.keys(classificacaoFase1).length === 0) {
    confrontosFase1.forEach(jogo => {
      const grupo = jogo.grupo || "Outros";
      if (!dadosClassificacao[grupo]) dadosClassificacao[grupo] = [];
      [jogo.mandante.nome, jogo.visitante.nome].forEach(nomeTime => {
        if (!dadosClassificacao[grupo].some(t => t.nome === nomeTime)) {
          dadosClassificacao[grupo].push({
            posicao: dadosClassificacao[grupo].length + 1,
            nome: nomeTime,
            pontos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            totalCartola: 0
          });
        }
      });
    });
  } else {
    dadosClassificacao = classificacaoFase1;
  }

  Object.entries(dadosClassificacao).forEach(([grupo, times]) => {
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
        <td>${(time.vitorias + time.empates + time.derrotas) || 0}</td>
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

        const resultado = resultadosRodada.find(r =>
          r.mandante.nome === jogo.mandante.nome &&
          r.visitante.nome === jogo.visitante.nome
        );

        const p1Raw = resultado?.mandante?.pontos;
        const p2Raw = resultado?.visitante?.pontos;
        const p1Num = Number(p1Raw);
        const p2Num = Number(p2Raw);
        const temPontos = Number.isFinite(p1Num) && Number.isFinite(p2Num) && (p1Num + p2Num) > 0;
        const p1 = temPontos ? p1Num.toFixed(2) : "?";
        const p2 = temPontos ? p2Num.toFixed(2) : "?";

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
        span.textContent = (!resultado || !temPontos)
          ? "🕒 Aguardando Confronto"
          : (p1Num > p2Num
              ? `?o. ${resultado.mandante.nome} venceu`
              : p1Num < p2Num
                  ? `?o. ${resultado.visitante.nome} venceu`
                  : `?Y? Empate`);

        if (!resultado || !temPontos) {
          span.style.backgroundColor = "#ffc107";
          span.style.color = "#000";
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
      if (rodadaAtual > RODADA_INICIO) atualizarRodada(rodadaAtual - 1);
    });
  
    const titulo = document.createElement("div");
    titulo.className = "titulo-rodada";
    titulo.textContent = `Rodada ${rodadaParaExibir}`;
  
    const btnProxima = document.createElement("button");
    btnProxima.textContent = "Próxima Rodada ▶️";
    btnProxima.addEventListener("click", () => {
      if (rodadaAtual < RODADA_MAXIMA) atualizarRodada(rodadaAtual + 1);
    });
  
    if (rodadaAtual === RODADA_INICIO) btnAnterior.disabled = true;
    if (rodadaAtual === RODADA_MAXIMA) btnProxima.disabled = true;
  
    navegacao.appendChild(btnAnterior);
    navegacao.appendChild(titulo);
    navegacao.appendChild(btnProxima);
  
    container.appendChild(navegacao);
    return container;
  }
  
  // inicia com a rodada atual
  atualizarRodada(rodadaAtual);
  
});




