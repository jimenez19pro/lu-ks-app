// Inicio nativo de Lu-Ks.
// Se dibuja con componentes del celular usando los datos que manda la web
// (puente.js → "snap"). Cada toque se le pide a la web (onTap), así toda la
// lógica (abrir cuentas, presupuestos, movimientos…) sigue siendo la misma.
import { memo, useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';

/* ---------- Colores ---------- */
export function rgba(c) {
  if (!c) return null;
  c = String(c).trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(c);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(c);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  m = /^hsla?\(([^)]+)\)$/i.exec(c);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    const h = ((p[0] % 360) + 360) % 360, sl = p[1] / 100, l = p[2] / 100;
    const k = (n) => (n + h / 30) % 12, a2 = sl * Math.min(l, 1 - l);
    const fn = (n) => l - a2 * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [fn(0) * 255, fn(8) * 255, fn(4) * 255, p.length > 3 ? p[3] : 1];
  }
  m = /^color\(srgb\s+([^)]+)\)$/i.exec(c);
  if (m) {
    const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
    return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
  }
  return null;
}
export function css(c, fb) {
  const v = rgba(c);
  if (!v) return fb;
  return `rgba(${Math.round(v[0])},${Math.round(v[1])},${Math.round(v[2])},${+v[3].toFixed(3)})`;
}
export function mezcla(a, b, pa) {
  const x = rgba(a) || [0, 0, 0, 1];
  const y = rgba(b) || [0, 0, 0, 1];
  const k = pa;
  return `rgba(${Math.round(x[0] * k + y[0] * (1 - k))},${Math.round(x[1] * k + y[1] * (1 - k))},${Math.round(x[2] * k + y[2] * (1 - k))},${+(x[3] * k + y[3] * (1 - k)).toFixed(3)})`;
}
export function alfa(c, a) {
  const x = rgba(c) || [0, 0, 0, 1];
  return `rgba(${Math.round(x[0])},${Math.round(x[1])},${Math.round(x[2])},${a})`;
}
function igual(a, b) {
  const x = rgba(a), y = rgba(b);
  return !!x && !!y && Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 6;
}

export function tema(th) {
  const t = th || {};
  const dark = !!t.dark;
  const C = {
    dark,
    bg: css(t.bg, dark ? '#000000' : '#F2F2F7'),
    sf: css(t.sf, dark ? '#1C1C1E' : '#FFFFFF'),
    sf2: css(t.sf2, dark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)'),
    ink: css(t.ink, dark ? '#FFFFFF' : '#000000'),
    mut: css(t.mut, dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)'),
    ac: css(t.ac, dark ? '#0A84FF' : '#007AFF'),
    neg: css(t.neg, dark ? '#FF453A' : '#FF3B30'),
    pos: css(t.pos, dark ? '#30D158' : '#248A3D'),
    ln: css(t.ln, dark ? 'rgba(84,84,88,0.5)' : 'rgba(60,60,67,0.16)'),
    z: t.z > 0 ? Math.min(Math.max(t.z, 0.8), 1.4) : 1,
  };
  return C;
}

/* ---------- Íconos propios ---------- */
export const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
export const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
export const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
export const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
const GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>';

export function Ico({ xml, size, color }) {
  if (!xml) return null;
  return <SvgXml xml={xml} width={size} height={size} color={color} />;
}

/* ---------- Piezas ---------- */
export function Toque({ onPress, style, children, label, disabled, hitSlop }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlop}
      style={({ pressed }) => [style, pressed && onPress ? { opacity: 0.6, transform: [{ scale: 0.98 }] } : null]}
    >
      {children}
    </Pressable>
  );
}

export function Barra({ bar, C, alto = 8, track, blanco }) {
  if (!bar) return null;
  let c = css(bar.c, C.ac);
  if (blanco && igual(bar.c, C.ac)) c = '#FFFFFF';
  return (
    <View style={{ height: alto, borderRadius: alto / 2, backgroundColor: track || C.sf2, overflow: 'hidden', marginTop: 8 }}>
      <View style={{ width: `${bar.w || 0}%`, height: '100%', borderRadius: alto / 2, backgroundColor: c }} />
    </View>
  );
}

