# VITRO — contexto del proyecto (léelo completo antes de tocar nada)

Sitio web con tienda y cobro en línea de **VITRO**, una marca mexicana de scrubs médicos "por estudiantes, para estudiantes de ciencias de la salud". Dueño: Fernando (estudiante del Tec de Monterrey). Idioma de todo el sitio y de la conversación con Fernando: **español de México**.

Sitio en producción: **https://www.vitroscrubs.com** (dirección oficial). `https://vitroscrubs.com` redirige a `www` desde el propio Worker.
Repositorio: GitHub `ElPadrino23/VITRO-Website`, rama `main`. Cada `git push` a `main` redespliega solo en Cloudflare (Workers Builds).

> El repositorio puede ser público. **Nunca** escribas aquí ni en ningún archivo: tokens, contraseñas, costos de proveedor, márgenes ni datos personales de clientes.

---

## 1. Qué es el producto

Se venden **sets completos** (top + pantalón), no piezas sueltas. Dos modelos × tres colores = 6 variantes, tallas **XS, S, M** (no hay L).

| Modelo (id) | Nombre | Tipo | Corte |
|---|---|---|---|
| `mujer` | **Montserrat** | Set Mujer | Slim femenino, manga larga |
| `unisex` | **Rafaello** | Set Unisex | Unisex, manga corta |

Colores (ids `navy`, `vino`, `verde`):

| id | Nombre | Hex | Nota |
|---|---|---|---|
| `navy` | Navy Blue | `#21355A` | Único con **V-Shield** (repele salpicaduras). Precio mayor |
| `vino` | Cold Wine | `#530020` | |
| `verde` | Clear Green | `#C3D184` | |

Los nombres de modelos y colores se cambian solo en `catalog.js`.

**Precios (MXN)**, siempre definidos en `public/catalog.js`:
- Lista: Navy $1,150 · Vino $950 · Verde $950.
- Estudiante: Navy $950 · Vino $800 · Verde $800.
- Envío: $99; **gratis desde 2 sets** en el pedido.

**Existencias**: primer lote pequeño, por modelo-color-talla, en `catalog.js` → `stock`. **Se descuentan a mano**: cuando se vende algo, Fernando (o tú, si te lo pide) resta la pieza en `catalog.js` y hace push. El servidor rechaza pedidos que excedan `stock`, pero no lo descuenta solo.

**Precio estudiante**: el cliente marca "Soy estudiante", usa correo escolar y escribe escuela y carrera. El servidor solo aplica el descuento si `student === true`, el dominio del correo está en `studentDomains` y hay escuela. El correo no prueba que sea estudiante, así que cada pedido con descuento sale en Mercado Pago con la nota *"SI - VERIFICAR CREDENCIAL POR WHATSAPP ANTES DE ENVIAR"*. Fernando verifica la credencial por WhatsApp antes de enviar; si no la manda, se cobra la diferencia.

---

## 2. Arquitectura

Un **Cloudflare Worker con assets estáticos**. Sin base de datos, sin build, sin framework.

```
wrangler.jsonc        config del Worker, SITE_URL y rutas de dominio
src/worker.js         router: redirige apex→www, POST /api/checkout, el resto → env.ASSETS
src/checkout.js       crea la preferencia de Mercado Pago (valida todo en servidor)
public/index.html     página principal (HTML/CSS/JS vanilla)
public/tienda.html    los 6 productos
public/producto.html  un producto (`producto.html?id=mujer-navy`): descripción, tela, laboratorio, certificaciones
public/carrito.html   carrito + datos de envío + botón de pago (único lugar desde donde se paga)
public/cuenta.html    registro / inicio de sesión con Supabase Auth ("Mis pedidos" pendiente)
public/fichas.html    fichas técnicas · public/sesion.html  galería de la sesión de fotos
public/site.js        COMPARTIDO: CONFIG (WhatsApp, redes, llaves públicas de Supabase), carrito, panel lateral, tarjeta de producto
public/site.css       estilos de producto, carrito y cuenta (index y tienda traen su CSS en línea)
public/ascii.js       animación ASCII del logo; se reproduce al tocar "Continuar con el pago", antes de ir a Mercado Pago
supabase/schema.sql   tabla `profiles` + RLS + trigger (se pega en el SQL Editor de Supabase)
public/gracias.html   página de "gracias por tu pedido" (se ve como /gracias)
public/catalog.js     FUENTE ÚNICA: precios, nombres, colores, stock, dominios escolares
public/img/           fotos (ver sección 6)
LEEME-DESPLIEGUE.md   guía de despliegue y pasos previos a vender
```

