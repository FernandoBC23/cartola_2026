// scripts/fase3_liberta.js 

// window.addEventListener('DOMContentLoaded', () => {
//   document.body.classList.add('loaded');

//   let rodadaAtual = (() => {
//     const rodadasComPontuacao = resultadosFase3
//       .filter(r => r.mandante?.pontos != null && r.visitante?.pontos != null)
//       .map(r => r.rodada);
//     return rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : 32;
//   })();
  
//   const RODADA_MAXIMA = 33;

//   const painelGrupos = document.getElementById("painel-fase3");

//

//   // âš ï¸ Atualize estes dois objetos se houver mudan?as na Fase 3
//   // Escudos centralizados (usa scripts/escudos_times.js)
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



//   const clubesTimes = {
//     "Rolo Compressor ZN": "CBB",
//     "Fedato Futebol Clube": "EST",
//     "SUPER VASCÃƒO F.C": "UCH",
//     "seralex": "BOT",

//     "lsauer fc": "BSC",
//     "FBC Colorado": "IDV",
//     "MauHumor F.C.": "UNI",
//     "Analove10 ITAQUI GRANDE!!": "RIV",

//     "Pity10": "CCO",
//     "SERGRILLO": "LDU",
//     "Paulo Virgili FC": "TAC",
//     "Gig@ntte": "FLA", 

//     "cartola scheuer": "ALI",
//     "KillerColorado": "LIB", 
//     "pura bucha /botafogo": "TAL",  
//     "Super Vasco f.c": "SAO",

//     "Laranjja Mecannica": "BUC",
//     "Texas Club 2025": "COL",
//     "Gremiomaniasm": "FOR",
//     "Dom Camillo68": "RAC",

//     "FC Los Castilho": "BAH",
//     "Noah A 10": "INT",
//     "Real SCI": "ATN",
//     "L? do Itaqui": "NAC",

//     "teves_futsal20 f.c": "CCP",
//     "S.E.R. GRILLO": "BOL",  
//     "KING LEONN": "SCR",
//     "Tatols Beants F.C": "PAL",

//     "RHANKA DENTY FC25": "SAB",     
//     "A Lenda Super Vasco F.c": "OLI",  
//     "TEAM LOPES 99": "VEL",               
//     "BORGES ITAQUI F.C.": "PEN"
//   }; 

//   function renderPainelCompleto(numeroRodada) {
//     painelGrupos.innerHTML = "";

//     const confrontosRodada = confrontosFase3.filter(j => j.rodada === numeroRodada);
//     const resultadosRodada = resultadosFase3.filter(j => j.rodada === numeroRodada);

//     const confrontosPorGrupo = {};
//     confrontosRodada.forEach(jogo => {
//     const grupo = jogo.jogo || "Outros";  
//     if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
//     confrontosPorGrupo[grupo].push(jogo);
//     });


//     Object.entries(classificacaoFase3).forEach(([grupo, times]) => {
//       const linha = document.createElement("div");
//       linha.className = "linha-grupo";

//       const colunaEsquerda = document.createElement("div");
//       colunaEsquerda.className = "coluna-esquerda";

//       const grupoDiv = document.createElement("div");
//       grupoDiv.className = "tabela-grupo";

//       const titulo = document.createElement("div");
//       titulo.className = "titulo-grupo";
//       titulo.textContent = grupo;
//       grupoDiv.appendChild(titulo);   

//       const tabela = document.createElement("table");
//       tabela.className = "tabela-classificacao";
//       tabela.innerHTML = `
//         <thead>
//           <tr>
//             <th>Pos</th>
//             <th>Time</th>
//             <th>Pts</th>
//             <th>J</th>
//             <th>V</th>
//             <th>E</th>
//             <th>D</th>
//             <th>Total</th>           
//           </tr>
//         </thead>
//       `;
//       const tbody = document.createElement("tbody");

//       times.forEach((time, index) => {
//         const tr = document.createElement("tr");
//         if (index === 0 || index === 1) tr.classList.add("lider-grupo");

//         const escudo = escudoSrc(time.nome);
//         tr.innerHTML = `
//           <td>${time.posicao}</td>
//           <td>
//             <div class="time-info">
//               <img src="${escudo}" class="escudo" alt="${time.nome}">
//               <span class="tag-clube">${clubesTimes[time.nome] ? ""}</span>
//               ${time.nome}              
//             </div>
//           </td>
//           <td>${time.pontos}</td>
//           <td>${time.vitorias + time.empates + time.derrotas}</td>
//           <td>${time.vitorias}</td>
//           <td>${time.empates}</td>
//           <td>${time.derrotas}</td>
//           <td>${time.totalCartola.toFixed(2)}</td>          
//         `;
//         tbody.appendChild(tr);
//       });

//       tabela.appendChild(tbody);
//       grupoDiv.appendChild(tabela);
//       colunaEsquerda.appendChild(grupoDiv);

//       const colunaDireita = document.createElement("div");
//       colunaDireita.className = "coluna-direita";

//       if (confrontosPorGrupo[grupo]) {
//         const grupoConfrontos = document.createElement("div");
//         grupoConfrontos.className = "grupo-confronto";