export function Circulo({ ico, z = 40, C }) {
  if (!ico) return <View style={{ width: z, height: z }} />;
  const c = css(ico.c, C.ac);
  return (
    <View style={{ width: z, height: z, borderRadius: z / 2, backgroundColor: alfa(c, 0.17), alignItems: 'center', justifyContent: 'center' }}>
      {ico.svg ? <Ico xml={ico.svg} size={Math.round(z * 0.52)} color={c} /> : <Text style={{ fontSize: Math.round(z * 0.5) }}>{ico.e}</Text>}
    </View>
  );
}

export function Tile({ tile, z = 30, C }) {
  if (!tile) return null;
  const bg = css(tile.bg, C.sf2);
  const fg = css(tile.c, C.ink);
  const len = (tile.t || '').length;
  return (
    <View style={{ width: z, height: z, borderRadius: Math.round(z * 0.3), backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {tile.svg ? (
        <Ico xml={tile.svg} size={Math.round(z * 0.62)} color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '800', letterSpacing: -0.3, fontSize: Math.round(z * (len > 3 ? 0.24 : len > 2 ? 0.28 : 0.36)) }} numberOfLines={1}>
          {tile.t}
        </Text>
      )}
    </View>
  );
}

export function Tarjeta({ C, style, children }) {
  return <View style={[{ backgroundColor: C.sf, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16 }, style]}>{children}</View>;
}

function Seccion({ s, C, f, onTap, keep }) {
  if (!s) return null;
  return (
    <View style={st.secHd}>
      <Toque onPress={() => keep(s.sel)} style={st.row} label={s.t}>
        <View style={{ transform: [{ rotate: s.col ? '0deg' : '90deg' }], marginRight: 6 }}>
          <Ico xml={CHEV} size={f(16)} color={C.mut} />
        </View>
        <Text style={{ color: C.ink, fontSize: f(20), fontWeight: '700', letterSpacing: -0.4 }}>{s.t}</Text>
      </Toque>
      {s.more && s.moreSel ? (
        <Toque onPress={() => onTap(s.moreSel)} hitSlop={8}>
          <Text style={{ color: C.ac, fontSize: f(15), fontWeight: '500' }}>{s.more}</Text>
        </Toque>
      ) : null}
    </View>
  );
}

function Titulo({ t, sub, C, f }) {
  return (
    <Text style={{ marginTop: 24, marginBottom: 8, color: C.ink, fontSize: f(20), fontWeight: '700', letterSpacing: -0.4 }}>
      {t}
      {sub ? <Text style={{ color: C.mut, fontSize: f(13), fontWeight: '400' }}>{'  ·  ' + sub}</Text> : null}
    </Text>
  );
}

export function Fila({ C, f, ico, t, s, right, onPress, last, pend }) {
  return (
    <Toque onPress={onPress} label={t}>
      <View style={[st.fila, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
        <Circulo ico={ico} z={40} C={C} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: C.ink, fontSize: f(16), fontWeight: '600' }} numberOfLines={1}>
            {t}
          </Text>
          {s ? (
            <Text style={{ color: C.mut, fontSize: f(13), marginTop: 2 }} numberOfLines={1}>
              {s}
            </Text>
          ) : null}
        </View>
        {pend ? <Text style={{ fontSize: f(14) }}>⏳</Text> : null}
        {right}
      </View>
    </Toque>
  );
}

