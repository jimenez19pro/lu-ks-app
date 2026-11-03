// Lu-Ks — app nativa.
// Etapa 1: abre la web de Lu-Ks dentro de la app, con ajustes nativos.
// Etapa 2: Inicio nativo (inicio.js), abre más rápido con una copia guardada
// en el celular (copia.js) y recordatorios en el celular (recordatorios.js).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';

import Inicio, { BarraAbajo, tema } from './inicio';
import Movimientos from './movimientos';
import Formulario from './formulario';
import Reportes, { HojaEspejo } from './reportes';
import { Cuenta, Detalle, Menu } from './hojas';
import Cuentas from './cuentas';
import NuevaCuenta from './nuevacuenta';
import Bienvenida, { Intro } from './bienvenida';
import { elegir } from './selector';
import { puente } from './puente';
import { BASE, actualizar, copiaGuardada, marcarMala } from './copia';
import { archivoPortadas, mezclarPortadas, portadasDe } from './portadas';
import { borrar, guardarJSON, leerJSON } from './almacen';
import * as Rec from './recordatorios';

export const WEB = BASE;
const VERSION = '1.6.2';

// Dominios que se abren dentro de la app. Todo lo demás (WhatsApp, correo,
// Google Sheets, páginas externas) se abre afuera, en su app o en Safari.
const INSIDE = ['jimenez19pro.github.io', 'lu-ks-ia.firebaseapp.com', 'lu-ks-ia.web.app'];

// Colores del sistema de Apple (iguales a los de Lu-Ks).
const LIGHT = { bg: '#F2F2F7', fg: '#000000', sub: '#6C6C70', acc: '#007AFF' };
const DARK = { bg: '#000000', fg: '#FFFFFF', sub: '#98989F', acc: '#0A84FF' };

const F_INICIO = 'inicio.json';
const F_PREFS = 'prefs.json';
const F_PORT = 'portadas.json';
const ESPERA_COPIA = 15000;

SplashScreen.preventAutoHideAsync().catch(() => {});

