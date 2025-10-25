// ===== CONFIGURAÇÃO INICIAL =====
// Pegue sua chave gratuita em: http://www.omdbapi.com/apikey.aspx
let CHAVE_API = typeof OMDB_API_KEY !== "undefined" ? OMDB_API_KEY : "SUA_CHAVE_AQUI";
let TMDB_API_KEY_LOCAL = typeof TMDB_API_KEY !== "undefined" ? TMDB_API_KEY : "SUA_CHAVE_AQUI";

const URL_BASE = "https://www.omdbapi.com/";
const TMDB_URL = "https://api.themoviedb.org/3";

// ===== CONEXÃO COM O HTML =====
const campoBusca = document.getElementById("campo-busca");
const listaResultados = document.getElementById("lista-resultados");
const mensagemStatus = document.getElementById("mensagem-status");

// ===== VARIÁVEIS DE CONTROLE =====
let termoBusca = "";      // Texto digitado pelo usuário
let paginaAtual = 1;      // Página de resultados (a API retorna 10 por página)

// ===== FUNÇÃO DO BOTÃO "BUSCAR" =====
function buscarFilmes() {
  termoBusca = campoBusca.value.trim(); // remove espaços extras
  paginaAtual = 1;                      // sempre começa da página 1
  pesquisarFilmes();                    // chama a função que faz a requisição
}

// ===== FUNÇÃO DO BOTÃO "PRÓXIMA PÁGINA" =====
function proximaPagina() {
  paginaAtual++;
  pesquisarFilmes();
}

// ===== FUNÇÃO DO BOTÃO "ANTERIOR" =====
function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    pesquisarFilmes();
  }
}

// ===== FUNÇÃO PRINCIPAL DE PESQUISA =====
async function pesquisarFilmes() {
  listaResultados.innerHTML = "";
  // Valida se o campo está vazio
  if (!termoBusca) {
    mensagemStatus.textContent = "Digite o nome de um filme para pesquisar.";
    return;
  }

  // Mostra mensagem de carregando
  mensagemStatus.textContent = "🔄 Buscando filmes, aguarde...";

  try {
    // Monta a URL com a chave e o termo buscado
    const url = `${URL_BASE}?apikey=${CHAVE_API}&s=${encodeURIComponent(termoBusca)}&page=${paginaAtual}`;
    
    // Faz a chamada na API
    const resposta = await fetch(url);
    const dados = await resposta.json();

    // Verifica se encontrou algo
    if (dados.Response === "False") {
      mensagemStatus.textContent = "Nenhum resultado encontrado.";
      return;
    }

    // Mostra os filmes na tela
    exibirFilmes(dados.Search);

     // Calcula total de páginas e resultados
    const totalResultados = parseInt(dados.totalResults, 10) || 0;
    const totalPaginas = Math.ceil(totalResultados / 10);

    mensagemStatus.textContent = `Página ${paginaAtual} de ${totalPaginas} — ${totalResultados} resultados para "${termoBusca}"`;

  } catch (erro) {
    console.error(erro);
    mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique sua conexão.";
  }
}

// ===== FUNÇÃO PARA MOSTRAR FILMES =====
function exibirFilmes(filmes) {
  listaResultados.innerHTML = ""; // limpa os resultados anteriores

  filmes.forEach(filme => {
    // Cria o container do card
    const div = document.createElement("div");
    div.classList.add("card");

    // Se não houver pôster, usa uma imagem padrão
    const poster = filme.Poster !== "N/A"
      ? filme.Poster
      : "https://via.placeholder.com/300x450?text=Sem+Poster";

    // Monta o HTML do card
    div.innerHTML = `
      <img src="${poster}" alt="Pôster do filme ${filme.Title}">
      <h3>${filme.Title}</h3>
      <p>Ano: ${filme.Year}</p>
    `;

    // Adiciona o card dentro da lista
    listaResultados.appendChild(div);
  });
}


