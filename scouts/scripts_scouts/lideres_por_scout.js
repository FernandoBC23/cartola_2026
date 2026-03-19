const NOME_KEY = "Nome do Jogador";
const CLUBE_KEY = "Clube";
const JOGOS_KEY = "Jogos";
const JOGOS_CASA_KEY = "Jogos Casa";
const JOGOS_FORA_KEY = "Jogos Fora";

const SCOUTS_POSITIVOS = ["G", "A", "FT", "FD", "FF", "DS", "FS", "SG", "DE", "DP", "PS"];
const SCOUTS_NEGATIVOS = ["GS", "FC", "GC", "PP", "I", "CA", "CV"];
const TODOS_SCOUTS = [...SCOUTS_POSITIVOS, ...SCOUTS_NEGATIVOS];

const selectScout = document.getElementById("select-scout");
const selectPosicao = document.getElementById("select-posicao");
const selectMando = document.getElementById("select-mando");
const selectTipo = document.getElementById("select-tipo");
const usarLocalProximoJogoCheckbox = document.getElementById("usar-local-proximo-jogo");
const somenteProvaveisCheckbox = document.getElementById("somente-provaveis");
const destaqueContainer = document.getElementById("lideres-destaque");
const tabelaContainer = document.getElementById("lideres-tabela");

function obterScoutsTotais() {
  if (typeof scoutsTotais !== "undefined") return scoutsTotais;
  if (typeof window.scoutsTotais !== "undefined") return window.scoutsTotais;
  return {};
}

function obterRodadasLocalData() {
  if (typeof rodadasLocalData !== "undefined") return rodadasLocalData;
  if (typeof window.rodadasLocalData !== "undefined") return window.rodadasLocalData;
  return [];
}

function detectarChavePosicao(base) {
  const primeiroGrupo = Object.values(base || {})[0] || [];
  const primeiroJogador = primeiroGrupo[0] || {};
  const chave = Object.keys(primeiroJogador).find((key) => {
    const normalizada = String(key)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizada.includes("posi");
  });
  return chave || "Posicao";
}

function detectarProximaRodada(dadosRodadas) {
  const rodadasPendentes = (dadosRodadas || [])
    .filter((jogo) => jogo["Placar Casa"] == null || jogo["Placar Visitante"] == null)
    .map((jogo) => Number(jogo.Rodada))
    .filter((rodada) => Number.isFinite(rodada));

  if (rodadasPendentes.length) return Math.max(...rodadasPendentes);
  return null;
}

function construirMapaMandoProximoJogo() {
  const dadosRodadas = obterRodadasLocalData();
  const proximaRodada = detectarProximaRodada(dadosRodadas);
  if (!proximaRodada) return new Map();

  const mapa = new Map();
  dadosRodadas
    .filter((jogo) => Number(jogo.Rodada) === proximaRodada)
    .forEach((jogo) => {
      if (jogo["Clube Casa"]) mapa.set(jogo["Clube Casa"], "casa");
      if (jogo["Clube Visitante"]) mapa.set(jogo["Clube Visitante"], "fora");
    });

  return mapa;
}

function chaveScoutPorMando(scout, mando) {
  if (mando === "casa") return `${scout} Casa`;
  if (mando === "fora") return `${scout} Fora`;
  return scout;
}

function chaveJogosPorMando(mando) {
  if (mando === "casa") return JOGOS_CASA_KEY;
  if (mando === "fora") return JOGOS_FORA_KEY;
  return JOGOS_KEY;
}

function sufixoMando(mando) {
  if (mando === "casa") return "Casa";
  if (mando === "fora") return "Fora";
  return "Total";
}

function usarLocalProximoJogo() {
  return Boolean(usarLocalProximoJogoCheckbox?.checked);
}

function somenteProvaveis() {
  return Boolean(somenteProvaveisCheckbox?.checked);
}

