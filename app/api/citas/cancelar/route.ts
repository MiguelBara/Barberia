// POST /api/citas/cancelar  { codigo, telefono }  → cita con estado 'cancelada'
// Al cancelar, el horario vuelve a quedar disponible para nuevas reservas.

import { cancelarCita, leerCredenciales } from "@/lib/citas";
import { leerJson, responderError, respuestaJsonInvalido } from "@/lib/respuestas";

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === undefined) return respuestaJsonInvalido();

  try {
    const cita = await cancelarCita(leerCredenciales(cuerpo));
    return Response.json({ cita });
  } catch (error) {
    return responderError(error);
  }
}
