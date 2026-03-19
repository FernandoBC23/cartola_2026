function obterDataset(nome) {
  if (nome === "rodadasLocalData" && typeof rodadasLocalData !== "undefined") return rodadasLocalData;
  if (nome === "pesosTimes" && typeof pesosTimes !== "undefined") return pesosTimes;
  if (nome === "mediaGolsClubes" && typeof mediaGolsClubes !== "undefined") return mediaGolsClubes;
  if (nome === "desempenhoTimes" && typeof desempenhoTimes !== "undefined") return desempenhoTimes;
  if (nome === "eficienciaMandanteVisitante" && typeof eficienciaMandanteVisitante !== "undefined") return eficienciaMandanteVisitante;
  if (nome === "mediaPontosTimes" && typeof mediaPontosTimes !== "undefined") return mediaPontosTimes;
  if (typeof window[nome] !== "undefined") return window[nome];
  if (typeof globalThis[nome] !== "undefined") return globalThis[nome];
  return [];
}

const rodadasLocalDataRef = obterDataset("rodadasLocalData");
const pesosTimesRef = obterDataset("pesosTimes");
const mediaGolsClubesRef = obterDataset("mediaGolsClubes");
const desempenhoTimesRef = obterDataset("desempenhoTimes");
const eficienciaMandanteVisitanteRef = obterDataset("eficienciaMandanteVisitante");
const mediaPontosTimesRef = obterDataset("mediaPontosTimes");

const listaConfrontos = document.getElementById("lista-confrontos");
const rodadaAtualEl = document.getElementById("rodada-atual");
const jogosAtualEl = document.getElementById("jogos-atual");
const modoPreRodadaCheckbox = document.getElementById("modo-pre-rodada");

function detectarRodadaAtual() {
  const rodadas = rodadasLocalDataRef
    .map((jogo) => Number(jogo.Rodada))
    .filter((rodada) => Number.isFinite(rodada));

  return rodadas.length ? Math.max(...rodadas) : null;
}

function mapPorClube(lista) {
  return new Map((lista || []).map((item) => [item["Clube ID"], item]));
}

const pesosPorClube = mapPorClube(pesosTimesRef);
const golsPorClube = mapPorClube(mediaGolsClubesRef);
const desempenhoPorClube = mapPorClube(desempenhoTimesRef);
const eficienciaPorClube = mapPorClube(eficienciaMandanteVisitanteRef);
const pontosPorClube = mapPorClube(mediaPontosTimesRef);

function fmt(numero, casas = 2) {
  return Number(numero || 0).toFixed(casas);
}

function modoPreRodadaAtivo() {
  return Boolean(modoPreRodadaCheckbox?.checked);
}

function resultadoDoClube(jogo, clube, rodadaLimite = null) {
  const casa = jogo["Clube Casa"];
  const fora = jogo["Clube Visitante"];
  const placarCasa = Number(jogo["Placar Casa"]);
  const placarFora = Number(jogo["Placar Visitante"]);
  if (rodadaLimite != null && Number(jogo.Rodada) >= rodadaLimite) return null;
  if (jogo["Placar Casa"] == null || jogo["Placar Visitante"] == null) return null;

  if (clube === casa) {
    const prefixo = placarCasa > placarFora ? "V" : placarCasa < placarFora ? "D" : "E";
    return { mando: "Casa", texto: `${prefixo} ${placarCasa}-${placarFora} ${fora}` };
  }
  if (clube === fora) {
    const prefixo = placarFora > placarCasa ? "V" : placarFora < placarCasa ? "D" : "E";
    return { mando: "Fora", texto: `${prefixo} ${placarFora}-${placarCasa} ${casa}` };
  }
  return null;
}

function ultimosResultados(clube, rodadaLimite = null, limite = 4) {
  return [...rodadasLocalDataRef]
    .filter((jogo) => jogo["Clube Casa"] === clube || jogo["Clube Visitante"] === clube)
    .filter((jogo) => (rodadaLimite == null ? true : Number(jogo.Rodada) < rodadaLimite))
    .filter((jogo) => jogo["Placar Casa"] != null && jogo["Placar Visitante"] != null)
    .sort((a, b) => Number(b.Rodada) - Number(a.Rodada))
    .map((jogo) => resultadoDoClube(jogo, clube, rodadaLimite))
    .filter(Boolean)
    .slice(0, limite);
}

