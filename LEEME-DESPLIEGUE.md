# Publicar VITRO en Cloudflare (Workers) con cobro en línea

Estructura (todo esto va en la raíz de tu repositorio de GitHub):
```
wrangler.jsonc          configuración de Cloudflare (nombre, carpeta del sitio, SITE_URL)
src/worker.js           atiende /api/checkout y sirve el sitio
src/checkout.js         cobro con Mercado Pago (valida precios, descuento y existencias)
public/index.html       el sitio, carrito y checkout
public/catalog.js       PRECIOS, descuento estudiante, envío y existencias (un solo lugar)
public/gracias.html     página tras el pago
public/img/             tus fotos (ver public/img/LEEME.txt)
```
Solo lo que está en `public/` es visible en internet. `src/` y `wrangler.jsonc` no.

## 1. Actualizar el repositorio
1. En GitHub, borra los archivos viejos del repositorio (index.html, catalog.js, gracias.html, functions/, img/...).
2. Sube todo el contenido de esta carpeta tal como está, con las subcarpetas `public/` y `src/`.
3. Cloudflare redespliega solo. En Settings > Build deja: Build command vacío, Deploy command `npx wrangler deploy`, Root directory `/`.

## 2. Mercado Pago
1. mercadopago.com.mx/developers > crea una aplicación de "Checkout Pro".
2. Copia el **Access Token** (producción: `APP_USR-...`; para probar: `TEST-...`).
3. En Cloudflare: tu Worker `vitro-website` > Settings > Variables and Secrets > Add > tipo **Secret**, nombre `MP_ACCESS_TOKEN`, pega el token.

## 3. SITE_URL y dominio
- `SITE_URL` está en `wrangler.jsonc`. Ponle la URL real del sitio, sin diagonal final: primero la que te da Cloudflare (`https://vitro-website.TU-SUBDOMINIO.workers.dev`), y después tu dominio (`https://vitroscrubs.com`). Sube el cambio a GitHub.
- Para conectar tu dominio: Worker > Settings > Domains & Routes > Add > Custom domain.
- Si `SITE_URL` queda mal, el cliente paga pero regresa a una página que no existe.

## 4. Antes de vender
- En `public/index.html`, bloque CONFIG: pon tu número de WhatsApp (`WHATSAPP`).
- Revisa `public/catalog.js`: precios, precio estudiante, envío ($99, gratis desde 2 sets) y correos escolares aceptados.
- Haz una compra de prueba con el token `TEST-` y revisa que llegue a tu panel de Mercado Pago.
- Cuando todo funcione, cambia el secret por el token de producción.

## Existencias
Salen de `public/catalog.js` (sección `stock`). Cuando se vende algo, réstalo ahí y sube el cambio a GitHub; Cloudflare se actualiza solo. El servidor rechaza pedidos que pasen de lo que dice `stock`, pero no descuenta solo.

## Precio estudiante
- El cliente marca "Soy estudiante", usa su correo escolar y escribe su escuela y carrera.
- El servidor solo da el descuento si el correo está en `studentDomains`.
- El correo escolar no prueba que sea estudiante. Por eso cada pedido con descuento aparece en Mercado Pago con la nota **"SI - VERIFICAR CREDENCIAL POR WHATSAPP ANTES DE ENVIAR"**, y el título de cada pieza dice "(precio estudiante)". Antes de enviar, pídele la foto de su credencial vigente; si no la manda, cóbrale la diferencia.

## Dónde ves los pedidos
En tu panel de Mercado Pago > Actividades. Cada cobro trae el folio (`external_reference`), el correo y los datos de envío. Mercado Pago también te manda correo por cada venta.