//         confrontosPorGrupo[grupo].forEach(jogo => {
//           const jogoDiv = document.createElement("div");
//           jogoDiv.className = "jogo";

//           const escudoConfronto = nome => escudoSrc(nome);

//           const time1 = document.createElement("div");
//           time1.className = "time";
//           time1.innerHTML = `
//             <img src="${escudoConfronto(jogo.mandante.nome)}" alt="${jogo.mandante.nome}">
//             <span class="tag-escudo">${clubesTimes[jogo.mandante.nome] ? ""}</span>
//           `;

//           const time2 = document.createElement("div");
//           time2.className = "time";
//           time2.innerHTML = `
//             <span class="tag-escudo">${clubesTimes[jogo.visitante.nome] ? ""}</span>
//             <img src="${escudoConfronto(jogo.visitante.nome)}" alt="${jogo.visitante.nome}">            
//           `;

//           const resultado = resultadosRodada.find(r =>
//             r.mandante.nome === jogo.mandante.nome &&
//             r.visitante.nome === jogo.visitante.nome
//           );

//           const p1 = resultado?.mandante?.pontos?.toFixed(2) ? "?";
//           const p2 = resultado?.visitante?.pontos?.toFixed(2) ? "?";

//           const placar = document.createElement("div");
//           placar.className = "placar";
//           placar.innerHTML = `
//             <span class="placar-numero">${p1}</span> 
//             <span class="placar-x"> X </span> 
//             <span class="placar-numero">${p2}</span>
//           `;

//           const resultadoDiv = document.createElement("div");
//           resultadoDiv.className = "resultado";
//           const span = document.createElement("span");
//           span.className = "vencedor";

//           if (!resultado || resultado.mandante.pontos == null || resultado.visitante.pontos == null) {
//             span.textContent = "🕒 Aguardando Confronto";
//             span.style.backgroundColor = "#ffc107";
//             span.style.color = "#000";
//           } else if (resultado.mandante.pontos > resultado.visitante.pontos) {
//             span.textContent = `âœ… ${resultado.mandante.nome} venceu`;
//           } else if (resultado.mandante.pontos < resultado.visitante.pontos) {
//             span.textContent = `âœ… ${resultado.visitante.nome} venceu`;
//           } else {
//             span.textContent = `ðŸ¤ Empate`;
//           }

//           jogoDiv.appendChild(time1);
//           jogoDiv.appendChild(placar);
//           jogoDiv.appendChild(time2);
//           resultadoDiv.appendChild(span);

//           grupoConfrontos.appendChild(jogoDiv);
//           grupoConfrontos.appendChild(resultadoDiv);
//         });

//         const separador = document.createElement("div");
//         separador.className = "separador-grupo";
//         grupoConfrontos.appendChild(separador);

//         colunaDireita.appendChild(grupoConfrontos);
//       }

//       const navegacaoRodadaGrupo = criarNavegacaoRodadaGrupo(grupo, numeroRodada);
//       colunaDireita.appendChild(navegacaoRodadaGrupo);

//       linha.appendChild(colunaEsquerda);
//       linha.appendChild(colunaDireita);
//       painelGrupos.appendChild(linha);
//     });
//   }

//   function atualizarRodada(novaRodada) {
//     rodadaAtual = novaRodada;
//     renderPainelCompleto(novaRodada);
//   }
  
//   function criarNavegacaoRodadaGrupo(grupo, rodadaParaExibir) {
//     const container = document.createElement("div");
//     container.className = "rodada-container";
  
//     const navegacao = document.createElement("div");
//     navegacao.className = "navegacao-rodada";
  
//     const btnAnterior = document.createElement("button");
//     btnAnterior.textContent = "◀️ Rodada Anterior";
//     btnAnterior.addEventListener("click", () => {
//       if (rodadaAtual > 32) atualizarRodada(rodadaAtual - 1);
//     });
  
//     const titulo = document.createElement("div");
//     titulo.className = "titulo-rodada";
//     titulo.textContent = `Rodada ${rodadaParaExibir}`;
  
//     const btnProxima = document.createElement("button");
//     btnProxima.textContent = "Próxima Rodada ▶️";
//     btnProxima.addEventListener("click", () => {
//       if (rodadaAtual < RODADA_MAXIMA) atualizarRodada(rodadaAtual + 1);
//     });
  
//     if (rodadaAtual === 32) btnAnterior.disabled = true;
//     if (rodadaAtual === RODADA_MAXIMA) btnProxima.disabled = true;
  
//     navegacao.appendChild(btnAnterior);
//     navegacao.appendChild(titulo);
//     navegacao.appendChild(btnProxima);
  
//     container.appendChild(navegacao);
//     return container;
//   }

//   atualizarRodada(rodadaAtual);
// });

