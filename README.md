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
| `tests/` | Tests de cumplimiento, vocabulario, inmutabilidad e ISIN |

## Reglas de cumplimiento que comprueban los tests

- Ninguna función pública recibe datos del usuario; las carteras salen siempre en orden
  fijo de menor a mayor riesgo y en tarjetas idénticas, sin destacados.
- La tabla `usuarios` no tiene datos de perfil y no existe ningún cuestionario.
- La parte pública nunca incluye instrumentos ni ISIN.
- Los textos no contienen vocabulario prohibido («instrucciones», «órdenes», «tu plan»,
  imperativos de compra-venta, recomendaciones personalizadas ni promesas de rentabilidad).
- Las versiones de una cartera y sus posiciones no se pueden modificar ni borrar
  (trigger en la base de datos); cada cambio crea una versión nueva.
