// POST /api/citas/buscar  { codigo, telefono }  → datos de la cita
// Se usa POST (y no GET) para que el teléfono no viaje en la URL ni quede en logs.

import { consultarCita, leerCredenciales } from "@/lib/citas";
import { leerJson, responderError, respuestaJsonInvalido } from "@/lib/respuestas";

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === undefined) return respuestaJsonInvalido();

  try {
    const cita = await consultarCita(leerCredenciales(cuerpo));
    return Response.json({ cita });
  } catch (error) {
    return responderError(error);
  }
}
