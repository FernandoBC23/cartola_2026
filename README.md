# cartola_2026

Painel estatico para acompanhar ligas e competicoes do Cartola 2026, com dois portais (Leon e Aluna) e acesso rapido a paginas por torneio.

## Visao geral
- Home com selecao de portal: `index.html`
- Portal Leon: `portal-leon/index.html`
- Portal Aluna: `portal-aluna/index.html`
- Paginas por competicao: Libertadores, Sul-Americana, Liga Classica, Eliminacao, Series A/B/C e Pontos Corridos
- Assets em `imagens/` e estilos em `css/`

## Estrutura do projeto
- `index.html`: pagina inicial com escolha de portal
- `portal-leon/` e `portal-aluna/`: entradas dos portais
- `libertadores/`, `sulamericana/`, `liga_classica/`, `liga_eliminacao/`, `liga_serie_A/`, `liga_serie_B/`, `liga_serie_C/`, `pontos_corridos/`, `copa/`, `campeoes/`, `scouts/`: paginas das competicoes
- `css/`: estilos globais e especificos
- `imagens/`: logos e escudos
- `scripts/escudos_times.js`: mapeamento de times para escudos
- `transicoes.js`: animacoes de transicao entre paginas

## Como executar
Este projeto nao precisa de build. Voce pode:
1. Abrir `index.html` diretamente no navegador, ou
2. Servir com um servidor local simples para evitar problemas de caminho.

Exemplos de servidor local (opcional):
- VS Code: extensao "Live Server"
- Node.js: `npx serve .`

## Como atualizar conteudo
- Para trocar imagens, substitua arquivos em `imagens/`
- Para ajustar estilos, edite `css/`
- Para adicionar/atualizar escudos de times, edite `scripts/escudos_times.js`
- Para incluir novas competicoes, crie paginas na pasta correspondente e adicione os cards nos portais

## Licenca
Consulte o arquivo `LICENSE`.
