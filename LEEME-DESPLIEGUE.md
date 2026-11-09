# Cómo publicar VITRO con cobro en línea (gratis)

Estructura:
```
index.html                  sitio, carrito y checkout
catalog.js                  PRECIOS, descuento estudiante, envío y existencias (un solo lugar)
gracias.html                página tras el pago
functions/api/checkout.js   función de servidor (cobro); lee catalog.js
img/                        tus fotos (ver img/LEEME.txt)
```

## 1. Mercado Pago
1. Entra a mercadopago.com.mx/developers y crea una aplicación de "Checkout Pro".
2. Copia el **Access Token de producción** (empieza con `APP_USR-`). Para probar usa el de prueba (`TEST-`) y tarjetas de prueba.
3. No lo pegues en ningún archivo del sitio. Solo va en Cloudflare (paso 3).

## 2. Subir a GitHub
Crea un repositorio y sube todo el contenido de esta carpeta (con tus fotos en `img/`).

## 3. Cloudflare Pages
1. dash.cloudflare.com > Workers & Pages > Create > Pages > Connect to Git, elige el repositorio.
2. Build command: vacío. Output directory: `/` (raíz).
3. Settings > Variables and secrets, agrega:
   - `MP_ACCESS_TOKEN` (tipo Secret): tu token
   - `SITE_URL`: `https://vitroscrubs.com` (o el `.pages.dev` mientras pruebas)
4. Redeploy. Luego Custom domains > agrega tu dominio.

## 4. Antes de vender
- En `index.html`, bloque CONFIG: pon tu número de WhatsApp (`WHATSAPP`).
- Revisa `catalog.js`: precios, precio estudiante, envío ($99, gratis desde 2 sets) y correos escolares aceptados.
- Haz una compra de prueba con el token de prueba y revisa que llegue a tu panel de Mercado Pago.

## Existencias
Salen de `catalog.js` (sección `stock`). Cuando se vende algo, réstalo ahí y sube el cambio a GitHub; Cloudflare se actualiza solo. Sin esto, el sitio seguiría vendiendo piezas que ya no tienes. El servidor rechaza pedidos que pasen de lo que dice `stock`, pero no descuenta solo.

## Precio estudiante
- El cliente marca "Soy estudiante", usa su correo escolar y escribe su escuela y carrera.
- El servidor solo da el descuento si el correo está en `studentDomains` (revisa el dominio completo, no engaña con `tec.mx.otro.com`).
- El correo escolar no prueba que sea estudiante. Por eso cada pedido con descuento aparece en Mercado Pago con la nota **"SI - VERIFICAR CREDENCIAL POR WHATSAPP ANTES DE ENVIAR"** y el título de cada pieza dice "(precio estudiante)". Antes de enviar, pídele la foto de su credencial vigente; si no la manda, cóbrale la diferencia.

## Dónde ves los pedidos
En tu panel de Mercado Pago > Actividades. Cada cobro trae el folio (`external_reference`), el correo y los datos de envío en la información del pago. Mercado Pago también te manda correo por cada venta.