function separarResultadosPorMando(resultados) {
  return resultados.reduce(
    (acc, item) => {
      if (item?.mando === "Casa") acc.casa.push(item);
      else if (item?.mando === "Fora") acc.fora.push(item);
      return acc;
    },
    { casa: [], fora: [] }
  );
}

function renderListaResultados(itens, vazioTexto) {
  if (!itens.length) return `<span class="confrontos-resultado-vazio">${vazioTexto}</span>`;
  return itens.map((item) => `<span class="selo confrontos-resultado-item">${item.texto}</span>`).join("");
}

function scoreContextoMando(resumo) {
  return (
    (resumo?.peso || 0) * 0.45 +
    (resumo?.mediaPontos || 0) * 12 +
    (resumo?.mediaGM || 0) * 7 -
    (resumo?.mediaGS || 0) * 6 +
    (resumo?.saldo || 0) * 1.5 +
    (resumo?.eficiencia || 0) * 0.18
  );
}

function fatorConfiancaMando(resumo) {
  const jogos = Number(resumo?.jogosLocal || 0);
  return Math.min(1, jogos / 4);
}

function leituraFavoritismo(resumoCasa, resumoFora) {
  const scoreCasaMando = scoreContextoMando(resumoCasa);
  const scoreForaMando = scoreContextoMando(resumoFora);

  const scoreCasaBase = (resumoCasa?.peso || 0) * 0.85;
  const scoreForaBase = (resumoFora?.peso || 0) * 0.85;

  const confiancaCasa = fatorConfiancaMando(resumoCasa);
  const confiancaFora = fatorConfiancaMando(resumoFora);

  const scoreCasa = scoreCasaBase * (1 - confiancaCasa) + scoreCasaMando * confiancaCasa;
  const scoreFora = scoreForaBase * (1 - confiancaFora) + scoreForaMando * confiancaFora;
  const diff = scoreCasa - scoreFora;

  const amostraCurta = Math.min(confiancaCasa, confiancaFora) < 0.75;

  let selo = "Confronto equilibrado";
  if (!amostraCurta) {
    if (diff >= 16) selo = "Mandante forte favorito";
    else if (diff <= -16) selo = "Visitante forte favorito";
  }
  if (selo === "Confronto equilibrado") {
    if (diff >= 7) selo = "Mandante favorito";
    else if (diff <= -7) selo = "Visitante favorito";
  }

  return {
    selo,
    diff,
    scoreCasa,
    scoreFora,
    amostraCurta,
  };
}

function sinaisCartoleiros(casaClube, foraClube, casaPeso, foraPeso, casaGols, foraGols) {
  const sinais = [];
  const potencialAtaqueCasa = (casaGols?.["Media Gols Marcados Casa"] || 0) + (foraGols?.["Media Gols Sofridos Fora"] || 0);
  const potencialAtaqueFora = (foraGols?.["Media Gols Marcados Fora"] || 0) + (casaGols?.["Media Gols Sofridos Casa"] || 0);

  if (potencialAtaqueCasa >= 2.8) sinais.push(`Bom para ataque do ${casaClube}`);
  if (potencialAtaqueFora >= 2.5) sinais.push(`Bom para ataque do ${foraClube}`);
  if ((casaGols?.["Media Gols Sofridos Casa"] || 0) <= 0.8 && (foraGols?.["Media Gols Marcados Fora"] || 0) <= 1) sinais.push(`Bom para defesa do ${casaClube}`);
  if ((foraGols?.["Media Gols Sofridos Fora"] || 0) <= 0.8 && (casaGols?.["Media Gols Marcados Casa"] || 0) <= 1) sinais.push(`Bom para defesa do ${foraClube}`);
  if ((casaPeso?.["Peso Casa"] || 0) < 50 && (foraPeso?.["Peso Fora"] || 0) < 50) sinais.push("Jogo de baixo peso tecnico");
  if (!sinais.length) sinais.push("Jogo sem vantagem clara");

  return sinais;
}