`catalog.js` es un script clásico que define `window.VITRO_CATALOG` y también hace `module.exports`, así lo lee el navegador (`index.html`) y el servidor (`checkout.js` con `import CATALOG`). **Cualquier cambio de precio, nombre o stock se hace solo ahí.** El cliente nunca decide precios: `checkout.js` los recalcula.

### Cobro (Mercado Pago Checkout Pro)
1. El cliente llena el carrito y el formulario de envío; `pay()` en `index.html` hace `POST /api/checkout` con `{student, items:[{model,color,size,qty}], customer}`.
2. `checkout.js` valida modelo/color/talla/cantidad (≤10 por línea, ≤12 líneas), stock acumulado por modelo-color-talla, datos de envío (teléfono de 10 dígitos, CP de 5), precio estudiante y envío.
3. Crea la preferencia en `https://api.mercadopago.com/checkout/preferences` con `MP_ACCESS_TOKEN` y devuelve `init_point`; el navegador redirige a Mercado Pago.
4. Mercado Pago regresa a `${SITE_URL}/gracias?pedido=ok|pendiente&ref=VITRO-…` (fallo → `/?pedido=fallo#tienda`).
5. Los pedidos se ven en el panel de Mercado Pago (Actividades); el folio está en `external_reference`. No hay webhooks ni base de datos.

Configuración en Cloudflare: secret **`MP_ACCESS_TOKEN`** (lo gestiona solo Fernando en el panel), variable `SITE_URL` en `wrangler.jsonc` (`https://www.vitroscrubs.com`, sin diagonal final), `keep_vars: true`.

### Dominio
- DNS en Cloudflare (el registrador es GoDaddy, con nameservers de Cloudflare).
- `www.vitroscrubs.com` = *custom domain* del Worker (en `wrangler.jsonc` → `routes`).
- `vitroscrubs.com/*` = ruta del Worker con un registro `A @ 192.0.2.1` proxied (IP de relleno); `worker.js` lo redirige 301 a `www` conservando ruta y parámetros. **No quites ese registro A** ni la ruta.
- Existe además una regla de redirección en Cloudflare ("root to WWW"); es redundante, déjala.

---

## 3. Diseño

Tema claro cálido, tipografía **Montserrat** (títulos) + **Instrument Sans** (texto). Variables en `:root` de `index.html`: `--bg #FBFAF5`, `--ink #12182B`, `--navy #0E1830`, `--gold #E8B84B`, `--line #E4E0D3`. Botones redondeados oscuros, tarjetas blancas con borde fino.

Secciones, en orden: encabezado con carrito · hero · por carrera (`#carreras`) · tienda (`#tienda`) · colores (`#colores`, fondo oscuro) · manifiesto (`#manifiesto`) · tribu (`#tribu`, incluye invitación a embajadores por WhatsApp) · quiz (`#quiz`) · newsletter (`#newsletter`) · footer. Hay un bloque `CONFIG` al inicio del `<script>` (WhatsApp, Instagram, TikTok, correo, URL de newsletter).

La tienda muestra **6 tarjetas** (una por modelo-color) con su propia talla y botón "Agregar al carrito"; 3 columnas en escritorio, 2 en tablet, 1 en celular. Si falta una foto, la tarjeta muestra "Foto próximamente". `PHOTO_POS` en el script permite ajustar el recorte (`"x% y%"`) de cada foto.

