// Endpoint de webhooks de Stripe. Verifica la firma antes de procesar nada.
import { getStripe } from "@/lib/stripe";
import { procesarEventoStripe } from "@/lib/webhook-stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto) return Response.json({ error: "Webhook no configurado" }, { status: 500 });

  const firma = req.headers.get("stripe-signature");
  if (!firma) return Response.json({ error: "Falta la firma" }, { status: 400 });

  const cuerpo = await req.text();
  const stripe = getStripe();
  let evento;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return Response.json({ error: "Firma no válida" }, { status: 400 });
  }

  try {
    const resultado = await procesarEventoStripe(evento, stripe);
    return Response.json({ recibido: true, resultado });
  } catch (e) {
    console.error(`[stripe] Error procesando ${evento.type} ${evento.id}`, e);
    // 500 para que Stripe reintente el envío.
    return Response.json({ error: "Error procesando el evento" }, { status: 500 });
  }
}
