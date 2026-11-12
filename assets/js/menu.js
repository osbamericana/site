/*
  Menu do site — ÚNICO lugar com a lista de abas.
  Para acrescentar uma aba: crie a pasta com index.html e adicione uma linha aqui.
  Para remover: apague a pasta e a linha.
  "caminho" é relativo à raiz do site e termina com "/" (a raiz é "").
*/
const ABAS = [
  { titulo: "Início", caminho: "" },
  { titulo: "Quem somos", caminho: "quem-somos/" },
  {
    titulo: "Pacto.Ame",
    caminho: "pacto-ame/",
    subabas: [
      { titulo: "Painel ODS", caminho: "pacto-ame/" },
      { titulo: "Ligação com o PPA", caminho: "pacto-ame/ppa/" },
    ],
  },
  { titulo: "Publicações", caminho: "publicacoes/" },
  { titulo: "Parceiros", caminho: "parceiros/" },
  { titulo: "Contato", caminho: "contato/" },
];

const NOME_SITE = "Observatório Social de Americana";

(function montarMenu() {
  const raiz = document.body.dataset.raiz || "./";
  const atual = document.body.dataset.pagina || "";
  const link = (caminho) => raiz + caminho;

  const ativo = (aba) =>
    aba.caminho === atual ||
    (aba.subabas || []).some((s) => s.caminho === atual);

  const itens = ABAS.map(
    (aba) =>
      `<li><a href="${link(aba.caminho)}"${ativo(aba) ? ' aria-current="page"' : ""}>${aba.titulo}</a></li>`
  ).join("");

  const topo = document.getElementById("topo");
  if (topo) {
    topo.innerHTML = `
      <div class="topo-conteudo">
        <a class="marca" href="${link("")}">
          <span class="logo-reservado" aria-hidden="true">logo</span>
          <span>${NOME_SITE}</span>
        </a>
        <button class="menu-botao" aria-expanded="false" aria-controls="menu-principal">Menu</button>
        <nav aria-label="Principal"><ul id="menu-principal">${itens}</ul></nav>
      </div>`;
    const botao = topo.querySelector(".menu-botao");
    botao.addEventListener("click", () => {
      const aberto = botao.getAttribute("aria-expanded") === "true";
      botao.setAttribute("aria-expanded", String(!aberto));
      topo.classList.toggle("menu-aberto", !aberto);
    });
  }

  // Sub-abas (ex.: Pacto.Ame) aparecem logo abaixo do cabeçalho da seção
  const sub = document.getElementById("subabas");
  const pai = ABAS.find((a) => a.subabas && ativo(a));
  if (sub && pai) {
    sub.innerHTML = `<nav aria-label="${pai.titulo}"><ul>${pai.subabas
      .map(
        (s) =>
          `<li><a href="${link(s.caminho)}"${s.caminho === atual ? ' aria-current="page"' : ""}>${s.titulo}</a></li>`
      )
      .join("")}</ul></nav>`;
  }

  const rodape = document.getElementById("rodape");
  if (rodape) {
    rodape.innerHTML = `
      <div class="rodape-conteudo">
        <p><strong>${NOME_SITE}</strong></p>
        <p>Integrante da rede do Observatório Social do Brasil.</p>
        <nav aria-label="Rodapé"><ul>${ABAS.map((a) => `<li><a href="${link(a.caminho)}">${a.titulo}</a></li>`).join("")}</ul></nav>
      </div>`;
  }
})();
