// Portadas de las tarjetas: copia segura en el celular.
// Regla: una portada solo sale de la copia si la persona la quitó (o borró/renombró la
// cuenta), nunca porque Firebase tardó o mandó una lista incompleta.
// prev: copia actual {nombre: {img, c}}; m: mensaje de la web {m, q, srv}; pedidas: nombres
// que ya se pidió volver a subir (se marca aquí). Devuelve la copia nueva y lo que falta subir.
export function mezclarPortadas(prev, m, pedidas = {}) {
  const nuevas = (m && m.m) || {};
  const quitadas = m && Array.isArray(m.q) ? m.q : [];
  const p = { ...(prev || {}), ...nuevas };
  quitadas.forEach((n) => {
    if (!nuevas[n]) delete p[n];
  });
  const faltan = {};
  // Firebase ya respondió y le falta alguna que el celular sí tiene: volver a subirla
  if (m && m.srv) {
    Object.keys(p).forEach((n) => {
      if (!nuevas[n] && p[n] && p[n].img && !pedidas[n]) {
        faltan[n] = p[n].img;
        pedidas[n] = 1;
      }
    });
  }
  return { p, faltan };
}

// Lee el archivo guardado (formato viejo = un solo mapa sin usuario → "suelta").
export function archivoPortadas(x) {
  if (x && x.v === 2 && x.por && typeof x.por === 'object') return { ultimo: x.ultimo || null, por: x.por };
  if (x && typeof x === 'object' && Object.keys(x).length) return { ultimo: null, por: {}, suelta: x };
  return { ultimo: null, por: {} };
}
// Portadas para mostrar al abrir la app (las del último usuario que entró).
export function portadasDe(A) {
  if (A.ultimo && A.por[A.ultimo]) return A.por[A.ultimo];
  return A.suelta || {};
}
