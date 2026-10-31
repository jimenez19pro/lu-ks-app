// Formulario de anotar nativo (botón +).
// Hoja de iPhone con teclado numérico, tipo (gasto/ingreso/transferencia),
// categoría y subcategoría, cuenta, fecha y descripción. Al guardar, los
// datos se le pasan a la web (window.__lkSave), que guarda como siempre.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CHEV, Circulo, Ico, Tile, Toque, alfa, tema } from './inicio';

const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const CATS_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l4.2 7H7.8z"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><circle cx="17" cy="17" r="3.6"/></svg>';
const IA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.8 9 19.5 11 13.8 13 12 18.5 10.2 13 4.5 11 10.2 9z"/><path d="M19 3v3M17.5 4.5h3"/></svg>';
const FOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.2"/></svg>';

export function miles(d) {
  const s = String(d || '').replace(/\D/g, '').replace(/^0+/, '');
  return s ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}
function ymd(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function fecha(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

const T = {
  nuevo: ['Nuevo movimiento', 'New transaction'],
  editar: ['Editar movimiento', 'Edit transaction'],
  guardarC: ['Guardar cambios', 'Save changes'],
  eliminar: ['Eliminar movimiento', 'Delete transaction'],
  eliminarQ: ['¿Eliminar este movimiento?', 'Delete this transaction?'],
  eliminarB: ['Eliminar', 'Delete'],
  cancelar: ['Cancelar', 'Cancel'],
  listo: ['Listo', 'Done'],
  cat: ['Categoría', 'Category'],
  auto: ['Automática según la descripción', 'Automatic from the description'],
  cuenta: ['Cuenta', 'Account'],
  origen: ['Cuenta origen', 'From account'],
  destino: ['Cuenta destino', 'To account'],
  fecha: ['Fecha', 'Date'],
  hoy: ['Hoy', 'Today'],
  ayer: ['Ayer', 'Yesterday'],
  otra: ['Otra', 'Other'],
  desc: ['Descripción (opcional)', 'Description (optional)'],
  crearOut: ['Crear gasto', 'Create expense'],
  crearIn: ['Crear ingreso', 'Create income'],
  crearTr: ['Crear transferencia', 'Create transfer'],
  monto: ['Escribe un monto mayor a 0', 'Enter an amount greater than 0'],
  cuentas: ['Elige cuentas de origen y destino distintas', 'Choose different from and to accounts'],
  elige: ['Elige categoría', 'Choose category'],
  eligeCuenta: ['Selecciona cuenta', 'Select account'],
  admin: ['Administrar categorías', 'Manage categories'],
  agregar: ['＋ Agregar cuenta', '＋ Add account'],
  ingreso: ['Ingreso', 'Income'],
  entre: ['Entre cuentas', 'Between accounts'],
};

export default function Formulario({ visible, datos, editar: datosIni, onClose, onSave, onWeb, onDelete }) {
  const editar = datosIni && !datosIni.nuevo ? datosIni : null;
  const lleno = datosIni || null;
  const ins = useSafeAreaInsets();
  const D = datos || {};
  const en = D.lang === 'en';
  const t = (k) => (en ? T[k][1] : T[k][0]);
  const C = tema(D.th);
  const [tp, setTp] = useState('out');
  const [monto, setMonto] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [sub, setSub] = useState('');
  const [acc, setAcc] = useState('');
  const [dst, setDst] = useState('');
  const [dia, setDia] = useState('');
  const [pag, setPag] = useState('main'); // main | cat | acc | dst | date
  const [error, setError] = useState('');
  const montoRef = useRef(null);
  const iniciado = useRef(false);

  // Al abrir: empezar de cero (como el formulario de la web).
  useEffect(() => {
    if (!visible) {
      iniciado.current = false;
      return;
    }
    setTp('out');
    setMonto('');
    setDesc('');
    setCat('');
    setSub('');
    setDst('');
    setPag('main');
    setError('');
    setDia(D.hoy || ymd(new Date()));
    iniciado.current = false;
    if (lleno) {
      // Editar (o repetir): llenar con los datos del movimiento
      iniciado.current = true;
      setTp(lleno.tp === 'in' || lleno.tp === 'tr' ? lleno.tp : 'out');
      setMonto(String(lleno.a || ''));
      setDesc(lleno.mer || '');
      setCat(lleno.cat || '');
      setSub(lleno.sub || '');
      setAcc(lleno.acc || '');
      setDst(lleno.dst || '');
      setDia(lleno.date || D.hoy || ymd(new Date()));
    }
  }, [visible, lleno]);
  // Cuenta principal por defecto cuando llegan los datos.
  useEffect(() => {
    if (visible && D.accs && !iniciado.current) {
      iniciado.current = true;
      setAcc(D.def || '');
      if (D.hoy) setDia(D.hoy);
    }
  }, [visible, D.accs, D.def, D.hoy]);

  const catSel = useMemo(() => (D.cats || []).find((c) => c.k === cat), [D.cats, cat]);
  const accOf = (n) => (D.accs || []).find((a) => a.n === n) || { n, lb: n || (en ? 'No account' : 'Sin cuenta'), s: 'COP', tile: null };
  const A = accOf(acc);
  const B = accOf(dst);
  const tpInfo = (k) => (D.tp && D.tp[k]) || { t: k };

  const guardar = () => {
    const a = parseInt(String(monto).replace(/\D/g, ''), 10);
    if (!a) {
      setError(t('monto'));
      montoRef.current && montoRef.current.focus();
      return;
    }
    if (tp === 'tr' && (!acc || !dst || acc === dst)) {
      setError(t('cuentas'));
      return;
    }
    onSave({ tp, a, mer: desc.trim(), cat: tp === 'out' ? cat : '', sub: tp === 'out' ? sub : '', acc, dst: tp === 'tr' ? dst : '', date: dia || D.hoy, edit: editar ? editar.id : null });
  };

  const fechaTxt = (() => {
    if (!dia) return '';
    if (dia === D.hoy) return t('hoy');
    if (dia === D.ayer) return t('ayer');
    return dia.slice(8, 10) + '/' + dia.slice(5, 7) + '/' + dia.slice(0, 4);
  })();

  const Fila = ({ ico, tile, titulo, sub: s, onPress, last, opaco }) => (
    <Toque onPress={onPress}>
      <View style={[st.fila, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }, opaco && { opacity: 0.55 }]}>
        {tile ? <Tile tile={tile} z={36} C={C} /> : <Circulo ico={ico} z={36} C={C} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
            {titulo}
          </Text>
          {s ? (
            <Text style={{ color: C.mut, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {s}
            </Text>
          ) : null}
        </View>
        {onPress ? <Ico xml={CHEV} size={16} color={C.mut} /> : null}
      </View>
    </Toque>
  );

  const Encabezado = ({ titulo, izq, onIzq, der, onDer }) => (
    <View style={[st.row, st.top]}>
      <Toque onPress={onIzq} hitSlop={10} style={{ minWidth: 80 }}>
        <Text style={{ color: C.ac, fontSize: 17 }}>{izq}</Text>
      </Toque>
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

  // ---------- Elegir categoría ----------
  const pagCat = (
    <View style={{ flex: 1 }}>
      <Encabezado titulo={t('elige')} izq={'‹ ' + t('cancelar')} onIzq={() => setPag('main')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: ins.bottom + 24 }}>
        <View style={[st.card, { backgroundColor: C.sf }]}>
          {(D.cats || []).map((c, i) => {
            const on = cat === c.k && !sub;
            return (
              <View key={c.k} style={i < D.cats.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }}>
                <Toque
                  onPress={() => {
                    setCat(c.k);
                    setSub('');
                    setPag('main');
                  }}
                >
                  <View style={[st.fila, { borderBottomWidth: 0 }]}>
                    <Circulo ico={c.ico} z={36} C={C} />
                    <Text style={{ flex: 1, color: C.ink, fontSize: 16, fontWeight: '600' }}>{c.n}</Text>
                    {on ? <Ico xml={CHECK} size={18} color={C.ac} /> : null}
                  </View>
                </Toque>
                {c.subs && c.subs.length ? (
                  <View style={[st.row, { flexWrap: 'wrap', gap: 6, marginLeft: 48, marginBottom: 12, marginTop: -4 }]}>
                    {c.subs.map((x) => {
                      const son = cat === c.k && sub === x.v;
                      return (
                        <Toque
                          key={x.v}
                          onPress={() => {
                            setCat(c.k);
                            setSub(x.v);
                            setPag('main');
                          }}
                          style={[st.chip, { backgroundColor: son ? C.ac : C.sf2 }]}
                        >
                          <Text style={{ color: son ? '#FFFFFF' : C.ink, fontSize: 13, fontWeight: '500' }}>{x.t}</Text>
                        </Toque>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <Toque onPress={() => onWeb('cats')} style={[st.btn, { backgroundColor: C.sf2, marginTop: 14 }]}>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }}>⚙️ {t('admin')}</Text>
        </Toque>
      </ScrollView>
    </View>
  );

  // ---------- Elegir cuenta ----------
  const pagAcc = (cual) => {
    const cur = cual === 'dst' ? dst : acc;
    return (
      <View style={{ flex: 1 }}>
        <Encabezado titulo={cual === 'dst' ? t('destino') : t('eligeCuenta')} izq={'‹ ' + t('cancelar')} onIzq={() => setPag('main')} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: ins.bottom + 24 }}>
          <View style={[st.card, { backgroundColor: C.sf }]}>
            {(D.accs || []).map((a, i) => (
              <Toque
                key={a.n || '-'}
                onPress={() => {
                  if (cual === 'dst') setDst(a.n);
                  else setAcc(a.n);
                  setError('');
                  setPag('main');
                }}
              >
                <View style={[st.fila, i < D.accs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                  <Tile tile={a.tile} z={40} C={C} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
                      {a.lb}
                    </Text>
                    <Text style={{ color: C.mut, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                      {a.s}
                    </Text>
                  </View>
                  {cur === a.n ? <Ico xml={CHECK} size={18} color={C.ac} /> : null}
                </View>
              </Toque>
            ))}
          </View>
          <Toque onPress={() => onWeb('acc')} style={[st.btn, { backgroundColor: C.sf2, marginTop: 14 }]}>
            <Text style={{ color: C.ac, fontSize: 16, fontWeight: '600' }}>{t('agregar')}</Text>
          </Toque>
        </ScrollView>
      </View>
    );
  };

  // ---------- Elegir fecha ----------
  const pagFecha = (
    <View style={{ flex: 1 }}>
      <Encabezado titulo={t('fecha')} izq={'‹ ' + t('cancelar')} onIzq={() => setPag('main')} der={t('listo')} onDer={() => setPag('main')} />
      <View style={{ padding: 16 }}>
        <View style={[st.card, { backgroundColor: C.sf, paddingVertical: 8 }]}>
          <DateTimePicker
            value={fecha(dia || D.hoy || ymd(new Date()))}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={fecha(D.hoy || ymd(new Date()))}
            themeVariant={C.dark ? 'dark' : 'light'}
            accentColor={C.ac}
            locale={en ? 'en-US' : 'es-CO'}
            onChange={(e, d) => {
              if (Platform.OS !== 'ios') setPag('main');
              if (d && (!e || e.type !== 'dismissed')) setDia(ymd(d));
            }}
          />
        </View>
      </View>
    </View>
  );

  // ---------- Pantalla principal ----------
  const crear = editar ? t('guardarC') : tp === 'in' ? t('crearIn') : tp === 'tr' ? t('crearTr') : t('crearOut');
  const eliminar = () =>
    Alert.alert(t('eliminarQ'), '', [
      { text: t('cancelar'), style: 'cancel' },
      { text: t('eliminarB'), style: 'destructive', onPress: () => onDelete && onDelete(editar.id) },
    ]);
  const pagMain = (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.row, st.top]}>
        <Toque onPress={onClose} hitSlop={10} style={{ minWidth: 80 }}>
          <Text style={{ color: C.ac, fontSize: 17 }}>{t('cancelar')}</Text>
        </Toque>
        <Text style={{ flex: 1, textAlign: 'center', color: C.ink, fontSize: 17, fontWeight: '600' }} numberOfLines={1}>
          {editar ? t('editar') : t('nuevo')}
        </Text>
        <View style={[st.row, { gap: 6, minWidth: 80, justifyContent: 'flex-end' }]}>
          {editar ? null : D.foto ? (
            <Toque onPress={() => onWeb('scan')} style={[st.row, st.fai, { backgroundColor: alfa(C.ac, 0.14) }]} label="Escanear recibo">
              <Ico xml={FOTO} size={15} color={C.ac} />
              <Text style={{ color: C.ac, fontSize: 13, fontWeight: '600' }}>{en ? 'Photo' : 'Foto'}</Text>
            </Toque>
          ) : null}
          {editar ? null : (
            <Toque onPress={() => onWeb('ai')} style={[st.row, st.fai, { backgroundColor: alfa(C.ac, 0.14) }]} label="Anotar con IA">
              <Ico xml={IA} size={15} color={C.ac} />
              <Text style={{ color: C.ac, fontSize: 13, fontWeight: '600' }}>IA</Text>
            </Toque>
          )}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {/* Tipo */}
        <View style={[st.seg, { backgroundColor: C.sf2 }]}>
          {['out', 'in', 'tr'].map((k) => {
            const on = tp === k;
            const I = tpInfo(k);
            return (
              <Toque
                key={k}
                onPress={() => {
                  setTp(k);
                  setError('');
                }}
                style={[st.segB, on && { backgroundColor: C.dark ? '#636366' : C.sf, ...st.sombra }]}
              >
                <Text style={{ color: on ? C.ink : C.mut, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {I.t}
                </Text>
              </Toque>
            );
          })}
        </View>

        {/* Monto */}
        <Toque onPress={() => montoRef.current && montoRef.current.focus()}>
          <View style={{ marginTop: 22, marginBottom: 6 }}>
            <TextInput
              ref={montoRef}
              value={monto ? '$ ' + miles(monto) : ''}
              onChangeText={(v) => {
                setMonto(v.replace(/\D/g, '').slice(0, 13));
                setError('');
              }}
              placeholder="$ 0"
              placeholderTextColor={C.mut}
              keyboardType="number-pad"
              autoFocus={!lleno}
              maxLength={21}
              textAlign="center"
              adjustsFontSizeToFit
              style={{ color: tp === 'in' ? C.pos : C.ink, fontSize: 52, fontWeight: '700', letterSpacing: -1, paddingVertical: 0, textAlign: 'center', fontVariant: ['tabular-nums'] }}
              accessibilityLabel="Monto"
            />
          </View>
        </Toque>
        <Text style={{ color: C.mut, fontSize: 13, textAlign: 'center' }}>COP</Text>

        {/* Opciones */}
        <View style={[st.card, { backgroundColor: C.sf, marginTop: 18 }]}>
          {tp === 'out' ? (
            <Fila
              ico={catSel ? catSel.ico : { svg: CATS_ICO, c: C.mut }}
              titulo={catSel ? sub ? (catSel.subs.find((x) => x.v === sub) || { t: sub }).t : catSel.n : t('cat')}
              sub={catSel ? (sub ? catSel.n : '') : t('auto')}
              onPress={() => setPag('cat')}
            />
          ) : null}
          <Fila tile={A.tile} titulo={(tp === 'tr' ? t('origen') + ': ' : '') + A.lb} sub={A.s} onPress={() => setPag('acc')} />
          {tp === 'tr' ? <Fila tile={B.tile} titulo={t('destino') + ': ' + B.lb} sub={B.s} onPress={() => setPag('dst')} /> : null}
          <View style={[st.fila, { borderBottomWidth: 0 }]}>
            <Circulo ico={{ svg: CAL, c: C.ac }} z={36} C={C} />
            <Text style={{ flex: 1, color: C.ink, fontSize: 16, fontWeight: '600' }}>{t('fecha')}</Text>
            {[D.hoy, D.ayer].map((d, i) => (
              <Toque key={i} onPress={() => setDia(d)} style={[st.chip, { backgroundColor: dia === d ? C.ac : C.sf2 }]}>
                <Text style={{ color: dia === d ? '#FFFFFF' : C.ink, fontSize: 13, fontWeight: '600' }}>{i ? t('ayer') : t('hoy')}</Text>
              </Toque>
            ))}
            <Toque onPress={() => setPag('date')} style={[st.chip, { backgroundColor: dia && dia !== D.hoy && dia !== D.ayer ? C.ac : C.sf2 }]}>
              <Text style={{ color: dia && dia !== D.hoy && dia !== D.ayer ? '#FFFFFF' : C.ink, fontSize: 13, fontWeight: '600' }}>
                {dia && dia !== D.hoy && dia !== D.ayer ? fechaTxt : t('otra')}
              </Text>
            </Toque>
          </View>
        </View>

        {/* Descripción */}
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder={t('desc')}
          placeholderTextColor={C.mut}
          returnKeyType="done"
          onSubmitEditing={guardar}
          style={[st.desc, { backgroundColor: C.sf, color: C.ink }]}
        />
        {error ? <Text style={{ color: C.neg, fontSize: 14, textAlign: 'center', marginTop: 12 }}>{error}</Text> : null}
        {editar ? (
          <Toque onPress={eliminar} style={[st.btn, { backgroundColor: alfa(C.neg, 0.12), marginTop: 18 }]} label={t('eliminar')}>
            <Text style={{ color: C.neg, fontSize: 16, fontWeight: '600' }}>{t('eliminar')}</Text>
          </Toque>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(ins.bottom, 12), backgroundColor: C.bg }}>
        <Toque onPress={guardar} style={[st.btn, { backgroundColor: C.ac }]} label={crear}>
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>{crear}</Text>
        </Toque>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => (pag === 'main' ? onClose() : setPag('main'))}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {pag === 'cat' ? pagCat : pag === 'acc' ? pagAcc('acc') : pag === 'dst' ? pagAcc('dst') : pag === 'date' ? pagFecha : pagMain}
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  top: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  fai: { gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 14 },
  segB: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 11 },
  sombra: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  card: { borderRadius: 20, paddingHorizontal: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999 },
  desc: { marginTop: 14, padding: 16, fontSize: 17, borderRadius: 18 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18 },
});
