// GET /api/admin/citas → todas las citas ordenadas por fecha y hora (requiere sesión de barbero).

import { rechazarSinSesion } from "@/lib/auth";
import { listarCitas } from "@/lib/citas";
import { responderError } from "@/lib/respuestas";

export async function GET() {
  const rechazo = await rechazarSinSesion();
  if (rechazo) return rechazo;

  try {
    return Response.json(
      { citas: await listarCitas(), generadoEn: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }, // Datos privados: nunca cachear
    );
  } catch (error) {
    return responderError(error);
  }
}