function resumoTime(clube, tipo, rodadaLimite = null) {
  const peso = pesosPorClube.get(clube) || {};
  const gols = golsPorClube.get(clube) || {};
  const desempenho = desempenhoPorClube.get(clube) || {};
  const eficiencia = eficienciaPorClube.get(clube) || {};
  const pontos = pontosPorClube.get(clube) || {};

  const emCasa = tipo === "casa";
  return {
    peso: emCasa ? peso["Peso Casa"] : peso["Peso Fora"],
    mediaGM: emCasa ? gols["Media Gols Marcados Casa"] : gols["Media Gols Marcados Fora"],
    mediaGS: emCasa ? gols["Media Gols Sofridos Casa"] : gols["Media Gols Sofridos Fora"],
    saldo: emCasa ? gols["Saldo Gols Casa"] : gols["Saldo Gols Fora"],
    mediaPontos: emCasa ? pontos["Media Pontos por Jogo Casa"] : pontos["Media Pontos por Jogo Fora"],
    eficiencia: emCasa ? eficiencia["% Vitorias Casa"] : eficiencia["% Vitorias Fora"],
    jogosLocal: emCasa ? desempenho["Jogos Casa"] : desempenho["Jogos Fora"],
    vitorias: emCasa ? desempenho["Vitorias Casa"] : desempenho["Vitorias Fora"],
    empates: emCasa ? desempenho["Empates Casa"] : desempenho["Empates Fora"],
    derrotas: emCasa ? desempenho["Derrotas Casa"] : desempenho["Derrotas Fora"],
    recentes: ultimosResultados(clube, rodadaLimite),
  };
}

