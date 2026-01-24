
function escudoSrc(nome) {
  if (!nome) return "";
  const direto = window.escudosTimes?.[nome];
  if (direto) return direto;
  const base = window.ESCUDOS_BASE_PATH || "../imagens/";
  const padrao = window.ESCUDO_PADRAO || "escudo_default.png";
  if (padrao.startsWith("http") || padrao.startsWith("/") || padrao.includes("/")) {
    return padrao;
  }
  return `${base}${padrao}`;
}



document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpo-ranking-campeoes");

  const rankingOrdenado = [...rankingTop5Mensal].sort((a, b) => b.pontos - a.pontos);

  rankingOrdenado.forEach((time, index) => {
    const linha = document.createElement("tr");

    const celulaPos = document.createElement("td");
    celulaPos.textContent = `${index + 1}º`;

    const celulaNome = document.createElement("td");
    celulaNome.textContent = time.time;

    const escudoImg = escudoSrc(time.time)
      ? `<img src="${escudoSrc(time.time)}" alt="Escudo" class="escudo">`
      : "";
      celulaNome.innerHTML = `<span class="time-info">${escudoImg} ${time.time}</span>`;

    const celulaPontos = document.createElement("td");
    celulaPontos.textContent = time.pontos;

    const celulaAparicoes = document.createElement("td");
    celulaAparicoes.textContent = time.aparicoes;

    const celulaMeses = document.createElement("td");
    celulaMeses.textContent = time.posicoes.map(p => `${p.mes} (${p.posicao}º)`).join(", ");

    linha.appendChild(celulaPos);
    linha.appendChild(celulaNome);
    linha.appendChild(celulaPontos);
    linha.appendChild(celulaAparicoes);
    linha.appendChild(celulaMeses);

    corpoTabela.appendChild(linha);
  });
});