Reglas de contenido: **no inventar** testimonios, cifras, reseñas ni datos técnicos de las telas. V-Shield es solo del Navy. Tono: directo, cercano, estudiantil.

---

## 4. Estado actual (12-nov-2026)

Hecho y funcionando:
- Sitio publicado en `www.vitroscrubs.com`, con redirección desde el dominio sin `www`.
- Compra de prueba completa: sitio → Mercado Pago → `/gracias` con folio (probada con cuenta vendedor/comprador de prueba y tarjeta de prueba).
- 6 tarjetas de producto con nombres Prisma y Cristal (archivos ya entregados a Fernando; verifica que estén en `main`).
- Rótulos de reemplazo de las fotos eliminados.

Pendiente, por prioridad:

### A. Fotos (necesitan archivos que solo Fernando tiene)
Fernando reportó, sobre la versión publicada:
1. **Hero** (`img/hero.jpg`): salen cortadas personas; deben aparecer **todas**. Ajustar proporción del contenedor `.hero .ph` y/o recortar la foto a la proporción correcta.
2. **Rotadas hacia la derecha** (la parte superior de la prenda quedó a la derecha, hay que girarlas 90° en sentido antihorario): `mujer-navy`, `mujer-vino`, `unisex-vino`, `unisex-verde`.
3. `mujer-verde`: derecha, pero descentrada; el sujeto debe quedar un poco más a la izquierda del encuadre.
4. `unisex-navy`: **no existe la foto todavía**.
Corrige girando/recortando los archivos y, si hace falta, con `PHOTO_POS`. Verifica con captura de pantalla antes de declarar listo.

### B. Sección "Photoshoot" (nueva)
Una sección con la sesión de fotos: cuadrícula de miniaturas; al hacer clic se abre un **visor (lightbox)** donde se ven todas o casi todas las fotos, con anterior/siguiente, cerrar (botón, Esc y clic fuera), navegación por teclado y deslizar en celular, `alt` descriptivo, foco accesible y `loading="lazy"`. Lista de fotos en un arreglo (por ejemplo en `CONFIG` o en un archivo `public/photoshoot.js`) para que agregar fotos no requiera tocar el código. Miniaturas ~600 px y versión grande ~1800 px, **cada archivo < 1 MB** (límite de Cloudflare 25 MiB por archivo, pero importa el peso para el cliente). Carpeta sugerida: `public/img/photoshoot/`. Añadir enlace en el menú superior. Las fotos las pone Fernando; mientras no estén, no inventes imágenes ni uses fotos de stock de personas.

### C. Banner a "Fichas técnicas" (nuevo, en medio de la página)
Un banner o franja destacada **a la mitad del sitio** (sugerencia: entre la tienda y la sección de colores, o entre manifiesto y tribu) con un enlace a las fichas técnicas de los scrubs. Falta definir con Fernando: (1) si son PDFs, imágenes o una página nueva; (2) el contenido real (tela, composición, cuidado, tallas). **No inventes especificaciones.** Si son PDFs, ponlos en `public/fichas/` y enlázalos; si es página, crea `public/fichas.html` con el mismo estilo. Pregunta a Fernando antes de construir el contenido.

### D. Antes de vender de verdad (los hace Fernando, tú solo recuérdalo)
- Cambiar el secret `MP_ACCESS_TOKEN` al de **producción** y hacer una compra real chica que se devuelve.
- Poner su número en `CONFIG.WHATSAPP` de `index.html` (formato `52XXXXXXXXXX`, hoy dice `52XXXXXXXXXX`).
- Actualizar stock en `catalog.js` con cada venta.

### E. Más adelante
- Otras secciones que Fernando pedirá (preguntas frecuentes, guía de tallas, envíos/devoluciones, contacto).
- Páginas de Producto/Quiz/Admin del prototipo viejo usan nombres y precios antiguos ($800/$450, "Azul Medianoche"); **no son parte de este repo**, ignóralas.

---

## 5. Cómo trabajar aquí

