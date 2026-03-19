const ORDEM_POSICOES_ORCAMENTO = {
  Goleiro: 1,
  Lateral: 2,
  Zagueiro: 3,
  Meia: 4,
  Atacante: 5,
  Técnico: 6,
  "TÃ©cnico": 6,
};

const dataOrcamento = window.escalacoesRodadaOrcamento || { ranking: [], formacoes: {}, meta: {} };

const selectFormacaoOrcamento = document.getElementById("select-formacao-orcamento");
const rankingGridOrcamento = document.getElementById("ranking-formacoes-orcamento");
const resumoFormacaoOrcamento = document.getElementById("resumo-formacao-orcamento");
const tabelaTitularesOrcamento = document.getElementById("tabela-titulares-orcamento");
const tabelaBancoOrcamento = document.getElementById("tabela-banco-orcamento");

const fmtNumero = (valor) => Number(valor || 0).toFixed(2);
const fmtCartoletas = (valor) => `${Number(valor || 0).toFixed(2)} C$`;

function ordenarPosicoesOrcamento(lista) {
  return [...(lista || [])].sort((a, b) => {
    const ordemA = ORDEM_POSICOES_ORCAMENTO[a.posicao] || 999;
    const ordemB = ORDEM_POSICOES_ORCAMENTO[b.posicao] || 999;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return (b.notaEscalacao || 0) - (a.notaEscalacao || 0);
  });
}

function contextoTextoOrcamento(jogador) {
  if (jogador.contextoFavoravel) return { texto: "Favorável", classe: "favoravel" };
  if (jogador.contextoDesfavoravel) return { texto: "Desfavorável", classe: "desfavoravel" };
  return { texto: "Neutro", classe: "neutro" };
}

function localTagOrcamento(local) {
  return `<span class="local-tag ${local}">${local === "casa" ? "Casa" : "Fora"}</span>`;
}

function playerIdentidadeOrcamento(jogador) {
  return `
    <div class="player-identidade">
      <span class="club-pill">${jogador.clube}</span>
      <div class="player-meta">
        <span>${jogador.nome}</span>
        <small>${jogador.posicao}</small>
      </div>
    </div>
  `;
}

function renderRestricoesOrcamento(lista, classeVazia) {
  if (!Array.isArray(lista) || !lista.length) {
    return `<span class="restricao-vazia ${classeVazia}">Nenhum</span>`;
  }

  return lista
    .map((item) => {
      const nome = Array.isArray(item) ? item[0] : "";
      const clube = Array.isArray(item) ? item[1] : "";
      return `<span class="restricao-tag">${nome} <small>${clube}</small></span>`;
    })
    .join("");
}

function renderRankingCardsOrcamento(formacaoAtiva) {
  rankingGridOrcamento.innerHTML = dataOrcamento.ranking
    .map((item) => {
      const ativo = item.formacao === formacaoAtiva ? "ativo" : "";
      return `
        <article class="ranking-card ${ativo}" data-formacao="${item.formacao}">
          <h3>${item.formacao}</h3>
          <div class="ranking-metricas">
            <span><strong>Score:</strong> ${fmtNumero(item.scoreTotal)}</span>
            <span><strong>Piso:</strong> ${fmtNumero(item.pisoTotal)}</span>
            <span><strong>Teto:</strong> ${fmtNumero(item.tetoTotal)}</span>
            <span><strong>Custo:</strong> ${fmtCartoletas(item.custoTitulares)}</span>
            <span><strong>Stack:</strong> ${fmtNumero(item.bonusStack)}</span>
          </div>
        </article>
      `;
    })
    .join("");

  rankingGridOrcamento.querySelectorAll(".ranking-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectFormacaoOrcamento.value = card.dataset.formacao;
      renderPaginaOrcamento(card.dataset.formacao);
    });
  });
}

