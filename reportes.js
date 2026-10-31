// Reportes nativo de Lu-Ks.
// La pestaña Reportes tiene muchas secciones (tendencia, gastos hormiga,
// suscripciones, top comercios, fijos y variables, 50/30/20, 4x1000, gráficas,
// chat). En vez de repetir todos esos cálculos, la web manda un "espejo" de la
// pantalla ya dibujada (cajas, textos, barras, gráficas en SVG, botones y
// campos) y aquí se dibuja con piezas del celular. Cada toque se le pide a la web.
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { BarraAbajo, Ico, Toque, altoBarra, css, tema } from './inicio';

const PESO = { normal: '400', bold: '700', bolder: '800', lighter: '300' };
function peso(w) {
  if (!w) return undefined;
  if (PESO[w]) return PESO[w];
  const n = Math.round(parseInt(w, 10) / 100) * 100;
  return isFinite(n) ? String(Math.min(Math.max(n, 100), 900)) : undefined;
}
function estiloTexto(st, C, fallback) {
  if (!st) return fallback;
  const o = { color: css(st.c, C.ink) };
  if (st.fs) o.fontSize = st.fs;
  const w = peso(st.fw);
  if (w) o.fontWeight = w;
  if (st.it) o.fontStyle = 'italic';
  if (st.tt === 'capitalize' || st.tt === 'uppercase' || st.tt === 'lowercase') o.textTransform = st.tt;
  if (st.lt) o.textDecorationLine = 'line-through';
  return o;
}
function dim(v) {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (/%$/.test(s)) return s;
  const n = parseFloat(s);
  return isFinite(n) ? n : undefined;
}

// Estilo de caja (márgenes, relleno, fondo, bordes, flex…)
function estiloCaja(b, ancho) {
  if (!b) return null;
  const o = {};
  if (b.fd) o.flexDirection = b.fd === 'row-reverse' ? 'row-reverse' : b.fd === 'column-reverse' ? 'column-reverse' : b.fd === 'row' ? 'row' : 'column';
  if (b.fw) o.flexWrap = 'wrap';
  if (b.jc) o.justifyContent = { 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly', center: 'center', 'flex-end': 'flex-end', end: 'flex-end', right: 'flex-end' }[b.jc];
  if (b.ai) o.alignItems = { center: 'center', 'flex-end': 'flex-end', end: 'flex-end', baseline: 'baseline', 'flex-start': 'flex-start', start: 'flex-start' }[b.ai];
  if (b.rg) o.rowGap = b.rg;
  if (b.cg) o.columnGap = b.cg;
  if (b.p) {
    o.paddingTop = b.p[0];
    o.paddingRight = b.p[1];
    o.paddingBottom = b.p[2];
    o.paddingLeft = b.p[3];
  }
  if (b.m) {
    o.marginTop = b.m[0];
    o.marginRight = b.m[1];
    o.marginBottom = b.m[2];
    o.marginLeft = b.m[3];
  }
  if (b.bg) o.backgroundColor = css(b.bg, undefined);
  if (b.br) o.borderRadius = b.br;
  for (const [k, side] of [
    ['bT', 'Top'],
    ['bR', 'Right'],
    ['bB', 'Bottom'],
    ['bL', 'Left'],
  ]) {
    if (b[k]) {
      o['border' + side + 'Width'] = b[k][0] <= 1 ? StyleSheet.hairlineWidth * 2 : b[k][0];
      o['border' + side + 'Color'] = css(b[k][1], 'transparent');
    }
  }
  if (b.bs) o.borderStyle = 'dashed';
  if (b.oh) o.overflow = 'hidden';
  if (b.op != null) o.opacity = b.op;
  if (b.fg) o.flexGrow = b.fg;
  if (b.fg) o.flexBasis = 0;
  if (b.fs0) o.flexShrink = 0;
  else o.flexShrink = 1;
  if (b.as) o.alignSelf = { center: 'center', 'flex-end': 'flex-end', end: 'flex-end', 'flex-start': 'flex-start', start: 'flex-start', stretch: 'stretch', baseline: 'baseline' }[b.as];
  const w = dim(b.w);
  if (w != null) o.width = w;
  if (b.h != null) o.height = b.h;
  if (b.abs) {
    o.position = 'absolute';
    o.left = dim(b.l);
    o.top = b.t;
  }
  if (b.cols && ancho) o._cols = b.cols;
  return o;
}

function Pedazos({ n, C, tap, onTap }) {
  const base = estiloTexto(n.st, C);
  const st = [base, n.ta ? { textAlign: n.ta } : null, n.lh ? { lineHeight: n.lh } : null];
  return (
    <Text style={st} numberOfLines={n.ws ? 1 : undefined} onPress={tap ? () => onTap(tap) : undefined} suppressHighlighting={!tap}>
      {n.runs.map((r, i) => {
        if (r.s != null) {
          return (
            <Text key={i} style={estiloTexto(r.st, C)}>
              {r.s}
            </Text>
          );
        }
        if (r.box) {
          const caja = (
            <View
              style={{
                width: r.w,
                height: r.h,
                borderRadius: r.r || 0,
                backgroundColor: r.bg ? css(r.bg, 'transparent') : 'transparent',
                marginRight: r.mr || 0,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: Math.max(0, (r.h - (base.fontSize || 15)) / 4) }],
              }}
            >
              {r.svg ? <Ico xml={r.svg} size={r.sw || Math.round(r.w * 0.6)} /> : null}
            </View>
          );
          // Espacio después del punto de color (el margen no se respeta dentro de un texto)
          return r.mr ? (
            <Text key={i}>
              {caja}
              {' '}
            </Text>
          ) : (
            <Text key={i}>{caja}</Text>
          );
        }
        if (r.svg) {
          return (
            <View key={i} style={{ width: r.w, height: r.h }}>
              <SvgXml xml={r.svg} width={r.w} height={r.h} />
            </View>
          );
        }
        return null;
      })}
    </Text>
  );
}

