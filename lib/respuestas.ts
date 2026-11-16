// Utilidades compartidas por las rutas de la API.

import { ErrorCita } from "@/lib/citas";

/** Convierte cualquier error en una respuesta JSON coherente. */
export function responderError(error: unknown): Response {
  if (error instanceof ErrorCita) {
    return Response.json(
      { error: error.message, errores: error.errores },
      { status: error.status },
    );
  }
  console.error("[api/citas]", error);
  return Response.json({ error: "Error interno del servidor." }, { status: 500 });
}

/** Lee el cuerpo JSON; devuelve `undefined` si no es JSON válido. */
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export const respuestaJsonInvalido = () =>
  Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