/* ---------- Pantalla ---------- */
function Inicio({ snap, onTap, onKeep, onRefresh, onNav, onAdd, viejo }) {
  const ins = useSafeAreaInsets();
  const C = tema(snap && snap.th);
  const f = useCallback((n) => Math.round(n * C.z * 10) / 10, [C.z]);
  const [cargando, setCargando] = useState(false);
  const tap = useCallback((sel) => sel && onTap(sel), [onTap]);
  const keep = useCallback((sel) => sel && onKeep(sel), [onKeep]);
  if (!snap) return null;
  const { hd, hero, gen, pre, rec, last } = snap;
  const refrescar = () => {
    setCargando(true);
    onRefresh && onRefresh();
    setTimeout(() => setCargando(false), 900);
  };
  const barAlto = 58 + Math.max(ins.bottom, 8);
  const sync = hd && hd.sync && !viejo;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: ins.top + 10, paddingHorizontal: 16, paddingBottom: barAlto + 28 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={refrescar} tintColor={C.mut} colors={[C.ac]} progressViewOffset={ins.top} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        {hd ? (
          <View style={[st.row, { gap: 12 }]}>
            <Toque onPress={() => tap('#app .hd [data-go="con"]')} label="Ajustes">
              <View style={[st.av, { backgroundColor: mezcla(C.ac, C.sf, 0.22) }]}>
                <Text style={{ color: C.ac, fontSize: f(18), fontWeight: '800' }}>{hd.av}</Text>
              </View>
            </Toque>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={[st.row, { gap: 6 }]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sync ? '#34C759' : '#FFCC00' }} />
                <Text style={{ color: C.mut, fontSize: f(13) }} numberOfLines={1}>
                  {hd.date}
                </Text>
              </View>
              <Toque onPress={() => tap('#app [data-lk="hola"]')}>
                <Text style={{ color: C.ink, fontSize: f(21), fontWeight: '700', letterSpacing: -0.4, marginTop: 1 }} numberOfLines={1}>
                  {hd.hello}
                </Text>
              </Toque>
            </View>
            <Toque onPress={() => tap('#navopen')} label="Menú">
              <View style={[st.circ, { backgroundColor: C.sf }]}>
                <Ico xml={hd.grid || GRID} size={22} color={C.ink} />
              </View>
            </Toque>
          </View>
        ) : null}

        {/* Frase del día */}
        {snap.frase && snap.frase.t ? (
          <View style={[st.row, st.frase, { backgroundColor: C.sf }]}>
            {snap.frase.svg ? <Ico xml={snap.frase.svg} size={f(16)} color={C.mut} /> : null}
            <Text style={{ color: C.mut, fontSize: f(14), flex: 1, lineHeight: f(19) }}>{snap.frase.t}</Text>
          </View>
        ) : null}

        {/* Finanzas | Ahorros y deudas */}
        {snap.seg && snap.seg.length ? (
          <View style={[st.seg, { backgroundColor: C.sf2 }]}>
            {snap.seg.map((b) => (
              <Toque key={b.k} onPress={() => (b.on ? null : tap(`#app [data-hv="${b.k}"]`))} style={[st.segB, b.on && { backgroundColor: C.dark ? '#636366' : C.sf, ...st.sombra }]}>
                <Text style={{ color: b.on ? C.ink : C.mut, fontSize: f(14), fontWeight: '600' }}>{b.t}</Text>
              </Toque>
            ))}
          </View>
        ) : null}

        {/* Período */}
        {snap.per ? (
          <View style={[st.row, { gap: 6, marginTop: 12 }]}>
            <Toque onPress={() => tap('#peropen')} style={[st.row, st.chip, { backgroundColor: C.sf2 }]}>
              {snap.per.cal ? <Ico xml={snap.per.cal} size={16} color={C.ink} /> : null}
              <Text style={{ color: C.ink, fontSize: f(14), fontWeight: '500' }}>{snap.per.chip}</Text>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Ico xml={CHEV} size={12} color={C.mut} />
              </View>
            </Toque>
            {snap.per.prev ? (
              <>
                <Toque onPress={() => keep('#app .pnav[data-off="-1"]')} style={[st.pnav, { backgroundColor: C.sf2 }]} label="Período anterior">
                  <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <Ico xml={CHEV} size={14} color={C.ink} />
                  </View>
                </Toque>
                <Text style={{ color: C.mut, fontSize: f(13), textTransform: 'capitalize' }}>{snap.per.label}</Text>
                <Toque
                  onPress={() => keep('#app .pnav[data-off="1"]')}
                  disabled={snap.per.nextOff}
                  style={[st.pnav, { backgroundColor: C.sf2, opacity: snap.per.nextOff ? 0.35 : 1 }]}
                  label="Período siguiente"
                >
                  <Ico xml={CHEV} size={14} color={C.ink} />
                </Toque>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Tarjeta principal */}
        {hero ? (
          <LinearGradient
            colors={[C.ac, mezcla(C.ac, '#000000', 0.7), mezcla(C.ac, '#5E5CE6', 0.55)]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[st.hero, { shadowColor: C.ac }]}
          >
            <View style={[st.row, { justifyContent: 'space-between' }]}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: f(15), fontWeight: '500' }}>{hero.lb}</Text>
              <Toque onPress={() => keep('#app [data-eye]')} hitSlop={10} label="Mostrar u ocultar montos">
                <Ico xml={snap.hide ? EYE_OFF : EYE} size={22} color="rgba(255,255,255,0.9)" />
              </Toque>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: f(38), fontWeight: '700', letterSpacing: -0.6, marginTop: 4, fontVariant: ['tabular-nums'] }} adjustsFontSizeToFit numberOfLines={1}>
              {hero.v}
            </Text>
            <Barra bar={hero.bar} C={C} track="rgba(255,255,255,0.28)" blanco />
            {hero.sub ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: f(13), marginTop: 8, lineHeight: f(18) }}>{hero.sub}</Text> : null}
          </LinearGradient>
        ) : null}

        {/* General */}
        <Seccion s={gen} C={C} f={f} onTap={tap} keep={keep} />
        {gen && !gen.col ? (
          <>
            {gen.accEmpty ? (
              <Toque onPress={() => tap(gen.accEmpty.sel)}>
                <View style={[st.row, st.slim, { backgroundColor: C.sf }]}>
                  <View style={[st.slimI, { backgroundColor: alfa(C.ac, 0.14) }]}>
                    <Ico xml={PLUS} size={20} color={C.ac} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.ink, fontSize: f(15), fontWeight: '600' }}>{gen.accEmpty.t}</Text>
                    <Text style={{ color: C.mut, fontSize: f(13), marginTop: 2 }}>{gen.accEmpty.s}</Text>
                  </View>
                  <Ico xml={CHEV} size={16} color={C.mut} />
                </View>
              </Toque>
            ) : null}
            {gen.acc ? (
              <Tarjeta C={C} style={{ paddingHorizontal: 0, paddingBottom: 14 }}>
                <View style={[st.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }]}>
                  <Text style={{ color: C.ink, fontSize: f(16), fontWeight: '700' }}>{gen.acc.t}</Text>
                  {gen.acc.manage ? (
                    <Toque onPress={() => tap(gen.acc.manage)} hitSlop={10} label="Gestionar cuentas">
                      <Ico xml={CHEV} size={18} color={C.ac} />
                    </Toque>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, alignItems: 'stretch' }}>
                  {gen.acc.items.map((a) => {
                    const c = css(a.c, C.ac);
                    const cr = a.credit;
                    const fondo = cr ? css(a.bg, c) : mezcla(c, C.sf, 0.1);
                    const tinta = cr ? '#FFFFFF' : C.ink;
                    const suave = cr ? 'rgba(255,255,255,0.85)' : C.mut;
                    return (
                      <Toque key={a.i} onPress={() => tap(a.sel)} label={a.name} style={{ alignSelf: 'stretch' }}>
                        <View style={[st.acct, { flex: 1 }, { backgroundColor: fondo }, !cr && { borderLeftWidth: 5, borderLeftColor: c }]}>
                          <View style={[st.row, { justifyContent: 'space-between' }]}>
                            <Tile tile={a.tile} z={30} C={C} />
                            <Text style={{ color: suave, fontSize: f(12) }} numberOfLines={1}>
                              {a.type}
                            </Text>
                          </View>
                          <Text style={{ color: tinta, fontSize: f(15), fontWeight: '600', marginTop: 8 }} numberOfLines={1}>
                            {a.name}
                          </Text>
                          <Text style={{ color: cr ? '#FFFFFF' : css(a.amtC, C.ink), fontSize: f(18), fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
                            {a.amt}
                          </Text>
                          {cr ? (
                            <>
                              <Barra bar={a.bar ? { ...a.bar, c: '#FFFFFF' } : null} C={C} alto={6} track="rgba(255,255,255,0.35)" />
                              <Text style={{ color: suave, fontSize: f(12), marginTop: 4 }} numberOfLines={1}>
                                {a.disp}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </Toque>
                    );
                  })}
                </ScrollView>
                {(gen.acc.orf || []).map((o, i) => (
                  <View key={i} style={[st.row, st.orf, { borderColor: alfa(C.neg, 0.7), marginHorizontal: 16 }]}>
                    <Ico xml={WARN} size={22} color={C.ink} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: C.ink, fontSize: f(14), fontWeight: '600' }} numberOfLines={1}>
                        {o.t}
                      </Text>
                      {o.s ? <Text style={{ color: C.mut, fontSize: f(12), marginTop: 2 }}>{o.s}</Text> : null}
                    </View>
                    <Toque onPress={() => tap(o.sel)} hitSlop={8}>
                      <Text style={{ color: C.ac, fontSize: f(14), fontWeight: '600' }}>{o.btn}</Text>
                    </Toque>
                  </View>
                ))}
              </Tarjeta>
            ) : null}
            {gen.duo && gen.duo.length ? (
              <View style={[st.row, { gap: 10, marginTop: 10, alignItems: 'stretch' }]}>
                {gen.duo.map((d, i) => (
                  <Tarjeta key={i} C={C} style={{ flex: 1 }}>
                    <Text style={{ color: C.mut, fontSize: f(13) }}>{d.k}</Text>
                    <Text style={{ color: css(d.vc, C.ink), fontSize: f(22), fontWeight: '700', marginTop: 4, letterSpacing: -0.3, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
                      {d.v}
                    </Text>
                    <Text style={{ color: C.mut, fontSize: f(12), marginTop: 4 }} numberOfLines={2}>
                      {d.s}
                    </Text>
                  </Tarjeta>
                ))}
              </View>
            ) : null}
            {gen.hoy ? (
              <Tarjeta C={C} style={{ marginTop: 10 }}>
                {gen.hoy.v != null ? (
                  <>
                    <View style={[st.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.mut, fontSize: f(13) }}>{gen.hoy.lb}</Text>
                        <Text style={{ color: css(gen.hoy.vc, C.pos), fontSize: f(28), fontWeight: '700', marginTop: 2, letterSpacing: -0.4, fontVariant: ['tabular-nums'] }}>{gen.hoy.v}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: C.mut, fontSize: f(12) }}>{gen.hoy.sk}</Text>
                        <Text style={{ color: C.ink, fontSize: f(16), fontWeight: '600', marginTop: 2 }}>{gen.hoy.sv}</Text>
                      </View>
                    </View>
                    <Barra bar={gen.hoy.bar} C={C} />
                    <Text style={{ color: C.mut, fontSize: f(12), marginTop: 6, lineHeight: f(16) }}>{gen.hoy.sub}</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: C.mut, fontSize: f(13) }}>{gen.hoy.lb}</Text>
                    <Text style={{ color: C.ink, fontSize: f(14), marginTop: 4 }}>{gen.hoy.msg}</Text>
                  </>
                )}
                {gen.hoy.btns && gen.hoy.btns.length ? (
                  <View style={[st.row, { gap: 8, marginTop: 12 }]}>
                    {gen.hoy.btns.map((b, i) => (
                      <Toque key={i} onPress={() => tap(b.sel)} style={[st.ghost, { backgroundColor: C.sf2 }]}>
                        {b.svg ? <Ico xml={b.svg} size={f(16)} color={C.ac} /> : null}
                        <Text style={{ color: C.ac, fontSize: f(14), fontWeight: '600' }} numberOfLines={1}>
                          {b.t}
                        </Text>
                      </Toque>
                    ))}
                  </View>
                ) : null}
              </Tarjeta>
            ) : null}
            {gen.proy ? (
              <Tarjeta C={C} style={{ marginTop: 10 }}>
                <View style={[st.row, { gap: 6 }]}>
                  {gen.proy.svg ? <Ico xml={gen.proy.svg} size={f(15)} color={C.mut} /> : null}
                  <Text style={{ color: C.mut, fontSize: f(13), flex: 1 }}>{gen.proy.lb}</Text>
                </View>
                <Text style={{ color: css(gen.proy.vc, C.ink), fontSize: f(26), fontWeight: '700', marginTop: 2, letterSpacing: -0.4, fontVariant: ['tabular-nums'] }}>
                  {gen.proy.v}
                  {gen.proy.unit ? <Text style={{ color: C.mut, fontSize: f(14), fontWeight: '500' }}>{' ' + gen.proy.unit}</Text> : null}
                </Text>
                <Barra bar={gen.proy.bar} C={C} />
                {gen.proy.sub ? <Text style={{ color: C.mut, fontSize: f(12), marginTop: 6, lineHeight: f(16) }}>{gen.proy.sub}</Text> : null}
                {(gen.proy.lines || []).map((l, i) => (
                  <Text key={i} style={{ color: css(l.c, C.ink), fontSize: f(14), marginTop: i ? 4 : 8 }}>
                    {l.t}
                  </Text>
                ))}
              </Tarjeta>
            ) : null}
          </>
        ) : null}

        {/* Presupuestos */}
        <Seccion s={pre} C={C} f={f} onTap={tap} keep={keep} />
        {pre && !pre.col ? (
          pre.empty ? (
            <Toque onPress={() => tap(pre.empty.sel)}>
              <View style={[st.row, st.slim, { backgroundColor: C.sf }]}>
                <View style={[st.slimI, { backgroundColor: alfa(C.ac, 0.14) }]}>
                  <Ico xml={PLUS} size={20} color={C.ac} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink, fontSize: f(15), fontWeight: '600' }}>{pre.empty.t}</Text>
                  <Text style={{ color: C.mut, fontSize: f(13), marginTop: 2 }}>{pre.empty.s}</Text>
                </View>
                <Ico xml={CHEV} size={16} color={C.mut} />
              </View>
            </Toque>
          ) : pre.rows && pre.rows.length ? (
            <Tarjeta C={C} style={{ paddingVertical: 4 }}>
              {pre.rows.map((r, i) => (
                <Toque key={r.k} onPress={() => tap(r.sel)} label={r.t}>
                  <View style={[{ paddingVertical: 12 }, i < pre.rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                    <View style={[st.row, { justifyContent: 'space-between', gap: 8 }]}>
                      <View style={[st.row, { gap: 8, flex: 1, minWidth: 0 }]}>
                        <Circulo ico={r.ico} z={26} C={C} />
                        <Text style={{ color: C.ink, fontSize: f(15), fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>
                          {r.t}
                        </Text>
                      </View>
                      <Text style={{ color: C.mut, fontSize: f(13), fontVariant: ['tabular-nums'] }}>{r.v}</Text>
                    </View>
                    <Barra bar={r.bar} C={C} />
                  </View>
                </Toque>
              ))}
            </Tarjeta>
          ) : null
        ) : null}

        {/* Próximos pagos */}
        {rec && rec.rows && rec.rows.length ? (
          <>
            <Titulo t={rec.t} sub={rec.sub} C={C} f={f} />
            <Tarjeta C={C} style={{ paddingVertical: 2 }}>
              {rec.rows.map((r, i) => (
                <Fila
                  key={i}
                  C={C}
                  f={f}
                  ico={r.ico}
                  t={r.t}
                  s={r.s}
                  last={i === rec.rows.length - 1}
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ color: C.ink, fontSize: f(15), fontWeight: '600', fontVariant: ['tabular-nums'] }}>{r.amt}</Text>
                      {r.reg ? (
                        <Toque onPress={() => tap(r.reg.sel)} style={[st.mini, { backgroundColor: C.sf2 }]} hitSlop={6}>
                          <Text style={{ color: C.ink, fontSize: f(12), fontWeight: '600' }}>{r.reg.t}</Text>
                        </Toque>
                      ) : null}
                    </View>
                  }
                />
              ))}
            </Tarjeta>
          </>
        ) : null}

        {/* Últimos movimientos */}
        {last ? (
          <>
            <Titulo t={last.t} C={C} f={f} />
            {last.rows.length ? (
              <Tarjeta C={C} style={{ paddingVertical: 2 }}>
                {last.rows.map((r, i) => (
                  <Fila
                    key={r.id}
                    C={C}
                    f={f}
                    ico={r.ico}
                    t={r.t}
                    s={r.s}
                    pend={r.pend}
                    last={i === last.rows.length - 1}
                    onPress={() => tap(r.sel)}
                    right={
                      <Text style={{ color: css(r.ac, C.ink), fontSize: f(15), fontWeight: '600', fontVariant: ['tabular-nums'] }} numberOfLines={1}>
                        {r.amt}
                      </Text>
                    }
                  />
                ))}
              </Tarjeta>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <BarraAbajo snap={snap} C={C} activo="home" onNav={onNav} onAdd={onAdd} />
    </View>
  );
}

export default memo(Inicio);

// Barra de abajo (igual a la de la web), compartida por Inicio y Movimientos.
export function altoBarra(ins) {
  return 58 + Math.max(ins.bottom, 8);
}
export function BarraAbajo({ snap, C, activo, onNav, onAdd }) {
  const ins = useSafeAreaInsets();
  const alto = altoBarra(ins);
  return (
    <View style={[st.nav, { height: alto, paddingBottom: Math.max(ins.bottom, 8), backgroundColor: alfa(C.bg, 0.96), borderTopColor: C.ln }]}>
      {(snap.nav || []).map((b, i) => {
        const on = b.k === activo;
        const tab = (
          <Toque key={b.k} onPress={on ? null : () => onNav && onNav(b.k)} style={st.tab} label={b.t}>
            <Ico xml={b.svg} size={25} color={on ? C.ac : C.mut} />
            <Text style={{ color: on ? C.ac : C.mut, fontSize: 10.5, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
              {b.t}
            </Text>
          </Toque>
        );
        if (i === 2) {
          return [
            <View key="fab" style={st.tab}>
              <Toque onPress={onAdd} label="Agregar movimiento">
                <View style={[st.fab, { backgroundColor: C.ac, shadowColor: C.ac, borderColor: C.bg }]}>
                  <Ico xml={snap.fab || PLUS} size={30} color="#FFFFFF" />
                </View>
              </Toque>
            </View>,
            tab,
          ];
        }
        return tab;
      })}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  circ: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  frase: { gap: 8, marginTop: 14, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18 },
  seg: { flexDirection: 'row', alignSelf: 'flex-start', marginTop: 14, padding: 3, borderRadius: 999 },
  segB: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 },
  sombra: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chip: { gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  pnav: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 16, borderRadius: 28, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 18, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  secHd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  slim: { gap: 12, padding: 14, borderRadius: 20 },
  slimI: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  acct: { width: 170, borderRadius: 22, padding: 14 },
  orf: { gap: 12, marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  ghost: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 8, borderRadius: 14 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  mini: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: -24, borderWidth: 4, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
