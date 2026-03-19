const ORDEM_POSICOES = {
  Goleiro: 1,
  Lateral: 2,
  Zagueiro: 3,
  Meia: 4,
  Atacante: 5,
  "Técnico": 6,
};

const dataEscalacoes = window.escalacoesRodada || { ranking: [], formacoes: {}, meta: {} };

const selectFormacao = document.getElementById("select-formacao");
const rankingGrid = document.getElementById("ranking-formacoes");
const resumoFormacao = document.getElementById("resumo-formacao");
const tabelaTitulares = document.getElementById("tabela-titulares");
const tabelaBanco = document.getElementById("tabela-banco");
const tabelaBancoEconomico = document.getElementById("tabela-banco-economico");
const fmt = (valor) => Number(valor || 0).toFixed(2);
const fmtCartoletas = (valor) => `${Number(valor || 0).toFixed(2)} C$`;

function ordenarPosicoes(lista) {
  return [...(lista || [])].sort((a, b) => {
    const ordemA = ORDEM_POSICOES[a.posicao] || 999;
    const ordemB = ORDEM_POSICOES[b.posicao] || 999;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return (b.notaEscalacao || 0) - (a.notaEscalacao || 0);
  });
}

function contextoTexto(jogador) {
  if (jogador.contextoFavoravel) return { texto: "Favorável", classe: "favoravel" };
  if (jogador.contextoDesfavoravel) return { texto: "Desfavorável", classe: "desfavoravel" };
  return { texto: "Neutro", classe: "neutro" };
}

function localTag(local) {
  return `<span class="local-tag ${local}">${local === "casa" ? "Casa" : "Fora"}</span>`;
}

function playerIdentidade(jogador) {
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

function renderRankingCards(formacaoAtiva) {
  rankingGrid.innerHTML = dataEscalacoes.ranking
    .map((item) => {
      const ativo = item.formacao === formacaoAtiva ? "ativo" : "";
      return `
        <article class="ranking-card ${ativo}" data-formacao="${item.formacao}">
          <h3>${item.formacao}</h3>
          <div class="ranking-metricas">
            <span><strong>Score:</strong> ${fmt(item.scoreTotal)}</span>
            <span><strong>Piso:</strong> ${fmt(item.pisoTotal)}</span>
            <span><strong>Teto:</strong> ${fmt(item.tetoTotal)}</span>
            <span><strong>Stack:</strong> ${fmt(item.bonusStack)}</span>
          </div>
        </article>
      `;
    })
    .join("");

  rankingGrid.querySelectorAll(".ranking-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectFormacao.value = card.dataset.formacao;
      renderPagina(card.dataset.formacao);
    });
  });
}

function renderResumo(formacao) {
  const ranking = dataEscalacoes.ranking.find((item) => item.formacao === formacao);
  if (!ranking) {
    resumoFormacao.innerHTML = "<p>Nenhum resumo disponível.</p>";
    return;
  }
  const custoTitulares = ordenarPosicoes([
    ...(dataEscalacoes.formacoes?.[formacao]?.titulares || []),
    ...(dataEscalacoes.tecnicos?.titular ? [dataEscalacoes.tecnicos.titular] : []),
  ]).reduce((total, jogador) => total + Number(jogador.preco || 0), 0);

  const clubes = (ranking.clubesBloqueadosDefesa || [])
    .map((clube) => `<span class="club-tag">${clube}</span>`)
    .join("");

  resumoFormacao.innerHTML = `
    <div class="section-title">
      <h3>Formação ${ranking.formacao}</h3>
      <small>Rodada ${dataEscalacoes.meta.rodada || "-"}</small>
    </div>
    <p>Comparação entre as formações geradas na etapa final do notebook, respeitando as regras de negócio atuais.</p>
    <div class="resumo-badges">
      <span class="resumo-badge"><strong>Score Total:</strong> ${fmt(ranking.scoreTotal)}</span>
      <span class="resumo-badge"><strong>Piso Total:</strong> ${fmt(ranking.pisoTotal)}</span>
      <span class="resumo-badge"><strong>Teto Total:</strong> ${fmt(ranking.tetoTotal)}</span>
      <span class="resumo-badge"><strong>Custo Titulares:</strong> ${fmtCartoletas(custoTitulares)}</span>
      <span class="resumo-badge"><strong>Bônus de Stack:</strong> ${fmt(ranking.bonusStack)}</span>
    </div>
    <div class="clubes-bloqueados">${clubes}</div>
  `;
}