export function isInside(url) {
  if (/^(about:|blob:|data:|javascript:)/.test(url)) return true;
  const m = /^https?:\/\/([^/?#]+)/i.exec(url);
  if (!m) return false;
  const host = m[1].toLowerCase().replace(/:\d+$/, '');
  return INSIDE.some((d) => host === d || host.endsWith('.' + d));
}

function openOutside(url) {
  if (!url) return;
  Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir', 'Revisa que tengas la app instalada.'));
}

async function saveAndShare({ name, mime, data }) {
  try {
    const safe = String(name || 'archivo').replace(/[\\/:*?"<>|]/g, '_');
    const file = new File(Paths.cache, safe);
    if (file.exists) file.delete();
    file.create();
    file.writeSync(data, { encoding: 'base64' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: mime || undefined, dialogTitle: safe });
    } else {
      Alert.alert('Guardado', 'El archivo quedó guardado en la app.');
    }
  } catch (e) {
    Alert.alert('No se pudo guardar', String((e && e.message) || e));
  }
}

function Offline({ c, onRetry }) {
  return (
    <View style={[s.off, { backgroundColor: c.bg }]}>
      <Text style={s.offIcon}>📡</Text>
      <Text style={[s.offTitle, { color: c.fg }]}>Sin conexión</Text>
      <Text style={[s.offText, { color: c.sub }]}>Lu-Ks necesita internet para abrir. Revisa tus datos o el Wi-Fi e intenta otra vez.</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [s.btn, { backgroundColor: c.acc, opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={s.btnText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const tx = (lang, es, en) => (lang === 'en' ? en : es);

export default function App() {
  const sysDark = useColorScheme() === 'dark';
  const web = useRef(null);
  const canBack = useRef(false);

  // Lo guardado en el celular (se lee una sola vez al abrir).
  const inicial = useMemo(() => {
    const snap = leerJSON(F_INICIO);
    const prefs = leerJSON(F_PREFS, {}) || {};
    const copia = copiaGuardada();
    return { snap, prefs, copia };
  }, []);
  const prefs = useRef(inicial.prefs);
  const guardarPrefs = (p) => {
    prefs.current = { ...prefs.current, ...p };
    guardarJSON(F_PREFS, prefs.current);
  };

  const [snap, setSnap] = useState(inicial.snap);
  const [txSnap, setTxSnap] = useState(null);
  const [esp, setEsp] = useState({});
  const [det, setDet] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [menu, setMenu] = useState(null);
  const [irA, setIrA] = useState(null);
  const [hoja, setHoja] = useState(null);
  const [cuentas, setCuentas] = useState(null);
  const [cuentasVis, setCuentasVis] = useState(false);
  const cuentasPend = useRef(false);
  const [accForm, setAccForm] = useState(null);
  const [accVis, setAccVis] = useState(false);
  const [accRes, setAccRes] = useState(null);
  const [accSes, setAccSes] = useState(0); // cuenta cada apertura del formulario
  const [land, setLand] = useState(null);
  // Copia de portadas en el celular, separada por usuario: {v:2, ultimo: uid, por: {uid: {nombre: {img, c}}}}
  const portArch = useRef(null);
  if (!portArch.current) portArch.current = archivoPortadas(leerJSON(F_PORT, null));
  const [portadas, setPortadas] = useState(() => portadasDe(portArch.current));
  const portRef = useRef(portadas); // copia segura de las portadas (solo se quitan si la persona las quita)
  const portRep = useRef({}); // portadas que ya se pidió volver a subir en esta apertura
  const [intro, setIntro] = useState(!!inicial.snap);
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 4500); // por si acaso
    return () => clearTimeout(t);
  }, []);
  const [navPend, setNavPend] = useState(null);
  const navPendRef = useRef(null);
  const navPendT = useRef(null);
  const [editar, setEditar] = useState(null);
  const [kind, setKind] = useState('home');
  const [show, setShow] = useState(!!inicial.snap);
  const [formVis, setFormVis] = useState(false);
  const [formData, setFormData] = useState(null);
  const [aviso, setAviso] = useState(null);
  const avisoT = useRef(null);
  const showT = useRef(null);
  const [viejo, setViejo] = useState(!!inicial.snap);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);
  const [source, setSource] = useState(
    inicial.copia ? { html: inicial.copia.html, baseUrl: BASE } : { uri: BASE }
  );
  const usandoCopia = useRef(!!inicial.copia);
  const cargo = useRef(false);
  const settled = useRef(false);
  const tapAt = useRef(0);
  const guardarT = useRef(null);
  const yaActualizo = useRef(false);
  const remItems = useRef(null);
  const remT = useRef(null);
  const preguntado = useRef(false);
  const opacity = useRef(new Animated.Value(inicial.snap ? 1 : 0)).current;

  const bridge = useMemo(
    () => puente({ version: VERSION, os: Platform.OS, recordatorios: inicial.prefs.rem, sinSplash: !!inicial.snap, formNativo: true }),
    [inicial.prefs.rem]
  );

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (inicial.snap) setTimeout(hideSplash, 50);
    const t = setTimeout(hideSplash, 6000);
    return () => clearTimeout(t);
  }, [hideSplash, inicial.snap]);

  // Mostrar u ocultar el Inicio nativo con una transición corta.
  useEffect(() => {
    if (show) Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    else {
      opacity.stopAnimation();
      opacity.setValue(0);
    }
  }, [show, opacity]);

  // Si la copia guardada no arranca, abrir la página normal desde internet.
  useEffect(() => {
    if (!usandoCopia.current) return;
    const t = setTimeout(() => {
      if (cargo.current || !usandoCopia.current) return;
      marcarMala();
      usandoCopia.current = false;
      setSource({ uri: BASE });
      setKey((k) => k + 1);
    }, ESPERA_COPIA);
    return () => clearTimeout(t);
  }, [key]);

  // Al volver a la app, pedir a la web el estado actual.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && web.current) web.current.injectJavaScript('window.__lkState&&window.__lkState();true;');
    });
    return () => sub.remove();
  }, []);

  // Botón Atrás (Android): primero cierra ventanas, luego sale de la app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!web.current) return false;
      web.current.injectJavaScript(
        "(function(){if(!(window.__lkBack&&window.__lkBack())){var t=window.tab;if(t&&t!=='home'){var b=document.querySelector('nav .tab[data-t=\"home\"]');if(b){b.click();return}}window.ReactNativeWebView.postMessage(JSON.stringify({t:'back'}))}})();true;"
      );
      return true;
    });
    return () => sub.remove();
  }, []);

  /* ---------- Recordatorios ---------- */
  const reprogramar = useCallback(async (forzar) => {
    const m = remItems.current;
    if (!m || prefs.current.rem !== true) return;
    const hoy = new Date().toDateString();
    const firma = JSON.stringify([m.items, m.hide, m.lang, hoy]);
    if (!forzar && firma === prefs.current.remFirma) return;
    if (!(await Rec.permiso(false))) return;
    await Rec.programar(m.items, { hide: m.hide, lang: m.lang });
    guardarPrefs({ remFirma: firma });
  }, []);

  const setRem = useCallback(
    async (on, lang) => {
      if (!on) {
        guardarPrefs({ rem: false, remFirma: null });
        await Rec.apagar();
        web.current && web.current.injectJavaScript('window.__lkRemSet&&window.__lkRemSet(false);true;');
        return;
      }
      const ok = await Rec.permiso(true);
      if (!ok) {
        guardarPrefs({ rem: false });
        web.current && web.current.injectJavaScript('window.__lkRemSet&&window.__lkRemSet(false);true;');
        Alert.alert(
          tx(lang, 'Activa las notificaciones', 'Turn on notifications'),
          tx(
            lang,
            'Para recibir los recordatorios, permite las notificaciones de esta app en los Ajustes del celular.',
            'To get reminders, allow notifications for this app in your phone Settings.'
          ),
          [
            { text: tx(lang, 'Ahora no', 'Not now'), style: 'cancel' },
            { text: tx(lang, 'Abrir Ajustes', 'Open Settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      guardarPrefs({ rem: true, remFirma: null });
      web.current && web.current.injectJavaScript('window.__lkRemSet&&window.__lkRemSet(true);true;');
      await reprogramar(true);
    },
    [reprogramar]
  );

  const preguntar = useCallback(
    (lang) => {
      if (preguntado.current || prefs.current.rem != null) return;
      preguntado.current = true;
      setTimeout(() => {
        Alert.alert(
          tx(lang, '¿Te recuerdo tus pagos? ⏰', 'Want payment reminders? ⏰'),
          tx(
            lang,
            'Lu-Ks puede avisarte en el celular un día antes y el mismo día de tus pagos fijos, cuotas y garantías por vencer, aunque no abras la app.\n\nPuedes cambiarlo cuando quieras en Ajustes.',
            'Lu-Ks can notify you the day before and on the day of your bills, installments and expiring warranties, even if you don’t open the app.\n\nYou can change it anytime in Settings.'
          ),
          [
            { text: tx(lang, 'Ahora no', 'Not now'), style: 'cancel', onPress: () => setRem(false, lang) },
            { text: tx(lang, 'Sí, avísame', 'Yes, remind me'), onPress: () => setRem(true, lang) },
          ]
        );
      }, 2500);
    },
    [setRem]
  );

  /* ---------- Mensajes de la web ---------- */
  const onMessage = useCallback(
    (e) => {
      let m;
      try {
        m = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (m.t === 'state') {
        // La página arrancó de verdad: mostró la entrada, el Inicio con datos u otra pestaña.
        if (m.out || m.snap || (m.tab && m.tab !== 'home')) {
          if (!cargo.current) {
            cargo.current = true;
            hideSplash();
          }
          // Revisar en segundo plano si hay versión nueva de la página.
          if (!yaActualizo.current) {
            yaActualizo.current = true;
            setTimeout(() => actualizar().catch(() => {}), 4000);
          }
        }
        setLand(m.land || null);
        if (m.land) setIntro(false);
        if (m.out) {
          settled.current = true;
          setShow(false);
          setSnap(null);
          setTxSnap(null);
          setEsp({});
          setDet(null);
          setCuenta(null);
          setMenu(null);
          setFormVis(false);
          // Al cerrar sesión no deben quedar datos de esta persona en el celular
          setHoja(null);
          setCuentas(null);
          setCuentasVis(false);
          cuentasPend.current = false;
          setAccVis(false);
          setAccForm(null);
          // Las portadas NO se borran del celular al cerrar sesión: quedan guardadas para ese usuario
          // (otra persona no las ve porque están separadas por usuario).
          setPortadas({});
          portRef.current = {};
          portRep.current = {};
          portArch.current.ultimo = null;
          guardarJSON(F_PORT, { v: 2, ultimo: null, por: portArch.current.por });
          borrar(F_INICIO);
          Rec.apagar();
          guardarPrefs({ remFirma: null });
          return;
        }
        if (m.snap) {
          setSnap(m.snap);
          setViejo(false);
          clearTimeout(guardarT.current);
          const sn = m.snap;
          guardarT.current = setTimeout(() => guardarJSON(F_INICIO, sn), 1200);
        }
        setHoja(m.hoja || null);
        if (m.tx) setTxSnap(m.tx);
        if (m.rep && m.rep.kind) setEsp((o) => ({ ...o, [m.rep.kind]: m.rep }));
        if (m.snap || (m.tab && m.tab !== 'home')) settled.current = true;
        if (!settled.current && !m.show) return; // todavía cargando: dejar el Inicio guardado
        clearTimeout(showT.current);
        // Cambiando de pestaña: seguir con lo nativo hasta que llegue la pantalla nueva
        if (navPendRef.current) {
          if (!(m.show && m.kind === navPendRef.current)) return;
          navPendRef.current = null;
          clearTimeout(navPendT.current);
          setNavPend(null);
        }
        const aplicar = () => {
          if (m.show && m.kind) setKind(m.kind);
          setShow(!!m.show);
        };
        const pasado = Date.now() - tapAt.current;
        // Acabamos de tocar algo que abre la web: esperar un momento antes de volver a mostrar.
        if (m.show && pasado < 350) showT.current = setTimeout(aplicar, 360 - pasado);
        else aplicar();
      } else if (m.t === 'form') {
        setFormData(m);
      } else if (m.t === 'add') {
        abrirForm();
      } else if (m.t === 'pick') {
        const lang = (remItems.current && remItems.current.lang) || 'es';
        elegir(m, lang)
          .then((files) => js(`window.__lkPicked&&window.__lkPicked(${JSON.stringify(m.id)},${JSON.stringify(files || [])})`))
          .catch((er) => Alert.alert('No se pudo abrir', String((er && er.message) || er)));
      } else if (m.t === 'det') {
        setDet((o) => (m.upd && !o ? o : m.d));
      } else if (m.t === 'cuenta') {
        setCuenta(m);
      } else if (m.t === 'menu') {
        setMenu(m);
      } else if (m.t === 'cuentas') {
        setCuentas(m);
        if (cuentasPend.current) {
          cuentasPend.current = false;
          setCuentasVis(true);
        }
      } else if (m.t === 'portadas') {
        // Portadas guardadas también en el celular (se ven al instante al abrir).
        // Se MEZCLAN: una portada solo sale de aquí si la persona la quitó (o borró la cuenta).
        const A = portArch.current;
        const u = m.u || A.ultimo || '';
        const base = (u && A.por[u]) || (A.suelta && u ? A.suelta : null) || (u === A.ultimo ? portRef.current : {}) || {};
        const { p, faltan } = mezclarPortadas(base, m, portRep.current);
        if (Object.keys(faltan).length) js(`window.__lkPortRep && window.__lkPortRep(${JSON.stringify(faltan)})`);
        portRef.current = p;
        setPortadas(p);
        if (u) {
          A.por[u] = p;
          A.ultimo = u;
          delete A.suelta;
          guardarJSON(F_PORT, { v: 2, ultimo: A.ultimo, por: A.por });
        }
      } else if (m.t === 'accform') {
        setAccForm(m);
        setAccRes(null);
        setAccSes((n) => n + 1);
        setAccVis(true);
      } else if (m.t === 'accsaved') {
        setAccRes(m);
      } else if (m.t === 'edit') {
        setEditar(m.d);
        setFormVis(true);
      } else if (m.t === 'saved') {
        if (!m.ok) Alert.alert('No se pudo guardar', m.msg || 'Intenta otra vez.');
      } else if (m.t === 'toast') {
        clearTimeout(avisoT.current);
        setAviso(m.s);
        avisoT.current = setTimeout(() => setAviso(null), 2200);
      } else if (m.t === 'rem') {
        remItems.current = m;
        if (prefs.current.rem === true) {
          clearTimeout(remT.current);
          remT.current = setTimeout(() => reprogramar(false), 1500);
        } else if (prefs.current.rem == null && m.items && m.items.length) {
          preguntar(m.lang);
        }
      } else if (m.t === 'remset') {
        setRem(!!m.on, (remItems.current && remItems.current.lang) || 'es');
      } else if (m.t === 'remtest') {
        Rec.prueba((remItems.current && remItems.current.lang) || 'es').catch(() => {});
      } else if (m.t === 'google') {
        Alert.alert(
          'Google no está disponible aquí',
          'Dentro de la app entra con tu correo y contraseña.\n\nSi tu cuenta es de Google, toca "¿Olvidaste tu contraseña?" y escribe tu Gmail: te llega un enlace para crear una contraseña. Tus datos siguen iguales.'
        );
      } else if (m.t === 'copy') {
        Clipboard.setStringAsync(String(m.s || '')).then(() => {
          clearTimeout(avisoT.current);
          setAviso(m.msg || 'Copiado');
          avisoT.current = setTimeout(() => setAviso(null), 2200);
        });
      } else if (m.t === 'file') {
        saveAndShare(m);
      } else if (m.t === 'fileErr') {
        Alert.alert('No se pudo preparar el archivo', 'Intenta otra vez.');
      } else if (m.t === 'err' && m.where === 'portada') {
        Alert.alert('Portada', String(m.msg || ''));
      } else if (m.t === 'err' && (m.where === 'cuentas' || m.where === 'accform')) {
        cuentasPend.current = false;
        Alert.alert('No se pudo abrir', 'Espera un momento a que cargue Lu-Ks e intenta otra vez.');
      } else if (m.t === 'back') {
        if (canBack.current && web.current) web.current.goBack();
        else BackHandler.exitApp();
      }
    },
    [hideSplash, preguntar, reprogramar, setRem]
  );

  /* ---------- Toques en el Inicio nativo ---------- */
  const js = (code) => web.current && web.current.injectJavaScript(code + ';true;');
  const onTap = useCallback((sel) => {
    // Abre algo de la web (ventana, otra pestaña…): ocultamos el Inicio nativo ya.
    tapAt.current = Date.now();
    setShow(false);
    js(`window.__lkTap&&window.__lkTap(${JSON.stringify(sel)})`);
  }, []);
  const onKeep = useCallback((sel) => {
    // Cambia algo del mismo Inicio (ojito, período, plegar sección).
    js(`window.__lkTap&&window.__lkTap(${JSON.stringify(sel)})`);
  }, []);
  const onRefresh = useCallback(() => js('window.__lkRefresh&&window.__lkRefresh()'), []);
  const onJs = useCallback((code) => js(code), []);
  // Barra de abajo: Inicio y Movimientos son nativos (no se oculta), lo demás es web.
  const onNav = useCallback(
    (k) => {
      if ((k === 'home' && snap) || (k === 'tx' && txSnap) || ((k === 'rep' || k === 'con') && esp[k])) {
        clearTimeout(showT.current);
        setKind(k);
        setShow(true);
        js(`window.__lkTap&&window.__lkTap(${JSON.stringify(`nav .tab[data-t="${k}"]`)})`);
        return;
      }
      if (k === 'home' || k === 'tx' || k === 'rep' || k === 'con') {
        // Primera vez en esa pestaña: no mostrar la web; esperar su pantalla nativa
        clearTimeout(navPendT.current);
        navPendRef.current = k;
        setNavPend(k);
        js(`window.__lkTap&&window.__lkTap(${JSON.stringify(`nav .tab[data-t="${k}"]`)})`);
        navPendT.current = setTimeout(() => {
          if (!navPendRef.current) return;
          navPendRef.current = null;
          setNavPend(null);
          js('window.__lkState&&window.__lkState()');
        }, 2500);
        return;
      }
      onTap(`nav .tab[data-t="${k}"]`);
    },
    [snap, txSnap, esp, onTap]
  );
  /* ---------- Formulario nativo ---------- */
  const abrirForm = useCallback(() => {
    setEditar(null);
    setFormVis(true);
    js('window.__lkFormData&&window.__lkFormData()');
  }, []);
  const cerrarForm = useCallback(() => setFormVis(false), []);
  const guardarForm = useCallback((d) => {
    setFormVis(false);
    js(`window.__lkSave&&window.__lkSave(${JSON.stringify(d)})`);
  }, []);
  const onEdit = useCallback((id) => js(`window.__lkEditData&&window.__lkEditData(${JSON.stringify(String(id))})`), []);
  const borrarMov = useCallback((id) => {
    setFormVis(false);
    js(`window.__lkDel&&window.__lkDel(${JSON.stringify(String(id))})`);
  }, []);
  const mostrarAviso = useCallback((txt) => {
    clearTimeout(avisoT.current);
    setAviso(txt);
    avisoT.current = setTimeout(() => setAviso(null), 2200);
  }, []);
  /* ---------- Hojas nativas: detalle, cuenta y menú ---------- */
  const luego = (fn) => setTimeout(fn, 450); // esperar a que se cierre una hoja antes de abrir otra
  const hojaDet = {
    onClose: () => setDet(null),
    onCat: (id, k) => js(`window.__lkCat&&window.__lkCat(${JSON.stringify(id)},${JSON.stringify(k)})`),
    onDup: (id) => {
      setDet(null);
      luego(() => js(`window.__lkDup&&window.__lkDup(${JSON.stringify(id)})`));
    },
    onEdit: (id) => {
      setDet(null);
      luego(() => js(`window.__lkEditData&&window.__lkEditData(${JSON.stringify(id)})`));
    },
    onDel: (id) => {
      setDet(null);
      js(`window.__lkDel&&window.__lkDel(${JSON.stringify(id)})`);
    },
  };
  /* ---------- Carrusel de cuentas y formulario de cuenta ---------- */
  const onCuentas = useCallback((i) => {
    cuentasPend.current = true;
    js(`window.__lkCuentas&&window.__lkCuentas(${JSON.stringify(i || 0)})`);
  }, []);
  const onCuenta = onCuentas;
  const hojaCuentas = {
    onClose: () => setCuentasVis(false),
    onAdd: () => {
      setCuentasVis(false);
      luego(() => js('window.__lkAccForm&&window.__lkAccForm(-1)'));
    },
    onEdit: (i) => {
      setCuentasVis(false);
      luego(() => js(`window.__lkAccForm&&window.__lkAccForm(${JSON.stringify(i)})`));
    },
    onVer: (n) => {
      setCuentasVis(false);
      js(`window.__lkVerCuenta&&window.__lkVerCuenta(${JSON.stringify(n)})`);
    },
    onDet: (id) => {
      setCuentasVis(false);
      luego(() => js(`window.__lkDet&&window.__lkDet(${JSON.stringify(id)})`));
    },
  };
  const hojaNuevaCuenta = {
    onClose: () => setAccVis(false),
    onSave: (d) => js(`window.__lkSaveAcc&&window.__lkSaveAcc(${JSON.stringify(d)})`),
    onVer: (i) => {
      setAccVis(false);
      luego(() => onCuentas(i >= 0 ? i : 0));
    },
  };
  const onTransfer = useCallback(() => {
    setEditar({ nuevo: 1, tp: 'tr', soloTipo: 1 });
    setFormVis(true);
    js('window.__lkFormData&&window.__lkFormData()');
  }, []);
  const hojaCuenta = {
    onClose: () => setCuenta(null),
    onDet: (id) => {
      setCuenta(null);
      luego(() => js(`window.__lkDet&&window.__lkDet(${JSON.stringify(id)})`));
    },
    onEditar: (i) => {
      setCuenta(null);
      luego(() => js(`window.__lkEditAcc&&window.__lkEditAcc(${JSON.stringify(i)})`));
    },
    onVer: (n) => {
      setCuenta(null);
      js(`window.__lkVerCuenta&&window.__lkVerCuenta(${JSON.stringify(n)})`);
    },
  };
  const hojaMenu = {
    onClose: () => setMenu(null),
    onGo: (k, h) => {
      setMenu(null);
      setIrA(h || null);
      luego(() => js(`window.__lkNav&&window.__lkNav(${JSON.stringify(k)})`));
    },
  };
  const formWeb = useCallback((k) => {
    setFormVis(false);
    // IA, Foto, Categorías y Nueva cuenta abren ventanas de la web, que ahora se ven como hojas nativas
    setTimeout(() => js(`window.__lkFormWeb&&window.__lkFormWeb(${JSON.stringify(k)})`), 450);
  }, []);

  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (isInside(url)) return true;
    if (req.isTopFrame === false) return true;
    openOutside(url);
    return false;
  }, []);

  const retry = () => {
    setFailed(false);
    setKey((k) => k + 1);
  };

  const dark = snap && snap.th ? !!snap.th.dark : sysDark;
  const c = dark ? DARK : LIGHT;
  const fondo = (snap && snap.th && snap.th.bg) || c.bg;

  return (
    <SafeAreaProvider>
      <StatusBar style={land || (show && kind === 'home' && snap) || dark ? 'light' : 'dark'} />
      <View style={[s.root, { backgroundColor: fondo }]}>
        {failed ? (
          <SafeAreaView style={s.root}>
            <Offline c={c} onRetry={retry} />
          </SafeAreaView>
        ) : (
          <WebView
            key={key}
            ref={web}
            source={source}
            style={{ flex: 1, backgroundColor: fondo }}
            containerStyle={{ backgroundColor: fondo }}
            originWhitelist={['*']}
            applicationNameForUserAgent={`LuKsApp/${VERSION}`}
            injectedJavaScriptBeforeContentLoaded={bridge}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStart}
            onOpenWindow={(e) => openOutside(e.nativeEvent.targetUrl)}
            setSupportMultipleWindows={false}
            onNavigationStateChange={(n) => {
              canBack.current = n.canGoBack;
            }}
            onLoadEnd={() => {
              if (!inicial.snap) hideSplash();
            }}
            onError={() => {
              hideSplash();
              if (usandoCopia.current) {
                marcarMala();
                usandoCopia.current = false;
                setSource({ uri: BASE });
                setKey((k) => k + 1);
                return;
              }
              setShow(false);
              setFailed(true);
            }}
            onContentProcessDidTerminate={() => web.current && web.current.reload()}
            onRenderProcessGone={() => web.current && web.current.reload()}
            // Se ve y se siente como app, no como página web
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            bounces={false}
            overScrollMode="never"
            pullToRefreshEnabled={false}
            allowsBackForwardNavigationGestures={false}
            allowsLinkPreview={false}
            textZoom={100}
            // El teclado puede abrirse solo (el botón + enfoca el valor)
            keyboardDisplayRequiresUserAction={false}
            // Sesión, datos, fotos y sonidos
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            webviewDebuggingEnabled={__DEV__}
          />
        )}
        {land && !failed ? (
          <Bienvenida
            land={land}
            onCrear={() => js(`window.__lkTap&&window.__lkTap(${JSON.stringify('#auth [data-au="up"]')})`)}
            onEntrar={() => js(`window.__lkTap&&window.__lkTap(${JSON.stringify('#auth .ld-top [data-au="in"]')})`)}
            onIdioma={() => js(`window.__lkTap&&window.__lkTap(${JSON.stringify('#auth [data-au="lang"]')})`)}
          />
        ) : null}
        {!failed && ((kind === 'tx' && txSnap) || esp[kind] || snap) ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents={show ? 'auto' : 'none'}>
            {kind === 'tx' && txSnap ? (
              <Movimientos S={txSnap} onTap={onTap} onKeep={onKeep} onJs={onJs} onRefresh={onRefresh} onNav={onNav} onAdd={abrirForm} onEdit={onEdit} />
            ) : esp[kind] ? (
              <Reportes
                R={esp[kind]}
                onTap={onKeep}
                onJs={onJs}
                onRefresh={onRefresh}
                onNav={onNav}
                onAdd={abrirForm}
                onAviso={mostrarAviso}
                irA={irA}
                onIrA={() => setIrA(null)}
              />
            ) : (
              <Inicio
                snap={snap}
                viejo={viejo}
                onTap={onTap}
                onKeep={onKeep}
                onRefresh={onRefresh}
                onNav={onNav}
                onAdd={abrirForm}
                onCuenta={onCuenta}
                onCuentas={onCuentas}
                onTransfer={onTransfer}
                onJs={onJs}
                listo={!intro}
              />
            )}
          </Animated.View>
        ) : null}
        {navPend && !failed && snap ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tema(snap.th).bg, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color={tema(snap.th).mut} />
            <BarraAbajo snap={snap} C={tema(snap.th)} activo={navPend} onNav={onNav} onAdd={abrirForm} />
          </View>
        ) : null}
        {aviso && (show || formVis) ? (
          <View pointerEvents="none" style={s.avisoW}>
            <View style={[s.aviso, { backgroundColor: dark ? 'rgba(58,58,60,0.96)' : 'rgba(28,28,30,0.92)' }]}>
              <Text style={s.avisoT}>{aviso}</Text>
            </View>
          </View>
        ) : null}
        {intro && !land ? <Intro dark={!!(snap && snap.th && snap.th.dark)} onFin={() => setIntro(false)} /> : null}
        <HojaEspejo
          h={hoja}
          visible={!!hoja && !formVis && !det && !cuenta && !menu && !cuentasVis && !accVis}
          onTap={onKeep}
          onJs={onJs}
          onClose={() => hoja && js(`window.__lkCerrarHoja&&window.__lkCerrarHoja(${JSON.stringify(hoja.id)})`)}
          aviso={aviso}
        />
        <Detalle d={det} {...hojaDet} />
        <Cuenta c={cuenta} {...hojaCuenta} />
        <Menu m={menu} {...hojaMenu} />
        <Cuentas data={cuentas} portadas={portadas} visible={cuentasVis} {...hojaCuentas} />
        <NuevaCuenta
          D={accForm}
          ses={accSes}
          portadaGuardada={accForm && accForm.i >= 0 && !accForm.portada && portadas[accForm.f && accForm.f.name] ? portadas[accForm.f.name].img : ''}
          visible={accVis}
          resultado={accRes}
          {...hojaNuevaCuenta}
        />
        <Formulario visible={formVis} datos={formData} editar={editar} onClose={cerrarForm} onSave={guardarForm} onWeb={formWeb} onDelete={borrarMov} />
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  off: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  offIcon: { fontSize: 48, marginBottom: 4 },
  offTitle: { fontSize: 22, fontWeight: '700' },
  offText: { fontSize: 16, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  btn: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 999 },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  avisoW: { position: 'absolute', left: 0, right: 0, bottom: 120, alignItems: 'center', paddingHorizontal: 24 },
  aviso: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 18, maxWidth: 420 },
  avisoT: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', textAlign: 'center' },
});
