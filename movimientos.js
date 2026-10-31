// Movimientos nativo de Lu-Ks.
// Igual que el Inicio: los datos los manda la web (puente.js → "tx") y cada
// toque se le pide a la web. La lista usa FlatList (fluida aunque haya muchos).
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Keyboard, PanResponder, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarraAbajo, CHEV, Circulo, EYE, EYE_OFF, Ico, Tile, Toque, alfa, altoBarra, css, tema } from './inicio';

const LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
const EQUIS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const FILTRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>';

function Cabecera({ S, C, f, tap, keep, buscar, guardar, q, setQ, foco, setFoco }) {
  const per = S.per;
  return (
    <View>
      {/* Título y balance */}
      <View style={[st.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <Text style={{ color: C.ink, fontSize: f(30), fontWeight: '700', letterSpacing: -0.6 }}>{S.hd.t}</Text>
        <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 12 }}>
          <View style={[st.row, { gap: 4 }]}>
            <Text style={{ color: C.mut, fontSize: f(12) }}>{S.hd.lb}</Text>
            <Toque onPress={() => keep('#app [data-eye]')} hitSlop={10} label="Mostrar u ocultar montos">
              <Ico xml={S.hide ? EYE_OFF : EYE} size={16} color={C.ac} />
            </Toque>
          </View>
          <Text style={{ color: css(S.hd.vc, C.ink), fontSize: f(22), fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
            {S.hd.v}
          </Text>
        </View>
      </View>

      {/* Período y filtro */}
      <View style={[st.row, { flexWrap: 'wrap', gap: 8, marginTop: 12 }]}>
        {per ? (
          <>
            <Toque onPress={() => tap('#peropen')} style={[st.row, st.chip, { backgroundColor: C.sf2 }]}>
              {per.cal ? <Ico xml={per.cal} size={16} color={C.ink} /> : null}
              <Text style={{ color: C.ink, fontSize: f(14), fontWeight: '500' }}>{per.chip}</Text>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Ico xml={CHEV} size={12} color={C.mut} />
              </View>
            </Toque>
            {per.prev ? (
              <View style={[st.row, { gap: 6 }]}>
                <Toque onPress={() => keep('#app .pnav[data-off="-1"]')} style={[st.pnav, { backgroundColor: C.sf2 }]} label="Período anterior">
                  <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <Ico xml={CHEV} size={14} color={C.ink} />
                  </View>
                </Toque>
                <Text style={{ color: C.mut, fontSize: f(13), textTransform: 'capitalize' }}>{per.label}</Text>
                <Toque
                  onPress={() => keep('#app .pnav[data-off="1"]')}
                  disabled={per.nextOff}
                  style={[st.pnav, { backgroundColor: C.sf2, opacity: per.nextOff ? 0.35 : 1 }]}
                  label="Período siguiente"
                >
                  <Ico xml={CHEV} size={14} color={C.ink} />
                </Toque>
              </View>
            ) : null}
          </>
        ) : null}
        {S.fil ? (
          <Toque onPress={() => tap('#fopen')} style={[st.row, st.chip, { backgroundColor: S.fil.on ? alfa(C.ac, 0.16) : C.sf2 }]}>
            <Ico xml={FILTRO} size={15} color={S.fil.on ? C.ac : C.ink} />
            <Text style={{ color: S.fil.on ? C.ac : C.ink, fontSize: f(14), fontWeight: '600' }}>{S.fil.t}</Text>
          </Toque>
        ) : null}
      </View>

      {/* Buscador */}
      <View style={[st.row, st.buscar, { backgroundColor: C.sf2, borderColor: foco ? alfa(C.ac, 0.6) : 'transparent' }]}>
        <Ico xml={LUPA} size={18} color={C.mut} />
        <TextInput
          value={q}
          onChangeText={(v) => {
            setQ(v);
            buscar(v);
          }}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          onSubmitEditing={() => guardar(q)}
          placeholder={S.q.ph}
          placeholderTextColor={C.mut}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          style={{ flex: 1, color: C.ink, fontSize: f(16), paddingVertical: 10 }}
          accessibilityLabel="Buscar movimientos"
        />
        {q ? (
          <Toque
            onPress={() => {
              setQ('');
              buscar('', false, true);
            }}
            hitSlop={10}
            label="Borrar búsqueda"
          >
            <Ico xml={EQUIS} size={18} color={C.mut} />
          </Toque>
        ) : null}
      </View>

      {/* Búsquedas recientes o resumen de resultados */}
      {S.rec && S.rec.items.length && !q ? (
        <View style={[st.row, { flexWrap: 'wrap', gap: 6, marginTop: 10 }]}>
          <Text style={{ color: C.mut, fontSize: f(12) }}>{S.rec.lb}</Text>
          {S.rec.items.map((x) => (
            <Toque
              key={x}
              onPress={() => {
                setQ(x);
                buscar(x, true);
              }}
              style={[st.mini, { backgroundColor: C.sf2 }]}
            >
              <Text style={{ color: C.ink, fontSize: f(13) }}>{x}</Text>
            </Toque>
          ))}
          {S.rec.clr ? (
            <Toque onPress={() => keep('#qrclr')} hitSlop={6}>
              <Text style={{ color: C.ac, fontSize: f(12) }}>{S.rec.clr}</Text>
            </Toque>
          ) : null}
        </View>
      ) : null}
      {S.qall && S.qall.length ? (
        <View style={[st.seg, { backgroundColor: C.sf2, marginTop: 10 }]}>
          {S.qall.map((b) => (
            <Toque key={b.k} onPress={() => (b.on ? null : keep(`#app [data-qall="${b.k}"]`))} style={[st.segB, b.on && { backgroundColor: C.dark ? '#636366' : C.sf, ...st.sombra }]}>
              <Text style={{ color: b.on ? C.ink : C.mut, fontSize: f(13), fontWeight: '600' }}>{b.t}</Text>
            </Toque>
          ))}
        </View>
      ) : null}
      {S.qsum && S.qsum.length ? (
        <View style={[st.row, { flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 10 }]}>
          {S.qsum.map((x, i) => (
            <Text key={i} style={{ color: x.b ? C.ink : C.mut, fontSize: f(13), fontWeight: x.b ? '700' : '400' }}>
              {x.lb}
              {x.v ? <Text style={{ color: css(x.c, C.ink), fontWeight: '600' }}>{' ' + x.v}</Text> : null}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Categorías | Cuentas */}
      {S.sv && S.sv.length ? (
        <View style={[st.seg, { backgroundColor: C.sf2, marginTop: 16 }]}>
          {S.sv.map((b) => (
            <Toque key={b.k} onPress={() => (b.on ? null : keep(`#app [data-sv="${b.k}"]`))} style={[st.segB, b.on && { backgroundColor: C.dark ? '#636366' : C.sf, ...st.sombra }]}>
              <Text style={{ color: b.on ? C.ink : C.mut, fontSize: f(14), fontWeight: '600' }}>{b.t}</Text>
            </Toque>
          ))}
        </View>
      ) : null}
      {S.tiles && S.tiles.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {S.tiles.map((t) => (
            <Toque key={t.k} onPress={() => keep(`#app .tile[data-tl="${t.k.replace(/"/g, '\\"')}"]`)} label={t.lb}>
              <View style={[st.tile, { backgroundColor: C.sf, borderColor: t.on ? C.ac : 'transparent' }]}>
                {t.ico ? <Circulo ico={t.ico} z={38} C={C} /> : t.tile ? <Tile tile={t.tile} z={34} C={C} /> : <Text style={{ fontSize: 22 }}>{t.e}</Text>}
                <Text style={{ color: C.mut, fontSize: f(13), marginTop: 8 }} numberOfLines={1}>
                  {t.lb}
                </Text>
                <Text style={{ color: css(t.vc, C.ink), fontSize: f(17), fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
                  {t.v}
                </Text>
              </View>
            </Toque>
          ))}
        </ScrollView>
      ) : null}

      <Text style={{ marginTop: 24, marginBottom: 4, color: C.ink, fontSize: f(20), fontWeight: '700', letterSpacing: -0.4 }}>{S.list.t}</Text>
      {!S.list.items.length && S.empty ? <Text style={{ color: C.mut, fontSize: f(15), marginTop: 8 }}>{S.empty}</Text> : null}
    </View>
  );
}

const ANCHO_ACC = 82;
const LAPIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const BASURA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';

// Fila que se desliza a la izquierda para mostrar Editar y Eliminar (como en Correo del iPhone).
const FilaMov = memo(function FilaMov({ it, ico, C, f, onOpen, onEdit, onDel, primera, ultima, abierta, lang }) {
  const x = useRef(new Animated.Value(0)).current;
  const pos = useRef(0);
  const max = ANCHO_ACC * 2;
  const mover = (v, cb) => {
    pos.current = v;
    Animated.spring(x, { toValue: v, useNativeDriver: true, bounciness: 0, speed: 20 }).start(cb);
  };
  const cerrar = useCallback(() => mover(0), []);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
        onPanResponderGrant: () => {
          x.stopAnimation((v) => (pos.current = v));
          if (abierta.current && abierta.current !== cerrar) abierta.current();
        },
        onPanResponderMove: (e, g) => {
          let v = pos.current + g.dx;
          if (v > 0) v = v / 4;
          if (v < -max) v = -max + (v + max) / 4;
          x.setValue(v);
        },
        onPanResponderRelease: (e, g) => {
          const v = pos.current + g.dx;
          if (v < -max * 0.4 || g.vx < -0.5) {
            mover(-max);
            abierta.current = cerrar;
          } else {
            mover(0);
            if (abierta.current === cerrar) abierta.current = null;
          }
        },
        onPanResponderTerminate: () => mover(0),
        onPanResponderTerminationRequest: () => false,
      }),
    []
  );
  const en = lang === 'en';
  const tocar = () => {
    if (pos.current < -4) {
      cerrar();
      return;
    }
    onOpen(it.id);
  };
  const radio = [primera && { borderTopLeftRadius: 20, borderTopRightRadius: 20 }, ultima && { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }];
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: C.sf }, radio]}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
        <Toque
          onPress={() => {
            cerrar();
            onEdit(it.id);
          }}
          style={[st.acc, { backgroundColor: C.ac }]}
          label={en ? 'Edit' : 'Editar'}
        >
          <Ico xml={LAPIZ} size={20} color="#FFFFFF" />
          <Text style={st.accT}>{en ? 'Edit' : 'Editar'}</Text>
        </Toque>
        <Toque
          onPress={() => {
            cerrar();
            onDel(it);
          }}
          style={[st.acc, { backgroundColor: C.neg }]}
          label={en ? 'Delete' : 'Eliminar'}
        >
          <Ico xml={BASURA} size={20} color="#FFFFFF" />
          <Text style={st.accT}>{en ? 'Delete' : 'Eliminar'}</Text>
        </Toque>
      </View>
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }], backgroundColor: C.sf, paddingHorizontal: 16 }}>
        <Toque onPress={tocar} label={it.t}>
          <View style={[st.fila, !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
            <Circulo ico={ico} z={40} C={C} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: C.ink, fontSize: f(16), fontWeight: '600' }} numberOfLines={1}>
                {it.t}
              </Text>
              <Text style={{ color: C.mut, fontSize: f(13), marginTop: 2 }} numberOfLines={2}>
                {it.s}
              </Text>
            </View>
            {it.p ? <Text style={{ fontSize: f(14) }}>⏳</Text> : null}
            <Text style={{ color: css(it.ac, C.ink), fontSize: f(15), fontWeight: '600', fontVariant: ['tabular-nums'] }} numberOfLines={1}>
              {it.a}
            </Text>
          </View>
        </Toque>
      </Animated.View>
    </View>
  );
});

