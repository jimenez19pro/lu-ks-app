// Hojas nativas (estilo iPhone) que reemplazan ventanas de la web:
// - Detalle del movimiento (al tocar un movimiento)
// - Ficha de cada cuenta (al tocar una cuenta en el Inicio)
// - Menú de navegación (botón de cuadritos del Inicio)
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHEV, Circulo, Ico, Tile, Toque, alfa, css, mezcla, tema } from './inicio';

const LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
const REPETIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/></svg>';
const LAPIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const BASURA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
const LISTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>';

const tr = (lang, es, en) => (lang === 'en' ? en : es);

function Encabezado({ C, titulo, izq, onIzq, der, onDer }) {
  return (
    <View style={[st.row, st.top]}>
      <View style={{ minWidth: 80 }}>
        {izq ? (
          <Toque onPress={onIzq} hitSlop={10}>
            <Text style={{ color: C.ac, fontSize: 17 }}>{izq}</Text>
          </Toque>
        ) : null}
      </View>
      <Text style={{ flex: 1, textAlign: 'center', color: C.ink, fontSize: 17, fontWeight: '600' }} numberOfLines={1}>
        {titulo}
      </Text>
      <View style={{ minWidth: 80, alignItems: 'flex-end' }}>
        {der ? (
          <Toque onPress={onDer} hitSlop={10}>
            <Text style={{ color: C.ac, fontSize: 17, fontWeight: '600' }}>{der}</Text>
          </Toque>
        ) : null}
      </View>
    </View>
  );
}

function Boton({ C, xml, t, color, onPress, fondo }) {
  return (
    <Toque onPress={onPress} style={[st.boton, { backgroundColor: fondo || C.sf }]}>
      <Ico xml={xml} size={20} color={color || C.ac} />
      <Text style={{ color: color || C.ac, fontSize: 16, fontWeight: '600' }}>{t}</Text>
    </Toque>
  );
}

