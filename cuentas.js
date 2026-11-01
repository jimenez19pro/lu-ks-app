// Carrusel de cuentas y tarjetas (nativo).
// Deslizas tus cuentas de lado; el saldo de cada una cambia con animación y
// abajo se ve su información y sus movimientos. Al final: "Agregar cuenta".
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Barra, CHEV, Circulo, Ico, Monto, PLUS, Tarjeta, Tile, Toque, alfa, css, mezcla, rgba, tema } from './inicio';

/* ---------- Tarjeta "de plástico" (también la usa el formulario de cuenta) ---------- */
export function claro(c) {
  const v = rgba(c) || [0, 0, 0, 1];
  return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 > 0.62;
}
export function RedLogo({ red, tinta, z = 1 }) {
  if (!red || red === 'Otra') return null;
  if (red === 'Mastercard') {
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 26 * z, height: 26 * z, borderRadius: 13 * z, backgroundColor: '#EB001B' }} />
        <View style={{ width: 26 * z, height: 26 * z, borderRadius: 13 * z, backgroundColor: 'rgba(247,158,27,0.92)', marginLeft: -10 * z }} />
      </View>
    );
  }
  const t = red === 'Visa' ? 'VISA' : red === 'Amex' ? 'AMEX' : red;
  return (
    <Text style={{ color: tinta, fontSize: (red === 'Visa' ? 22 : 15) * z, fontWeight: '900', fontStyle: red === 'Visa' ? 'italic' : 'normal', letterSpacing: red === 'Visa' ? 0.5 : 0 }}>
      {t}
    </Text>
  );
}
export function colorCuenta(it) {
  if (!it) return '#4A63E7';
  if (it.tipo === 'credito' && it.color) return it.color;
  if (it.tipo === 'efectivo') return '#C9A227';
  return (it.tile && css(it.tile.bg, null)) || it.color || '#4A63E7';
}
export function Plastico({ w, h, color, tile, titulo, sub, red, tipoN, abajo, vertical, chip = true }) {
  const base = css(color, '#4A63E7');
  const tinta = claro(base) ? '#1C1C1E' : '#FFFFFF';
  const suave = claro(base) ? 'rgba(28,28,30,0.62)' : 'rgba(255,255,255,0.78)';
  return (
    <LinearGradient
      colors={[mezcla(base, '#FFFFFF', 0.88), base, mezcla(base, '#000000', 0.62)]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: w, height: h, borderRadius: Math.round(Math.min(w, h) * 0.11), padding: Math.round(Math.min(w, h) * 0.085), justifyContent: 'space-between', overflow: 'hidden' }}
    >
      {/* brillo diagonal */}
      <View style={[st.brillo, { width: w * 1.4, height: h * 0.55, top: vertical ? h * 0.18 : -h * 0.2, left: -w * 0.2 }]} />
      <View style={[st.fila, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <View style={[st.fila, { gap: 10, flex: 1, minWidth: 0 }]}>
          {tile ? <Tile tile={tile} z={34} C={tema()} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: tinta, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
              {titulo}
            </Text>
            {sub ? (
              <Text style={{ color: suave, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                {sub}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {vertical ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: alfa(tinta, 0.16), fontSize: w * 0.34, fontWeight: '900', letterSpacing: -2 }}>Lu</Text>
        </View>
      ) : chip ? (
        <View style={[st.chipT, { borderColor: alfa(tinta, 0.25), backgroundColor: alfa('#FFFFFF', claro(base) ? 0.35 : 0.22) }]} />
      ) : null}
      <View>
        {abajo ? (
          <Text style={{ color: tinta, fontSize: 18, fontWeight: '700', marginBottom: 8, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
            {abajo}
          </Text>
        ) : null}
        <View style={[st.fila, { justifyContent: 'space-between' }]}>
          <Text style={{ color: suave, fontSize: 13, fontWeight: '600' }}>{tipoN}</Text>
          <RedLogo red={red} tinta={tinta} />
        </View>
      </View>
    </LinearGradient>
  );
}

/* ---------- Pantalla ---------- */
export default function Cuentas({ data, visible, onClose, onAdd, onEdit, onVer, onDet }) {
  const ins = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const D = data || {};
  const T = D.T || {};
  const C = tema(D.th);
  const items = D.items || [];
  const CW = Math.min(Math.round(W * 0.64), 300);
  const CH = Math.round(CW * 1.42);
  const pags = useMemo(() => [...items, { add: 1 }], [items]);
  const pos = useRef(new Animated.Value(0)).current; // 0 = primera tarjeta, 1 = segunda…
  const posV = useRef(0);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const abre = useRef(new Animated.Value(0)).current;
  const nRef = useRef(pags.length);
  nRef.current = pags.length;
  // El saldo cambia mientras deslizas (no al soltar)
  useEffect(() => {
    const id = pos.addListener(({ value }) => {
      posV.current = value;
      const i = Math.max(0, Math.min(nRef.current - 1, Math.round(value)));
      if (i !== idxRef.current) {
        idxRef.current = i;
        setIdx(i);
      }
    });
    return () => pos.removeListener(id);
  }, []);
  const ir = (i, rapido) => {
    const k = Math.max(0, Math.min(nRef.current - 1, i));
    Animated.spring(pos, { toValue: k, useNativeDriver: true, speed: rapido ? 20 : 13, bounciness: 6 }).start();
  };
  // Deslizar con el dedo: el mazo sigue al dedo y al soltar se acomoda en la tarjeta más cercana
  const pan = useMemo(() => {
    let inicio = 0;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pos.stopAnimation((v) => {
          inicio = v;
          posV.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        let v = inicio - g.dx / (CW * 0.62);
        const max = nRef.current - 1;
        if (v < 0) v = v * 0.3; // resistencia en los bordes
        if (v > max) v = max + (v - max) * 0.3;
        pos.setValue(v);
      },
      onPanResponderRelease: (_, g) => {
        const v = posV.current - g.vx * 0.35;
        ir(Math.round(v));
      },
      onPanResponderTerminate: () => ir(Math.round(posV.current)),
    });
  }, [CW]);
  // Al abrir: las tarjetas entran desde la derecha, una tras otra
  useEffect(() => {
    if (!visible) return;
    abre.setValue(0);
    Animated.timing(abre, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }).start();
  }, [visible]);

  // Ir a la cuenta pedida (al abrir o después de agregar una)
  useEffect(() => {
    if (!visible || !data) return;
    const i = Math.max(0, Math.min(data.at || 0, pags.length - 1));
    pos.setValue(i);
    posV.current = i;
    idxRef.current = i;
    setIdx(i);
  }, [visible, data && data.at, data && data.items && data.items.length]);

  const it = items[idx];
  const color = it ? colorCuenta(it) : C.ac;
  const credito = it && it.tipo === 'credito';

  const pagina = (item, i) => {
    const r = [i - 2, i - 1, i, i + 1, i + 2];
    const mx = pos.interpolate({ inputRange: r, outputRange: [CW * 0.8, CW * 0.55, 0, -CW * 0.55, -CW * 0.8], extrapolate: 'clamp' });
    const esc = pos.interpolate({ inputRange: r, outputRange: [0.72, 0.85, 1, 0.85, 0.72], extrapolate: 'clamp' });
    const sombra = pos.interpolate({ inputRange: r, outputRange: [0.5, 0.3, 0, 0.3, 0.5], extrapolate: 'clamp' });
    const giro = pos.interpolate({ inputRange: r, outputRange: ['-16deg', '-10deg', '0deg', '10deg', '16deg'], extrapolate: 'clamp' });
    const d = Math.abs(i - idx);
    const entra = abre.interpolate({ inputRange: [0, 1], outputRange: [W * (0.9 + d * 0.35), 0] });
    return (
      <Animated.View
        key={item.add ? 'add' : String(item.i != null ? item.i : i)}
        style={[
          st.carta,
          { width: CW, height: CH, left: (W - CW) / 2, zIndex: 100 - d, elevation: 100 - d },
          { transform: [{ translateX: entra }, { perspective: 1000 }, { translateX: mx }, { scale: esc }, { rotateY: giro }] },
        ]}
      >
        {item.add ? (
          <Toque onPress={onAdd} label={T.add}>
            <View style={[st.nueva, { width: CW, height: CH, borderColor: alfa(C.ink, 0.22), backgroundColor: C.sf }]}>
              <View style={[st.mas, { backgroundColor: C.ink }]}>
                <Ico xml={PLUS} size={26} color={C.bg} />
              </View>
              <Text style={{ color: C.ink, fontSize: 17, fontWeight: '700', marginTop: 14 }}>{T.add}</Text>
              <Text style={{ color: C.mut, fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 18 }}>{T.addS}</Text>
            </View>
          </Toque>
        ) : (
          <Toque onPress={() => i !== idx && ir(i, true)} label={item.n}>
            <View>
            <Plastico
              w={CW}
              h={CH}
              vertical
              color={colorCuenta(item)}
              tile={item.tile}
              titulo={item.apodo || item.n}
              sub={item.banco && item.banco !== (item.apodo || item.n) ? item.banco : ''}
              red={item.red}
              tipoN={item.tipoN}
            />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: Math.round(CW * 0.11), backgroundColor: '#000', opacity: sombra }]} />
            </View>
          </Toque>
        )}
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[alfa(color, C.dark ? 0.45 : 0.22), alfa(color, 0)]} style={[st.fondo, { height: CH + ins.top + 160 }]} />
        <View style={[st.diag, { backgroundColor: alfa(color, C.dark ? 0.55 : 0.4), width: W * 1.3, top: ins.top + CH * 0.18, left: W * 0.35 }]} />
        <ScrollView contentContainerStyle={{ paddingTop: ins.top + 6, paddingBottom: ins.bottom + 30 }} showsVerticalScrollIndicator={false}>
          {/* Encabezado */}
          <View style={[st.fila, { justifyContent: 'space-between', paddingHorizontal: 16 }]}>
            <Toque onPress={onClose} label="Atrás" hitSlop={10}>
              <View style={[st.circ, { backgroundColor: alfa(C.sf, 0.85) }]}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <Ico xml={CHEV} size={18} color={C.ink} />
                </View>
              </View>
            </Toque>
            <Text style={{ color: C.ink, fontSize: 17, fontWeight: '700' }}>{T.tit}</Text>
            <Toque onPress={onAdd} label={T.add} hitSlop={10}>
              <View style={[st.circ, { backgroundColor: C.ac }]}>
                <Ico xml={PLUS} size={20} color="#FFFFFF" />
              </View>
            </Toque>
          </View>

          {/* Carrusel */}
          <View style={{ height: CH + 44, marginTop: 10 }} {...pan.panHandlers}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 22, height: CH }}>{pags.map((p, i) => pagina(p, i))}</View>
          </View>

          {/* Puntos */}
          <View style={[st.fila, { justifyContent: 'center', gap: 6 }]}>
            {pags.map((p, i) => (
              <Toque key={i} onPress={() => ir(i, true)} hitSlop={6}>
                <View style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? C.ink : alfa(C.ink, 0.22) }} />
              </Toque>
            ))}
          </View>

          {it ? (
            <View style={{ paddingHorizontal: 16 }}>
              {/* Saldo */}
              <View style={{ alignItems: 'center', marginTop: 18 }}>
                <Text style={{ color: C.mut, fontSize: 14 }}>{credito ? T.usado : T.saldo}</Text>
                <Monto
                  v={credito ? it.usado : it.saldo}
                  style={{ color: !credito && it.neg ? C.neg : C.ink, fontSize: 40, fontWeight: '700', letterSpacing: -0.8, marginTop: 2, fontVariant: ['tabular-nums'] }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                />
                {credito ? (
                  <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
                    <Barra bar={{ w: it.pct, c: it.pct >= 90 ? C.neg : color }} C={C} alto={8} />
                    <Text style={{ color: C.mut, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                      {T.disp} {it.disp} · {T.cupo} {it.cupo}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Entró / Salió */}
              <View style={[st.fila, { gap: 10, marginTop: 18 }]}>
                {[
                  [T.entra, it.entra, C.pos],
                  [T.sale, it.sale, C.ink],
                ].map(([k, v, c]) => (
                  <Tarjeta key={k} C={C} style={{ flex: 1 }}>
                    <Text style={{ color: C.mut, fontSize: 13 }}>
                      {k} · {it.mes ? it.mes.charAt(0).toUpperCase() + it.mes.slice(1) : ''}
                    </Text>
                    <Text style={{ color: c, fontSize: 20, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
                      {v}
                    </Text>
                  </Tarjeta>
                ))}
              </View>

              {/* Información */}
              <Text style={[st.tit, { color: C.ink }]}>{T.info}</Text>
              <Tarjeta C={C} style={{ paddingVertical: 4 }}>
                {[
                  [T.tipo, it.tipoN],
                  it.banco ? [T.banco, it.banco] : null,
                  credito && it.corte ? [T.corte, String(it.corte)] : null,
                  credito && it.pago ? [T.pago, String(it.pago)] : null,
                  it.pri ? [T.pri, '★'] : null,
                ]
                  .filter(Boolean)
                  .map(([k, v], i, arr) => (
                    <View key={k} style={[st.fila, st.info, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                      <Text style={{ color: C.mut, fontSize: 15, flex: 1 }}>{k}</Text>
                      <Text style={{ color: C.ink, fontSize: 15, fontWeight: '600' }}>{v}</Text>
                    </View>
                  ))}
              </Tarjeta>

              {/* Botones */}
              <View style={[st.fila, { gap: 10, marginTop: 12 }]}>
                <Toque onPress={() => onVer && onVer(it.n)} style={[st.btn, { backgroundColor: C.sf }]}>
                  <Text style={{ color: C.ac, fontSize: 15, fontWeight: '600' }}>{T.ver}</Text>
                </Toque>
                <Toque onPress={() => onEdit && onEdit(it.i)} style={[st.btn, { backgroundColor: C.sf }]}>
                  <Text style={{ color: C.ac, fontSize: 15, fontWeight: '600' }}>{T.editar}</Text>
                </Toque>
              </View>

              {/* Movimientos */}
              <Text style={[st.tit, { color: C.ink }]}>{T.movs}</Text>
              {it.movs && it.movs.length ? (
                <Tarjeta C={C} style={{ paddingVertical: 2 }}>
                  {it.movs.map((mv, i) => (
                    <Toque key={mv.id} onPress={() => onDet && onDet(mv.id)} label={mv.t}>
                      <View style={[st.fila, st.mov, i < it.movs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                        <Circulo ico={mv.ico} z={38} C={C} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ color: C.ink, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                            {mv.t}
                          </Text>
                          <Text style={{ color: C.mut, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {mv.s}
                          </Text>
                        </View>
                        <Text style={{ color: mv.tone === 'pos' ? C.pos : C.ink, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{mv.a}</Text>
                      </View>
                    </Toque>
                  ))}
                </Tarjeta>
              ) : (
                <Text style={{ color: C.mut, fontSize: 14 }}>{T.sin}</Text>
              )}
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24, alignItems: 'center', marginTop: 24 }}>
              <Toque onPress={onAdd} style={[st.grande, { backgroundColor: C.ac }]}>
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>{T.add}</Text>
              </Toque>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center' },
  fondo: { position: 'absolute', left: 0, right: 0, top: 0 },
  carta: { position: 'absolute', top: 0 },
  diag: { position: 'absolute', height: 260, borderRadius: 60, transform: [{ rotate: '-28deg' }] },
  circ: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nueva: { borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  mas: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  brillo: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-24deg' }] },
  chipT: { width: 40, height: 30, borderRadius: 7, borderWidth: 1 },
  tit: { fontSize: 20, fontWeight: '700', marginTop: 24, marginBottom: 8, letterSpacing: -0.4 },
  info: { paddingVertical: 13 },
  mov: { gap: 12, paddingVertical: 11 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  grande: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 16, borderRadius: 18 },
});
