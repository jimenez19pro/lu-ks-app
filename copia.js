// "Abrir más rápido": guarda en el celular una copia completa de la página
// de Lu-Ks (con Firebase incluido) y la abre desde ahí, sin esperar a internet.
// La copia se abre con la misma dirección de siempre (baseUrl), así que la
// sesión, los datos guardados y Firebase funcionan igual.
// En cada apertura se revisa en segundo plano si hay una versión nueva; si la
// hay, se usa la próxima vez que se abra la app.
import { borrar, guardarJSON, guardarTexto, leerJSON, leerTexto } from './almacen';

export const BASE = 'https://jimenez19pro.github.io/lu-ks/';
const HTML = 'copia-lu-ks.html';
const META = 'copia-lu-ks.json';
const CORTE = 15000;

function conTiempo(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), CORTE);
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t));
}

export function absoluta(src) {
  const s = String(src || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return 'https:' + s;
  if (s.startsWith('/')) return BASE.replace(/^(https?:\/\/[^/]+).*$/, '$1') + s;
  return BASE + s.replace(/^\.\//, '');
}

// Mete dentro del HTML los scripts de afuera (config.js y Firebase) y quita
// lo que no hace falta (tipografías de Google, que con letra del sistema no se usan).
export async function armar(html, traer = (u) => conTiempo(u).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))) {
  const re = /<script\s+src="([^"]+)"\s*><\/script>/g;
  const srcs = [];
  let m;
  while ((m = re.exec(html))) srcs.push(m[1]);
  const codigos = {};
  for (const s of srcs) {
    const u = absoluta(s);
    if (!u) throw new Error('src ' + s);
    const code = await traer(u);
    if (!code || code.length < 20) throw new Error('vacío ' + s);
    codigos[s] = code;
  }
  let out = html.replace(re, (all, s) => '<script>/* ' + s + ' */\n' + codigos[s].replace(/<\/script/gi, '<\\/script') + '\n</script>');
  out = out
    .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>/g, '')
    .replace(/<link[^>]+fonts\.gstatic\.com[^>]*>/g, '');
  return { html: out, scripts: srcs };
}

export function copiaGuardada() {
  const meta = leerJSON(META);
  if (!meta || meta.mala) return null;
  const html = leerTexto(HTML);
  if (!html || html.length < 100000 || html.indexOf('</html>') < 0) return null;
  return { html, meta };
}

export function marcarMala() {
  const meta = leerJSON(META) || {};
  meta.mala = true;
  guardarJSON(META, meta);
}

export function borrarCopia() {
  borrar(HTML);
  borrar(META);
}

// Revisa si hay versión nueva y actualiza la copia. Devuelve true si cambió.
export async function actualizar() {
  const meta = leerJSON(META) || {};
  const headers = {};
  if (meta.etag && !meta.mala && leerTexto(HTML)) headers['If-None-Match'] = meta.etag;
  const r = await conTiempo(BASE + 'index.html', { headers, cache: 'no-store' });
  if (r.status === 304) {
    guardarJSON(META, { ...meta, revisada: Date.now() });
    return false;
  }
  if (!r.ok) throw new Error('index ' + r.status);
  const crudo = await r.text();
  if (crudo.length < 100000 || crudo.indexOf('</html>') < 0) throw new Error('index incompleto');
  const { html, scripts } = await armar(crudo);
  if (!guardarTexto(HTML, html)) throw new Error('no se pudo guardar');
  guardarJSON(META, {
    etag: r.headers.get('etag') || null,
    largo: crudo.length,
    scripts,
    guardada: Date.now(),
    revisada: Date.now(),
  });
  return true;
}