// scripts/fase3_liberta.js

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const RODADA_MINIMA = 32;
  const RODADA_MAXIMA = 33;

  let rodadaAtual = (() => {
    // Considera apenas rodadas com pontua??es reais (n?o nulas e > 0)
    const rodadasComPontuacao = resultadosFase3
      .filter(r =>
        r.mandante?.pontos != null &&
        r.visitante?.pontos != null &&
        (r.mandante.pontos > 0 || r.visitante.pontos > 0)
      )
      .map(r => r.rodada);

    // Se n?o houver pontua??o v?lida ainda, mant?m em 32
    return rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : RODADA_MINIMA;
  })();

  const painelGrupos = document.getElementById("painel-fase3");
  const aviso = document.getElementById("aviso-liberta");
  const avisoOriginal = aviso ? { html: aviso.innerHTML, className: aviso.className } : null;
  const metaRodada = Number.isFinite(window.libertaMeta?.rodada_atual)
    ? Number(window.libertaMeta.rodada_atual)
    : null;
  const parcialRodadaRaw = Number.isFinite(window.pontuacaoParcialRodadaAtual?.rodada)
    ? Number(window.pontuacaoParcialRodadaAtual.rodada)
    : metaRodada;
  const parcialTimes = window.pontuacaoParcialRodadaAtual?.times || {};
  const parcialRodadaExibida = Number.isFinite(parcialRodadaRaw)
    ? parcialRodadaRaw
    : null;
  const parcialDisponivel = (
    (window.libertaMeta?.parcial_disponivel === true) ||
    (Object.keys(parcialTimes).length > 0)
  ) && parcialRodadaExibida !== null
    && parcialRodadaExibida >= RODADA_MINIMA
    && parcialRodadaExibida <= RODADA_MAXIMA;
  if (parcialDisponivel) {
    rodadaAtual = parcialRodadaExibida;
  }
  const rodadaSistema = Number.isFinite(window.RODADA_ATUAL)
    ? window.RODADA_ATUAL
    : (Number.isFinite(window.rodadaAtual) ? window.rodadaAtual : null);
  const faseNaoIniciou = rodadaSistema !== null && rodadaSistema < RODADA_MINIMA;
  const hasTimes = (() => {
    try {
      return Object.keys(classificacaoFase3 || {}).length > 0;
    } catch {
      return false;
    }
  })();
  const hasConfrontosNaFase =
    Array.isArray(confrontosFase3) &&
    confrontosFase3.some(j => {
      const r = Number(j?.rodada);
      return Number.isFinite(r) && r >= RODADA_MINIMA && r <= RODADA_MAXIMA;
    });
  const temDados = hasTimes || hasConfrontosNaFase;
  if (faseNaoIniciou || !temDados) {
    if (aviso) {
      if (avisoOriginal) {
        aviso.className = avisoOriginal.className;
        aviso.innerHTML = avisoOriginal.html;
      }
      aviso.style.display = "block";
    }
    if (painelGrupos) painelGrupos.style.display = "none";
    return;
  }
  if (aviso) aviso.style.display = "none";
  if (painelGrupos) painelGrupos.style.display = "";

  // âš™ï¸ Escudos e siglas
  // ===============================
  // Renderiza??o do painel
  // ===============================
  function renderPainelCompleto(numeroRodada) {
    painelGrupos.innerHTML = "";
    const rodadaEmAndamento = parcialDisponivel && parcialRodadaExibida === numeroRodada;
    if (aviso) {
      if (rodadaEmAndamento) {
        aviso.className = "aviso-parcial";
        aviso.textContent = `Rodada ${numeroRodada} em andamento: pontuacoes parciais (nao definitivas).`;
        aviso.style.display = "block";
      } else {
        aviso.style.display = "none";
      }
    }

    const confrontosRodada = confrontosFase3.filter(j => j.rodada === numeroRodada);
    const resultadosRodada = resultadosFase3.filter(j => j.rodada === numeroRodada);

    const confrontosPorGrupo = {};
    confrontosRodada.forEach(jogo => {
      const grupo = jogo.jogo || "Outros";
      if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
      confrontosPorGrupo[grupo].push(jogo);
    });

    Object.entries(classificacaoFase3).forEach(([grupo, times]) => {
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

          // --- Resultado do confronto (ajustado igual S?rie A)
          const resultadoDiv = document.createElement("div");
          resultadoDiv.className = "resultado";
          const span = document.createElement("span");
          span.className = "vencedor";

          if (!resultado || !temPontos) {
            span.textContent = "\u23F0 Aguardando Confronto";
            span.style.backgroundColor = "#ffc107";
            span.style.color = "#000";
            span.style.fontWeight = "600";
          } else if (rodadaEmAndamento) {
            span.textContent = (p1Num > p2Num)
              ? `\u23F3 ${resultado.mandante.nome} est\u00E1 vencendo`
              : (p1Num < p2Num)
                ? `\u23F3 ${resultado.visitante.nome} est\u00E1 vencendo`
                : "\u23F3 Parcial: empate";
          } else if (p1Num > p2Num) {
            span.textContent = `\u2705 ${resultado.mandante.nome} venceu`;
          } else if (p1Num < p2Num) {
            span.textContent = `\u2705 ${resultado.visitante.nome} venceu`;
          } else {
            span.textContent = "\uD83E\uDD1D Empate";
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



