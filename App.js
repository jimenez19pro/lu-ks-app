// Lu-Ks — app nativa (etapa 1).
// Abre la versión web de Lu-Ks dentro de la app y le agrega lo que la web no
// hace bien dentro de una app: abrir WhatsApp y enlaces afuera, guardar y
// compartir respaldos con el menú Compartir, botón Atrás de Android, pantalla
// sin conexión y aviso del inicio de sesión con Google.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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

export const WEB = 'https://jimenez19pro.github.io/lu-ks/';
const VERSION = '1.0.0';

// Dominios que se abren dentro de la app. Todo lo demás (WhatsApp, correo,
// Google Sheets, páginas externas) se abre afuera, en su app o en Safari.
const INSIDE = ['jimenez19pro.github.io', 'lu-ks-ia.firebaseapp.com', 'lu-ks-ia.web.app'];

// Colores del sistema de Apple (iguales a los de Lu-Ks).
const LIGHT = { bg: '#F2F2F7', fg: '#000000', sub: '#6C6C70', acc: '#007AFF' };
const DARK = { bg: '#000000', fg: '#FFFFFF', sub: '#98989F', acc: '#0A84FF' };

SplashScreen.preventAutoHideAsync().catch(() => {});

// Código que corre dentro de la página antes de que cargue.
export const BRIDGE = `(function(){
  if (window.LUKS_APP) return;
  window.LUKS_APP = { v: '${VERSION}', os: '${Platform.OS}' };
  var post = function (m) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
  };

  // 1) "Continuar con Google" no funciona dentro de una app: avisamos.
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-au="google"]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    post({ t: 'google' });
  }, true);

  // 2) Descargas (respaldo JSON, fotos de garantías): se mandan a la app
  //    para guardarlas y abrir el menú Compartir.
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

  // 3) Botón Atrás de Android: cierra la ventana de arriba si hay una abierta.
  window.__lkBack = function () {
    var o = document.querySelectorAll('.sheet.on');
    if (!o.length) return false;
    o[o.length - 1].classList.remove('on');
    return true;
  };
})(); true;`;

export function isInside(url) {
  if (/^(about:|blob:|data:|javascript:)/.test(url)) return true;
  const m = /^https?:\/\/([^/?#]+)/i.exec(url);
  if (!m) return false;
  const host = m[1].toLowerCase().replace(/:\d+$/, '');
  return INSIDE.some((d) => host === d || host.endsWith('.' + d));
}

function openOutside(url) {
  if (!url) return;
  Linking.openURL(url).catch(() =>
    Alert.alert('No se pudo abrir', 'Revisa que tengas la app instalada.')
  );
}

async function saveAndShare({ name, mime, data }) {
  try {
    const safe = String(name || 'archivo').replace(/[\\/:*?"<>|]/g, '_');
    const file = new File(Paths.cache, safe);
    if (file.exists) file.delete();
    file.create();
    file.write(data, { encoding: 'base64' });
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
      <Text style={[s.offText, { color: c.sub }]}>
        Lu-Ks necesita internet para abrir. Revisa tus datos o el Wi-Fi e intenta otra vez.
      </Text>
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

export default function App() {
  const dark = useColorScheme() === 'dark';
  const c = dark ? DARK : LIGHT;
  const web = useRef(null);
  const canBack = useRef(false);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Si la página tarda mucho, no dejar la pantalla de inicio pegada.
  useEffect(() => {
    const t = setTimeout(hideSplash, 6000);
    return () => clearTimeout(t);
  }, [hideSplash]);

  // Botón Atrás (Android): primero cierra ventanas, luego sale de la app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!web.current) return false;
      web.current.injectJavaScript(
        "(function(){if(!(window.__lkBack&&window.__lkBack())){window.ReactNativeWebView.postMessage(JSON.stringify({t:'back'}))}})();true;"
      );
      return true;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback((e) => {
    let m;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.t === 'google') {
      Alert.alert(
        'Google no está disponible aquí',
        'Dentro de la app entra con tu correo y contraseña.\n\nSi tu cuenta es de Google, toca "¿Olvidaste tu contraseña?" y escribe tu Gmail: te llega un enlace para crear una contraseña. Tus datos siguen iguales.'
      );
    } else if (m.t === 'file') {
      saveAndShare(m);
    } else if (m.t === 'fileErr') {
      Alert.alert('No se pudo preparar el archivo', 'Intenta otra vez.');
    } else if (m.t === 'back') {
      if (canBack.current && web.current) web.current.goBack();
      else BackHandler.exitApp();
    }
  }, []);

  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (isInside(url)) return true;
    // Solo mandamos afuera lo que se abre en la página principal; los marcos
    // internos (por ejemplo, los de Firebase) siguen normales.
    if (req.isTopFrame === false) return true;
    openOutside(url);
    return false;
  }, []);

  const retry = () => {
    setFailed(false);
    setKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={[s.root, { backgroundColor: c.bg }]}>
        {failed ? (
          <SafeAreaView style={s.root}>
            <Offline c={c} onRetry={retry} />
          </SafeAreaView>
        ) : (
          <WebView
            key={key}
            ref={web}
            source={{ uri: WEB }}
            style={{ flex: 1, backgroundColor: c.bg }}
            containerStyle={{ backgroundColor: c.bg }}
            originWhitelist={['*']}
            applicationNameForUserAgent={`LuKsApp/${VERSION}`}
            injectedJavaScriptBeforeContentLoaded={BRIDGE}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStart}
            onOpenWindow={(e) => openOutside(e.nativeEvent.targetUrl)}
            setSupportMultipleWindows={false}
            onNavigationStateChange={(n) => {
              canBack.current = n.canGoBack;
            }}
            onLoadEnd={hideSplash}
            onError={() => {
              hideSplash();
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
});
