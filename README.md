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

## Etapa 2 (28 oct 2026)
- **Inicio nativo** (`inicio.js`): la pantalla de Inicio (vista Finanzas) se dibuja con componentes del celular. Los datos los manda la web (`puente.js`) y cada toque se le pide a la web, así todo funciona igual. "Ahorros y deudas", las demás pestañas y las ventanas siguen siendo la web.
- **Abre más rápido** (`copia.js`): la app guarda una copia de la página con Firebase incluido y abre desde ahí (con la misma dirección, así la sesión sigue igual). Revisa en segundo plano si hay versión nueva y la usa la próxima vez. Si la copia falla, abre la página normal. Además muestra al instante el último Inicio guardado.
- **Recordatorios en el celular** (`recordatorios.js`): avisos un día antes (7 p. m.) y el mismo día (8 a. m.) de pagos fijos, pago de tarjetas y cuotas; garantías 30 días, 7 días y el día que vencen (9 a. m.). Se activan en Ajustes → "Recordatorios en el celular" (o al aceptar la pregunta la primera vez).

## Etapa 2b (29 oct 2026)
- **Movimientos nativo** (`movimientos.js`): la pestaña Movimientos con piezas del celular y lista fluida (FlatList): balance, período, filtro, buscador nativo (busca con la misma lógica de la web), recientes, tarjetas de categorías/cuentas y la lista por días. Muestra 300 movimientos y carga más al bajar.
- **Formulario de anotar nativo** (`formulario.js`): el + abre una hoja de iPhone con teclado numérico (puntos de mil), Gasto/Ingreso/Transferencia, categoría y subcategoría, cuenta, cuenta destino, fecha (Hoy/Ayer/Otra con calendario) y descripción. Guarda con la misma lógica de la web (categoría automática si no se elige). Los botones IA y Foto abren los de la web. Editar un movimiento sigue siendo el formulario web.

## Archivos
| Archivo | Qué es |
|---|---|
| `App.js` | La app: une la web, el Inicio nativo, la copia y los recordatorios |
| `inicio.js` | Inicio nativo (y la barra de abajo compartida) |
| `movimientos.js` | Movimientos nativo |
| `formulario.js` | Formulario de anotar nativo |
| `puente.js` | Código que corre dentro de la web y le manda datos a la app |
| `copia.js` | Copia guardada de la página (abrir rápido / sin internet) |
| `recordatorios.js` | Recordatorios en el celular |
| `almacen.js` | Guardar y leer archivos en el celular |
| `index.js` | Arranque |
| `app.json` | Nombre, ícono, permisos, identificador `com.jimenez19pro.luks` |
| `eas.json` | Configuración de Expo (EAS) para armar la app |
| `package.json`, `package-lock.json` | Librerías (Expo SDK 58) |
| `icon.png`, `icono-fondo.png` | Ícono de Lu-Ks |

## Siguientes etapas
- Etapa 2 (sigue): pasar más pantallas a nativo, inicio de sesión con Google nativo (necesita compilación propia).
- Etapa 3: publicar en App Store (US$99/año) y Google Play (US$25 una vez).