- Edita directamente los archivos; **no hay build**. Prueba local: `python -m http.server 8765` dentro de `public/` (el checkout no funciona así) o `npx wrangler dev` (sí funciona; necesita `MP_ACCESS_TOKEN` en un `.dev.vars` que **no** debe subirse a git).
- Revisa sintaxis del JS en línea antes de entregar (`node --check` sobre el script extraído) y haz una prueba con Playwright en escritorio (1366×900) y celular (390×844): 6 tarjetas, agregar al carrito, sin errores de consola.
- Despliegue: `git push origin main` o `npx wrangler deploy` desde la raíz. Al final del deploy deben listarse `www.vitroscrubs.com (custom domain)` y `vitroscrubs.com/*`.
- Mantén `wrangler.jsonc` con `keep_vars: true` y **no pegues secretos** en ningún archivo.
- No cambies precios, descuentos ni reglas de estudiante sin que Fernando lo pida; viven en `catalog.js` y el servidor es quien manda.
- El HTML se escribe a mano; respeta el estilo existente (variables CSS, clases `.card`, `.btn`, `.ph`, `.wrap`, secciones `section` con id) y verifica contraste y uso con teclado.
- Los originales RAW (si Fernando los conserva) están fuera del repo; **no subas archivos RAW/TIFF ni más de 1 MB por foto**.

## 6. Trampas conocidas

- **Fotos**: las fotos originales de Fernando son **RAW de cámara Canon (CR2) con extensión `.jpg`**. Ninguna herramienta común las abre como JPEG. Se extrajo el JPEG incrustado con `exiftool-vendored` (`extractPreview`) y se redujo con `sharp` (1800 px de ancho, calidad 80, mozjpeg). El JPEG extraído **no trae orientación EXIF**, por eso salieron rotadas. Si pides fotos nuevas, pide JPEG/PNG exportados, no RAW. Cloudflare rechaza cualquier archivo de más de 25 MiB y el deploy falla entero.
- **Error 1034 / sitio "caído"**: en la red del Tec el dominio sin `www` y a veces `www` dieron 1034 por el firewall/DNS de la red. Desde datos móviles funcionaba. Antes de "arreglar" el DNS, prueba desde otra red.
- **Cuentas de prueba de Mercado Pago**: vendedor de prueba + comprador de prueba. Mezclar token de prueba con un comprador real da *"Una de las partes con la que intentas hacer el pago es de prueba"*. Se paga en ventana privada, con el correo del comprador de prueba y la tarjeta de prueba de Mercado Pago (titular `APRO` para aprobado). Con el precio estudiante activo el correo debe ser escolar o el servidor rechaza el pedido.
- `gracias.html` se sirve como `/gracias` (Cloudflare quita `.html`); `SITE_URL` no lleva diagonal final.
- Wrangler: los dominios se declaran en `wrangler.jsonc`; el diálogo "Add Domain" del panel falló con subdominios. Evita cambiarlos desde el panel porque el siguiente deploy los pisa.
- Algunos cambios de dominio tardan 10–15 minutos en reflejarse.
## 7. Cambios del 13-nov-2026 (mandan sobre lo anterior si se contradicen)

- El pago ya **no** se hace desde el panel lateral: el panel es un resumen con botón a `carrito.html`, y `pay()` vive ahí. Tras crear la preferencia se reproduce `VitroAscii.play()` y al terminar se redirige a Mercado Pago.
- `CONFIG` se movió de `index.html` a `public/site.js`. Ahí van `SUPABASE_URL` y `SUPABASE_ANON_KEY` (públicas). **Nunca** la llave `service_role`.
- Cuentas: `cuenta.html` muestra "se activan muy pronto" mientras las llaves estén vacías. No se guardan datos de pago en ningún lado.
- Las tarjetas ya no muestran "quedan N". Logo del encabezado: `img/logo-vitro-blanco.png` (recorte de la imagen oficial).
- Fotos de producto: nombres de archivo **sin espacios** (rompen el `url()` del CSS).