function FilaInfo({ C, izq, titulo, sub, last }) {
  return (
    <View style={[st.fila, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
      {izq}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
          {titulo}
        </Text>
        {sub ? (
          <Text style={{ color: C.mut, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ---------------- Detalle del movimiento ---------------- */
export function Detalle({ d, onClose, onCat, onDup, onEdit, onDel }) {
  const ins = useSafeAreaInsets();
  const D = d || {};
  const C = tema(D.th);
  const L = D.lang;
  const color = D.tone === 'pos' ? C.pos : D.tone === 'mut' ? C.mut : C.ink;
  const borrar = () =>
    Alert.alert(tr(L, '¿Eliminar este movimiento?', 'Delete this transaction?'), (D.mer || '') + '  ' + (D.amt || ''), [
      { text: tr(L, 'Cancelar', 'Cancel'), style: 'cancel' },
      { text: tr(L, 'Eliminar', 'Delete'), style: 'destructive', onPress: () => onDel(D.id) },
    ]);
  return (
    <Modal visible={!!d} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Encabezado C={C} titulo={tr(L, 'Movimiento', 'Transaction')} der={tr(L, 'Listo', 'Done')} onDer={onClose} />
        {d ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: ins.bottom + 24 }}>
            <View style={{ alignItems: 'center', marginTop: 6 }}>
              <Circulo ico={D.ico} z={64} C={C} />
              <Text style={{ color: C.ink, fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>{D.mer}</Text>
              <Text style={{ color, fontSize: 36, fontWeight: '700', marginTop: 4, letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>{D.amt}</Text>
              <Text style={{ color: C.mut, fontSize: 14, marginTop: 4, textTransform: 'capitalize' }}>
                {D.fecha}
                {D.hora ? ' · ' + D.hora : ''}
              </Text>
            </View>
            <View style={[st.card, { backgroundColor: C.sf, marginTop: 20 }]}>
              <FilaInfo C={C} izq={<Circulo ico={D.ico} z={36} C={C} />} titulo={D.sub ? D.sub : D.catN} sub={D.sub ? D.catN : tr(L, 'Categoría', 'Category')} />
              <FilaInfo
                C={C}
                izq={<Tile tile={D.accTile} z={36} C={C} />}
                titulo={D.tp === 'tr' ? tr(L, 'Desde: ', 'From: ') + D.accN : D.accN}
                sub={D.accS}
                last={D.tp !== 'tr'}
              />
              {D.tp === 'tr' ? <FilaInfo C={C} izq={<Tile tile={D.dstTile} z={36} C={C} />} titulo={tr(L, 'Hacia: ', 'To: ') + D.dstN} last /> : null}
            </View>
            {D.cats && D.cats.length ? (
              <>
                <Text style={[st.seccion, { color: C.mut }]}>{tr(L, 'Cambiar categoría', 'Change category')}</Text>
                <View style={[st.row, { flexWrap: 'wrap', gap: 8 }]}>
                  {D.cats.map((c) => {
                    const on = c.k === D.cat;
                    const cc = css(c.ico && c.ico.c, C.ac);
                    return (
                      <Toque key={c.k} onPress={() => (on ? null : onCat(D.id, c.k))} style={[st.row, st.chip, { backgroundColor: on ? alfa(cc, 0.2) : C.sf, borderColor: on ? cc : 'transparent' }]}>
                        <Circulo ico={c.ico} z={22} C={C} />
                        <Text style={{ color: C.ink, fontSize: 14, fontWeight: on ? '700' : '500' }}>{c.n}</Text>
                      </Toque>
                    );
                  })}
                </View>
              </>
            ) : null}
            <View style={{ gap: 10, marginTop: 22 }}>
              <Boton C={C} xml={REPETIR} t={tr(L, 'Repetir con fecha de hoy', 'Repeat with today’s date')} onPress={() => onDup(D.id)} />
              <Boton C={C} xml={LAPIZ} t={tr(L, 'Editar', 'Edit')} onPress={() => onEdit(D.id)} />
              <Boton C={C} xml={BASURA} t={tr(L, 'Eliminar', 'Delete')} color={C.neg} onPress={borrar} />
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

/* ---------------- Ficha de cuenta ---------------- */
export function Cuenta({ c, onClose, onDet, onEditar, onVer }) {
  const ins = useSafeAreaInsets();
  const D = c || {};
  const C = tema(D.th);
  const L = D.lang;
  const credito = D.tipo === 'credito';
  const tipoTxt = credito ? tr(L, 'Tarjeta de crédito', 'Credit card') + (D.red ? ' · ' + D.red : '') : D.tipo === 'efectivo' ? tr(L, 'Efectivo', 'Cash') : tr(L, 'Débito (ahorros)', 'Debit (savings)');
  const tarjeta = css(D.color, C.ac);
  return (
    <Modal visible={!!c} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Encabezado C={C} titulo={D.n || ''} der={tr(L, 'Listo', 'Done')} onDer={onClose} />
        {c ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: ins.bottom + 24 }}>
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <Tile tile={D.tile} z={60} C={C} />
              <Text style={{ color: C.mut, fontSize: 14, marginTop: 10 }}>{tipoTxt}</Text>
            </View>
            {credito ? (
              <View style={[st.card, { backgroundColor: tarjeta, marginTop: 16, paddingVertical: 18 }]}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{tr(L, 'Usado', 'Used')}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>{D.usado}</Text>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', marginTop: 10 }}>
                  <View style={{ width: `${D.pct || 0}%`, height: '100%', backgroundColor: '#FFFFFF', borderRadius: 4 }} />
                </View>
                <View style={[st.row, { justifyContent: 'space-between', marginTop: 10 }]}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    {tr(L, 'Disponible ', 'Available ')}
                    <Text style={{ fontWeight: '700' }}>{D.disp}</Text>
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    {tr(L, 'Cupo ', 'Limit ')}
                    {D.cupo}
                  </Text>
                </View>
                {D.pago ? (
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 }}>{tr(L, 'Día de pago: ', 'Payment day: ') + D.pago}</Text>
                ) : null}
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: C.mut, fontSize: 14 }}>{tr(L, 'Saldo', 'Balance')}</Text>
                <Text style={{ color: D.neg ? C.neg : C.ink, fontSize: 38, fontWeight: '700', letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>{D.saldo}</Text>
              </View>
            )}
            <Text style={[st.seccion, { color: C.mut }]}>{D.mes}</Text>
            <View style={[st.row, { gap: 10 }]}>
              <View style={[st.card, { flex: 1, backgroundColor: C.sf, paddingVertical: 14 }]}>
                <Text style={{ color: C.mut, fontSize: 13 }}>{tr(L, 'Entró', 'In')}</Text>
                <Text style={{ color: C.pos, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{D.entra}</Text>
              </View>
              <View style={[st.card, { flex: 1, backgroundColor: C.sf, paddingVertical: 14 }]}>
                <Text style={{ color: C.mut, fontSize: 13 }}>{tr(L, 'Salió', 'Out')}</Text>
                <Text style={{ color: C.ink, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{D.sale}</Text>
              </View>
            </View>
            <View style={{ gap: 10, marginTop: 14 }}>
              <Boton C={C} xml={LISTA} t={tr(L, 'Ver en Movimientos', 'See in Transactions')} onPress={() => onVer(D.n)} />
              <Boton C={C} xml={LAPIZ} t={tr(L, 'Editar cuenta', 'Edit account')} onPress={() => onEditar(D.i)} />
            </View>
            <Text style={[st.seccion, { color: C.mut }]}>
              {tr(L, 'Movimientos', 'Transactions')} · {D.total}
            </Text>
            {D.movs && D.movs.length ? (
              <View style={[st.card, { backgroundColor: C.sf }]}>
                {D.movs.map((m, i) => (
                  <Toque key={m.id} onPress={() => onDet(m.id)}>
                    <View style={[st.fila, i < D.movs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                      <Circulo ico={m.ico} z={38} C={C} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: C.ink, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                          {m.t}
                        </Text>
                        <Text style={{ color: C.mut, fontSize: 12, marginTop: 2, textTransform: 'none' }} numberOfLines={1}>
                          {m.s}
                        </Text>
                      </View>
                      {m.p ? <Text style={{ fontSize: 13 }}>⏳</Text> : null}
                      <Text style={{ color: m.tone === 'pos' ? C.pos : C.ink, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{m.a}</Text>
                    </View>
                  </Toque>
                ))}
              </View>
            ) : (
              <Text style={{ color: C.mut, fontSize: 15 }}>{tr(L, 'Aún no hay movimientos en esta cuenta.', 'No transactions in this account yet.')}</Text>
            )}
            {D.total > (D.movs || []).length ? (
              <Toque onPress={() => onVer(D.n)} style={{ alignSelf: 'center', marginTop: 12 }}>
                <Text style={{ color: C.ac, fontSize: 15, fontWeight: '600' }}>{tr(L, 'Ver todos', 'See all')}</Text>
              </Toque>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

/* ---------------- Menú de navegación ---------------- */
function nz(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
export function Menu({ m, onClose, onGo }) {
  const ins = useSafeAreaInsets();
  const D = m || {};
  const C = tema(D.th);
  const L = D.lang;
  const [q, setQ] = useState('');
  useEffect(() => {
    if (m) setQ('');
  }, [m]);
  const secs = useMemo(() => {
    const s = D.secs || [];
    const b = nz(q.trim());
    if (!b) return s;
    const vistos = {};
    const items = [];
    s.forEach((x) =>
      x.items.forEach((it) => {
        if (!vistos[it.k] && nz(it.t).indexOf(b) > -1) {
          vistos[it.k] = 1;
          items.push(it);
        }
      })
    );
    return [{ t: tr(L, 'Resultados', 'Results'), items }];
  }, [D.secs, q, L]);
  return (
    <Modal visible={!!m} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Encabezado C={C} titulo={tr(L, 'Ir a…', 'Go to…')} der={tr(L, 'Listo', 'Done')} onDer={onClose} />
        <View style={[st.row, st.buscar, { backgroundColor: C.sf2 }]}>
          <Ico xml={LUPA} size={18} color={C.mut} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={tr(L, 'Buscar herramienta', 'Search tools')}
            placeholderTextColor={C.mut}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            style={{ flex: 1, color: C.ink, fontSize: 16, paddingVertical: 10 }}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: ins.bottom + 24 }}>
          {secs.map((s, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={[st.seccion, { color: C.mut, marginTop: i ? 14 : 0 }]}>{s.t}</Text>
              {s.items.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }}>
                  {s.items.map((it) => (
                    <Toque key={s.t + it.k} onPress={() => onGo(it.k, it.h)} style={[st.tileMenu, { backgroundColor: C.sf }]}>
                      <View style={[st.icoMenu, { backgroundColor: mezcla(C.ac, C.sf, 0.14) }]}>
                        <Ico xml={it.svg} size={22} color={C.ac} />
                      </View>
                      <Text style={{ color: C.ink, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 }} numberOfLines={2}>
                        {it.t}
                      </Text>
                    </Toque>
                  ))}
                </View>
              ) : (
                <Text style={{ color: C.mut, fontSize: 15, textAlign: 'center', marginTop: 20 }}>{tr(L, 'No encontré nada con esa búsqueda.', 'Nothing found.')}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  top: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  card: { borderRadius: 20, paddingHorizontal: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  seccion: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 22, marginBottom: 8, marginLeft: 4 },
  chip: { gap: 6, paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: 999, borderWidth: 1.5 },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  buscar: { gap: 8, marginHorizontal: 16, paddingHorizontal: 12, borderRadius: 12 },
  tileMenu: { width: '31%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: 18 },
  icoMenu: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