function renderCardConfronto(jogo, rodadaAtual) {
  const casa = jogo["Clube Casa"];
  const fora = jogo["Clube Visitante"];
  const resumoCasa = resumoTime(casa, "casa", modoPreRodadaAtivo() ? rodadaAtual : null);
  const resumoFora = resumoTime(fora, "fora", modoPreRodadaAtivo() ? rodadaAtual : null);
  const recentesCasa = separarResultadosPorMando(resumoCasa.recentes);
  const recentesFora = separarResultadosPorMando(resumoFora.recentes);
  const favoritismo = leituraFavoritismo(resumoCasa, resumoFora);
  const sinais = sinaisCartoleiros(casa, fora, pesosPorClube.get(casa), pesosPorClube.get(fora), golsPorClube.get(casa), golsPorClube.get(fora));
  const diffPeso = (resumoCasa.peso || 0) - (resumoFora.peso || 0);
  const encerrado = !modoPreRodadaAtivo() && jogo["Placar Casa"] != null && jogo["Placar Visitante"] != null;
  const statusJogo = encerrado
    ? `Encerrado: ${jogo["Placar Casa"]} x ${jogo["Placar Visitante"]}`
    : modoPreRodadaAtivo()
      ? "Leitura pre-rodada"
      : "Pendente";

  return `
    <article class="confrontos-card">
      <div class="confrontos-topo">
        <div>
          <h3>${casa} x ${fora}</h3>
          <p>${jogo.Data} · ${jogo["Horario"] || jogo["Horário"] || jogo["HorÃ¡rio"] || jogo["HorÃƒÂ¡rio"] || ""} · ${jogo.Local}</p>
        </div>
        <span class="selo">${favoritismo.selo}</span>
      </div>

      <div class="confrontos-resumo">
        <span class="time-tag">${statusJogo}</span>
        <span class="time-tag">Dif. peso: ${fmt(diffPeso, 1)}</span>
        <span class="time-tag">Ind. fav.: ${fmt(favoritismo.diff, 1)}</span>
        <span class="time-tag">${casa} ${fmt(resumoCasa.peso, 1)}</span>
        <span class="time-tag">${fora} ${fmt(resumoFora.peso, 1)}</span>
        ${favoritismo.amostraCurta ? '<span class="time-tag">Amostra curta</span>' : ""}
      </div>

      <div class="confrontos-times">
        <section class="confrontos-coluna">
          <h4>${casa} (casa)</h4>
          <div class="confrontos-stats">
            <div class="stat-line"><span>Peso</span><strong>${fmt(resumoCasa.peso, 1)}</strong></div>
            <div class="stat-line"><span>Ataque</span><strong>${fmt(resumoCasa.mediaGM)}</strong></div>
            <div class="stat-line"><span>Defesa</span><strong>${fmt(resumoCasa.mediaGS)}</strong></div>
            <div class="stat-line"><span>Media pts</span><strong>${fmt(resumoCasa.mediaPontos)}</strong></div>
            <div class="stat-line"><span>Vitorias</span><strong>${fmt(resumoCasa.eficiencia, 1)}%</strong></div>
            <div class="stat-line"><span>Saldo</span><strong>${fmt(resumoCasa.saldo, 0)}</strong></div>
          </div>
        </section>

        <section class="confrontos-coluna">
          <h4>${fora} (fora)</h4>
          <div class="confrontos-stats">
            <div class="stat-line"><span>Peso</span><strong>${fmt(resumoFora.peso, 1)}</strong></div>
            <div class="stat-line"><span>Ataque</span><strong>${fmt(resumoFora.mediaGM)}</strong></div>
            <div class="stat-line"><span>Defesa</span><strong>${fmt(resumoFora.mediaGS)}</strong></div>
            <div class="stat-line"><span>Media pts</span><strong>${fmt(resumoFora.mediaPontos)}</strong></div>
            <div class="stat-line"><span>Vitorias</span><strong>${fmt(resumoFora.eficiencia, 1)}%</strong></div>
            <div class="stat-line"><span>Saldo</span><strong>${fmt(resumoFora.saldo, 0)}</strong></div>
          </div>
        </section>
      </div>

      <div class="confrontos-bloco">
        <h4>Ultimos Resultados</h4>
        <div class="confrontos-ultimos">
          <section class="confrontos-ultimos-coluna">
            <h5>${casa}</h5>
            <div class="confrontos-ultimos-mandos">
              <div class="confrontos-mando-bloco">
                <h6>Casa</h6>
                <div class="confrontos-lista confrontos-lista-vertical">
                  ${renderListaResultados(recentesCasa.casa, "Sem jogos recentes")}
                </div>
              </div>
              <div class="confrontos-mando-bloco">
                <h6>Fora</h6>
                <div class="confrontos-lista confrontos-lista-vertical">
                  ${renderListaResultados(recentesCasa.fora, "Sem jogos recentes")}
                </div>
              </div>
            </div>
          </section>
          <section class="confrontos-ultimos-coluna">
            <h5>${fora}</h5>
            <div class="confrontos-ultimos-mandos">
              <div class="confrontos-mando-bloco">
                <h6>Casa</h6>
                <div class="confrontos-lista confrontos-lista-vertical">
                  ${renderListaResultados(recentesFora.casa, "Sem jogos recentes")}
                </div>
              </div>
              <div class="confrontos-mando-bloco">
                <h6>Fora</h6>
                <div class="confrontos-lista confrontos-lista-vertical">
                  ${renderListaResultados(recentesFora.fora, "Sem jogos recentes")}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="confrontos-bloco">
        <h4>Sinais da Rodada</h4>
        <div class="confrontos-sinais">
          ${sinais.map((item) => `<span class="selo">${item}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPagina() {
  const rodada = detectarRodadaAtual();
  if (!rodada) {
    listaConfrontos.innerHTML = '<div class="empty-state">Nenhuma rodada encontrada nos datasets atuais.</div>';
    return;
  }

  const confrontos = rodadasLocalDataRef.filter((jogo) => Number(jogo.Rodada) === rodada);
  const jogosPendentes = confrontos.filter((jogo) => jogo["Placar Casa"] == null || jogo["Placar Visitante"] == null).length;

  rodadaAtualEl.textContent = `Rodada ${rodada}`;
  jogosAtualEl.textContent = modoPreRodadaAtivo()
    ? `${confrontos.length} jogos · leitura pre-rodada`
    : `${confrontos.length} jogos · ${jogosPendentes} pendente(s)`;

  if (!confrontos.length) {
    listaConfrontos.innerHTML = '<div class="empty-state">A rodada atual nao tem confrontos para exibir.</div>';
    return;
  }

  listaConfrontos.innerHTML = confrontos.map((jogo) => renderCardConfronto(jogo, rodada)).join("");
}

modoPreRodadaCheckbox?.addEventListener("change", renderPagina);
renderPagina();
