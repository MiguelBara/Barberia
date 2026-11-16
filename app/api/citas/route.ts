// API de citas.
//   GET  /api/citas?fecha=YYYY-MM-DD&servicio=<id>  → franjas del día con su disponibilidad
//   POST /api/citas                                  → crea una cita (valida cruces de horario)
// Ver también: /api/citas/buscar y /api/citas/cancelar

import type { NextRequest } from "next/server";
import { crearCita, leerSolicitud, obtenerDisponibilidad } from "@/lib/citas";
import { leerJson, responderError, respuestaJsonInvalido } from "@/lib/respuestas";

export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  const servicio = request.nextUrl.searchParams.get("servicio") ?? "";

  try {
    const franjas = await obtenerDisponibilidad(fecha, servicio);
    return Response.json({ fecha, franjas });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === undefined) return respuestaJsonInvalido();

  try {
    const cita = await crearCita(leerSolicitud(cuerpo));
    return Response.json({ cita }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}
