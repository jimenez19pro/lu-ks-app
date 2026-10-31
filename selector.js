// Selector de fotos y archivos del iPhone para la web (recibos, garantías,
// importar respaldo). La web pide (puente.js → "pick") y aquí se elige.
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

const tr = (lang, es, en) => (lang === 'en' ? en : es);

async function fotos(desdeCamara, multi) {
  if (desdeCamara) {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return null;
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
    return r.canceled ? null : r.assets;
  }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true, allowsMultipleSelection: !!multi, selectionLimit: multi ? 4 : 1 });
  return r.canceled ? null : r.assets;
}

// Devuelve [{ name, type, b64 }] o null si se cancela.
export async function elegir({ accept, multi, cam }, lang) {
  const esImagen = /image/.test(accept || '');
  if (esImagen) {
    const desde = await new Promise((ok) => {
      if (cam) return ok('cam');
      Alert.alert(tr(lang, 'Agregar foto', 'Add photo'), '', [
        { text: tr(lang, 'Tomar foto', 'Take photo'), onPress: () => ok('cam') },
        { text: tr(lang, 'Elegir de Fotos', 'Choose from Photos'), onPress: () => ok('lib') },
        { text: tr(lang, 'Cancelar', 'Cancel'), style: 'cancel', onPress: () => ok(null) },
      ]);
    });
    if (!desde) return null;
    const a = await fotos(desde === 'cam', multi);
    if (!a || !a.length) return null;
    return a
      .filter((x) => x.base64)
      .map((x, i) => ({ name: x.fileName || `foto-${i + 1}.jpg`, type: x.mimeType && x.mimeType !== 'image/heic' ? x.mimeType : 'image/jpeg', b64: x.base64 }));
  }
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: !!multi });
  if (r.canceled || !r.assets || !r.assets.length) return null;
  const out = [];
  for (const a of r.assets) {
    const b64 = await new File(a.uri).base64();
    out.push({ name: a.name || 'archivo', type: a.mimeType || '', b64 });
  }
  return out;
}
