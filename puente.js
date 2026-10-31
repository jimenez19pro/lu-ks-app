// Código que corre DENTRO de la página de Lu-Ks (en el WebView).
// Conecta la web con la app: avisos, descargas, botón Atrás, y además
// manda a la app los datos del Inicio (para el Inicio nativo) y los pagos
// que vienen (para los recordatorios en el celular).
export function puente({ version, os, recordatorios, sinSplash, formNativo }) {
  return `(function(){
  if (window.LUKS_APP) return;
  window.LUKS_APP = { v: ${JSON.stringify(version)}, os: ${JSON.stringify(os)} };
  var REM_ON = ${recordatorios === true ? 'true' : recordatorios === false ? 'false' : 'null'};
  var post = function (m) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
  };
  var Lx = function (es, en) { try { return window.L ? L(es, en) : (window.LKLANG === 'en' ? en : es); } catch (e) { return es; } };

  /* ---------- 1) Google no funciona dentro de la app ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-au="google"]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    post({ t: 'google' });
  }, true);

  /* ---------- 2) Descargas → menú Compartir de la app ---------- */
  function sendFile(href, name) {
    fetch(href).then(function (r) { return r.blob(); }).then(function (bl) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result || '');
        post({ t: 'file', name: name || 'archivo', mime: bl.type || '', data: s.slice(s.indexOf(',') + 1) });
      };
      fr.readAsDataURL(bl);
    }).catch(function () { post({ t: 'fileErr' }); });
  }
  var isDl = function (a) {
    return a && a.hasAttribute && a.hasAttribute('download') && /^(blob:|data:)/.test(a.href || '');
  };
  var oClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (isDl(this)) { sendFile(this.href, this.getAttribute('download')); return; }
    return oClick.apply(this, arguments);
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[download]');
    if (!isDl(a)) return;
    e.preventDefault();
    sendFile(a.href, a.getAttribute('download'));
  }, true);

  /* ---------- 3) Botón Atrás de Android ---------- */
  window.__lkBack = function () {
    var o = document.querySelectorAll('.sheet.on, .navp.on, #navp.on');
    if (!o.length) return false;
    o[o.length - 1].classList.remove('on');
    sched();
    return true;
  };

  /* ---------- 4) Acciones que pide el Inicio nativo ---------- */
  window.__lkTap = function (sel) {
    var el = null;
    try { el = document.querySelector(sel); } catch (e) {}
    if (!el) { sched(); return false; }
    if (typeof el.click === 'function') el.click();
    else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    sched();
    return true;
  };
  // Buscar en Movimientos (desde el buscador nativo)
  window.__lkQ = function (v, guardar) {
    try {
      Q = String(v == null ? '' : v);
      var e = document.getElementById('q-in');
      if (e) e.value = Q;
      if (typeof qPaint === 'function') qPaint();
      if (guardar && typeof qRecSave === 'function') qRecSave(Q);
    } catch (e) {}
    sched();
  };
  // Cargar más movimientos en la lista nativa
  window.__lkMore = function () { TXMAX += 300; sched(); };
  window.__lkRefresh = function () {
    try { if (window.MCP) MCP.invalidate(SRV, 'get_values'); } catch (e) {}
    sched();
  };

  /* ---------- 5) Datos del Inicio para la app ---------- */
  var q = function (s, r) { try { return (r || document).querySelector(s); } catch (e) { return null; } };
  var qa = function (s, r) { try { return [].slice.call((r || document).querySelectorAll(s)); } catch (e) { return []; } };
  var CS = function (el) { return el ? getComputedStyle(el) : null; };
  // Texto visible; si el número está "contando" usa el valor final.
  function T(el) {
    if (!el) return '';
    var cu = el.closest && el.closest('[data-cu]');
    if (cu && cu.dataset.cu != null && typeof window.m === 'function' && !window.HIDE) {
      return (cu.dataset.cs || '') + m(+cu.dataset.cu || 0);
    }
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function svgOf(el) { var s = el && q('svg', el); return s ? s.outerHTML : null; }
  function col(el) { var c = CS(el); return c ? c.color : null; }
  function bg(el) { var c = CS(el); return c ? c.backgroundColor : null; }
  function bar(el) {
    var i = el && q('i', el);
    if (!i) return null;
    var w = parseFloat(i.dataset.w || i.style.width);
    return { w: isFinite(w) ? Math.max(0, Math.min(100, w)) : 0, c: bg(i) };
  }
  function ico(el) {
    if (!el) return null;
    var c = CS(el), v = c ? c.getPropertyValue('--c').trim() : '';
    return { svg: svgOf(el), e: svgOf(el) ? null : T(el), c: v || (c && c.color) };
  }
  function tile(el) {
    if (!el) return null;
    return { svg: svgOf(el), t: T(el), bg: bg(el), c: col(el) };
  }
  function vis(el) {
    if (!el) return false;
    var c = CS(el);
    return c.display !== 'none' && c.visibility !== 'hidden' && el.getClientRects().length > 0;
  }
  function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function theme() {
    var z = parseFloat(cssv('--z'));
    var dk = document.documentElement.getAttribute('data-theme');
    var dark = dk ? dk === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    return { bg: cssv('--bg'), sf: cssv('--sf'), sf2: cssv('--sf2'), ink: cssv('--ink'), mut: cssv('--mut'),
      ac: cssv('--ac'), acink: cssv('--acink'), neg: cssv('--neg'), pos: cssv('--pos'), ln: cssv('--ln'),
      z: isFinite(z) && z > 0 ? z : 1, dark: dark };
  }
  // ¿Hay algo encima del Inicio (una ventana, el menú, la historia, el inicio de sesión…)?
  function covered() {
    var w = innerWidth, h = innerHeight, pts = [[w / 2, 150], [w / 2, h * 0.62], [w * 0.2, h * 0.4]];
    for (var i = 0; i < pts.length; i++) {
      var el = document.elementFromPoint(pts[i][0], pts[i][1]);
      if (!el || el === document.body || el === document.documentElement) continue;
      if (el.closest('#app, nav, #splash, #toast, .ptr')) continue;
      return true;
    }
    return false;
  }
  function sectHdr(k) {
    var b = q('#app .shb[data-c="' + k + '"]');
    if (!b) return null;
    var p = b.parentNode, more = q('[data-go]', p);
    var t = T(b).replace(/^[›⌄]\\s*/, '');
    return { t: t, col: !!(window.COL && COL[k]), sel: '#app .shb[data-c="' + k + '"]',
      more: more ? T(more) : '', moreSel: more ? '#app [data-go="' + more.dataset.go + '"]' : null };
  }
  function snap() {
    var app = q('#app');
    var hd = q('.hd', app);
    if (!hd) return null;
    var S = { v: 2, lang: window.LKLANG || 'es', hide: !!window.HIDE, th: theme() };
    // Encabezado
    var dd = qa('.hd-d span', hd);
    S.hd = { av: T(q('.av', hd)), date: T(dd[dd.length - 1]), sync: !q('.sdot.off', hd), hello: T(q('.hd-h', hd)),
      grid: svgOf(q('#navopen', hd)) };
    var fr = q('.frase', app);
    S.frase = fr ? { t: T(fr), svg: svgOf(fr) } : null;
    S.seg = qa('[data-hv]', app).map(function (b) { return { k: b.dataset.hv, t: T(b), on: b.getAttribute('aria-pressed') === 'true' }; });
    var po = q('#peropen', app), pl = qa('.pnav', app);
    var lab = pl.length ? pl[0].nextElementSibling : null;
    S.per = po ? { chip: T(po).replace(/\\s*⌄\\s*$/, ''), cal: svgOf(po), label: lab ? T(lab) : '',
      prev: !!q('.pnav[data-off="-1"]', app), next: !!q('.pnav[data-off="1"]', app),
      nextOff: !!(q('.pnav[data-off="1"]', app) || {}).disabled } : null;
    // Tarjeta principal
    var he = q('.hero', app);
    if (he) {
      var hv = q('.hero-v', he);
      S.hero = { lb: T(q('.hero-t span', he)), v: T(hv), neg: !!(hv && hv.classList.contains('neg')),
        bar: bar(q('.hero-b', he)), sub: T(q('.hero-s', he)) };
    }
    // General
    S.gen = sectHdr('gen');
    if (S.gen && !S.gen.col) {
      var acs = qa('.acct[data-a]', app), aadd = q('#aadd', app);
      if (aadd) S.gen.accEmpty = { t: T(q('b', aadd)), s: T(q('.mut', aadd)), sel: '#aadd' };
      if (acs.length) {
        var ac = acs[0].closest('.card'), mg = ac && q('[data-go="manage"]', ac);
        S.gen.acc = { t: T(ac && q('b', ac)), manage: mg ? '#app [data-go="manage"]' : null,
          orf: qa('[data-orf]', ac).map(function (b) {
            var row = b.parentNode, mid = b.previousElementSibling, mu = q('.mut', row);
            var main = mid ? T(mid) : T(row);
            if (mu) main = main.replace(T(mu), '').trim();
            var nm = b.dataset.orf, esc = window.CSS && CSS.escape ? CSS.escape(nm) : nm.replace(/"/g, '\\"');
            return { t: main, s: T(mu), btn: T(b), sel: '#app [data-orf="' + esc + '"]' };
          }),
          items: acs.map(function (a) {
          var i = a.dataset.a, credit = /background:/.test(a.getAttribute('style') || '') && !/background:var\\(--sf\\)/.test(a.getAttribute('style') || '');
          var ch = [].slice.call(a.children), top = ch[0], spans = top ? qa('span', top) : [];
          var name = ch[1], num = q('.num', a);
          var o = { i: +i, sel: '#app .acct[data-a="' + i + '"]', tile: tile(q('.stile', a)), type: T(spans[spans.length - 1]),
            name: T(name), amt: T(num), amtC: col(num), credit: credit, c: CS(a).getPropertyValue('--c').trim() };
          if (credit) { o.bg = bg(a); o.bar = bar(q('.bar', a)); o.disp = T(ch[ch.length - 1]); }
          return o;
        }) };
      }
      var duo = q('.duo', app);
      if (duo) S.gen.duo = qa('.card', duo).map(function (c) { var v = q('.v', c); return { k: T(q('.k', c)), v: T(v), vc: col(v), s: T(q('.s', c)) }; });
      var mab = q('[data-ma]', app), hoy = mab && mab.closest('.card');
      if (hoy) {
        var num2 = q('.num', hoy), right = q('div[style*="text-align:right"]', hoy), muts = qa('.mut', hoy);
        S.gen.hoy = num2 ? { lb: T(muts[0]), v: T(num2), vc: col(num2), sk: T(q('.mut', right)), sv: T(q('.amt', right)),
          bar: bar(q('.bar', hoy)), sub: T(muts[muts.length - 1]) } : { lb: T(muts[0]), msg: T(muts[0] && muts[0].nextElementSibling) };
        S.gen.hoy.btns = qa('button[data-ma],button[data-pl]', hoy).map(function (b) {
          return { t: T(b), svg: svgOf(b), sel: b.dataset.ma ? '#app [data-ma]' : '#app [data-pl]' };
        });
        var pc = hoy.nextElementSibling;
        if (pc && pc.classList.contains('card') && q('.bar', pc) && !q('[data-b]', pc)) {
          var pn = q('.num', pc), pm = qa('.mut', pc), unit = q('.num .mut', pc), grid = q('div[style*="display:grid"]', pc);
          var pv = pn ? T(pn) : '', ut = T(unit);
          if (ut && pv.slice(-ut.length) === ut) pv = pv.slice(0, -ut.length).trim();
          S.gen.proy = { lb: T(pm[0]), svg: svgOf(pm[0]), v: pv, unit: ut, vc: pn ? col(pn) : null, bar: bar(q('.bar', pc)),
            sub: T(pm.filter(function (x) { return x !== unit && x !== pm[0]; })[0]),
            lines: grid ? [].slice.call(grid.children).map(function (d) { var sp = q('span', d) || d; return { t: T(d), c: col(sp) }; }) : [] };
        }
      }
    }
    // Presupuestos
    S.pre = sectHdr('pre');
    if (S.pre && !S.pre.col) {
      var slim = q('button.slim[data-b]', app);
      if (slim) S.pre.empty = { t: T(q('b', slim)), s: T(q('.mut', slim)), sel: '#app button.slim[data-b="' + slim.dataset.b + '"]' };
      S.pre.rows = qa('.row[data-b]', app).map(function (r) {
        var sp = qa('span', r.firstElementChild || r);
        var nm = q('.cil', r), vv = q('.mut', r);
        return { k: r.dataset.b, sel: '#app .row[data-b="' + r.dataset.b + '"]', ico: ico(q('.ci', r)),
          t: T(nm), v: T(vv), bar: bar(q('.bar', r)) };
      });
    }
    // Próximos pagos y Últimos movimientos (por su estructura, no por el texto)
    qa('#app > h2').forEach(function (h) {
      var card = h.nextElementSibling;
      if (!card || !card.classList.contains('card')) return;
      var sub = q('.mut', h), t = sub ? T(h).replace(T(sub), '').trim() : T(h);
      if (q('.row[data-id]', card) || (!q('.row', card) && /movim|transact/i.test(t))) {
        S.last = { t: t, rows: qa('.row[data-id]', card).map(function (r) {
          var a = q('.amt', r);
          return { id: r.dataset.id, sel: '#app .row[data-id="' + r.dataset.id + '"]', ico: ico(q('.ci', r)),
            t: T(q('.t', r)), s: T(q('.mut', r)), pend: !!q('span[title]', r), amt: T(a), ac: col(a) };
        }) };
      } else if (q('.row', card) && !q('.row[data-b]', card) && !q('[data-lk]', card)) {
        S.rec = { t: t, sub: T(sub).replace(/^·\\s*/, ''), rows: qa('.row', card).map(function (r) {
          var b = q('[data-rec]', r);
          return { ico: ico(q('.ci', r)), t: T(q('.t', r)), s: T(q('.mut', r)), amt: T(q('.amt', r)),
            reg: b ? { t: T(b), sel: '#app [data-rec="' + b.dataset.rec + '"]' } : null };
        }) };
      }
    });
    S.nav = qa('nav .tab').map(function (b) { return { k: b.dataset.t, t: T(b), svg: svgOf(b) }; });
    S.fab = svgOf(q('#add'));
    return S;
  }
  /* ---------- 5b) Datos de Movimientos para la app ---------- */
  var TXMAX = 300;
  function soloTexto(el) {
    if (!el) return '';
    return [].map.call(el.childNodes, function (n) { return n.nodeType === 3 ? n.textContent : ''; }).join(' ').replace(/\\s+/g, ' ').trim();
  }
  function pressed(b) { return b.getAttribute('aria-pressed') === 'true'; }
  function perOf(app) {
    var po = q('#peropen', app), pl = qa('.pnav', app);
    var lab = pl.length ? pl[0].nextElementSibling : null;
    return po ? { chip: T(po).replace(/\\s*⌄\\s*$/, ''), cal: svgOf(po), label: lab ? T(lab) : '',
      prev: !!q('.pnav[data-off="-1"]', app), next: !!q('.pnav[data-off="1"]', app),
      nextOff: !!(q('.pnav[data-off="1"]', app) || {}).disabled } : null;
  }
  function snapTx() {
    var app = q('#app'), qi = q('#q-in', app);
    if (!qi) return null;
    var S = { v: 1, lang: window.LKLANG || 'es', hide: !!window.HIDE, th: theme() };
    var h1 = q('h1', app), right = h1 && h1.nextElementSibling;
    var rl = right && q('.mut', right), rv = right && q('.num', right);
    S.hd = { t: T(h1), lb: soloTexto(rl), v: T(rv), vc: col(rv) };
    S.per = perOf(app);
    var fo = q('#fopen', app);
    S.fil = fo ? { t: T(fo), on: pressed(fo) } : null;
    S.q = { v: qi.value || '', ph: qi.getAttribute('placeholder') || '' };
    var qt = q('#qtop', app);
    var rlb = qt && q('span.mut', qt), rclr = qt && q('#qrclr', qt);
    S.rec = { lb: rlb ? T(rlb) : '', clr: rclr ? T(rclr) : '', items: qa('[data-qr]', qt).map(function (b) { return b.dataset.qr; }) };
    S.qall = qa('[data-qall]', qt).map(function (b) { return { k: b.dataset.qall, t: T(b), on: pressed(b) }; });
    var qs = qt && q('.qsum', qt);
    S.qsum = qs ? [].slice.call(qs.children).map(function (c) {
      var v = q('span', c);
      return { lb: v ? T(c).replace(T(v), '').trim() : T(c), v: v ? T(v) : '', c: v ? col(v) : null, b: c.tagName === 'B' };
    }) : null;
    S.sv = qa('[data-sv]', app).map(function (b) { return { k: b.dataset.sv, t: T(b), on: pressed(b) }; });
    S.tiles = qa('.tile[data-tl]', app).map(function (b) {
      var c = q('.ci', b), st = q('.stile', b), lb = q('.mut', b), v = q('.num', b), vs = v && q('span', v);
      return { k: b.dataset.tl, on: pressed(b), ico: c ? ico(c) : null, tile: st ? tile(st) : null,
        e: !c && !st && b.firstElementChild ? T(b.firstElementChild) : null, lb: T(lb), v: T(v), vc: col(vs || v) };
    });
    var tl = q('#txlist', app), icons = [], ik = {}, items = [], n = 0, total = 0;
    function icoKey(el) {
      var o = ico(el), k = JSON.stringify(o);
      if (ik[k] == null) { ik[k] = icons.length; icons.push(o); }
      return ik[k];
    }
    if (tl) [].forEach.call(tl.children, function (ch) {
      if (ch.classList.contains('day')) { if (n < TXMAX) items.push({ d: T(ch) }); return; }
      var r = q('.row[data-id]', ch);
      if (!r) { if (!n && !items.length) S.empty = T(ch); return; }
      total++;
      if (n >= TXMAX) return;
      n++;
      var a = q('.amt', r);
      items.push({ id: r.dataset.id, i: icoKey(q('.ci', r)), t: T(q('.t', r)), s: T(q('.mut', r)), a: T(a), ac: col(a), p: !!q('span[title]', r) });
    });
    while (items.length && items[items.length - 1].d != null) items.pop();
    var h2 = tl && tl.previousElementSibling;
    S.list = { t: h2 ? T(h2) : '', items: items, icons: icons, total: total, more: total > n };
    S.nav = qa('nav .tab').map(function (b) { return { k: b.dataset.t, t: T(b), svg: svgOf(b) }; });
    S.fab = svgOf(q('#add'));
    return S;
  }
  /* ---------- 5c) Reportes: "espejo" de la pantalla para dibujarla nativa ---------- */
  function px(v) { var n = parseFloat(v); return isFinite(n) ? Math.round(n * 10) / 10 : 0; }
  function colorOk(c) { return c && c !== 'transparent' && !/rgba\\([^)]*,\\s*0\\)$/.test(c); }
  function rutaDe(el) {
    var parts = [];
    while (el && el.id !== 'app') {
      if (el.id && /^[A-Za-z][\\w-]*$/.test(el.id)) { parts.unshift('#' + el.id); return parts.join(' > '); }
      var i = 1, x = el;
      while ((x = x.previousElementSibling)) i++;
      parts.unshift(':nth-child(' + i + ')');
      el = el.parentElement;
    }
    return '#app > ' + parts.join(' > ');
  }
  var INLINE = { inline: 1, 'inline-block': 1, 'inline-flex': 1, 'inline-grid': 1, contents: 1 };
  function tocable(el, cs) {
    var t = el.tagName;
    return t === 'BUTTON' || t === 'A' || (cs.cursor === 'pointer' && t !== 'LABEL');
  }
  function textoEstilo(cs) {
    var o = { fs: px(cs.fontSize), fw: cs.fontWeight, c: cs.color };
    if (cs.fontStyle === 'italic') o.it = 1;
    if (cs.textTransform && cs.textTransform !== 'none') o.tt = cs.textTransform;
    if (cs.textDecorationLine && cs.textDecorationLine.indexOf('line-through') >= 0) o.lt = 1;
    return o;
  }
  // SVG con colores y letras ya resueltos (la app no entiende var(--ac) ni style="font:…")
  function svgListo(el) {
    var cl = el.cloneNode(true), a = [el].concat([].slice.call(el.querySelectorAll('*'))), b = [cl].concat([].slice.call(cl.querySelectorAll('*')));
    a.forEach(function (o, i) {
      var c = b[i], cs = getComputedStyle(o);
      if (!c || !c.setAttribute) return;
      var tag = o.tagName.toLowerCase();
      if (tag !== 'svg' || i > 0) {
        if (cs.fill && cs.fill !== 'none') c.setAttribute('fill', cs.fill); else if (o.getAttribute('fill') === 'none' || cs.fill === 'none') c.setAttribute('fill', 'none');
        if (cs.stroke && cs.stroke !== 'none') c.setAttribute('stroke', cs.stroke);
        if (cs.opacity && cs.opacity !== '1') c.setAttribute('opacity', cs.opacity);
      }
      if (tag === 'text' || tag === 'tspan') {
        c.setAttribute('font-size', px(cs.fontSize));
        c.setAttribute('font-weight', cs.fontWeight);
        c.setAttribute('fill', cs.fill && cs.fill !== 'none' ? cs.fill : cs.color);
        if (cs.textTransform === 'capitalize') c.textContent = (o.textContent || '').replace(/(^|\\s)(\\S)/g, function (m, s1, s2) { return s1 + s2.toUpperCase(); });
        else if (cs.textTransform === 'uppercase') c.textContent = (o.textContent || '').toUpperCase();
      }
      c.removeAttribute('style'); c.removeAttribute('class');
    });
    // Textos vacíos dentro del SVG: en el iPhone pueden cortar el dibujo → quitarlos
    [].slice.call(cl.querySelectorAll('text,tspan')).forEach(function (t) { if (!(t.textContent || '').trim()) t.parentNode.removeChild(t); });
    // SVG dentro de otro SVG (íconos de la gráfica de barras): el iPhone no los ubica bien → pasarlos a <g> con translate/scale
    [].slice.call(cl.querySelectorAll('svg')).forEach(function (ns) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var x = parseFloat(ns.getAttribute('x')) || 0, y = parseFloat(ns.getAttribute('y')) || 0;
      var w = parseFloat(ns.getAttribute('width')), h = parseFloat(ns.getAttribute('height'));
      var vb = (ns.getAttribute('viewBox') || '').split(/[\\s,]+/).map(parseFloat);
      var sx = vb.length === 4 && vb[2] && w ? w / vb[2] : 1, sy = vb.length === 4 && vb[3] && h ? h / vb[3] : 1;
      var tr = 'translate(' + x + ' ' + y + ') scale(' + sx + ' ' + sy + ')' + (vb.length === 4 && (vb[0] || vb[1]) ? ' translate(' + (-vb[0]) + ' ' + (-vb[1]) + ')' : '');
      g.setAttribute('transform', tr);
      [].slice.call(ns.attributes).forEach(function (a) {
        if (!/^(x|y|width|height|viewBox|xmlns|xmlns:xlink|preserveAspectRatio)$/.test(a.name)) g.setAttribute(a.name, a.value);
      });
      while (ns.firstChild) g.appendChild(ns.firstChild);
      ns.parentNode.replaceChild(g, ns);
    });
    var r = el.getBoundingClientRect();
    cl.setAttribute('width', Math.round(r.width)); cl.setAttribute('height', Math.round(r.height));
    if (el.getAttribute('fill') == null && getComputedStyle(el).fill === 'none') cl.setAttribute('fill', 'none');
    // Zonas tocables de la gráfica (barras y meses)
    var zonas = [];
    [].forEach.call(el.querySelectorAll('rect[data-lk]'), function (z) {
      var zr = z.getBoundingClientRect();
      if (!zr.width || !zr.height) return;
      zonas.push({ x: Math.round(zr.left - r.left), y: Math.round(zr.top - r.top), w: Math.round(zr.width), h: Math.round(zr.height), sel: rutaDe(z) });
    });
    return { k: 'svg', x: cl.outerHTML, w: Math.round(r.width), h: Math.round(r.height), z: zonas.length ? zonas : undefined };
  }
  // Pedazos de texto en línea (texto, íconos y puntos de color)
  function enLinea(nodes, out) {
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var t = n.textContent.replace(/\\s+/g, ' ');
        if (t) out.push({ s: t, st: textoEstilo(getComputedStyle(n.parentElement)) });
        return;
      }
      if (n.nodeType !== 1) return;
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (n.tagName === 'BR') { out.push({ s: '\\n', st: textoEstilo(cs) }); return; }
      if (n.tagName === 'svg') { var sv = svgListo(n); out.push({ svg: sv.x, w: sv.w, h: sv.h }); return; }
      var r = n.getBoundingClientRect();
      if (cs.display === 'inline-block' || cs.display === 'inline-grid' || cs.display === 'inline-flex') {
        var inner = n.querySelector('svg');
        if (inner || !n.textContent.trim()) {
          out.push({ box: 1, w: Math.round(r.width), h: Math.round(r.height), bg: colorOk(cs.backgroundColor) ? cs.backgroundColor : null,
            r: px(cs.borderTopLeftRadius), mr: px(cs.marginRight), svg: inner ? svgListo(inner).x : null,
            sw: inner ? Math.round(inner.getBoundingClientRect().width) : 0 });
          return;
        }
      }
      enLinea([].slice.call(n.childNodes), out);
    });
    return out;
  }
  function esLinea(n, padreFlex) {
    if (n.nodeType === 3) return true;
    if (n.nodeType !== 1) return true;
    var cs = getComputedStyle(n);
    // Dentro de una fila flex o grid, cada elemento es una caja aparte (como en la web).
    if (padreFlex && cs.display !== 'none' && n.tagName !== 'BR' && (n.textContent.trim() || n.querySelector('svg') || n.getBoundingClientRect().width)) return false;
    if (cs.display === 'none') return true;
    if (n.tagName === 'svg') return false;
    if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'BUTTON') return false;
    return !!INLINE[cs.display] && !(cs.display === 'inline-flex' && n.children.length > 1);
  }
  function caja(cs, el, padre) {
    var o = {};
    var d = cs.display;
    if (d === 'flex' || d === 'inline-flex') {
      o.fd = cs.flexDirection;
      if (cs.flexWrap === 'wrap') o.fw = 1;
      if (cs.justifyContent && cs.justifyContent !== 'normal' && cs.justifyContent !== 'flex-start' && cs.justifyContent !== 'start') o.jc = cs.justifyContent;
      if (cs.alignItems && cs.alignItems !== 'normal' && cs.alignItems !== 'stretch') o.ai = cs.alignItems;
      var rg = px(cs.rowGap), cg = px(cs.columnGap);
      if (rg) o.rg = rg; if (cg) o.cg = cg;
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && cs.flexWrap !== 'wrap' && cs.flexDirection.indexOf('row') === 0) o.sx = 1;
    } else if (d === 'grid' || d === 'inline-grid') {
      var cols = (cs.gridTemplateColumns || '').split(' ').filter(Boolean).length || 1;
      if (cols > 1) { o.fd = 'row'; o.fw = 1; o.cols = cols; }
      var rg2 = px(cs.rowGap), cg2 = px(cs.columnGap);
      if (rg2) o.rg = rg2; if (cg2) o.cg = cg2;
      if (cs.alignItems && cs.alignItems !== 'normal' && cs.alignItems !== 'stretch') o.ai = cs.alignItems;
      if (cs.justifyItems === 'center') { o.jc = 'center'; o.ai = o.ai || 'center'; }
    }
    // Los botones de la web centran su contenido (por ejemplo, la flecha de enviar del chat)
    if (el.tagName === 'BUTTON' && !/flex|grid/.test(d)) { o.jc = 'center'; o.ai = 'center'; }
    var pd = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    if (pd.some(Boolean)) o.p = pd;
    var mg = [px(cs.marginTop), px(cs.marginRight), px(cs.marginBottom), px(cs.marginLeft)];
    if (mg.some(Boolean)) o.m = mg;
    if (colorOk(cs.backgroundColor)) o.bg = cs.backgroundColor;
    var br = px(cs.borderTopLeftRadius);
    if (br) o.br = Math.min(br, 999);
    ['Top', 'Right', 'Bottom', 'Left'].forEach(function (sd) {
      var w = px(cs['border' + sd + 'Width']);
      if (w && cs['border' + sd + 'Style'] !== 'none' && colorOk(cs['border' + sd + 'Color'])) {
        o['b' + sd[0]] = [w, cs['border' + sd + 'Color']];
        if (cs['border' + sd + 'Style'] === 'dashed') o.bs = 'dashed';
      }
    });
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') o.oh = 1;
    if (cs.opacity !== '1') o.op = +cs.opacity;
    var fg = parseFloat(cs.flexGrow);
    if (padre && /flex/.test(getComputedStyle(padre).display) && fg) o.fg = fg;
    if (padre && /flex/.test(getComputedStyle(padre).display)) {
      if (cs.flexShrink === '0') o.fs0 = 1;
      if (cs.alignSelf && cs.alignSelf !== 'auto') o.as = cs.alignSelf;
    }
    if (el.style.width) o.w = el.dataset.w || el.style.width;
    else if (INLINE[d] && d !== 'inline') {
      // Botones que en la web ocupan todo el ancho (width:100%) se quedan anchos
      var pcs = padre ? getComputedStyle(padre) : null, prr = padre ? padre.getBoundingClientRect() : null;
      var interior = prr ? prr.width - px(pcs.paddingLeft) - px(pcs.paddingRight) : 0;
      var mio = el.getBoundingClientRect().width + px(cs.marginLeft) + px(cs.marginRight);
      if (!(interior && mio >= interior - 2) || /flex/.test(pcs.display)) o.as = o.as || 'flex-start';
    }
    if (el.style.height || el.style.maxHeight) o.h = px(cs.height);
    // Círculos y botones redondos (íconos, ‹ ›): conservar su tamaño
    var rr = el.getBoundingClientRect();
    if (!o.w && rr.width && Math.abs(rr.width - rr.height) < 1.5 && br >= rr.width / 2 - 1 && rr.width <= 64) { o.w = Math.round(rr.width); o.h = Math.round(rr.height); o.fs0 = 1; }
    if (cs.position === 'absolute') {
      o.abs = 1;
      o.l = el.style.left && /%$/.test(el.style.left) ? el.style.left : px(cs.left);
      o.t = px(cs.top);
    } else if (cs.position === 'relative' && padre) o.rel = 1;
    return o;
  }
  function espejo(el, padre) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    if (el.tagName === 'svg') {
      var sv = svgListo(el), r0 = el.getBoundingClientRect(), pr = padre && padre.getBoundingClientRect();
      if (pr && Math.abs((r0.left - pr.left) - (pr.right - r0.right)) < 3 && r0.width < pr.width - 20) sv.c = 1;
      return sv;
    }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      return { k: 'in', sel: rutaDe(el), id: el.id || null, v: el.value || '', ph: el.getAttribute('placeholder') || '', multi: el.tagName === 'TEXTAREA', ro: !!el.readOnly,
        st: textoEstilo(cs), b: caja(cs, el, padre) };
    }
    var o = { k: 'v', b: caja(cs, el, padre) };
    if (el.id) o.id = el.id;
    if (tocable(el, cs)) { o.tap = rutaDe(el); if (el.disabled) o.dis = 1; if (el.getAttribute('aria-pressed') === 'true') o.on = 1; }
    var kids = [].slice.call(el.childNodes), ch = [], linea = [];
    function cerrar() {
      if (!linea.length) return;
      var runs = enLinea(linea, []);
      linea = [];
      while (runs.length && runs[0].s != null && !runs[0].s.trim()) runs.shift();
      while (runs.length && runs[runs.length - 1].s != null && !runs[runs.length - 1].s.trim()) runs.pop();
      if (runs.length && runs[0].s != null) runs[0].s = runs[0].s.replace(/^\\s+/, '');
      if (runs.length && runs[runs.length - 1].s != null) runs[runs.length - 1].s = runs[runs.length - 1].s.replace(/\\s+$/, '');
      if (!runs.length) return;
      ch.push({ k: 'p', runs: runs, ta: cs.textAlign === 'center' || cs.textAlign === 'right' || cs.textAlign === 'end' ? (cs.textAlign === 'end' ? 'right' : cs.textAlign) : null,
        lh: cs.lineHeight !== 'normal' ? px(cs.lineHeight) : null, ws: cs.whiteSpace === 'nowrap' ? 1 : 0, st: textoEstilo(cs) });
    }
    var flexP = /flex|grid/.test(cs.display);
    kids.forEach(function (n) {
      if (esLinea(n, flexP)) { linea.push(n); return; }
      cerrar();
      var c = espejo(n, el);
      if (c) ch.push(c);
    });
    cerrar();
    if (!ch.length) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      if (!o.b.w) o.b.w = Math.round(r.width);
      o.b.h = Math.round(r.height);
    }
    o.ch = ch;
    return o;
  }
  function snapRep() {
    var app = q('#app');
    if (!app || !q('h1', app)) return null;
    var ch = [];
    [].forEach.call(app.children, function (el) { var c = espejo(el, app); if (c) ch.push(c); });
    var acs = getComputedStyle(app), ancho = Math.round(app.getBoundingClientRect().width - px(acs.paddingLeft) - px(acs.paddingRight));
    return { v: 1, lang: window.LKLANG || 'es', hide: !!window.HIDE, th: theme(), tree: ch, ancho: ancho,
      nav: qa('nav .tab').map(function (b) { return { k: b.dataset.t, t: T(b), svg: svgOf(b) }; }), fab: svgOf(q('#add')) };
  }
  // Escribir en un campo de la web desde la app (por ejemplo, el chat financiero)
  window.__lkIn = function (sel, v) {
    var e = q(sel);
    if (!e) return;
    e.value = v;
    try { e.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {}
  };
  window.__lkEnter = function (sel) {
    var e = q(sel);
    if (!e) return;
    try { e.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); } catch (x) {}
    sched();
  };
  function state() {
    var tb = typeof tab !== 'undefined' ? tab : null, hv = typeof HV !== 'undefined' ? HV : null;
    var out = vis(q('#auth'));
    var home = tb === 'home' && hv === 'fin' && !!q('#app .hd');
    var txv = tb === 'tx' && !!q('#app #q-in');
    var repv = tb === 'rep' && !!q('#app h1');
    var kind = home ? 'home' : txv ? 'tx' : repv ? 'rep' : null;
    var S = home ? snap() : null, X = txv ? snapTx() : null, R = repv ? snapRep() : null;
    return { t: 'state', show: !!(kind && (S || X || R) && !covered()), kind: kind, out: out, tab: tb, snap: S, tx: X, rep: R };
  }
  // En Inicio y Movimientos la app dibuja los números: que la web no los "cuente".
  function conFila() {
    if (typeof window.render !== 'function' || window.render.__lkRem) return;
    var o = window.render;
    window.render = function () { var r = o.apply(this, arguments); try { remRow(); } catch (e) {} return r; };
    window.render.__lkRem = 1;
  }
  function sinConteo() {
    if (typeof window.lkCount !== 'function' || window.lkCount.__lk) return;
    var o = window.lkCount;
    window.lkCount = function () { try { if (tab === 'home' || tab === 'tx' || tab === 'rep') return; } catch (e) {} return o.apply(this, arguments); };
    window.lkCount.__lk = 1;
  }
  var last = '', timer = null, late = null;
  function send() {
    timer = null;
    var s;
    try { sinConteo(); } catch (e) {}
    try { conFila(); } catch (e) {}
    try { s = state(); } catch (e) { post({ t: 'err', where: 'state', msg: String(e && e.message || e) }); return; }
    var k = JSON.stringify(s);
    if (k !== last) { last = k; post(s); }
    try { rem(); } catch (e) {}
    try { remRow(); } catch (e) {}
  }
  function sched() {
    if (!timer) timer = setTimeout(send, 90);
    clearTimeout(late); late = setTimeout(send, 800);
  }
  window.__lkSched = sched;
  window.__lkState = function () { last = ''; send(); };

  /* ---------- 6) Recordatorios: pagos que vienen ---------- */
  var lastRem = '';
  function ymdOf(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dimOf(y, mo) { return new Date(y, mo + 1, 0).getDate(); }
  function rem() {
    if (typeof REC === 'undefined' || typeof ACC === 'undefined' || !window.LKREADY) return;
    if (!q('#app') || vis(q('#auth'))) return;
    var it = [], now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var nrmf = typeof nrm === 'function' ? nrm : function (s) { return String(s || '').toLowerCase(); };
    var paidNames = {};
    try {
      (typeof outMes === 'function' ? outMes() : []).forEach(function (t) {
        var k = nrmf(t.mer);
        REC.forEach(function (r) { var n = nrmf(r.n); if (n.length >= 3 && k.length >= 3 && (k.indexOf(n) >= 0 || n.indexOf(k) >= 0)) paidNames[r.n] = 1; });
      });
    } catch (e) {}
    function nextDays(day, months) {
      var out = [];
      for (var i = 0; i < months; i++) {
        var y = now.getFullYear(), mo = now.getMonth() + i, yy = y + Math.floor(mo / 12), mm2 = mo % 12;
        var d = new Date(yy, mm2, Math.min(day, dimOf(yy, mm2)));
        if (d >= t0) out.push({ d: d, thisMonth: i === 0 });
      }
      return out;
    }
    REC.forEach(function (r) {
      if (!r || !r.day) return;
      nextDays(+r.day, 3).forEach(function (o) {
        if (o.thisMonth && paidNames[r.n]) return;
        it.push({ k: 'rec', id: 'r:' + r.n + ':' + ymdOf(o.d), n: String(r.n || ''), amt: +r.amt || 0, date: ymdOf(o.d) });
      });
    });
    ACC.forEach(function (a) {
      if (a.tipo !== 'credito' || !a.rec || !a.pago) return;
      var debe = 0; try { debe = Math.max(a.ini - bal(a.n), 0); } catch (e) {}
      nextDays(+a.pago, 2).forEach(function (o) {
        it.push({ k: 'tc', id: 't:' + a.n + ':' + ymdOf(o.d), n: String(a.n || ''), amt: debe, date: ymdOf(o.d) });
      });
    });
    try {
      (typeof CUO !== 'undefined' ? CUO : []).forEach(function (c) {
        var x = cuoCalc(c);
        if (!x || !x.nx || x.rest <= 0) return;
        it.push({ k: 'cuo', id: 'c:' + c.n + ':' + ymdOf(x.nx), n: String(c.n || ''), amt: +x.q || 0, date: ymdOf(x.nx),
          num: x.k + 1, tot: +c.nc || 0 });
      });
    } catch (e) {}
    try {
      (window.LKGAR && LKGAR.all ? LKGAR.all() : []).forEach(function (g) {
        if (!g || !g.fecha) return;
        var d = new Date(String(g.fecha).slice(0, 10) + 'T12:00:00');
        if (isNaN(d)) return;
        d.setMonth(d.getMonth() + (+g.meses || 0));
        if (d < t0) return;
        it.push({ k: 'gar', id: 'g:' + g.id + ':' + ymdOf(d), n: String(g.nombre || ''), amt: 0, date: ymdOf(d) });
      });
    } catch (e) {}
    var m2 = { t: 'rem', items: it, hide: !!window.HIDE, lang: window.LKLANG || 'es' };
    var k = JSON.stringify(m2);
    if (k !== lastRem) { lastRem = k; post(m2); }
  }

  /* ---------- 7) Fila "Recordatorios en el celular" en Ajustes ---------- */
  window.__lkRemSet = function (on) { REM_ON = on; var r = q('#lkapp-rem'); if (r) r.remove(); remRow(); };
  function remRow() {
    if (typeof tab === 'undefined' || tab !== 'con') return;
    if (q('#lkapp-rem')) return;
    var snd = q('#app [data-lk="snd"]'), row = snd && snd.closest('.srow');
    if (!row) return;
    var on = REM_ON === true;
    var d = document.createElement('div');
    d.className = 'srow'; d.id = 'lkapp-rem'; d.style.cursor = 'default';
    var ico = '<svg class="li" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.8"/><path d="M4.5 4.5 7 2.5M19.5 4.5 17 2.5"/></svg>';
    var st0 = q('.stile', row);
    d.innerHTML = '<div class="stile">' + (st0 && q('svg', st0) ? ico : '⏰') + '</div><div class="grow"><div class="t">' + Lx('Recordatorios', 'Reminders') +
      '</div><div class="mut" style="font-size:13px">' + Lx('Avisos en el celular de pagos fijos, cuotas y garantías', 'Phone alerts for bills, installments and warranties') +
      (on ? ' · <button class="lnk" data-lkrem="test" style="padding:0;font-size:13px">' + Lx('Probar', 'Test') + '</button>' : '') +
      '</div></div><div class="seg"><button data-lkrem="si" aria-pressed="' + on + '">' + Lx('Sí', 'Yes') +
      '</button><button data-lkrem="no" aria-pressed="' + !on + '">No</button></div>';
    row.parentNode.insertBefore(d, row.nextSibling);
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-lkrem]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var v = b.dataset.lkrem;
    if (v === 'test') { post({ t: 'remtest' }); return; }
    post({ t: 'remset', on: v === 'si' });
  }, true);

  /* ---------- La app ya mostró su Inicio: quitar la animación de bienvenida de la web ---------- */
  // Si no, queda escondida detrás del Inicio nativo y aparece al tocar otra pestaña.
  var SIN_SPLASH = ${sinSplash ? 'true' : 'false'};
  function sinAnimacion() {
    var sp = q('#splash');
    if (!sp) return;
    try { sp.click(); } catch (e) {}
    if (sp.parentNode) sp.parentNode.removeChild(sp);
    setTimeout(function () { try { if (window.lkAnim) lkAnim(false); } catch (e) {} }, 0);
  }

  /* ---------- 8) Formulario de anotar nativo ---------- */
  var FORM_NATIVO = ${formNativo ? 'true' : 'false'};
  function nodo(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return d; }
  function icoH(h) {
    var d = nodo(h), c = q('.ci', d) || d.firstElementChild;
    if (!c) return null;
    var sv = q('svg', c);
    return { svg: sv ? sv.outerHTML : null, e: sv ? null : (c.textContent || '').trim(), c: (c.style.getPropertyValue('--c') || '').trim() };
  }
  function tileH(h) {
    var d = nodo(h), st = q('.stile', d) || d.firstElementChild;
    if (!st) return null;
    var sv = q('svg', st);
    return { svg: sv ? sv.outerHTML : null, t: sv ? '' : (st.textContent || '').trim(), bg: st.style.backgroundColor || st.style.background || '', c: st.style.color || '' };
  }
  var TRf = function (s) { try { return window.LKTR ? (LKTR(s) || s) : s; } catch (e) { return s; } };
  window.__lkFormData = function () {
    try {
      var cats = Object.keys(CATS).filter(function (k) { return k !== 'ing'; }).map(function (k) {
        return { k: k, n: TRf(CATS[k][0]), ico: icoH(ci(k, 44)), subs: (SUBS[k] || []).map(function (x) { return { v: x, t: TRf(x) }; }) };
      });
      var accs = [''].concat(allAcc().filter(function (k) { return k !== 'Sin cuenta' && k !== 'Sin tarjeta'; })).map(function (n) {
        var a = accDisp(n);
        return { n: n, lb: TRf(a.n), s: TRf(a.s), tile: tileH(a.i) };
      });
      var pa = ACC.filter(function (a) { return a.pri; })[0];
      var tp = {};
      ['out', 'in', 'tr'].forEach(function (k) {
        tp[k] = { svg: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + TPI[k][0] + '</svg>', t: TRf(TPI[k][1]) };
      });
      var d = { t: 'form', cats: cats, accs: accs, def: pa ? pa.n : '', hoy: iso(0), ayer: iso(1), tp: tp, foto: false,
        lang: window.LKLANG || 'es', th: theme() };
      post(d);
      try {
        if (window.claude && claude.use) claude.use('sample').then(function (sm) { return sm ? sm.limits() : null; }).then(function (l) {
          if (l && l.images) { d.foto = true; post(d); }
        }).catch(function () {});
      } catch (e) {}
    } catch (e) { post({ t: 'err', where: 'form', msg: String(e && e.message || e) }); }
  };
  function selVal(id, v) {
    var e = document.getElementById(id);
    if (!e) return;
    e.value = v;
    if (e.tagName === 'SELECT' && v && e.value !== v) { var o = document.createElement('option'); o.textContent = v; e.appendChild(o); e.value = v; }
  }
  window.__lkSave = function (d) {
    try {
      EDIT = null; PFDATE = null;
      var ed = d.edit ? txPor(d.edit) : null;
      if (d.edit && !ed) throw new Error('No encontré ese movimiento. Actualiza e intenta otra vez.');
      fillAcc();
      TP = d.tp;
      selVal('f-amt', String(d.a));
      selVal('f-mer', d.mer || '');
      selVal('f-cat', d.tp === 'out' ? (d.cat || '') : '');
      selVal('f-sub', d.tp === 'out' ? (d.sub || '') : '');
      selVal('f-acc', d.acc || '');
      selVal('f-dst', d.tp === 'tr' ? (d.dst || '') : '');
      var hoy = iso(0);
      selVal('f-date', d.date || hoy);
      PFDATE = d.date && d.date !== hoy ? d.date : null;
      if (ed) { EDIT = ed; PFDATE = d.date && d.date !== ed.date ? d.date : null; }
      syncForm();
      document.getElementById('save').click();
      post({ t: 'saved', ok: true });
    } catch (e) { post({ t: 'saved', ok: false, msg: String(e && e.message || e) }); }
    sched();
  };
  // Editar un movimiento con el formulario nativo
  function txPor(id) { return (typeof tx !== 'undefined' ? tx : []).filter(function (x) { return String(x.id) === String(id); })[0]; }
  window.__lkEditData = function (id) {
    var t = txPor(id);
    if (!t) return;
    if (t.pend) { try { toast('Este movimiento se enviará a tu hoja cuando vuelva la conexión'); } catch (e) {} return; }
    try { CUR = t; } catch (e) {}
    var cs = document.getElementById('csheet');
    if (cs) cs.classList.remove('on');
    window.__lkFormData();
    post({ t: 'edit', d: { id: String(t.id), tp: t.tipo || 'out', a: t.amt, mer: t.mer || '', cat: (t.cat in CATS) && t.cat !== 'ing' ? t.cat : '',
      sub: t.sub || '', acc: t.acc || '', dst: t.dst || '', date: t.date } });
    sched();
  };
  // Eliminar un movimiento (después de confirmar en la app)
  window.__lkDel = function (id) {
    var t = txPor(id);
    if (!t) return;
    if (t.pend) { try { toast('Este movimiento se enviará a tu hoja cuando vuelva la conexión'); } catch (e) {} return; }
    try { CUR = t; DELQ = true; delRow(); } catch (e) { post({ t: 'err', where: 'del', msg: String(e && e.message || e) }); }
    sched();
  };
  // "Editar" en el detalle del movimiento → formulario nativo
  document.addEventListener('click', function (e) {
    if (!FORM_NATIVO) return;
    var b = e.target && e.target.closest && e.target.closest('#cedit');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { if (CUR) window.__lkEditData(CUR.id); } catch (x) {}
  }, true);
  // Abrir IA o Foto (escanear recibo) de la web desde el formulario nativo
  window.__lkFormWeb = function (k) {
    try {
      var b = document.createElement('button');
      if (k === 'cats') b.dataset.s2 = 'cats';
      else if (k === 'acc') b.id = 'pk-addacc';
      else b.dataset.hm = k;
      b.style.display = 'none';
      document.body.appendChild(b); b.click(); b.remove();
    } catch (e) {}
    sched();
  };
  // El botón + de la web abre el formulario nativo
  document.addEventListener('click', function (e) {
    if (!FORM_NATIVO) return;
    var b = e.target && e.target.closest && e.target.closest('#add');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    post({ t: 'add' });
  }, true);
  // Avisos cortos de la web (toast) → la app los muestra encima de lo nativo
  var lastToast = '', lastToastAt = 0;
  function toastObs() {
    var t = document.getElementById('toast');
    if (!t) return;
    new MutationObserver(function () {
      if (!t.classList.contains('on')) return;
      var s = T(t), now = Date.now();
      if (!s || (s === lastToast && now - lastToastAt < 1500)) return;
      lastToast = s; lastToastAt = now;
      post({ t: 'toast', s: s });
    }).observe(t, { attributes: true, attributeFilter: ['class'], childList: true, characterData: true, subtree: true });
  }

  /* ---------- Observadores ---------- */
  function start() {
    if (SIN_SPLASH) sinAnimacion();
    try { toastObs(); } catch (e) {}
    try {
      new MutationObserver(function (ms) {
        // Si la web volvió a dibujar Ajustes, poner la fila de Recordatorios ya
        // (antes de que se pinte la pantalla), para que no parpadee.
        try { remRow(); } catch (e) {}
        for (var i = 0; i < ms.length; i++) {
          var t = ms[i].target;
          if (t && t.id === 'toast') continue;
          if (t && t.closest && t.closest('#toast')) continue;
          sched(); return;
        }
      }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'aria-pressed', 'data-theme'] });
      new MutationObserver(sched).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
    } catch (e) {}
    ['transitionend', 'animationend', 'resize', 'scroll'].forEach(function (ev) { window.addEventListener(ev, sched, { passive: true, capture: true }); });
    document.addEventListener('visibilitychange', sched);
    setInterval(sched, 60000);
    sched();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})(); true;`;
}
