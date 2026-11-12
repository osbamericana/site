# Site do Observatório Social de Americana

Repositório `osbamericana/site`, publicado via GitHub Pages em https://osbamericana.github.io/site.
O site fica no subcaminho `/site`: use sempre links relativos.

## Abas
- Início
- Quem somos / metodologia
- Pacto.Ame: painel de indicadores ODS e aba da ligação com o PPA
- Publicações: capas dos carrosséis do Instagram, com link para o post
- Parceiros
- Contato: só canais, sem formulário

## Regras de conteúdo
- Tom técnico e apartidário: descrever dados e métodos, sem juízo político sobre pessoas,
  partidos ou gestões.
- Linguagem acessível ao público: frases curtas, siglas explicadas na primeira menção
  (ODS, PPA etc.).
- Só informação pública e agregada.
- Sempre citar a fonte e a data de referência dos dados exibidos.
- Linha editorial: não atribuir causas; apresentar os achados como perguntas à gestão.

## Tecnologia e estrutura
- HTML/CSS/JS puro, sem compilação. Uma pasta com index.html por aba.
- Menu num lugar só: a lista de abas fica em `assets/js/menu.js`, que monta cabeçalho e rodapé.
  - Acrescentar aba: criar `<pasta>/index.html` (copiando uma página existente) e uma linha em `menu.js`.
  - Remover aba: apagar a pasta e a linha.
  - Cada página declara `data-raiz` no `<body>` (`./`, `../` ou `../../`, conforme a profundidade).
- Pacto.Ame: painel de indicadores (d3) em
  `pacto-ame/index.html` + `assets/css/pacto-ame.css` + `assets/js/pacto-ame.js`.
  - Dados: `dados/pacto-ame/indicadores.json` e `series.json`, gerados pelo projeto Pacto.Ame.
    Para atualizar o painel, trocar esses dois arquivos. Notas são corrigidas na origem, não aqui.
- Cores e fontes só em `assets/css/tokens.css`. A referência é a identidade da rede OSB
  (osbrasil.org.br), sem copiar código nem imagens. O logo oficial entra em `assets/img/logo/`.
- A lista de publicações fica em `dados/publicacoes.json`.
- Para ver localmente: abrir com um servidor simples (os dados são carregados via fetch).
- GitHub Pages: `_config.yml` exclui do site publicado os arquivos de trabalho (como este CLAUDE.md).
- Regras locais adicionais ficam em `CLAUDE.local.md`, fora do Git.
