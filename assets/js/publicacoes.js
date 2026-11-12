/*
  Monta a grade de publicações a partir de dados/publicacoes.json.
  Cada item: { "titulo": "...", "capa": "assets/img/publicacoes/arquivo.jpg", "link": "https://www.instagram.com/p/..." }
  "capa" é relativo à raiz do site.
*/
(async function montarPublicacoes() {
  const lista = document.getElementById("lista-publicacoes");
  if (!lista) return;
  const raiz = document.body.dataset.raiz || "./";

  try {
    const resp = await fetch(raiz + "dados/publicacoes.json");
    const itens = await resp.json();
    if (!itens.length) {
      lista.outerHTML = '<p class="provisorio">Nenhuma publicação cadastrada ainda.</p>';
      return;
    }
    lista.innerHTML = itens
      .map(
        (p) => `<li><a href="${p.link}" target="_blank" rel="noopener">
          <img src="${raiz + p.capa}" alt="Capa: ${p.titulo}" loading="lazy">
          <span>${p.titulo}</span></a></li>`
      )
      .join("");
  } catch (e) {
    lista.outerHTML = '<p class="provisorio">Não foi possível carregar as publicações.</p>';
  }
})();