function renderTitulares(formacao) {
  const lista = ordenarPosicoes([
    ...(dataEscalacoes.formacoes?.[formacao]?.titulares || []),
    ...(dataEscalacoes.tecnicos?.titular ? [dataEscalacoes.tecnicos.titular] : []),
  ]);
  tabelaTitulares.innerHTML = `
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
          <th>Amostra</th>
          <th>Contexto</th>
        </tr>
      </thead>
      <tbody>
        ${lista
          .map((jogador) => {
            const contexto = contextoTexto(jogador);
            return `
              <tr>
                <td>${jogador.posicao}</td>
                <td>${playerIdentidade(jogador)}</td>
                <td>${fmtCartoletas(jogador.preco)}</td>
                <td>${localTag(jogador.local)}</td>
                <td>${jogador.adversario}</td>
                <td>${fmt(jogador.notaEscalacao)}</td>
                <td>${fmt(jogador.pisoRodada)}</td>
                <td>${fmt(jogador.tetoRodada)}</td>
                <td>${fmt(jogador.fatorAmostraLocal)}</td>
                <td><span class="context-tag ${contexto.classe}">${contexto.texto}</span></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBanco(formacao) {
  const tecnicoTitular = dataEscalacoes.tecnicos?.titular || null;
  const bancoBase = (dataEscalacoes.formacoes?.[formacao]?.banco || []).filter(
    (jogador) => jogador.posicao !== "Técnico"
  );
  const tecnicosReserva = (dataEscalacoes.tecnicos?.ranking || [])
    .filter((jogador) => {
      if (!tecnicoTitular) return true;
      return !(jogador.nome === tecnicoTitular.nome && jogador.clube === tecnicoTitular.clube);
    })
    .slice(0, 2)
    .map((jogador, index) => ({
      ...jogador,
      reservaOrdem: index + 1,
    }));

  const lista = ordenarPosicoes([...bancoBase, ...tecnicosReserva]);
  tabelaBanco.innerHTML = `
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
          <th>Piso</th>
          <th>Teto</th>
        </tr>
      </thead>
      <tbody>
        ${lista
          .map(
            (jogador) => `
              <tr>
                <td>${jogador.posicao}</td>
                <td>${jogador.reservaOrdem || "-"}</td>
                <td>${playerIdentidade(jogador)}</td>
                <td>${fmtCartoletas(jogador.preco)}</td>
                <td>${localTag(jogador.local)}</td>
                <td>${jogador.adversario}</td>
                <td>${fmt(jogador.notaEscalacao)}</td>
                <td>${fmt(jogador.pisoRodada)}</td>
                <td>${fmt(jogador.tetoRodada)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBancoEconomico(formacao) {
  const lista = ordenarPosicoes(dataEscalacoes.formacoes?.[formacao]?.bancoEconomico || []);
  if (!lista.length) {
    tabelaBancoEconomico.innerHTML = "<p>Nenhum banco econômico disponível para esta formação.</p>";
    return;
  }

  tabelaBancoEconomico.innerHTML = `
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
          <th>Piso</th>
          <th>Teto</th>
        </tr>
      </thead>
      <tbody>
        ${lista
          .map(
            (jogador) => `
              <tr>
                <td>${jogador.posicao}</td>
                <td>${jogador.reservaOrdem || "-"}</td>
                <td>${playerIdentidade(jogador)}</td>
                <td>${fmtCartoletas(jogador.preco)}</td>
                <td>${localTag(jogador.local)}</td>
                <td>${jogador.adversario}</td>
                <td>${fmt(jogador.notaEscalacao)}</td>
                <td>${fmt(jogador.pisoRodada)}</td>
                <td>${fmt(jogador.tetoRodada)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderPagina(formacao) {
  renderRankingCards(formacao);
  renderResumo(formacao);
  renderTitulares(formacao);
  renderBanco(formacao);
  renderBancoEconomico(formacao);
}

function init() {
  const formacoes = dataEscalacoes.ranking.map((item) => item.formacao);
  selectFormacao.innerHTML = formacoes
    .map((formacao) => `<option value="${formacao}">${formacao}</option>`)
    .join("");

  const inicial = dataEscalacoes.meta.melhorFormacao || formacoes[0];
  selectFormacao.value = inicial;
  selectFormacao.addEventListener("change", (event) => {
    renderPagina(event.target.value);
  });

  renderPagina(inicial);
}

init();