function Movimientos({ S, onTap, onKeep, onJs, onRefresh, onNav, onAdd, onEdit }) {
  const ins = useSafeAreaInsets();
  const C = tema(S && S.th);
  const f = useCallback((n) => Math.round(n * C.z * 10) / 10, [C.z]);
  const [cargando, setCargando] = useState(false);
  const [q, setQ] = useState((S && S.q && S.q.v) || '');
  const [foco, setFoco] = useState(false);
  const timer = useRef(null);
  const pidiendo = useRef(false);

  // Si la búsqueda cambia desde la web (recientes, borrar), actualizar el campo.
  const qWeb = S && S.q ? S.q.v : '';
  useEffect(() => {
    if (!foco) setQ(qWeb);
  }, [qWeb, foco]);

  const tap = useCallback((sel) => sel && onTap(sel), [onTap]);
  const keep = useCallback((sel) => sel && onKeep(sel), [onKeep]);
  const buscar = useCallback(
    (v, guardar, ya) => {
      clearTimeout(timer.current);
      const go = () => onJs(`window.__lkQ&&window.__lkQ(${JSON.stringify(v)},${guardar ? 'true' : 'false'})`);
      if (ya || guardar) go();
      else timer.current = setTimeout(go, 160);
    },
    [onJs]
  );
  const guardar = useCallback((v) => buscar(v, true), [buscar]);
  const abierta = useRef(null);
  const borrar = useCallback(
    (it) => {
      const en = S && S.lang === 'en';
      Alert.alert(en ? 'Delete this transaction?' : '¿Eliminar este movimiento?', (it.t || '') + '  ' + (it.a || ''), [
        { text: en ? 'Cancel' : 'Cancelar', style: 'cancel' },
        { text: en ? 'Delete' : 'Eliminar', style: 'destructive', onPress: () => onJs(`window.__lkDel&&window.__lkDel(${JSON.stringify(String(it.id))})`) },
      ]);
    },
    [onJs, S && S.lang]
  );
  const abrir = useCallback(
    (id) => {
      Keyboard.dismiss();
      onJs(`window.__lkDet&&window.__lkDet(${JSON.stringify(String(id))})`);
    },
    [onJs]
  );

  // Lista: separadores de día + filas (con esquinas redondeadas por grupo).
  const datos = useMemo(() => {
    const out = [];
    const items = (S && S.list && S.list.items) || [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.d != null) {
        out.push({ k: 'd' + i, d: it.d });
        continue;
      }
      const prev = items[i - 1], next = items[i + 1];
      out.push({ k: 'r' + it.id, it, primera: !prev || prev.d != null, ultima: !next || next.d != null });
    }
    return out;
  }, [S]);

  useEffect(() => {
    pidiendo.current = false;
  }, [S && S.list && S.list.items.length]);

  if (!S) return null;
  const icons = (S.list && S.list.icons) || [];
  const barAlto = altoBarra(ins);
  const refrescar = () => {
    setCargando(true);
    onRefresh && onRefresh();
    setTimeout(() => setCargando(false), 900);
  };
  const masAbajo = () => {
    if (!S.list.more || pidiendo.current) return;
    pidiendo.current = true;
    onJs('window.__lkMore&&window.__lkMore()');
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <FlatList
        data={datos}
        keyExtractor={(x) => x.k}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => {
          if (abierta.current) {
            abierta.current();
            abierta.current = null;
          }
        }}
        contentContainerStyle={{ paddingTop: ins.top + 10, paddingHorizontal: 16, paddingBottom: barAlto + 28 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={refrescar} tintColor={C.mut} colors={[C.ac]} progressViewOffset={ins.top} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        windowSize={11}
        onEndReachedThreshold={0.6}
        onEndReached={masAbajo}
        ListHeaderComponent={
          <Cabecera S={S} C={C} f={f} tap={tap} keep={keep} buscar={buscar} guardar={guardar} q={q} setQ={setQ} foco={foco} setFoco={setFoco} />
        }
        ListFooterComponent={
          S.list.more ? (
            <Text style={{ color: C.mut, fontSize: f(13), textAlign: 'center', marginTop: 16 }}>
              {S.lang === 'en' ? 'Loading more…' : 'Cargando más…'}
            </Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.d != null ? (
            <Text style={{ color: C.mut, fontSize: f(13), fontWeight: '600', textTransform: 'capitalize', marginTop: 18, marginBottom: 6, marginLeft: 4 }}>{item.d}</Text>
          ) : (
            <FilaMov
              it={item.it}
              ico={icons[item.it.i]}
              C={C}
              f={f}
              onOpen={abrir}
              onEdit={onEdit}
              onDel={borrar}
              abierta={abierta}
              lang={S.lang}
              primera={item.primera}
              ultima={item.ultima}
            />
          )
        }
      />
      <BarraAbajo snap={S} C={C} activo="tx" onNav={onNav} onAdd={onAdd} />
    </View>
  );
}

export default memo(Movimientos);

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  pnav: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buscar: { gap: 8, marginTop: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5 },
  mini: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },
  seg: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 999 },
  segB: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 },
  sombra: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tile: { width: 132, borderRadius: 20, padding: 14, borderWidth: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  acc: { width: ANCHO_ACC, alignItems: 'center', justifyContent: 'center', gap: 4 },
  accT: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
