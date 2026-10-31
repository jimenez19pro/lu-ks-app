// Bienvenida animada (cuando no has iniciado sesión).
// 1) Dos piezas se juntan y forman el ícono de Lu-Ks. 2) Un degradado barre la
// pantalla en diagonal. 3) Sube el mensaje y aparecen los botones.
// Los botones tocan los de la web (Crear cuenta / Entrar), así todo sigue igual.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Toque } from './inicio';

const ICONO = require('./icon.png');
let yaVista = false;

const TX = {
  h1: ['Tus finanzas,', 'Your money,'],
  h2: ['claras.', 'made clear.'],
  sub: ['Anota tus gastos en segundos, cumple tu presupuesto y sal de deudas con un plan. Simple, privada y hecha en Colombia.', 'Track expenses in seconds, stay on budget and get out of debt with a plan. Simple, private and made in Colombia.'],
  crear: ['Crear mi cuenta gratis', 'Create my free account'],
  entrar: ['Ya tengo cuenta', 'I already have an account'],
  idioma: ['🇺🇸 English', '🇨🇴 Español'],
  gratis: ['Gratis · sin anuncios', 'Free · no ads'],
};

export default function Bienvenida({ land, onCrear, onEntrar, onIdioma }) {
  const ins = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const en = land && land.lang === 'en';
  const t = (k) => (en ? TX[k][1] : TX[k][0]);
  const rapido = yaVista;
  const piezas = useRef(new Animated.Value(rapido ? 1 : 0)).current;
  const icono = useRef(new Animated.Value(rapido ? 1 : 0)).current;
  const barrido = useRef(new Animated.Value(rapido ? 1 : 0)).current;
  const arriba = useRef(new Animated.Value(rapido ? 1 : 0)).current;
  const texto = useRef(new Animated.Value(rapido ? 1 : 0)).current;

  useEffect(() => {
    if (rapido) return;
    yaVista = true;
    Animated.sequence([
      Animated.delay(150),
      Animated.timing(piezas, { toValue: 1, duration: 750, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.spring(icono, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      Animated.timing(barrido, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(arriba, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(texto, { toValue: 1, duration: 700, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const Z = 112; // tamaño del ícono
  const diag = Math.sqrt(W * W + H * H);
  const pA = {
    transform: [
      { translateX: piezas.interpolate({ inputRange: [0, 1], outputRange: [-W * 0.55, 0] }) },
      { translateY: piezas.interpolate({ inputRange: [0, 1], outputRange: [-H * 0.3, 0] }) },
      { rotate: piezas.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '0deg'] }) },
    ],
  };
  const pB = {
    transform: [
      { translateX: piezas.interpolate({ inputRange: [0, 1], outputRange: [W * 0.55, 0] }) },
      { translateY: piezas.interpolate({ inputRange: [0, 1], outputRange: [H * 0.3, 0] }) },
      { rotate: piezas.interpolate({ inputRange: [0, 1], outputRange: ['35deg', '0deg'] }) },
    ],
  };
  const subeIcono = arriba.interpolate({ inputRange: [0, 1], outputRange: [0, -H * 0.2] });
  const achica = arriba.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: land && land.dark ? '#000000' : '#F2F2F7' }]} />
      {/* Barrido diagonal del degradado */}
      <Animated.View
        style={{
          position: 'absolute',
          width: diag * 1.2,
          height: diag * 1.2,
          left: (W - diag * 1.2) / 2,
          top: (H - diag * 1.2) / 2,
          transform: [{ rotate: '-35deg' }, { translateY: barrido.interpolate({ inputRange: [0, 1], outputRange: [diag * 1.25, 0] }) }],
        }}
      >
        <LinearGradient colors={['#2B8CFF', '#3B3FB6', '#0A0E1F', '#05060C']} locations={[0, 0.25, 0.6, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Ícono */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Animated.View style={{ width: Z, height: Z, transform: [{ translateY: subeIcono }, { scale: achica }] }}>
          <Animated.View style={[st.pieza, { width: Z / 2, height: Z, borderTopLeftRadius: Z * 0.24, borderBottomLeftRadius: Z * 0.24, left: 0, opacity: icono.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }) }, pA]} />
          <Animated.View style={[st.pieza, { width: Z / 2, height: Z, borderTopRightRadius: Z * 0.24, borderBottomRightRadius: Z * 0.24, left: Z / 2, backgroundColor: '#0047D6', opacity: icono.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }) }, pB]} />
          <Animated.Image
            source={ICONO}
            style={{ width: Z, height: Z, borderRadius: Z * 0.24, opacity: icono, transform: [{ scale: icono.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}
          />
        </Animated.View>
      </View>

      {/* Idioma */}
      <Animated.View style={[st.idioma, { top: ins.top + 10, opacity: texto }]}>
        <Toque onPress={onIdioma} style={st.chip}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{t('idioma')}</Text>
        </Toque>
      </Animated.View>

      {/* Mensaje y botones */}
      <Animated.View
        style={[
          st.abajo,
          { paddingBottom: ins.bottom + 20, opacity: texto, transform: [{ translateY: texto.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] },
        ]}
      >
        <View style={st.badge}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>✨ {t('gratis')}</Text>
        </View>
        <Text style={st.h}>{t('h1')}</Text>
        <Text style={[st.h, { color: '#7FB2FF' }]}>{t('h2')}</Text>
        <Text style={st.sub}>{t('sub')}</Text>
        <Toque onPress={onCrear} style={[st.btn, { backgroundColor: '#FFFFFF', marginTop: 26 }]}>
          <Text style={{ color: '#0A0E1F', fontSize: 17, fontWeight: '700' }}>{t('crear')}</Text>
        </Toque>
        <Toque onPress={onEntrar} style={[st.btn, { backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>{t('entrar')}</Text>
        </Toque>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  pieza: { position: 'absolute', top: 0, backgroundColor: '#2B8CFF' },
  idioma: { position: 'absolute', right: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  abajo: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24 },
  badge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14 },
  h: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', letterSpacing: -1, lineHeight: 44 },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 23, marginTop: 12 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18 },
});
