/*
  Painel Pacto.Ame (indicadores ODS) — lógica vinda do painel original do projeto Pacto.Ame (d3).
  Os dados vêm de dados/pacto-ame/indicadores.json e series.json, gerados pelo projeto Pacto.Ame.
  Para atualizar o painel, basta trocar esses dois arquivos.
*/
(() => {
const _DADOS = {};
const dash = (() => {
  const calcs = {}, draws = {}, onData = [];
  const data = (n) => {
    if (_DADOS[n]) return { status: 'ok', data: _DADOS[n] };
    if (calcs[n]) { const c = calcs[n]; return { status: 'ok', data: c.fn(...c.inputs.map((i) => data(i).data)) }; }
    return { status: 'none' };
  };
  const run = (n) => document.querySelectorAll('[data-draw="' + n + '"]').forEach((el) => draws[n](el));
  return {
    colors: ['#2f6fb5', '#d1652a', '#2e9a6a', '#8e5bb5', '#c2417a', '#7a7a2a'],
    data, calc: (n, def) => { calcs[n] = def; },
    draw: (n, fn) => { if (fn) draws[n] = fn; else if (draws[n]) run(n); },
    onData: (fn) => onData.push(fn),
    setLink: (id) => { try { history.replaceState(null, '', id === 'grade' ? location.pathname : '#' + id); } catch (e) {} },
    _start: () => { Object.keys(draws).forEach(run); onData.forEach((f) => f()); }
  };
})();

  // Estado da navegação (qual ODS está aberto)
  window.paSel = window.paSel || { v: 'todos' };
  const PA_SEL = window.paSel;


  // Origem da poluição que chega ao rio, a partir das porcentagens da CETESB
  dash.calc('origem_carga', {
    inputs: ['series'],
    title: 'Origem da carga que chega ao rio',
    description: 'Divide a carga gerada em três partes: não coletada, coletada sem tratamento e tratada mas não removida.',
    fn: (series) => {
      const v = (id, serie, p) => {
        const r = series.find((s) => s.id === id && s.serie === serie && String(s.periodo) === p);
        return r ? Number(r.valor) : NaN;
      };
      const anos = Array.from(new Set(series.filter((s) => s.id === '6.2-carga').map((s) => String(s.periodo)))).sort();
      const out = [];
      anos.forEach((p) => {
        const C = v('6.2-etapas', 'Coleta', p) / 100;
        const T = v('6.2-etapas', 'Tratamento do coletado', p) / 100;
        const R = v('6.2-etapas', 'Remoção na estação', p) / 100;
        const G = v('6.2-carga', 'Gerada pela cidade', p);
        if ([C, T, R, G].some((x) => isNaN(x))) return;
        out.push({ id: '6.2-origem', serie: 'Esgoto não coletado', periodo: p, valor: Math.round((1 - C) * G) });
        out.push({ id: '6.2-origem', serie: 'Coletado, sem passar pela estação', periodo: p, valor: Math.round(C * (1 - T) * G) });
        out.push({ id: '6.2-origem', serie: 'Passa pela estação, mas não é removido', periodo: p, valor: Math.round(C * T * (1 - R) * G) });
      });
      return out;
    }
  });

  // Contagens a partir do catálogo
  dash.calc('resumo', {
    inputs: ['indicadores'],
    title: 'Indicadores por situação',
    description: 'Conta os indicadores do catálogo pela situação da coleta.',
    fn: (indicadores) => {
      const conta = (s) => indicadores.filter((r) => r.situacao === s).length;
      return [{
        total: indicadores.length,
        com_serie: conta('Série carregada'),
        pontual: conta('Dado pontual'),
        em_coleta: conta('Em coleta')
      }];
    }
  });

  dash.calc('por_ods', {
    inputs: ['indicadores'],
    title: 'Indicadores por ODS',
    description: 'Conta os indicadores do catálogo em cada um dos 17 ODS.',
    fn: (indicadores) => {
      const linhas = [];
      for (let i = 1; i <= 17; i++) {
        linhas.push({ ods: String(i), n: indicadores.filter((r) => String(r.ods) === String(i)).length });
      }
      return linhas;
    }
  });

  // Números do texto de abertura
  [['n-serie', 'com_serie'], ['n-pontual', 'pontual'], ['n-coleta', 'em_coleta'], ['n-total', 'total']].forEach(([nome, campo]) => {
    dash.draw(nome, (el) => {
      const d = dash.data('resumo');
      el.textContent = d.status === 'ok' && d.data && d.data.length ? String(d.data[0][campo]) : '—';
    });
  });

  // Contagem em cada botão de ODS
  dash.draw('cont', (el) => {
    const d = dash.data('por_ods');
    const btn = el.closest('[data-ods]');
    const ods = btn ? btn.dataset.ods : '';
    if (d.status !== 'ok' || !d.data) { el.textContent = '—'; return; }
    const linha = d.data.find((r) => r.ods === ods);
    el.textContent = linha ? String(linha.n) : '0';
  });

  // Botões: marca o escolhido, mostra o aviso de ODS vazio e redesenha a grade
  function paAplica() {
    document.querySelectorAll('.pa-ods').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.ods === PA_SEL.v));
    });
    const d = dash.data('por_ods');
    let vazio = false;
    if (d.status === 'ok' && d.data) {
      d.data.forEach((r) => {
        document.querySelectorAll('.pa-ods[data-ods="' + r.ods + '"]').forEach((b) => b.classList.toggle('pa-zero', r.n === 0));
      });
      if (PA_SEL.v !== 'todos') {
        const r = d.data.find((x) => x.ods === PA_SEL.v);
        vazio = !r || r.n === 0;
      }
    }
    document.querySelectorAll('.pa-vazio').forEach((p) => { p.hidden = !vazio; });
  }
  document.querySelectorAll('.pa-ods').forEach((b) => {
    b.addEventListener('click', () => {
      PA_SEL.v = b.dataset.ods;
      paAplica();
      dash.draw('grade');
      try { dash.setLink(PA_SEL.v === 'todos' ? 'grade' : 'ods-' + PA_SEL.v); } catch (e) {}
    });
  });
  const paHash = (location.hash || '').match(/^#ods-(\d{1,2})$/);
  if (paHash) PA_SEL.v = paHash[1];
  dash.onData(paAplica);

  // Grade de cartões, um por indicador, agrupados por ODS
  const PA_COR = { 1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21', 6: '#26bde2', 7: '#fcc30b', 8: '#a21942', 9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d', 17: '#19486a' };
  const PA_SIT = { 'Série carregada': 'serie', 'Dado pontual': 'pontual', 'Em coleta': 'coleta' };
  const PA_LOC = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['R$ ', ''] });
  const paFmt = (c) => PA_LOC.format(',.' + Math.max(0, Number(c) || 0) + 'f');
  const paTick = PA_LOC.format(',.2~f');

  function paGrafico(body, linhas, r) {
    const W = Math.max(240, Math.round(body.node().clientWidth || 300));
    const H = 168;
    const casas = Number(r.casas) || 0;
    const f = paFmt(casas);
    const periodos = Array.from(new Set(linhas.map((s) => String(s.periodo)))).sort();
    const series = Array.from(d3.group(linhas, (s) => s.serie), ([nome, pts]) => ({
      nome,
      pts: pts.map((p) => ({ p: String(p.periodo), v: Number(p.valor) })).sort((a, b) => a.p.localeCompare(b.p))
    }));
    // Séries de meta (tracejadas): 'Meta do PPA · <série>' e 'Meta do INEP · <série>'
    const ehMeta = (n) => /^Meta do (PPA|INEP) · /.test(n);
    const tipoMeta = (n) => (n.startsWith('Meta do PPA') ? 'ppa' : 'inep');
    const reais = series.filter((s) => !ehMeta(s.nome));
    const corDe = (s) => {
      const base = ehMeta(s.nome) ? s.nome.split(' · ').slice(1).join(' · ') : s.nome;
      const k = Math.max(0, reais.findIndex((q) => q.nome === base));
      return dash.colors[k % dash.colors.length];
    };
    const alvo = r.ppa_alvo === null || r.ppa_alvo === undefined || r.ppa_alvo === '' ? null : Number(r.ppa_alvo);
    const maxV = d3.max(linhas.map((s) => Number(s.valor)).concat(alvo === null ? [] : [alvo])) || 1;
    const minV = d3.min(linhas.map((s) => Number(s.valor))) || 0;
    const y = (r.eixo === 'livre'
      ? d3.scaleLinear([minV - (maxV - minV) * 0.15, maxV + (maxV - minV) * 0.15], [H - 26, 16])
      : d3.scaleLinear([0, maxV * 1.12], [H - 26, 16])).nice(4);
    // Percentual não passa de 100 no eixo
    if (/^%/.test(r.unidade || '') && y.domain()[1] > 100) y.domain([y.domain()[0], 100]);
    const ticks = y.ticks(4);

    const svg = body.append('svg').attr('class', 'pa-svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', r.indicador);

    // Margem esquerda medida pelo maior rótulo do eixo
    let ml = 0;
    const med = svg.append('g');
    ticks.forEach((t) => { const n = med.append('text').attr('class', 'pa-tick').text(paTick(t)); ml = Math.max(ml, n.node().getComputedTextLength()); });
    let fimMax = 0;
    series.forEach((s) => { const ult = s.pts[s.pts.length - 1]; const n = med.append('text').attr('class', 'pa-end').text(f(ult.v)); fimMax = Math.max(fimMax, n.node().getComputedTextLength()); });
    med.remove();
    ml = Math.ceil(ml) + 10;
    const barras = r.grafico === 'barras';
    const mr = barras ? 8 : Math.ceil(fimMax) + 12;
    const porAno = !barras && periodos.every((p) => /^\d{4}$/.test(p));
    const anos = periodos.map(Number);
    const xl = d3.scaleLinear([d3.min(anos), d3.max(anos)], [ml + 6, W - mr - 6]);
    const x = porAno ? (p) => xl(Number(p)) : d3.scalePoint(periodos, [ml, W - mr]).padding(0.2);
    const xb = d3.scaleBand(periodos, [ml, W - mr]).paddingInner(0.25).paddingOuter(0.1);
    const xc = (p) => (barras ? xb(p) + xb.bandwidth() / 2 : x(p));

    // Grade e eixo Y
    const g = svg.append('g');
    ticks.forEach((t) => {
      g.append('line').attr('x1', ml).attr('x2', W - mr + 4).attr('y1', y(t)).attr('y2', y(t))
        .attr('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)').attr('stroke-width', 1);
      g.append('text').attr('class', 'pa-tick').attr('x', ml - 8).attr('y', y(t)).attr('dy', '0.32em').attr('text-anchor', 'end').text(paTick(t));
    });

    // Períodos com prefixo de ordenação ("01 jan") aparecem sem o prefixo
    const rotP = (p) => String(p).replace(/^\d{2} /, '');
    // Eixo X com rótulos espaçados
    if (porAno) {
      let ultX = -1e9; const fimX = xc(periodos[periodos.length - 1]);
      periodos.forEach((p, i) => {
        const px = xc(p); const ultimo = i === periodos.length - 1;
        if (!ultimo && (px - ultX < 36 || fimX - px < 36)) return;
        g.append('text').attr('class', 'pa-tick').attr('x', px).attr('y', H - 6).attr('text-anchor', 'middle').text(p);
        ultX = px;
      });
    } else {
      const cabem = Math.max(2, Math.floor((W - ml - mr) / 40));
      const passo = Math.max(1, Math.ceil(periodos.length / cabem));
      periodos.forEach((p, i) => {
        if (i % passo === 0 || i === periodos.length - 1) {
          if (i !== periodos.length - 1 && periodos.length - 1 - i < passo) return;
          g.append('text').attr('class', 'pa-tick').attr('x', xc(p)).attr('y', H - 6).attr('text-anchor', 'middle').text(rotP(p));
        }
      });
    }

    // Linha de referência da meta do PPA
    if (alvo !== null) {
      g.append('line').attr('x1', ml).attr('x2', W - mr + 4).attr('y1', y(alvo)).attr('y2', y(alvo))
        .attr('stroke', 'var(--cds-chart-reference)').attr('stroke-width', 1.5).attr('stroke-dasharray', '5 4');
      g.append('text').attr('class', 'pa-ref').attr('x', ml + 4).attr('y', y(alvo) - 5)
        .text((r.ppa_rotulo || ('Meta do PPA para ' + (r.ppa_ano || ''))) + ': ' + f(alvo));
    }

    // Séries
    const linha = d3.line().x((d) => x(d.p)).y((d) => y(d.v));
    const fins = [];
    if (barras) {
      const dentro = d3.scaleBand(series.map((s) => s.nome), [0, xb.bandwidth()]).padding(0.12);
      series.forEach((s, i) => {
        const cor = dash.colors[i % dash.colors.length];
        s.pts.forEach((d) => {
          g.append('rect').attr('x', xb(d.p) + dentro(s.nome)).attr('y', y(d.v))
            .attr('width', Math.max(1, dentro.bandwidth())).attr('height', Math.max(0, y(0) - y(d.v)))
            .attr('rx', 2).attr('fill', cor);
        });
      });
    }
    (barras ? [] : series).forEach((s, i) => {
      const meta = ehMeta(s.nome);
      const cor = meta ? corDe(s) : dash.colors[reais.indexOf(s) % dash.colors.length];
      const tr = g.append('path').attr('d', linha(s.pts)).attr('fill', 'none').attr('stroke', cor).attr('stroke-width', meta ? 1.6 : 2)
        .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      if (meta) tr.attr('stroke-dasharray', tipoMeta(s.nome) === 'ppa' ? '7 4' : '1.5 3.5').attr('opacity', 0.9);
      s.pts.forEach((d, j) => {
        if (meta) {
          g.append('circle').attr('cx', x(d.p)).attr('cy', y(d.v)).attr('r', 2.5).attr('fill', 'var(--color-bg)').attr('stroke', cor).attr('stroke-width', 1.2);
        } else {
          g.append('circle').attr('cx', x(d.p)).attr('cy', y(d.v)).attr('r', j === s.pts.length - 1 ? 4 : 2.5).attr('fill', cor);
        }
      });
      const ult = s.pts[s.pts.length - 1];
      fins.push({ x: x(ult.p) + 8, y: y(ult.v), t: f(ult.v) });
    });
    // Afasta rótulos finais que se encostam
    fins.sort((a, b) => a.y - b.y);
    for (let k = 1; k < fins.length; k++) { if (fins[k].y - fins[k - 1].y < 13) fins[k].y = fins[k - 1].y + 13; }
    fins.forEach((e) => g.append('text').attr('class', 'pa-end').attr('x', e.x).attr('y', e.y).attr('dy', '0.32em').text(e.t));

    // Dica ao passar o mouse
    const regua = g.append('line').attr('y1', 12).attr('y2', H - 26).attr('stroke', 'var(--cds-chart-axis)').attr('stroke-width', 1).attr('opacity', 0);
    const dica = body.append('div').attr('class', 'pa-tip').style('display', 'none');
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', Math.max(1, W - mr - ml)).attr('height', H).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [mx] = d3.pointer(ev, svg.node());
        let melhor = periodos[0];
        periodos.forEach((p) => { if (Math.abs(xc(p) - mx) < Math.abs(xc(melhor) - mx)) melhor = p; });
        regua.attr('x1', xc(melhor)).attr('x2', xc(melhor)).attr('opacity', barras ? 0 : 1);
        dica.selectAll('*').remove();
        dica.append('div').attr('class', 'pa-tp').text(rotP(melhor));
        series.forEach((s, i) => {
          const pt = s.pts.find((d) => d.p === melhor);
          if (!pt) return;
          const l = dica.append('div').attr('class', 'pa-tl');
          if (series.length > 1) l.append('i').style('background', corDe(s)).style('opacity', ehMeta(s.nome) ? 0.6 : 1);
          l.append('span').text((series.length > 1 ? s.nome + ': ' : '') + f(pt.v));
        });
        dica.style('display', 'block');
        const bw = body.node().clientWidth;
        const tw = dica.node().offsetWidth;
        const px = (xc(melhor) / W) * bw;
        dica.style('left', Math.max(0, Math.min(bw - tw, px + 10)) + 'px').style('top', '4px');
      })
      .on('pointerleave', () => { regua.attr('opacity', 0); dica.style('display', 'none'); });

    return series;
  }

  function paCartao(grid, r, linhas) {
    const desenhar = paCartaoBase(grid, r, linhas);
    const art = d3.select(grid.node().lastElementChild);
    // Tabela pequena opcional no cartão: r.tabela = { cab: [...], linhas: [[...], ...] }
    // O conjunto de dados pode entregar a tabela como texto JSON: converte antes de usar
    let tabela = r.tabela;
    if (typeof tabela === 'string' && tabela.trim()) { try { tabela = JSON.parse(tabela); } catch (e) { tabela = null; } }
    if (tabela && Array.isArray(tabela.linhas)) {
      r = Object.assign({}, r, { tabela });
      const tb = art.append('table').attr('class', 'pa-tab');
      tb.append('thead').append('tr').selectAll('th').data(r.tabela.cab || []).join('th').text((d) => d);
      tb.append('tbody').selectAll('tr').data(r.tabela.linhas).join('tr')
        .selectAll('td').data((l) => l).join('td').text((d) => (typeof d === 'number' ? d.toLocaleString('pt-BR') : d));
      if (r.tabela.nota) art.append('p').attr('class', 'pa-tab-nota').text(r.tabela.nota);
    }
    if (r.nota) art.append('p').attr('class', 'pa-nota').text(r.nota);
    art.append('p').attr('class', 'pa-rod').text([r.janela, r.fonte].filter(Boolean).join(' · '));
    return desenhar;
  }

  function paCartaoBase(grid, r, linhas) {
    const sit = PA_SIT[r.situacao] || 'coleta';
    const art = grid.append('article').attr('class', 'pa-card').attr('data-sit', sit);
    const top = art.append('div').attr('class', 'pa-top');
    top.append('span').attr('class', 'pa-chip pa-meta').text('Meta ' + r.meta);
    top.append('span').attr('class', 'pa-chip').attr('data-k', sit).text(r.situacao);
    if (r.categoria_ppa) top.append('span').attr('class', 'pa-chip').text('PPA: ' + r.categoria_ppa);
    art.append('h3').attr('class', 'pa-h3').text(r.indicador);
    if (r.unidade) art.append('p').attr('class', 'pa-un').text(r.unidade);

    const body = art.append('div').attr('class', 'pa-body');
    const periodos = new Set(linhas.map((s) => String(s.periodo)));
    if (periodos.size > 1) {
      // O gráfico só é desenhado depois que todos os cartões estão na grade:
      // medido antes, o 1º cartão de cada grupo ocupava a linha inteira e o desenho encolhia depois.
      const legSlot = art.append('div').attr('class', 'pa-leg-slot');
      return () => {
      const series = paGrafico(body, linhas, r);
      const ehM = (n) => /^Meta do (PPA|INEP) · /.test(n);
      const reaisL = series.filter((s) => !ehM(s.nome));
      const temPPA = series.some((s) => s.nome.startsWith('Meta do PPA · '));
      const temINEP = series.some((s) => s.nome.startsWith('Meta do INEP · '));
      if (reaisL.length > 1 || temPPA || temINEP) {
        const leg = legSlot.attr('class', 'pa-leg');
        reaisL.forEach((s, i) => { const it = leg.append('span'); it.append('i').style('background', dash.colors[i % dash.colors.length]); it.append('span').text(s.nome); });
        if (temPPA) { const it = leg.append('span'); it.append('i').attr('class', 'pa-leg-ppa'); it.append('span').text('Meta do PPA (tracejado)'); }
        if (temINEP) { const it = leg.append('span'); it.append('i').attr('class', 'pa-leg-inep'); it.append('span').text('Meta do INEP (pontilhado)'); }
      } else { legSlot.remove(); }
      };
    } else if (linhas.length >= 1) {
      const l = linhas[0];
      const big = body.append('div').attr('class', 'pa-big');
      big.append('span').attr('class', 'pa-bignum').text(paFmt(r.casas)(Number(l.valor)));
      big.append('p').attr('class', 'pa-bigsub').text((r.unidade ? r.unidade + ' · ' : '') + 'dado de ' + l.periodo);
    } else {
      body.append('p').attr('class', 'pa-espera').text('Coleta em andamento. A fonte já está definida.');
    }
    return null;
  }

  // Filtro por relação com o PPA (só na visão "Todos os ODS")
  const PA_CAT = [
    ['Medir', 'O PPA tem a meta, mas não tem indicador para acompanhá-la.'],
    ['Aprimorar', 'O PPA tem a meta e o indicador, mas dá para melhorar.'],
    ['Aprimorar parcial', 'O indicador do PPA cobre só parte da meta.'],
    ['Debater', 'Meta relevante para Americana que não está no PPA.'],
    ['Informativo', 'Tema regional, sem cobrança no PPA.'],
    ['Desconsiderar', 'Não se aplica a Americana ou não dá para medir.']
  ];

  function paFiltro(el, todos) {
    const cat = (window.paSel && window.paSel.cat) || '';
    const box = d3.select(el).append('section').attr('class', 'pa-filtro').attr('aria-label', 'Filtrar por relação com o PPA');
    box.append('p').attr('class', 'pa-ftit').text('Relação com o PPA');
    const bts = box.append('div').attr('class', 'pa-fbts');
    const conta = d3.rollup(todos, (v) => v.length, (r) => r.categoria_ppa || '');
    const opcoes = [['', 'Mostrar todos os indicadores.', 'Todas']].concat(PA_CAT.filter(([c]) => conta.get(c)).map(([c, d]) => [c, d, c]));
    opcoes.forEach(([c, desc, nome]) => {
      const b = bts.append('button').attr('type', 'button').attr('class', 'pa-fbt').attr('aria-pressed', String(cat === c));
      const t = b.append('span').attr('class', 'pa-fnome');
      t.append('span').text(nome);
      t.append('span').attr('class', 'pa-fnum').text(c ? conta.get(c) : todos.length);
      b.append('span').attr('class', 'pa-fdesc').text(desc);
      b.on('click', () => { window.paSel.cat = c; dash.draw('grade'); });
    });
    const n = cat ? (conta.get(cat) || 0) : todos.length;
    box.append('p').attr('class', 'pa-fres').text(cat
      ? n + (n === 1 ? ' indicador' : ' indicadores') + ' em “' + cat + '”, de ' + todos.length + ' no total.'
      : todos.length + ' indicadores no total.');
  }

  // Cartão pequeno (visão "Todos os ODS"): último valor + minigráfico; clique abre o ODS
  function paMini(grid, r, linhas) {
    const sit = PA_SIT[r.situacao] || 'coleta';
    const b = grid.append('button').attr('type', 'button').attr('class', 'pa-mini').attr('data-sit', sit)
      .style('--ods', PA_COR[r.ods] || null).attr('title', 'Abrir o ODS ' + r.ods);
    const top = b.append('span').attr('class', 'pa-mtop');
    top.append('span').text('Meta ' + r.meta);
    top.append('span').text(r.categoria_ppa || '');
    b.append('p').attr('class', 'pa-mh').text(r.indicador);
    b.on('click', () => {
      window.paSel.v = String(r.ods);
      document.querySelectorAll('.pa-ods').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.ods === window.paSel.v)));
      dash.draw('grade');
      try { dash.setLink('ods-' + r.ods); } catch (e) {}
      window.scrollTo({ top: 0 });
    });
    const reais = linhas.filter((l) => !/^Meta do (PPA|INEP) · /.test(String(l.serie)));
    if (!reais.length) { b.append('span').attr('class', 'pa-mvazio').text('Em coleta'); return null; }
    const series = Array.from(d3.group(reais, (l) => l.serie), ([nome, pts]) => ({
      nome, pts: pts.map((p) => ({ p: String(p.periodo), v: Number(p.valor) })).sort((a, c) => a.p.localeCompare(c.p))
    }));
    // Série principal: se as séries forem anos (ex.: mensal por ano), a do ano mais recente
    const anosS = series.every((x) => /^\d{4}$/.test(x.nome));
    // senão, a que chega ao período mais recente (empate: a primeira)
    const fimDe = (x) => x.pts[x.pts.length - 1].p;
    const prin = anosS ? series.slice().sort((a, c) => c.nome.localeCompare(a.nome))[0]
      : series.reduce((m, x) => (fimDe(x).localeCompare(fimDe(m)) > 0 ? x : m), series[0]);
    const ult = prin.pts[prin.pts.length - 1];
    const val = b.append('span').attr('class', 'pa-mval');
    val.append('span').attr('class', 'pa-mnum').text(paFmt(r.casas)(ult.v));
    const rot = String(ult.p).replace(/^\d{2} /, '') + (anosS ? '/' + prin.nome : '');
    val.append('span').attr('class', 'pa-msub').text((series.length > 1 && !anosS ? prin.nome + ' · ' : '') + rot);
    const periodos = Array.from(new Set(reais.map((l) => String(l.periodo)))).sort();
    if (periodos.length < 2) return null;
    return () => {
      const W = 160, H = 30;
      const x = d3.scalePoint(periodos, [2, W - 4]);
      const vs = reais.map((l) => Number(l.valor));
      const lo = d3.min(vs), hi = d3.max(vs);
      const y = d3.scaleLinear([lo, hi === lo ? lo + 1 : hi], [H - 3, 3]);
      const svg = b.append('svg').attr('class', 'pa-mspark').attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'none').attr('aria-hidden', 'true');
      series.forEach((sr, i) => {
        const ehP = sr === prin;
        svg.append('path').attr('d', d3.line().x((d) => x(d.p)).y((d) => y(d.v))(sr.pts)).attr('fill', 'none')
          .attr('stroke', ehP ? (PA_COR[r.ods] || dash.colors[0]) : 'var(--cds-chart-muted, #999)')
          .attr('stroke-width', ehP ? 1.8 : 1.1).attr('opacity', ehP ? 1 : 0.6).attr('vector-effect', 'non-scaling-stroke');
      });
    };
  }

  dash.draw('grade', (el) => {
    const I = dash.data('indicadores');
    const S = dash.data('series');
    const O = dash.data('origem_carga');
    if (I.status !== 'ok' || S.status !== 'ok' || !I.data || !S.data) { el.textContent = '—'; return; }
    const todasSeries = S.data.concat(O.status === 'ok' && Array.isArray(O.data) ? O.data : []);
    el.replaceChildren();
    const sel = (window.paSel && window.paSel.v) || 'todos';
    let lista = I.data.filter((r) => sel === 'todos' || String(r.ods) === sel);
    if (sel === 'todos') {
      paFiltro(el, lista);
      const cat = window.paSel.cat || '';
      if (cat) lista = lista.filter((r) => (r.categoria_ppa || '') === cat);
    }
    const grupos = d3.group(lista, (r) => Number(r.ods));
    const pendentes = [];
    Array.from(grupos.keys()).sort((a, b) => a - b).forEach((ods) => {
      const itens = grupos.get(ods);
      const sec = d3.select(el).append('section').attr('class', 'pa-grupo').attr('id', 'ods-' + ods);
      const h = sec.append('h2').attr('class', 'pa-gtitle');
      h.append('span').attr('class', 'pa-gnum').style('background', PA_COR[ods] || 'var(--color-fg)').text(String(ods));
      h.append('span').text(itens[0].ods_nome);
      const mini = sel === 'todos';
      const grid = sec.append('div').attr('class', mini ? 'pa-cards pa-mini-grade' : 'pa-cards');
      itens.forEach((r) => {
        const ls = todasSeries.filter((s) => s.id === r.id);
        const d = mini ? paMini(grid, r, ls) : paCartao(grid, r, ls);
        if (d) pendentes.push(d);
      });
    });
    pendentes.forEach((d) => d());
  });

  // Carrega os dados públicos e desenha o painel
  const raiz = document.body.dataset.raiz || './';
  const ler = (nome) => fetch(raiz + 'dados/pacto-ame/' + nome + '.json').then((r) => {
    if (!r.ok) throw new Error(nome + ': ' + r.status);
    return r.json();
  });
  Promise.all([ler('indicadores'), ler('series')])
    .then(([indicadores, series]) => {
      _DADOS.indicadores = indicadores;
      _DADOS.series = series;
      dash._start();
    })
    .catch(() => {
      document.querySelectorAll('#grade').forEach((el) => { el.textContent = 'Não foi possível carregar os dados do painel.'; });
    });
})();
