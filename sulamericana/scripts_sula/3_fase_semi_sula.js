// // scripts/fase_quartas_sula.js 

// window.addEventListener('DOMContentLoaded', () => {
//   document.body.classList.add('loaded');

//   let rodadaAtual = (() => {
//     const rodadasComPontuacao = resultados_semi_sula
//       .filter(r => r.mandante?.pontos != null && r.visitante?.pontos != null)
//       .map(r => r.rodada);
//     return rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) :  17;
//   })();
  
//   const RODADA_MAXIMA = 18;

//   const painelGrupos = document.getElementById("painel-sula-semi");

//   const gerarNomeArquivo = nome => {
//     return nome
//       .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//       .replace(/\s+/g, "_")
//       .replace(/[^\w\-]/g, "")
//       .toLowerCase();
//   };


//   const escudosTimes = {
//     "Dom Camillo68": "../imagens/2_dom_camillo68.png",  
//     "lsauer fc": "../imagens/2_lsauer_fc.png", 
//     "Tabajara de Inhaua FC2": "../imagens/2_tabajara_de_inhaua_fc2.png",
//     "TEAM LOPES 99": "../imagens/2_team_lopes_99.png",
//     "KING LEONN": "../imagens/2_king_leonn.png",
//     "Laranjja Mecannica": "../imagens/2_laranjja_mecannica.png",
//     "Gremiomaniasm": "../imagens/2_gremiomaniasm.png",  
//     "Gig@ntte": "../imagens/2_gigntte.png", 
//     "BORGES ITAQUI F.C.": "../imagens/2_borges_itaqui_fc.png",
//     "Tatols Beants F.C": "../imagens/2_tatols_beants_fc.png",
//     "Gr?mio imortal 37": "../imagens/2_gremio_imortal_37.png",
//     "MauHumor F.C.": "../imagens/2_mauhumor_fc.png",
//     "F.C. Rei Das Copas": "../imagens/2_fc_rei_das_copas.png",
//     "HS SPORTS F.C": "../imagens/2_hs_sports_fc.png",
//     "FC Los Castilho": "../imagens/2_fc_los_castilho.png",
//     "E.C. Boror?": "../imagens/2_ec_borore.png"
//   };

//   const clubesTimes = {
//     "Dom Camillo68": "UCH",   
//     "lsauer fc": "BSC",
//     "BORGES ITAQUI F.C.": "EST",
//     "Tatols Beants F.C": "TAL",
//     "Gr?mio imortal 37": "TAC",
//     "MauHumor F.C.": "OLI",
//     "F.C. Rei Das Copas": "CCP",
//     "HS SPORTS F.C": "RIV",
//     "FC Los Castilho": "NAC",
//     "E.C. Boror?": "FOR",
//     "Tabajara de Inhaua FC2": "IDV",
//     "TEAM LOPES 99": "FLA",
//     "KING LEONN": "PAL",
//     "Laranjja Mecannica": "PEN",     
//     "Gremiomaniasm": "ATL",
//     "Gig@ntte": "SAB"
//   }; 


//   function renderPainelCompleto(numeroRodada) {
//     painelGrupos.innerHTML = "";

//     const confrontosRodada = confrontos_semi_sula.filter(j => j.rodada === numeroRodada);
//     const resultadosRodada = resultados_semi_sula.filter(j => j.rodada === numeroRodada);

//     const confrontosPorGrupo = {};
//     confrontosRodada.forEach(jogo => {
//     const grupo = jogo.jogo || "Outros";  
//     if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
//     confrontosPorGrupo[grupo].push(jogo);
//     });

//     Object.entries(classificacao_semi_sula).forEach(([grupo, times]) => {
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

//           const escudoSrc = nome => `../imagens/2_${gerarNomeArquivo(nome)}.png`;

//           const time1 = document.createElement("div");
//           time1.className = "time";          
//           time1.innerHTML = `
//             <img src="${escudoSrc(jogo.mandante.nome)}" alt="${jogo.mandante.nome}">
//             <span class="tag-escudo">${clubesTimes[jogo.mandante.nome] ? ""}</span>
//           `;

//           const time2 = document.createElement("div");
//           time2.className = "time";          
//           time2.innerHTML = `
//             <span class="tag-escudo">${clubesTimes[jogo.visitante.nome] ? ""}</span>
//             <img src="${escudoSrc(jogo.visitante.nome)}" alt="${jogo.visitante.nome}">            
//           `;

//           const resultado = resultadosRodada.find(r =>
//             r.mandante.nome === jogo.mandante.nome &&
//             r.visitante.nome === jogo.visitante.nome
//           );

//           const p1 = resultado?.mandante?.pontos?.toFixed(2) ? "?";
//           const p2 = resultado?.visitante?.pontos?.toFixed(2) ? "?";

//           // const placar = document.createElement("div");
//           // placar.className = "placar";
//           // placar.textContent = `${p1} Ã— ${p2}`;

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

//         // ðŸ”½ Adiciona separador ap?s os confrontos do grupo
//         const separador = document.createElement("div");
//         separador.className = "separador-grupo";
//         grupoConfrontos.appendChild(separador);

