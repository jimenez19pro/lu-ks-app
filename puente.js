// Código que corre DENTRO de la página de Lu-Ks (en el WebView).
// Conecta la web con la app: avisos, descargas, botón Atrás, y además
// manda a la app los datos del Inicio (para el Inicio nativo) y los pagos
// que vienen (para los recordatorios en el celular).
export function puente({ version, os, recordatorios }) {
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
    el.click();
    sched();
    return true;
  };
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
    var w = parseFloat(i.style.width);
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
  function state() {
    var tb = typeof tab !== 'undefined' ? tab : null, hv = typeof HV !== 'undefined' ? HV : null;
    var out = vis(q('#auth'));
    var home = tb === 'home' && hv === 'fin' && !!q('#app .hd');
    var S = home ? snap() : null;
    return { t: 'state', show: !!(home && S && !covered()), out: out, tab: tb, snap: S };
  }
  var last = '', timer = null, late = null;
  function send() {
    timer = null;
    var s;
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

  /* ---------- Observadores ---------- */
  function start() {
    try {
      new MutationObserver(function (ms) {
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
