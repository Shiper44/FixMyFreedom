// Envío de correo. Mientras no haya proveedor configurado, los correos se
// escriben en la consola del servidor (y, en tests, en una bandeja en memoria).

export type Correo = { para: string; asunto: string; texto: string };

export const bandejaDeSalida: Correo[] = [];

export async function enviarCorreo(correo: Correo): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    bandejaDeSalida.push(correo);
    return;
  }
  // TODO fase 4: proveedor de correo real.
  console.info(`\n[correo] Para: ${correo.para}\n[correo] Asunto: ${correo.asunto}\n${correo.texto}\n`);
}
