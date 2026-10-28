// Lo que la app guarda en el celular: la copia de la página (para abrir
// rápido y sin internet), la última foto del Inicio y las preferencias.
import { File, Paths } from 'expo-file-system';

function archivo(nombre) {
  return new File(Paths.document, nombre);
}

export function leerTexto(nombre) {
  try {
    const f = archivo(nombre);
    if (!f.exists) return null;
    return f.textSync();
  } catch {
    return null;
  }
}

export function guardarTexto(nombre, texto) {
  try {
    const f = archivo(nombre);
    if (!f.exists) f.create();
    f.writeSync(texto);
    return true;
  } catch {
    return false;
  }
}

export function borrar(nombre) {
  try {
    const f = archivo(nombre);
    if (f.exists) f.delete();
  } catch {}
}

export function leerJSON(nombre, defecto = null) {
  const t = leerTexto(nombre);
  if (!t) return defecto;
  try {
    return JSON.parse(t);
  } catch {
    return defecto;
  }
}

export function guardarJSON(nombre, valor) {
  return guardarTexto(nombre, JSON.stringify(valor));
}
