// PATCH /api/admin/citas/:id  { estado }  → cambia el estado de una cita (requiere sesión de barbero).
// Estados posibles: "confirmada", "completada", "cancelada".

import { rechazarSinSesion } from "@/lib/auth";
import { cambiarEstadoCita, esEstadoValido } from "@/lib/citas";
import { leerJson, responderError, respuestaJsonInvalido } from "@/lib/respuestas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rechazo = await rechazarSinSesion();
  if (rechazo) return rechazo;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Identificador de cita inválido." }, { status: 400 });
  }

  const cuerpo = await leerJson(request);
  if (cuerpo === undefined) return respuestaJsonInvalido();

  const estado = (cuerpo as { estado?: unknown } | null)?.estado;
  if (!esEstadoValido(estado)) {
    return Response.json(
      { error: 'El estado debe ser "confirmada", "completada" o "cancelada".' },
      { status: 400 },
    );
  }

  try {
    return Response.json({ cita: await cambiarEstadoCita(id, estado) });
  } catch (error) {
    return responderError(error);
  }
}
