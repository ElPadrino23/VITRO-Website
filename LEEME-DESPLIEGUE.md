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
Viven en Supabase (tabla `stock`). Se editan en **/admin → Existencias** y se descuentan solas cuando Mercado Pago aprueba un pago. `public/catalog.js` → `stock` queda solo como semilla y respaldo: ya no lo toques para descontar ventas.

## Precio estudiante
- El cliente marca "Soy estudiante", usa su correo escolar y escribe su escuela y carrera.
- El servidor solo da el descuento si el correo está en `studentDomains`.
- El correo escolar no prueba que sea estudiante. Por eso cada pedido con descuento aparece en Mercado Pago con la nota **"SI - VERIFICAR CREDENCIAL POR WHATSAPP ANTES DE ENVIAR"**, y el título de cada pieza dice "(precio estudiante)". Antes de enviar, pídele la foto de su credencial vigente; si no la manda, cóbrale la diferencia.

## Dónde ves los pedidos
En **https://www.vitroscrubs.com/admin** (con tu cuenta de administrador): cada pedido pagado con sus datos de envío, estado, paquetería y guía, y botones para avisar al cliente por correo o WhatsApp. También quedan en tu panel de Mercado Pago > Actividades con el folio (`external_reference`).

## Puesta en marcha de pedidos y panel (una sola vez)
1. **Supabase → SQL Editor**: pega y corre `supabase/schema.sql` (si no lo habías hecho) y luego `supabase/orders.sql`.
2. Crea tu cuenta en `/cuenta`, confirma el correo y corre en el SQL Editor el bloque «Darte acceso de administrador» del final de `orders.sql` (con tu correo).
3. **Cloudflare → tu Worker → Settings → Variables and Secrets**. Secrets: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`. Variables de texto: `NOTIFY_EMAIL` (tu correo) y, cuando el dominio esté verificado en Resend, `MAIL_FROM` (p. ej. `VITRO <pedidos@vitroscrubs.com>`).
4. **Mercado Pago → Tus integraciones → Webhooks**: URL `https://www.vitroscrubs.com/api/mp-webhook`, evento Pagos. Haz lo mismo en la pestaña de pruebas si vas a probar con cuentas de prueba (cada modo tiene su propia clave secreta).
5. Prueba con una compra de prueba: debe aparecer en `/admin` como «Pagado · por enviar», bajar el stock y llegarte el correo.
