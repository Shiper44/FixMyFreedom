# FixMyFreedom

Web de suscripción a **tres carteras modelo genéricas** (Conservadora, Moderada y Dinámica).
Cada persona elige libremente a cuáles suscribirse; todas las personas suscritas a una
cartera reciben exactamente el mismo contenido y los mismos avisos de cambio.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma 6
- Vitest para los tests

## Puesta en marcha

1. Copia `.env.example` a `.env` y rellena `DATABASE_URL` y `DATABASE_URL_TEST`
   (el nombre de la base de datos de test debe terminar en `_test`).
2. Instala dependencias y aplica migraciones:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```

3. Arranca en desarrollo: `npm run dev` y abre http://localhost:3000

## Stripe (modo test)

Productos: un producto por cartera con un precio mensual en EUR (impuestos incluidos).
Se usa Checkout en modo suscripción, el portal del cliente de Stripe y webhooks.
Los price IDs solo están en variables de entorno.

1. Pon `STRIPE_SECRET_KEY` (mejor una clave restringida `rk_test_...`) en `.env`.
2. Crea productos, precios y la configuración del portal (idempotente):

   ```bash
   npx tsx scripts/stripe-configurar.ts
   ```

   Copia en `.env` las líneas `STRIPE_PRICE_*` y `STRIPE_PORTAL_CONFIGURATION` que imprime.
3. Webhooks en local con la CLI de Stripe:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copia el `whsec_...` que muestra en `STRIPE_WEBHOOK_SECRET`. En producción, crea el
   endpoint en el panel de Stripe con los eventos de `EVENTOS_STRIPE` (`lib/webhook-stripe.ts`).
   Si no puedes usar la CLI, `scripts/reenviar-eventos-stripe.ts` reenvía al webhook local los
   eventos reales de Stripe, firmados con tu `STRIPE_WEBHOOK_SECRET`, y
   `scripts/simular-ciclo-stripe.ts` crea, cancela o hace fallar suscripciones de prueba.
   Si el servidor sale a internet por un proxy (`HTTPS_PROXY`), arranca Node con
   `NODE_USE_ENV_PROXY=1`.
4. **Stripe Tax**: déjalo en `STRIPE_TAX_ENABLED="false"` hasta tener en Stripe la dirección
   de la sede y al menos un registro fiscal activo. Sin registro, Stripe no cobra impuestos
   y no avisa. El código fiscal del producto está pendiente de confirmar con el asesor.
5. **Facturas**: Stripe genera una factura por cada cuota; quien se suscribe las descarga
   desde el portal («Facturas y método de pago» en su cuenta).

El portal no permite cambiar de una cartera a otra: suscribirse a otra cartera siempre
pasa por la casilla de aceptación.

## Inicio de sesión

Sin contraseña: se envía por correo un enlace de un solo uso que caduca en 15 minutos.
Mientras no haya proveedor de correo, el correo se escribe en la consola del servidor y,
en desarrollo, el enlace aparece también en la página.

## Tests

```bash
npm test
```

Los tests vacían y recrean la base de datos de `DATABASE_URL_TEST` en cada ejecución.

## Dónde está cada cosa

| Carpeta | Contenido |
|---|---|
| `app/` | Páginas: portada, ficha de cada cartera, textos legales, inicio de sesión |
| `components/` | Componentes de interfaz (comparador de carteras, escala de riesgo, etc.) |
| `content/legal/index.ts` | **Todos los textos legales y avisos**, marcados «PENDIENTE DE REVISIÓN LEGAL» |
| `lib/carteras.ts` | Consultas públicas: sin datos del usuario y sin instrumentos ni ISIN |
| `prisma/schema.prisma` | Modelo de datos |
| `prisma/datos-ejemplo.ts` | Carteras, instrumentos y rentabilidades **ficticios** de ejemplo |
| `lib/suscripciones.ts` | Pago con Checkout, portal del cliente y sincronización de suscripciones |
| `lib/webhook-stripe.ts` | Procesado de eventos de Stripe (idempotente) |
| `lib/acceso.ts` | Control de acceso al contenido de pago (siempre en el servidor) |
| `lib/auth.ts` | Enlaces de acceso y sesiones |
| `scripts/stripe-configurar.ts` | Crea productos, precios y portal en Stripe (modo test) |
| `tests/` | Tests de cumplimiento, webhooks, pago, acceso, sesiones, vocabulario, inmutabilidad e ISIN |

## Reglas de cumplimiento que comprueban los tests

- Ninguna función pública recibe datos del usuario; las carteras salen siempre en orden
  fijo de menor a mayor riesgo y en tarjetas idénticas, sin destacados.
- La tabla `usuarios` no tiene datos de perfil y no existe ningún cuestionario.
- La parte pública nunca incluye instrumentos ni ISIN.
- Los textos no contienen vocabulario prohibido («instrucciones», «órdenes», «tu plan»,
  imperativos de compra-venta, recomendaciones personalizadas ni promesas de rentabilidad).
- Las versiones de una cartera y sus posiciones no se pueden modificar ni borrar
  (trigger en la base de datos); cada cambio crea una versión nueva.