function Campo({ n, C, onIn, onEnter }) {
  const [v, setV] = useState(n.v || '');
  const [foco, setFoco] = useState(false);
  useEffect(() => {
    if (!foco) setV(n.v || '');
  }, [n.v, foco]);
  const st = [estiloTexto(n.st, C), estiloCaja(n.b), { backgroundColor: n.b && n.b.bg ? css(n.b.bg, C.sf2) : C.sf2, borderRadius: (n.b && n.b.br) || 12 }];
  if (n.multi && n.ro) {
    return (
      <Text selectable style={[st, { padding: 10, fontSize: 12, fontFamily: 'Courier' }]} numberOfLines={12}>
        {n.v}
      </Text>
    );
  }
  return (
    <TextInput
      value={v}
      onChangeText={(x) => {
        setV(x);
        onIn(n.sel, x);
      }}
      onFocus={() => setFoco(true)}
      onBlur={() => setFoco(false)}
      onSubmitEditing={() => onEnter(n.sel)}
      placeholder={n.ph}
      placeholderTextColor={C.mut}
      multiline={!!n.multi}
      editable={!n.ro}
      returnKeyType="send"
      blurOnSubmit
      style={[st, { flex: 1, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10 }]}
    />
  );
}

function Nodo({ n, C, ctx, ancho }) {
  if (!n) return null;
  if (n.k === 'p') return <Pedazos n={n} C={C} tap={null} onTap={ctx.onTap} />;
  if (n.k === 'svg') {
    const w = ancho && n.w > ancho ? ancho : n.w;
    const h = n.w ? (n.h * w) / n.w : n.h;
    return (
      <View style={[{ width: w, height: h }, n.c ? { alignSelf: 'center' } : null]}>
        <SvgXml xml={n.x} width={w} height={h} />
        {(n.z || []).map((z, i) => {
          const k = n.w ? w / n.w : 1;
          return (
            <Toque
              key={i}
              onPress={() => ctx.onTap(z.sel)}
              style={{ position: 'absolute', left: z.x * k, top: z.y * k, width: Math.max(z.w * k, 24), height: Math.max(z.h * k, 24) }}
            />
          );
        })}
      </View>
    );
  }
  if (n.k === 'in') return <Campo n={n} C={C} onIn={ctx.onIn} onEnter={ctx.onEnter} />;
  if (n.k !== 'v') return null;
  const est = estiloCaja(n.b, ancho) || {};
  const cols = est._cols;
  delete est._cols;
  // Ancho disponible aproximado para los hijos (para ajustar gráficas anchas).
  const pad = (n.b && n.b.p ? n.b.p[1] + n.b.p[3] : 0) + (n.b && n.b.m ? Math.max(0, n.b.m[1]) + Math.max(0, n.b.m[3]) : 0);
  const anchoHijos = typeof est.width === 'number' ? est.width - pad : ancho ? ancho - pad : undefined;
  const hijos = (n.ch || []).map((c, i) => {
    const el = <Nodo key={i} n={c} C={C} ctx={ctx} ancho={cols ? undefined : anchoHijos} />;
    if (cols) return <View key={i} style={{ width: `${Math.floor(100 / cols) - 3}%` }}>{el}</View>;
    return el;
  });
  if (n.id === 'expcopy' || n.id === 'exp-copy') {
    return (
      <Toque onPress={() => ctx.copiar()} style={est}>
        {hijos}
      </Toque>
    );
  }
  if (n.b && n.b.sx) {
    const { marginLeft, marginRight, paddingLeft, paddingRight, ...resto } = est;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginLeft, marginRight, flexGrow: 0 }}
        contentContainerStyle={[resto, { paddingLeft, paddingRight, flexDirection: 'row', alignItems: est.alignItems || 'center' }]}
      >
        {hijos}
      </ScrollView>
    );
  }
  if (n.tap) {
    return (
      <Toque onPress={n.dis ? null : () => ctx.onTap(n.tap)} disabled={!!n.dis} style={[est, n.dis ? { opacity: 0.5 } : null]}>
        {hijos}
      </Toque>
    );
  }
  return <View style={est}>{hijos}</View>;
}