function jogadorProvavel(jogador) {
  if (Number(jogador.statusId) === 7) return true;
  const statusNormalizado = String(jogador.status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return statusNormalizado.includes("provavel");
}

function normalizarJogadores() {
  const base = obterScoutsTotais();
  const posKey = detectarChavePosicao(base);
  return Object.entries(base).flatMap(([posicaoDoGrupo, jogadores]) =>
    (jogadores || []).map((jogador) => ({
      nome: jogador[NOME_KEY],
      clube: jogador[CLUBE_KEY],
      posicao: jogador[posKey] || posicaoDoGrupo,
      jogos: Number(jogador[JOGOS_KEY] || 0),
      statusId: Number(jogador.Status_ID ?? -1),
      status: jogador.Status || "Status indisponivel",
      bruto: jogador,
    }))
  );
}

const jogadoresBase = normalizarJogadores();
const mandoProximoJogoPorClube = construirMapaMandoProximoJogo();

function popularFiltros() {
  selectScout.innerHTML = TODOS_SCOUTS.map((scout) => `<option value="${scout}">${scout}</option>`).join("");

  const posicoes = [...new Set(jogadoresBase.map((j) => j.posicao))].sort();
  selectPosicao.innerHTML = ['<option value="todas">Todas</option>']
    .concat(posicoes.map((posicao) => `<option value="${posicao}">${posicao}</option>`))
    .join("");
}

function mandoEfetivoJogador(jogador) {
  if (!usarLocalProximoJogo()) return selectMando.value;
  return mandoProximoJogoPorClube.get(jogador.clube) || "total";
}

function filtrarJogadores() {
  const scout = selectScout.value;
  const posicao = selectPosicao.value;
  const tipo = selectTipo.value;

  let filtrados = jogadoresBase.filter((jogador) => (posicao === "todas" ? true : jogador.posicao === posicao));
  if (somenteProvaveis()) {
    filtrados = filtrados.filter((jogador) => jogadorProvavel(jogador));
  }

  filtrados = filtrados
    .map((jogador) => {
      const mando = mandoEfetivoJogador(jogador);
      const scoutKey = chaveScoutPorMando(scout, mando);
      const jogosKey = chaveJogosPorMando(mando);
      return {
        ...jogador,
        mandoEfetivo: mando,
        scoutAtual: Number(jogador.bruto[scoutKey] ?? jogador.bruto[scout] ?? 0),
        jogosAtual: Number(jogador.bruto[jogosKey] ?? jogador.jogos ?? 0),
      };
    })
    .filter((jogador) => (tipo === "todos" ? true : tipo === "positivos" ? jogador.scoutAtual > 0 : jogador.scoutAtual < 0))
    .filter((jogador) => (usarLocalProximoJogo() ? jogador.mandoEfetivo !== "total" && jogador.jogosAtual > 0 : selectMando.value === "total" ? true : jogador.jogosAtual > 0))
    .sort((a, b) => {
      if (tipo === "negativos") return a.scoutAtual - b.scoutAtual;
      return b.scoutAtual - a.scoutAtual;
    });

  return filtrados;
}

function renderAvisoMando(scout, mando) {
  if (usarLocalProximoJogo()) {
    const existeMapa = mandoProximoJogoPorClube.size > 0;
    const existeCampos = jogadoresBase.some((jogador) =>
      ["casa", "fora"].some((local) => Object.prototype.hasOwnProperty.call(jogador.bruto, chaveScoutPorMando(scout, local)))
    );
    if (existeMapa && existeCampos) return "";
    return `
      <div style="margin-bottom: 14px; padding: 12px 14px; border-left: 4px solid var(--destaque); background-color: rgba(255, 118, 4, 0.08); border-radius: 8px; color: var(--texto);">
        O modo do proximo jogo precisa dos scouts de Casa/Fora em <strong>scouts_totais.js</strong> e dos confrontos da rodada em
        <strong>rodadas_local_data.js</strong>.
      </div>
    `;
  }

  if (mando === "total") return "";
  const chave = chaveScoutPorMando(scout, mando);
  const existe = jogadoresBase.some((jogador) => Object.prototype.hasOwnProperty.call(jogador.bruto, chave));
  if (existe) return "";
  return `
    <div style="margin-bottom: 14px; padding: 12px 14px; border-left: 4px solid var(--destaque); background-color: rgba(255, 118, 4, 0.08); border-radius: 8px; color: var(--texto);">
      O filtro de mando ja esta preparado, mas o arquivo <strong>scouts_totais.js</strong> atual ainda nao foi regenerado com os campos
      <strong>${chave}</strong>.
    </div>
  `;
}

function renderDestaques(lista, scout, mando) {
  const top = lista.slice(0, 4);
  const labelScout = usarLocalProximoJogo()
    ? `${scout} Prox. Jogo`
    : mando === "total"
      ? scout
      : `${scout} ${sufixoMando(mando)}`;

  destaqueContainer.innerHTML = top
    .map(
      (jogador, index) => `
        <article class="lider-card">
          <h3>${index + 1}&ordm; Lugar</h3>
          <strong>${jogador.scoutAtual}</strong>
          <span>${jogador.nome}</span>
          <small>${jogador.clube} · ${jogador.posicao} · ${usarLocalProximoJogo() ? `${labelScout} (${sufixoMando(jogador.mandoEfetivo)})` : labelScout}</small>
        </article>
      `
    )
    .join("");
}

function renderTabela(lista, scout, mando) {
  const labelScout = usarLocalProximoJogo()
    ? `${scout} Prox. Jogo`
    : mando === "total"
      ? scout
      : `${scout} ${sufixoMando(mando)}`;
  const labelJogos = usarLocalProximoJogo()
    ? "Jogos no Local"
    : mando === "total"
      ? "Jogos"
      : `Jogos ${sufixoMando(mando)}`;

  tabelaContainer.innerHTML = `
    ${renderAvisoMando(scout, mando)}
    <div class="lideres-table-wrap">
      <table class="lideres-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Jogador</th>
            <th>Clube</th>
            <th>Posicao</th>
            ${usarLocalProximoJogo() ? "<th>Prox.</th>" : ""}
            <th>${labelScout}</th>
            <th>${labelJogos}</th>
            <th>Media/Jogo</th>
          </tr>
        </thead>
        <tbody>
          ${lista
            .slice(0, 20)
            .map(
              (jogador, index) => `
                <tr>
                  <td>${index + 1}&ordm;</td>
                  <td class="lider-name">${jogador.nome}</td>
                  <td><span class="lider-club">${jogador.clube}</span></td>
                  <td><span class="lider-pos">${jogador.posicao}</span></td>
                  ${usarLocalProximoJogo() ? `<td>${sufixoMando(jogador.mandoEfetivo)}</td>` : ""}
                  <td>${jogador.scoutAtual}</td>
                  <td>${jogador.jogosAtual}</td>
                  <td>${jogador.jogosAtual ? (jogador.scoutAtual / jogador.jogosAtual).toFixed(2) : "0.00"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPagina() {
  const scout = selectScout.value;
  const mando = selectMando.value;
  const lista = filtrarJogadores();

  selectMando.disabled = usarLocalProximoJogo();

  renderDestaques(lista, scout, mando);
  renderTabela(lista, scout, mando);
}

function init() {
  popularFiltros();
  selectScout.value = "DS";
  selectTipo.value = "positivos";
  selectMando.value = "total";
  selectScout.addEventListener("change", renderPagina);
  selectPosicao.addEventListener("change", renderPagina);
  selectMando.addEventListener("change", renderPagina);
  selectTipo.addEventListener("change", renderPagina);
  usarLocalProximoJogoCheckbox?.addEventListener("change", renderPagina);
  somenteProvaveisCheckbox?.addEventListener("change", renderPagina);
  renderPagina();
}

init();