// ===== INTEGRAÇÃO COM TMDb =====
// Pegue uma chave gratuita em: https://www.themoviedb.org/settings/api

// ===== VARIÁVEIS DE CONTROLE PARA ATORES =====
let termoAtor = "";
let paginaAtorAtual = 1;

// ===== FUNÇÃO DO BOTÃO "BUSCAR POR ATOR" (inicia na página 1) =====
function buscarFilmesPorAtor() {
  const campoAtor = document.getElementById("campo-ator");
  termoAtor = campoAtor.value.trim();
  paginaAtorAtual = 1;
  pesquisarFilmesPorAtor();
}

// ===== FUNÇÃO PRÓXIMA/ANTERIOR (ATOR) =====
function proximaPaginaAtor() {
  paginaAtorAtual++;
  pesquisarFilmesPorAtor();
}
function paginaAnteriorAtor() {
  if (paginaAtorAtual > 1) {
    paginaAtorAtual--;
    pesquisarFilmesPorAtor();
  }
}

// ===== FUNÇÃO PRINCIPAL DE PESQUISA POR ATOR (BUSCA OS FILMES DO ATOR) =====
async function pesquisarFilmesPorAtor() {
  const campoAtor = document.getElementById("campo-ator");
  const nomeAtor = termoAtor || campoAtor.value.trim(); // fallback
  const statusAtor = document.getElementById("status-ator");
  const listaAtor = document.getElementById("lista-ator");

  if (!nomeAtor) {
    statusAtor.textContent = "Digite o nome de um ator ou atriz.";
    listaAtor.innerHTML = "";
    return;
  }

  statusAtor.textContent = `🔄 Buscando filmes de "${nomeAtor}", aguarde...`;
  listaAtor.innerHTML = "";

  try {
    // 1️⃣ Buscar ID do ator (pegar o primeiro resultado mais relevante)
    const buscaPessoa = await fetch(`${TMDB_URL}/search/person?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(nomeAtor)}`);
    const dadosPessoa = await buscaPessoa.json();

    if (!dadosPessoa.results || dadosPessoa.results.length === 0) {
      statusAtor.textContent = "Ator não encontrado.";
      listaAtor.innerHTML = "";
      return;
    }

    const personId = dadosPessoa.results[0].id;

    // 2️⃣ Buscar filmes em que o ator participou usando /discover/movie com with_cast
    const discoverUrl = `${TMDB_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_cast=${personId}&page=${paginaAtorAtual}&sort_by=release_date.desc`;
    const respostaDiscover = await fetch(discoverUrl);
    const dadosDiscover = await respostaDiscover.json();

    if (!dadosDiscover.results || dadosDiscover.results.length === 0) {
      statusAtor.textContent = "Nenhum filme encontrado para este ator/atriz.";
      listaAtor.innerHTML = "";
      return;
    }

    // Exibir filmes
    listaAtor.innerHTML = "";
    dadosDiscover.results.forEach(filme => {
      const div = document.createElement("div");
      div.classList.add("card");

      const poster = filme.poster_path
        ? `https://image.tmdb.org/t/p/w300${filme.poster_path}`
        : "https://via.placeholder.com/300x450?text=Sem+Imagem";

      // Use title (filme) ou name (caso seja série) e release_date
      div.innerHTML = `
        <img src="${poster}" alt="Poster de ${filme.title || filme.name}">
        <h3>${filme.title || filme.name}</h3>
        <p>Lançamento: ${filme.release_date || filme.first_air_date || "N/D"}</p>
      `;

      listaAtor.appendChild(div);
    });

    // Atualiza status com indicação de página e total (quando disponível)
    const totalPages = dadosDiscover.total_pages || 1;
    const totalResults = dadosDiscover.total_results || "N/D";
    statusAtor.textContent = `Página ${paginaAtorAtual} de ${totalPages} — ${totalResults} resultados para "${nomeAtor}"`;

  } catch (erro) {
    console.error(erro);
    statusAtor.textContent = "❌ Erro ao buscar dados no TMDb.";
  }
}