function Reportes({ R, onTap, onJs, onRefresh, onNav, onAdd, onAviso }) {
  const ins = useSafeAreaInsets();
  const C = tema(R && R.th);
  const [cargando, setCargando] = useState(false);
  const csv = useRef('');
  const onIn = useCallback((sel, v) => onJs(`window.__lkIn&&window.__lkIn(${JSON.stringify(sel)},${JSON.stringify(v)})`), [onJs]);
  const onEnter = useCallback((sel) => onJs(`window.__lkEnter&&window.__lkEnter(${JSON.stringify(sel)})`), [onJs]);
  if (!R) return null;
  // Texto del CSV (si ya se generó) para el botón "Copiar"
  const buscar = (ns) => {
    for (const x of ns || []) {
      if (x && x.k === 'in' && x.id === 'exp-t') return x.v;
      const r = x && x.ch ? buscar(x.ch) : null;
      if (r) return r;
    }
    return null;
  };
  csv.current = buscar(R.tree) || '';
  const ctx = {
    onTap,
    onIn,
    onEnter,
    copiar: async () => {
      if (!csv.current) return;
      await Clipboard.setStringAsync(csv.current);
      onAviso && onAviso(R.lang === 'en' ? 'Copied' : 'Copiado');
    },
  };
  const barAlto = altoBarra(ins);
  const refrescar = () => {
    setCargando(true);
    onRefresh && onRefresh();
    setTimeout(() => setCargando(false), 900);
  };
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: ins.top + 10, paddingHorizontal: 16, paddingBottom: barAlto + 28 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={refrescar} tintColor={C.mut} colors={[C.ac]} progressViewOffset={ins.top} />}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {R.tree.map((n, i) => (
          <Nodo key={i} n={n} C={C} ctx={ctx} ancho={R.ancho || 358} />
        ))}
      </ScrollView>
      <BarraAbajo snap={R} C={C} activo="rep" onNav={onNav} onAdd={onAdd} />
    </View>
  );
}

export default memo(Reportes);
