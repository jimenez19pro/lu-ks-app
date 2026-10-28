// Recordatorios en el celular: avisos programados en el iPhone/Android para
// pagos fijos, pago de tarjetas, cuotas y garantías por vencer.
// Los datos vienen de la web (puente.js, mensaje "rem").
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const MAX = 60; // iOS deja máximo 64 avisos programados por app
const CANAL = 'recordatorios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function plata(n) {
  const v = Math.round(Math.abs(Number(n) || 0));
  return '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function fecha(ymd, h, min = 0, diasAntes = 0) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d - diasAntes, h, min, 0, 0);
}

// Arma la lista de avisos (título, texto y hora) a partir de los pagos.
export function armarAvisos(items, { hide = false, lang = 'es' } = {}, ahora = new Date()) {
  const en = lang === 'en';
  const $ = (n) => (hide || !n ? '' : plata(n));
  const out = [];
  const add = (cuando, title, body, id) => {
    if (cuando.getTime() > ahora.getTime() + 60 * 1000) out.push({ cuando, title, body, id });
  };
  for (const it of items || []) {
    const n = it.n || '';
    if (it.k === 'rec' || it.k === 'tc') {
      const que = it.k === 'tc' ? (en ? `your ${n} card` : `la tarjeta ${n}`) : n;
      const monto = $(it.amt);
      add(
        fecha(it.date, 19, 0, 1),
        en ? `Tomorrow you pay ${que}` : `Mañana pagas ${que}`,
        monto ? (en ? `${monto} · Tap to open Lu-Ks` : `${monto} · Toca para abrir Lu-Ks`) : en ? 'Tap to open Lu-Ks' : 'Toca para abrir Lu-Ks',
        it.id + ':-1'
      );
      add(
        fecha(it.date, 8, 0, 0),
        en ? `Today you pay ${que} 📅` : `Hoy pagas ${que} 📅`,
        monto ? (en ? `${monto} · Remember to record it` : `${monto} · Recuerda registrarlo`) : en ? 'Remember to record it' : 'Recuerda registrarlo',
        it.id + ':0'
      );
    } else if (it.k === 'cuo') {
      const cuota = it.num && it.tot ? (en ? ` ${it.num} of ${it.tot}` : ` ${it.num} de ${it.tot}`) : '';
      const monto = $(it.amt);
      add(
        fecha(it.date, 19, 0, 1),
        en ? `Tomorrow: installment${cuota} of ${n}` : `Mañana pagas la cuota${cuota} de ${n}`,
        monto || (en ? 'Tap to open Lu-Ks' : 'Toca para abrir Lu-Ks'),
        it.id + ':-1'
      );
      add(
        fecha(it.date, 8, 0, 0),
        en ? `Today: installment${cuota} of ${n} 💳` : `Hoy pagas la cuota${cuota} de ${n} 💳`,
        monto || (en ? 'Tap to open Lu-Ks' : 'Toca para abrir Lu-Ks'),
        it.id + ':0'
      );
    } else if (it.k === 'gar') {
      for (const d of [30, 7, 0]) {
        add(
          fecha(it.date, 9, 0, d),
          d === 0
            ? en ? `The warranty for ${n} expires today 🧾` : `Hoy vence la garantía de ${n} 🧾`
            : en ? `The warranty for ${n} expires in ${d} days` : `La garantía de ${n} vence en ${d} días`,
          en ? 'If something is wrong with it, claim it before it expires.' : 'Si tiene algún daño, reclámala antes de que se venza.',
          it.id + ':' + d
        );
      }
    }
  }
  out.sort((a, b) => a.cuando - b.cuando);
  return out.slice(0, MAX);
}

export async function permiso(pedir) {
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
    if (!pedir || p.canAskAgain === false) return false;
    const r = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return !!r.granted;
  } catch {
    return false;
  }
}

async function canal() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de pagos',
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {}
}

// Borra los avisos anteriores y programa los nuevos.
export async function programar(items, opts) {
  const avisos = armarAvisos(items, opts);
  await canal();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
  let n = 0;
  for (const a of avisos) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: a.id,
        content: { title: a.title, body: a.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.cuando, channelId: CANAL },
      });
      n++;
    } catch {}
  }
  return n;
}

export async function apagar() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function prueba(lang = 'es') {
  const en = lang === 'en';
  await canal();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: en ? 'This is how your reminders look ⏰' : 'Así se ven tus recordatorios ⏰',
      body: en ? 'Lu-Ks will remind you of bills, installments and warranties.' : 'Lu-Ks te avisará de tus pagos, cuotas y garantías.',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 4, channelId: CANAL },
  });
}
