// Agregar o editar una cuenta (nativo), con la tarjeta de arriba llenándose en vivo.
// Guarda con la misma lógica de la web (saveAcc2) a través del puente: __lkSaveAcc.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CHEV, Ico, Tile, Toque, alfa, mezcla, tema } from './inicio';
import { Plastico, claro } from './cuentas';
import * as ImagePicker from 'expo-image-picker';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const TX = {
  nueva: ['Nueva cuenta', 'New account'],
  editar: ['Editar cuenta', 'Edit account'],
  cancelar: ['Cancelar', 'Cancel'],
  tipo: ['Tipo', 'Type'],
  debito: ['Débito', 'Debit'],
  credito: ['Crédito', 'Credit'],
  efectivo: ['Efectivo', 'Cash'],
  banco: ['Banco', 'Bank'],
  elige: ['Elige tu banco', 'Choose your bank'],
  buscar: ['Buscar banco…', 'Search bank…'],
  apodo: ['Apodo (opcional)', 'Nickname (optional)'],
  nombre: ['Nombre', 'Name'],
  apodoPh: ['Ej: Visa Oro, Nómina', 'E.g. Gold Visa, Payroll'],
  nombrePh: ['Ej. Billetera', 'E.g. Wallet'],
  red: ['Red', 'Network'],
  color: ['Color de la tarjeta', 'Card color'],
  cupo: ['Cupo total', 'Credit limit'],
  corte: ['Día de corte', 'Statement day'],
  pago: ['Día de pago', 'Due day'],
  recordar: ['Recordatorio de pago', 'Payment reminder'],
  deuda: ['Deuda actual (hoy)', 'Current debt (today)'],
  saldo: ['Saldo actual (hoy)', 'Current balance (today)'],
  ayudaS: ['Escribe cuánto tienes hoy y la app ajusta el resto con tus movimientos.', 'Enter what you have today and the app adjusts the rest with your transactions.'],
  ayudaD: ['Escribe cuánto debes hoy según tu banco.', 'Enter what you owe today according to your bank.'],
  hoy: ['Hoy la app calcula', 'Today the app calculates'],
  pri: ['Cuenta principal', 'Main account'],
  avanz: ['Opciones avanzadas', 'Advanced options'],
  enMovs: ['Nombre en tus movimientos', 'Name in your transactions'],
  enMovsS: ['Debe ser igual al nombre de la tarjeta en tus movimientos. Si lo dejas vacío, usa el apodo o el banco.', 'Must match the card name in your transactions. If empty, the nickname or bank is used.'],
  guardar: ['Agregar cuenta', 'Add account'],
  guardarC: ['Guardar cambios', 'Save changes'],
  eliminar: ['Eliminar cuenta', 'Delete account'],
  eliminarQ: ['¿Eliminar esta cuenta?', 'Delete this account?'],
  eliminarS: ['Tus movimientos no se borran.', 'Your transactions are not deleted.'],
  si: ['Eliminar', 'Delete'],
  agregando: ['Agregando tu cuenta', 'Adding your account'],
  guardando: ['Guardando cambios', 'Saving changes'],
  momento: ['Solo toma un momento', 'This only takes a moment'],
  p1: ['Revisar', 'Check'],
  p2: ['Guardar', 'Save'],
  p3: ['Lista', 'Ready'],
  e1: ['Revisando los datos', 'Checking details'],
  e2: ['Guardando en tu cuenta', 'Saving to your account'],
  e3: ['Todo listo', 'All set'],
  lista: ['¡Cuenta agregada!', 'Account added!'],
  listaC: ['¡Cambios guardados!', 'Changes saved!'],
  listaS: ['ya aparece en tus cuentas', 'now shows in your accounts'],
  ver: ['Ver cuenta', 'View account'],
  listo: ['Listo', 'Done'],
  errBanco: ['Elige tu banco', 'Choose your bank'],
  errNombre: ['Escribe un nombre', 'Enter a name'],
  errCupo: ['Escribe el cupo total', 'Enter the credit limit'],
  corteYpago: ['Corte', 'Statement'],
};
function tilePropio(n) {
  const s = String(n || '?');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  const w = s.split(' ').filter((x) => ['de', 'del', 'la', 'banco'].indexOf(x.toLowerCase()) < 0);
  const p = w.length ? w : [s];
  return { t: (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(), bg: `hsl(${h}, 45%, 42%)`, c: '#FFFFFF' };
}
const solo = (s) => String(s == null ? '' : s).replace(/\D/g, '');
const miles = (s) => {
  const d = solo(s);
  return d ? '$ ' + d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
};

export default function NuevaCuenta({ D, ses, portadaGuardada, visible, resultado, onClose, onSave, onVer }) {
  const ins = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const en = D && D.lang === 'en';
  const t = (k) => (en ? TX[k][1] : TX[k][0]);
  const C = tema(D && D.th);
  const edit = D && D.i >= 0;
  const [f, setF] = useState(null);
  const [pag, setPag] = useState('main'); // main | bank
  const [q, setQ] = useState('');
  const [avanz, setAvanz] = useState(false);
  const [error, setError] = useState('');
  const [fase, setFase] = useState('form'); // form | anim | ok
  const [paso, setPaso] = useState(0);
  const [portada, setPortada] = useState('');
  const portadaCambio = useRef(false);
  const giro = useRef(new Animated.Value(0)).current;
  const prog = useRef(new Animated.Value(0)).current;
  const sube = useRef(new Animated.Value(0)).current;
  const esperando = useRef(false);
  const animLista = useRef(false);

  useEffect(() => {
    if (!visible) Keyboard.dismiss();
  }, [visible]);
  useEffect(() => {
    if (!visible || !D) return;
    setF({ ...D.f, act: '', cupo: D.f.cupo ? String(D.f.cupo) : '' });
    setPortada(D.portada || portadaGuardada || '');
    portadaCambio.current = false;
    setPag('main');
    setQ('');
    setAvanz(false);
    setError('');
    setFase('form');
    setPaso(0);
    giro.setValue(0);
    // Solo al abrir el formulario (no cada vez que la app se redibuja): si no, se borraba lo escrito
  }, [visible, ses]);

  // Llega la respuesta de la web
  useEffect(() => {
    if (!resultado || !esperando.current) return;
    esperando.current = false;
    clearTimeout(esperaT.current);
    if (!resultado.ok) {
      setFase('form');
      setError(resultado.msg || '');
      return;
    }
    const fin = () => {
      setPaso(3);
      Animated.timing(prog, { toValue: 1, duration: 350, useNativeDriver: false }).start(() => {
        setFase('ok');
        sube.setValue(0);
        Animated.spring(sube, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }).start();
      });
    };
    if (animLista.current) fin();
    else animLista.current = fin;
  }, [resultado]);

  // Si la portada llega después de abrir (Firebase tardó), ponerla sin tocar lo demás
  useEffect(() => {
    const p = (D && D.portada) || portadaGuardada;
    if (visible && p && !portadaCambio.current) setPortada(p);
  }, [visible, D && D.portada, portadaGuardada]);
  // Si la web no responde al guardar, no dejar la animación colgada
  const esperaT = useRef(null);
  useEffect(() => () => clearTimeout(esperaT.current), []);
  const bancos = useMemo(() => {
    const l = (D && D.banks) || [];
    const k = q.trim().toLowerCase();
    return k ? l.filter((b) => b.n.toLowerCase().indexOf(k) >= 0) : l;
  }, [D, q]);

  if (!D || !f) return <Modal visible={false} />;
  const cr = f.tipo === 'credito';
  const ef = f.tipo === 'efectivo';
  const set = (o) => {
    setError('');
    setF((v) => ({ ...v, ...o }));
  };
  const tileBanco = ef ? D.cash : ((D.banks || []).find((b) => b.n === f.banco) || {}).tile || (f.banco ? tilePropio(f.banco) : null);
  const color = cr ? f.color : ef ? '#C9A227' : (tileBanco && tileBanco.bg) || '#4A63E7';
  const nombreVis = (f.apodo || '').trim() || (f.banco || '').trim() || (ef ? t('efectivo') : en ? 'Your account' : 'Tu cuenta');
  const tipoN = t(f.tipo === 'credito' ? 'credito' : f.tipo === 'efectivo' ? 'efectivo' : 'debito');
  const montoVis = cr ? (f.cupo ? miles(f.cupo) : '$ 0') : f.act ? miles(f.act) : edit && D.hoy ? D.hoy : '$ 0';
  const PW = W - 40;
  const PH = Math.round(PW / 1.586);

  const voltear = (atras) => Animated.spring(giro, { toValue: atras ? 1 : 0, useNativeDriver: true, speed: 10, bounciness: 6 }).start();
  const frente = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const dorso = giro.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const elegirPortada = async () => {
    try {
      const pm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (pm && pm.granted === false) return;
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [8, 5], quality: 1 });
      if (!r || r.canceled || !r.assets || !r.assets[0]) return;
      const a = r.assets[0];
      const out = await manipulateAsync(a.uri, [{ resize: { width: 900 } }], { compress: 0.72, format: SaveFormat.JPEG, base64: true });
      if (out && out.base64) {
        portadaCambio.current = true;
        setPortada('data:image/jpeg;base64,' + out.base64);
      }
    } catch (e) {
      Alert.alert(en ? 'Could not open Photos' : 'No se pudo abrir Fotos', String((e && e.message) || e));
    }
  };
  const guardar = () => {
    Keyboard.dismiss();
    if (!ef && !f.banco) return setError(t('errBanco'));
    const nm = (f.name || '').trim() || (f.apodo || '').trim() || (f.banco || '').trim() || (ef ? 'Efectivo' : '');
    if (!nm) return setError(t('errNombre'));
    if (cr && !parseInt(solo(f.cupo), 10)) return setError(t('errCupo'));
    setError('');
    setFase('anim');
    setPaso(1);
    prog.setValue(0);
    animLista.current = false;
    esperando.current = true;
    clearTimeout(esperaT.current);
    esperaT.current = setTimeout(() => {
      if (!esperando.current) return;
      esperando.current = false;
      setFase('form');
      setError(en ? 'Lu-Ks did not confirm the save. Check your connection and try again.' : 'Lu-Ks no confirmó que se guardó. Revisa tu conexión e intenta otra vez.');
    }, 12000);
    Animated.timing(prog, { toValue: 0.45, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => {
      setPaso(2);
      Animated.timing(prog, { toValue: 0.85, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(() => {
        if (typeof animLista.current === 'function') animLista.current();
        else animLista.current = true;
      });
    });
    onSave({
      i: edit ? D.i : -1,
      tipo: f.tipo,
      banco: ef ? '' : f.banco,
      apodo: (f.apodo || '').trim(),
      name: (f.name || '').trim(),
      color: f.color,
      ini: f.ini,
      cupo: solo(f.cupo),
      red: f.red,
      corte: solo(f.corte),
      pago: solo(f.pago),
      rec: !!f.rec,
      pri: !!f.pri,
      act: solo(f.act),
      ...(portadaCambio.current ? { portada } : {}),
    });
  };
  const eliminar = () =>
    Alert.alert(t('eliminarQ'), t('eliminarS'), [
      { text: t('cancelar'), style: 'cancel' },
      {
        text: t('si'),
        style: 'destructive',
        onPress: () => {
          esperando.current = false;
          onSave({ i: D.i, del: true, tipo: f.tipo, banco: f.banco, apodo: f.apodo, name: f.name });
          onClose();
        },
      },
    ]);

  const campo = (lb, v, on, extra = {}) => (
    <View style={{ marginTop: 14 }}>
      <Text style={[st.lb, { color: C.mut }]}>{lb}</Text>
      <TextInput
        value={v}
        onChangeText={on}
        placeholderTextColor={alfa(C.mut, 0.7)}
        style={[st.in, { backgroundColor: C.sf, color: C.ink }]}
        {...extra}
      />
    </View>
  );

  const preview = (
    <View style={{ height: PH, marginTop: 6 }}>
      <Animated.View style={[st.cara, { transform: [{ perspective: 1000 }, { rotateY: frente }] }]}>
        <Plastico w={PW} h={PH} color={color} tile={tileBanco} titulo={nombreVis} sub={f.banco && !ef && f.apodo ? f.banco : ''} red={cr ? f.red : ''} tipoN={tipoN} abajo={montoVis} portada={portada} />
      </Animated.View>
      <Animated.View style={[st.cara, { transform: [{ perspective: 1000 }, { rotateY: dorso }] }]}>
        <LinearGradient colors={[mezcla(color, '#000', 0.75), mezcla(color, '#000', 0.45)]} style={{ width: PW, height: PH, borderRadius: Math.round(PH * 0.11), overflow: 'hidden' }}>
          <View style={{ height: PH * 0.2, backgroundColor: '#111', marginTop: PH * 0.14 }} />
          <View style={{ flexDirection: 'row', gap: 12, padding: 18 }}>
            {[
              [t('corte'), f.corte],
              [t('pago'), f.pago],
            ].map(([k, v]) => (
              <View key={k} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 }}>
                <Text style={{ color: '#555', fontSize: 11 }}>{k}</Text>
                <Text style={{ color: '#111', fontSize: 20, fontWeight: '700' }}>{solo(v) || '—'}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );

  const pasos = [t('p1'), t('p2'), t('p3')];
  const ancho = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {pag === 'bank' ? (
          <View style={{ flex: 1 }}>
            <View style={[st.hd, { borderBottomColor: C.ln }]}>
              <Toque
                onPress={() => {
                  Keyboard.dismiss();
                  setPag('main');
                }}
                hitSlop={10}
              >
                <Text style={{ color: C.ac, fontSize: 17 }}>‹ {t('banco')}</Text>
              </Toque>
            </View>
            <TextInput value={q} onChangeText={setQ} placeholder={t('buscar')} placeholderTextColor={C.mut} style={[st.in, { backgroundColor: C.sf, color: C.ink, margin: 16 }]} autoFocus />
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: ins.bottom + 20 }}>
              {q.trim() && !(D.banks || []).some((b) => b.n.toLowerCase() === q.trim().toLowerCase()) ? (
                <Toque
                  onPress={() => {
                    Keyboard.dismiss();
                    set({ banco: q.trim() });
                    setPag('main');
                  }}
                  label={q.trim()}
                >
                  <View style={[st.fila, { gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                    <Tile tile={tilePropio(q.trim())} z={40} C={C} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }}>{(en ? 'Use ' : 'Usar ') + '«' + q.trim() + '»'}</Text>
                      <Text style={{ color: C.mut, fontSize: 13 }}>{en ? 'Not in the list? Add it with this name' : '¿No está en la lista? Agrégalo con este nombre'}</Text>
                    </View>
                  </View>
                </Toque>
              ) : null}
              {bancos.map((b) => (
                <Toque
                  key={b.n}
                  onPress={() => {
                    Keyboard.dismiss();
                    set({ banco: b.n });
                    setPag('main');
                  }}
                  label={b.n}
                >
                  <View style={[st.fila, { gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.ln }]}>
                    <Tile tile={b.tile} z={40} C={C} />
                    <Text style={{ color: C.ink, fontSize: 16, flex: 1 }}>{b.n}</Text>
                    {f.banco === b.n ? <Text style={{ color: C.ac, fontSize: 18 }}>✓</Text> : null}
                  </View>
                </Toque>
              ))}
            </ScrollView>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[st.hd, { borderBottomColor: C.ln }]}>
              <Toque onPress={onClose} hitSlop={10}>
                <Text style={{ color: C.ac, fontSize: 17 }}>{t('cancelar')}</Text>
              </Toque>
              <Text style={{ color: C.ink, fontSize: 17, fontWeight: '700' }}>{edit ? t('editar') : t('nueva')}</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, paddingBottom: ins.bottom + 40 }}>
              {preview}

              {/* Tipo */}
              <View style={[st.seg, { backgroundColor: C.sf2, marginTop: 20 }]}>
                {[
                  ['debito', '🐷'],
                  ['credito', '💳'],
                  ['efectivo', '💵'],
                ].map(([k, e]) => (
                  <Toque key={k} onPress={() => set({ tipo: k, ...(k === 'efectivo' ? { banco: '' } : null) })} style={[st.segB, f.tipo === k && { backgroundColor: C.dark ? '#636366' : C.sf }]}>
                    <Text style={{ color: f.tipo === k ? C.ink : C.mut, fontSize: 14, fontWeight: '600' }}>
                      {e} {t(k)}
                    </Text>
                  </Toque>
                ))}
              </View>

              {/* Portada */}
              <View style={[st.fila, st.sw, { backgroundColor: C.sf, gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink, fontSize: 16 }}>{(D.T2 && D.T2.portada) || (en ? 'Card cover' : 'Portada de la tarjeta')}</Text>
                  <Text style={{ color: C.mut, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{(D.T2 && D.T2.ayudaP) || ''}</Text>
                </View>
                {portada ? (
                  <Toque
                    onPress={() => {
                      portadaCambio.current = true;
                      setPortada('');
                    }}
                    hitSlop={8}
                  >
                    <Text style={{ color: C.neg, fontSize: 15, fontWeight: '600' }}>{(D.T2 && D.T2.quitar) || (en ? 'Remove' : 'Quitar')}</Text>
                  </Toque>
                ) : null}
                <Toque onPress={elegirPortada} style={[st.chip, { backgroundColor: C.ac }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{(D.T2 && D.T2.elegir) || (en ? 'Choose photo' : 'Elegir foto')}</Text>
                </Toque>
              </View>

              {/* Banco */}
              {!ef ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={[st.lb, { color: C.mut }]}>{t('banco')}</Text>
                  <Toque onPress={() => setPag('bank')} label={t('elige')}>
                    <View style={[st.fila, st.in, { backgroundColor: C.sf, gap: 10 }]}>
                      {tileBanco ? <Tile tile={tileBanco} z={30} C={C} /> : <Text style={{ fontSize: 20 }}>🏦</Text>}
                      <Text style={{ color: f.banco ? C.ink : C.mut, fontSize: 16, flex: 1 }}>{f.banco || t('elige')}</Text>
                      <View style={{ transform: [{ rotate: '90deg' }] }}>
                        <Ico xml={CHEV} size={14} color={C.mut} />
                      </View>
                    </View>
                  </Toque>
                </View>
              ) : null}

              {campo(ef ? t('nombre') : t('apodo'), f.apodo, (v) => set({ apodo: v }), { placeholder: ef ? t('nombrePh') : t('apodoPh'), onFocus: () => voltear(false) })}

              {cr ? (
                <>
                  <Text style={[st.lb, { color: C.mut, marginTop: 14 }]}>{t('red')}</Text>
                  <View style={[st.fila, { flexWrap: 'wrap', gap: 8 }]}>
                    {(D.redes || []).map((r) => (
                      <Toque key={r} onPress={() => set({ red: f.red === r ? '' : r })} style={[st.chip, { backgroundColor: f.red === r ? C.ac : C.sf }]}>
                        <Text style={{ color: f.red === r ? '#FFFFFF' : C.ink, fontSize: 14, fontWeight: '600' }}>{r}</Text>
                      </Toque>
                    ))}
                  </View>
                  <Text style={[st.lb, { color: C.mut, marginTop: 14 }]}>{t('color')}</Text>
                  <View style={[st.fila, { flexWrap: 'wrap', gap: 10 }]}>
                    {(D.clr || []).map((c) => (
                      <Toque key={c} onPress={() => set({ color: c })} label={c}>
                        <View style={[st.dot, { backgroundColor: c, borderColor: f.color === c ? C.ink : 'transparent' }]}>
                          {f.color === c ? <Text style={{ color: claro(c) ? '#000' : '#FFF', fontSize: 14, fontWeight: '800' }}>✓</Text> : null}
                        </View>
                      </Toque>
                    ))}
                  </View>
                  {campo(t('cupo'), miles(f.cupo), (v) => set({ cupo: solo(v) }), { keyboardType: 'number-pad', placeholder: '$ 0', onFocus: () => voltear(false) })}
                  <View style={[st.fila, { gap: 10 }]}>
                    <View style={{ flex: 1 }}>{campo(t('corte'), solo(f.corte), (v) => set({ corte: solo(v).slice(0, 2) }), { keyboardType: 'number-pad', placeholder: '1-31', onFocus: () => voltear(true), onBlur: () => voltear(false) })}</View>
                    <View style={{ flex: 1 }}>{campo(t('pago'), solo(f.pago), (v) => set({ pago: solo(v).slice(0, 2) }), { keyboardType: 'number-pad', placeholder: '1-31', onFocus: () => voltear(true), onBlur: () => voltear(false) })}</View>
                  </View>
                  <View style={[st.fila, st.sw, { backgroundColor: C.sf }]}>
                    <Text style={{ color: C.ink, fontSize: 16, flex: 1 }}>{t('recordar')}</Text>
                    <Switch value={!!f.rec} onValueChange={(v) => set({ rec: v })} trackColor={{ true: C.ac }} />
                  </View>
                </>
              ) : null}

              {campo(cr ? t('deuda') : t('saldo'), miles(f.act), (v) => set({ act: solo(v) }), { keyboardType: 'number-pad', placeholder: edit && D.hoy ? D.hoy : '$ 0', onFocus: () => voltear(false) })}
              <Text style={{ color: C.mut, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
                {edit && D.hoy ? `${t('hoy')} ${D.hoy}. ` : ''}
                {cr ? t('ayudaD') : t('ayudaS')}
              </Text>

              <View style={[st.fila, st.sw, { backgroundColor: C.sf }]}>
                <Text style={{ color: C.ink, fontSize: 16, flex: 1 }}>{t('pri')}</Text>
                <Switch value={!!f.pri} onValueChange={(v) => set({ pri: v })} trackColor={{ true: C.ac }} />
              </View>

              <Toque onPress={() => setAvanz((v) => !v)} style={{ marginTop: 16 }}>
                <Text style={{ color: C.ac, fontSize: 15, fontWeight: '600' }}>
                  {avanz ? '⌄ ' : '› '}
                  {t('avanz')}
                </Text>
              </Toque>
              {avanz ? (
                <>
                  {campo(t('enMovs'), f.name, (v) => set({ name: v }), { placeholder: nombreVis, autoCapitalize: 'words' })}
                  <Text style={{ color: C.mut, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{t('enMovsS')}</Text>
                </>
              ) : null}

              {error ? <Text style={{ color: C.neg, fontSize: 15, marginTop: 16, textAlign: 'center' }}>{error}</Text> : null}

              <Toque onPress={guardar} style={[st.btn, { backgroundColor: C.ink, marginTop: 22 }]}>
                <Text style={{ color: C.bg, fontSize: 17, fontWeight: '700' }}>{edit ? t('guardarC') : t('guardar')}</Text>
              </Toque>
              {edit ? (
                <Toque onPress={eliminar} style={[st.btn, { backgroundColor: C.sf, marginTop: 10 }]}>
                  <Text style={{ color: C.neg, fontSize: 16, fontWeight: '600' }}>{t('eliminar')}</Text>
                </Toque>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Animación al guardar */}
        {fase !== 'form' ? (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient colors={[mezcla(color, '#0A0E1F', 0.45), '#0A0E1F', '#05060C']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1, paddingTop: 48, paddingHorizontal: 20, paddingBottom: ins.bottom + 24 }}>
              {fase === 'anim' ? (
                <>
                  <Text style={st.bigT}>{edit ? t('guardando') : t('agregando')}</Text>
                  <Text style={st.bigS}>{t('momento')}</Text>
                </>
              ) : null}
              <View style={{ alignItems: 'center', marginTop: fase === 'ok' ? 40 : 28 }}>
                <Plastico w={PW - 30} h={Math.round((PW - 30) / 1.586)} color={color} tile={tileBanco} titulo={nombreVis} red={cr ? f.red : ''} tipoN={tipoN} abajo={montoVis} portada={portada} />
              </View>
              {fase === 'anim' ? (
                <View style={[st.pasos, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
                  <View style={[st.fila, { justifyContent: 'space-between' }]}>
                    {pasos.map((p, i) => {
                      const hecho = paso > i + 1 || (paso === 3 && i === 2);
                      const act = paso === i + 1;
                      return (
                        <View key={p} style={{ alignItems: 'center', flex: 1 }}>
                          <View style={[st.bola, { backgroundColor: hecho ? '#34C759' : act ? '#5E5CE6' : 'rgba(255,255,255,0.12)' }]}>
                            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{hecho ? '✓' : i + 1}</Text>
                          </View>
                          <Text style={{ color: act || hecho ? '#FFF' : 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6 }}>{p}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 18, overflow: 'hidden' }}>
                    <Animated.View style={{ height: 6, borderRadius: 3, width: ancho, backgroundColor: '#FFFFFF' }} />
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 10 }}>{t(paso >= 3 ? 'e3' : paso === 2 ? 'e2' : 'e1')}</Text>
                </View>
              ) : (
                <Animated.View style={{ alignItems: 'center', marginTop: 34, opacity: sube, transform: [{ translateY: sube.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
                  <View style={st.check}>
                    <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '800' }}>✓</Text>
                  </View>
                  <Text style={[st.bigT, { textAlign: 'center', marginTop: 16 }]}>{edit ? t('listaC') : t('lista')}</Text>
                  <Text style={[st.bigS, { textAlign: 'center' }]}>
                    {nombreVis} {t('listaS')}
                  </Text>
                </Animated.View>
              )}
              <View style={{ flex: 1 }} />
              {fase === 'ok' ? (
                <Animated.View style={{ opacity: sube }}>
                  <Toque onPress={() => onVer && onVer(resultado && resultado.i)} style={[st.btn, { backgroundColor: '#FFFFFF' }]}>
                    <Text style={{ color: '#0A0E1F', fontSize: 17, fontWeight: '700' }}>{t('ver')}</Text>
                  </Toque>
                  <Toque onPress={onClose} style={[st.btn, { backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10 }]}>
                    <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>{t('listo')}</Text>
                  </Toque>
                </Animated.View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center' },
  hd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cara: { position: 'absolute', left: 0, top: 0, backfaceVisibility: 'hidden' },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 14 },
  segB: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  lb: { fontSize: 13, marginBottom: 6, marginLeft: 4 },
  in: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, minHeight: 50 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  dot: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  sw: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18 },
  bigT: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  bigS: { color: 'rgba(255,255,255,0.65)', fontSize: 15, marginTop: 4 },
  pasos: { marginTop: 30, borderRadius: 20, padding: 18 },
  bola: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' },
});
