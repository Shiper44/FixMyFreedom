# Integración de Stripe Checkout: pasos pendientes

Este archivo es la referencia única de lo que falta por configurar en la integración con Stripe.

Integración: **Stripe Checkout alojado por Stripe** (`ui_mode: "hosted_page"`), en modo
suscripción, una suscripción mensual independiente por cartera modelo. La llamada está en
[lib/suscripciones.ts](lib/suscripciones.ts) (función `iniciarCheckout`).

## Values to Replace

No queda ningún valor de ejemplo en el código. Los parámetros `sample_only` ya tienen valores
reales de la aplicación:

**Files containing these values:**
- [lib/suscripciones.ts](lib/suscripciones.ts)
- [lib/config.ts](lib/config.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | `subscription` | Correcto: las carteras son suscripciones mensuales. No cambiar. |
| success_url | `${APP_URL}/cuenta?pago=completado&session_id={CHECKOUT_SESSION_ID}` | Define `APP_URL` en producción con el dominio real (p. ej. `https://fixmyfreedom.es`). |
| cancel_url | `${APP_URL}/carteras/<cartera>#suscripcion` | Igual: depende de `APP_URL`. |
| line_items[].price | `STRIPE_PRICE_CONSERVADORA`, `STRIPE_PRICE_MODERADA`, `STRIPE_PRICE_DINAMICA` | En modo test ya están en `.env`. Para producción, crea los precios en modo live (`scripts/stripe-configurar.ts` solo funciona con claves de test) y pon sus IDs en las variables de entorno del servidor. |

## Configured Parameters

Parámetros configurados en Stripe Checkout Studio, aplicados tal cual:

**Files containing these parameters:**
- [lib/suscripciones.ts](lib/suscripciones.ts)
- [lib/stripe.ts](lib/stripe.ts) (`INTEGRACION_CHECKOUT`)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (SDK `stripe` 23.0.0, ≥ 21.0.0) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| payment_method_collection | `always` |
| submit_type | `auto` |
| integration_identifier | `hosted_web_0002` |
| origin_context | `web` |

### Parámetros de la aplicación que se mantienen

No son de Checkout Studio y se conservan porque los webhooks y el registro de cumplimiento
dependen de ellos. Quitarlos rompería la asociación entre el pago, la persona y la cartera.

| Parameter | Por qué |
|-----------|---------|
| customer | El webhook identifica a la persona por su cliente de Stripe. |
| client_reference_id | Id del usuario en FixMyFreedom, para conciliar en el panel de Stripe. |
| metadata / subscription_data.metadata | `usuario_id`, `cartera_slug` y `aceptacion_id`: enlazan la suscripción con la aceptación de la casilla previa al pago. Solo se usan como último recurso en los webhooks. |

Se han quitado `locale` (Checkout detecta el idioma del navegador) y los parámetros que se
añadían al activar impuestos (`customer_update`, `tax_id_collection` y
`billing_address_collection: "required"`), porque Checkout Studio fija `automatic_tax` en
`false` y `billing_address_collection` en `auto`.

## Configuración

Variables de entorno (servidor; ninguna llega al navegador, la integración no usa la clave
publicable):

| Variable | Valor |
|----------|-------|
| `STRIPE_SECRET_KEY` | Clave secreta o, mejor, restringida (`rk_...`). **Renueva la clave de test actual**: se compartió en un chat. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del endpoint de webhook (panel de Stripe → Workbench → Webhooks) o de `stripe listen`. |
| `STRIPE_PRICE_CONSERVADORA` / `_MODERADA` / `_DINAMICA` | Price IDs (ya configurados en test). |
| `STRIPE_PORTAL_CONFIGURATION` | Configuración del portal del cliente (ya creada en test). |
| `APP_URL` | Dominio de la web. |

Dependencias: `stripe` 23.0.0 (ya en `package.json`). Comandos de configuración en el [README](README.md#stripe-modo-test).

## Cómo funciona

1. La persona inicia sesión y abre la ficha de una cartera.
2. Marca la casilla obligatoria. El servidor guarda la aceptación con fecha, hora y versión del texto.
3. El servidor crea la sesión de Checkout y redirige a la página de pago de Stripe.
4. Tras pagar, Stripe vuelve a `/cuenta` y envía los webhooks a `/api/stripe/webhook`
   ([app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts)). Los webhooks son los que
   activan la suscripción, no la página de vuelta.
5. Desde «Mi cuenta», el portal de Stripe permite cancelar cada suscripción por separado y descargar facturas.

## Pruebas

Tarjetas de prueba (cualquier fecha futura y cualquier CVC):

| Tarjeta | Resultado |
|---------|-----------|
| 4242 4242 4242 4242 | Pago correcto |
| 4000 0000 0000 0341 | Se guarda la tarjeta, pero fallan los cobros (útil para probar impagos) |
| 4000 0025 0000 3155 | Requiere autenticación 3D Secure |
| 4000 0000 0000 9995 | Rechazada por fondos insuficientes |

Tests automáticos: `npm test` (webhooks firmados, pago, acceso y casilla de aceptación; no llaman a Stripe).

## Próximos pasos

- [ ] Completar una vez el pago en la página de Checkout con la tarjeta 4242 (en este entorno
      faltan por permitir `js.stripe.com`, `merchant-ui-api.stripe.com`, `r.stripe.com` y
      `checkout-cookies.stripe.com`).
- [ ] Crear el endpoint de webhook en el panel de Stripe con los eventos de `EVENTOS_STRIPE`
      ([lib/webhook-stripe.ts](lib/webhook-stripe.ts)) cuando la web tenga dominio público.
- [ ] **Stripe Tax**: añadir el registro fiscal (Tax → Locations) cuando lo confirme el asesor
      fiscal. Después, activar `automatic_tax` en Checkout Studio y en `iniciarCheckout`. Sin
      registro, Stripe no cobra impuestos y no avisa. Código fiscal de los productos: `txcd_10000000`,
      pendiente de confirmar.
- [ ] Revisar la marca de Checkout (logo y colores) en el panel: Configuración → Marca.
- [ ] Pasar a modo live: claves live, precios live, configuración del portal live y endpoint de webhook live.

## Recursos

- https://support.stripe.com
- https://docs.stripe.com/mcp
