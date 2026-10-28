# Lu-Ks — app nativa (Expo)

App de iPhone y Android para Lu-Ks. **Etapa 1:** la app abre la versión web
(https://jimenez19pro.github.io/lu-ks/) y le agrega lo que la web no hace bien
dentro de una app.

## Qué hace la app (etapa 1)
- Abre Lu-Ks a pantalla completa, con su ícono y su pantalla de inicio (clara u oscura según el iPhone).
- WhatsApp, correo y páginas externas se abren afuera, en su app.
- Respaldos y fotos de garantías se guardan con el menú Compartir.
- "Continuar con Google" muestra un aviso (Google no deja iniciar sesión dentro de apps así; se entra con correo y contraseña).
- Pantalla "Sin conexión" con botón Reintentar.
- Android: el botón Atrás cierra la ventana abierta y luego sale.
- El teclado se abre solo cuando la página enfoca un campo (botón +).

## Archivos
| Archivo | Qué es |
|---|---|
| `App.js` | Toda la app |
| `index.js` | Arranque |
| `app.json` | Nombre, ícono, permisos, identificador `com.jimenez19pro.luks` |
| `eas.json` | Configuración de Expo (EAS) para armar la app |
| `package.json`, `package-lock.json` | Librerías (Expo SDK 58) |
| `icon.png`, `icono-fondo.png` | Ícono de Lu-Ks |

## Siguientes etapas
- Etapa 2: pasar pantallas a nativo (empezando por las más usadas), inicio de sesión con Google nativo, notificaciones.
- Etapa 3: publicar en App Store (US$99/año) y Google Play (US$25 una vez).