function renderResumoOrcamento(formacao) {
  const ranking = dataOrcamento.ranking.find((item) => item.formacao === formacao);
  if (!ranking) {
    resumoFormacaoOrcamento.innerHTML = "<p>Nenhum resumo disponível.</p>";
    return;
  }

  const orcamento = Number(dataOrcamento.meta.orcamento || 0);
  const custo = Number(ranking.custoTitulares || 0);
  const sobra = Math.max(0, orcamento - custo);
  const obrigatorios = renderRestricoesOrcamento(dataOrcamento.meta.jogadoresObrigatorios, "restricao-vazia-ok");
  const bloqueados = renderRestricoesOrcamento(dataOrcamento.meta.jogadoresBloqueados, "restricao-vazia-bad");

  resumoFormacaoOrcamento.innerHTML = `
    <div class="section-title">
      <h3>Formação ${ranking.formacao}</h3>
      <small>Rodada ${dataOrcamento.meta.rodada || "-"}</small>
    </div>
    <p>Comparação entre formações sob teto de cartoletas, priorizando o melhor score possível dentro do orçamento definido manualmente.</p>
    <div class="orcamento-kpis">
      <span class="resumo-badge"><strong>Orçamento:</strong> ${fmtCartoletas(orcamento)}</span>
      <span class="resumo-badge"><strong>Custo Titulares:</strong> ${fmtCartoletas(custo)}</span>
      <span class="resumo-badge"><strong>Sobra:</strong> ${fmtCartoletas(sobra)}</span>
      <span class="resumo-badge"><strong>Score Total:</strong> ${fmtNumero(ranking.scoreTotal)}</span>
      <span class="resumo-badge"><strong>Piso Total:</strong> ${fmtNumero(ranking.pisoTotal)}</span>
      <span class="resumo-badge"><strong>Teto Total:</strong> ${fmtNumero(ranking.tetoTotal)}</span>
      <span class="resumo-badge"><strong>Bônus de Stack:</strong> ${fmtNumero(ranking.bonusStack)}</span>
    </div>
    <div class="restricoes-grid">
      <div class="restricoes-card">
        <strong>Jogadores Obrigatórios</strong>
        <div class="restricoes-tags">${obrigatorios}</div>
      </div>
      <div class="restricoes-card">
        <strong>Jogadores Bloqueados</strong>
        <div class="restricoes-tags">${bloqueados}</div>
      </div>
    </div>
  `;
}

function renderTitularesOrcamento(formacao) {
  const lista = ordenarPosicoesOrcamento(dataOrcamento.formacoes?.[formacao]?.titulares || []);
  tabelaTitularesOrcamento.innerHTML = `
    <table class="player-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Jogador</th>
          <th>Preço</th>
          <th>Local</th>
          <th>Adv</th>
          <th>Nota</th>
          <th>Piso</th>
          <th>Teto</th>
          <th>Contexto</th>
        </tr>
      </thead>
      <tbody>
        ${lista
          .map((jogador) => {
            const contexto = contextoTextoOrcamento(jogador);
            return `
              <tr>
                <td>${jogador.posicao}</td>
                <td>${playerIdentidadeOrcamento(jogador)}</td>
                <td>${fmtCartoletas(jogador.preco)}</td>
                <td>${localTagOrcamento(jogador.local)}</td>
                <td>${jogador.adversario}</td>
                <td>${fmtNumero(jogador.notaEscalacao)}</td>
                <td>${fmtNumero(jogador.pisoRodada)}</td>
                <td>${fmtNumero(jogador.tetoRodada)}</td>
                <td><span class="context-tag ${contexto.classe}">${contexto.texto}</span></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBancoOrcamento(formacao) {
  const lista = ordenarPosicoesOrcamento(dataOrcamento.formacoes?.[formacao]?.banco || []);
  tabelaBancoOrcamento.innerHTML = `
    <table class="player-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Reserva</th>
          <th>Jogador</th>
          <th>Preço</th>
          <th>Local</th>
          <th>Adv</th>
          <th>Nota</th>
        </tr>
      </thead>
      <tbody>
        ${lista
          .map(
            (jogador) => `
              <tr>
                <td>${jogador.posicao}</td>
                <td>${jogador.reservaOrdem || "-"}</td>
                <td>${playerIdentidadeOrcamento(jogador)}</td>
                <td>${fmtCartoletas(jogador.preco)}</td>
                <td>${localTagOrcamento(jogador.local)}</td>
                <td>${jogador.adversario}</td>
                <td>${fmtNumero(jogador.notaEscalacao)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderPaginaOrcamento(formacao) {
  renderRankingCardsOrcamento(formacao);
  renderResumoOrcamento(formacao);
  renderTitularesOrcamento(formacao);
  renderBancoOrcamento(formacao);
}

function initOrcamento() {
  const formacoes = dataOrcamento.ranking.map((item) => item.formacao);
  selectFormacaoOrcamento.innerHTML = formacoes
    .map((formacao) => `<option value="${formacao}">${formacao}</option>`)
    .join("");

  const inicial = dataOrcamento.meta.melhorFormacao || formacoes[0];
  selectFormacaoOrcamento.value = inicial;
  selectFormacaoOrcamento.addEventListener("change", (event) => {
    renderPaginaOrcamento(event.target.value);
  });

  renderPaginaOrcamento(inicial);
}

initOrcamento();