//         colunaDireita.appendChild(grupoConfrontos);
//       }

//       const navegacaoRodadaGrupo = criarNavegacaoRodadaGrupo(grupo, numeroRodada);
//       console.log("Adicionando navega??o para grupo:", grupo);

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
//       if (rodadaAtual > 17) atualizarRodada(rodadaAtual - 1);
//     });
  
//     const titulo = document.createElement("div");
//     titulo.className = "titulo-rodada";
//     titulo.textContent = `Rodada ${rodadaParaExibir}`;
  
//     const btnProxima = document.createElement("button");
//     btnProxima.textContent = "Próxima Rodada ▶️";
//     btnProxima.addEventListener("click", () => {
//       if (rodadaAtual < RODADA_MAXIMA) atualizarRodada(rodadaAtual + 1);
//     });
  
//     if (rodadaAtual === 17) btnAnterior.disabled = true;
//     if (rodadaAtual === RODADA_MAXIMA) btnProxima.disabled = true;
  
//     navegacao.appendChild(btnAnterior);
//     navegacao.appendChild(titulo);
//     navegacao.appendChild(btnProxima);
  
//     container.appendChild(navegacao);
//     return container;
//   }
  
//   // inicia com a rodada atual
//   atualizarRodada(rodadaAtual);
  
// });


// #######################################################################################################

// scripts/3_fase_semi_sula.js

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const RODADA_MINIMA = 17;
  const RODADA_MAXIMA = 18;

  // âœ… C?lculo da rodada atual (somente se houver pontua??o > 0)
  let rodadaAtual = (() => {
    const rodadasComPontuacao = resultados_semi_sula
      .filter(
        r =>
          r.mandante?.pontos != null &&
          r.visitante?.pontos != null &&
          (r.mandante.pontos > 0 || r.visitante.pontos > 0)
      )
      .map(r => r.rodada)
      .filter(r => r >= RODADA_MINIMA && r <= RODADA_MAXIMA);
    const rodadaDetectada = rodadasComPontuacao.length ? Math.max(...rodadasComPontuacao) : RODADA_MINIMA;
    return Math.min(Math.max(rodadaDetectada, RODADA_MINIMA), RODADA_MAXIMA);
  })();
  const painelGrupos = document.getElementById("painel-sula-semi");
  const aviso = document.getElementById("aviso-sula");
  const hasTimes = (() => {
    try {
      return Object.keys(classificacao_semi_sula || {}).length > 0;
    } catch {
      return false;
    }
  })();
  const hasConfrontos = Array.isArray(confrontos_semi_sula) && confrontos_semi_sula.length > 0;
  const temDados = hasTimes || hasConfrontos;
  if (!temDados) {
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
  // Fun??o utilit?ria
  // ===============================
  const gerarNomeArquivo = nome => {
    return nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")
      .toLowerCase();
  };

  // ===============================
  // Escudos e siglas
  // ===============================
const clubesTimes = {
    "Rolo Compressor ZN": "CBB",
    "Fedato Futebol Clube": "EST",
    "SUPER VASCÃƒO F.C": "UCH",
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
    "L? do Itaqui": "NAC",
    "teves_futsal20 f.c": "CCP",
    "S.E.R. GRILLO": "BOL",
    "KING LEONN": "SCR",
    "Tatols Beants F.C": "PAL",
    "RHANKA DENTY FC25": "SAB",
    "A Lenda Super Vasco F.c": "OLI",
    "TEAM LOPES 99": "VEL",
    "BORGES ITAQUI F.C.": "PEN"
  };

  // ===============================
  // Renderiza??o do painel
  // ===============================
  function renderPainelCompleto(numeroRodada) {
    painelGrupos.innerHTML = "";

    const confrontosRodada = confrontos_semi_sula.filter(j => j.rodada === numeroRodada);
    const resultadosRodada = resultados_semi_sula.filter(j => j.rodada === numeroRodada);

    const confrontosPorGrupo = {};
    confrontosRodada.forEach(jogo => {
      const grupo = jogo.jogo || "Outros";
      if (!confrontosPorGrupo[grupo]) confrontosPorGrupo[grupo] = [];
      confrontosPorGrupo[grupo].push(jogo);
    });

    Object.entries(classificacao_semi_sula).forEach(([grupo, times]) => {
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
              <span class="tag-clube">${clubesTimes[time.nome] ? ""}</span>
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
          const time1 = document.createElement("div");
          time1.className = "time";
          time1.innerHTML = `
            <img src="${escudoSrc(jogo.mandante.nome)}" alt="${jogo.mandante.nome}">
            <span class="tag-escudo">${clubesTimes[jogo.mandante.nome] ? ""}</span>
          `;

          const time2 = document.createElement("div");
          time2.className = "time";
          time2.innerHTML = `
            <span class="tag-escudo">${clubesTimes[jogo.visitante.nome] ? ""}</span>
            <img src="${escudoSrc(jogo.visitante.nome)}" alt="${jogo.visitante.nome}">
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

          // --- Resultado do confronto (igual Fase 3 / S?rie A)
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

  // ===============================
  // Navega??o
  // ===============================
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







