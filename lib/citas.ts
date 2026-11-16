// Lógica de citas del lado del servidor: disponibilidad, validación, guardado y cancelación.

import { randomBytes } from "node:crypto";
import { ahoraLocal, obtenerDb } from "@/lib/db";
import {
  BARBERO,
  buscarServicio,
  esDiaLaboral,
  fechaISO,
  generarFranjas,
  horaAMinutos,
  minutosAHora,
  normalizarCodigo,
  normalizarTelefono,
  parsearFecha,
  telefonosCoinciden,
  validarCliente,
  type Cita,
  type EstadoCita,
  type ErroresCliente,
  type Franja,
  type SolicitudCita,
} from "@/lib/negocio";

/** Error de negocio con el código HTTP que debe devolver la API. */
export class ErrorCita extends Error {
  constructor(
    message: string,
    public status: number,
    public errores?: ErroresCliente,
  ) {
    super(message);
  }
}

/** Fila tal como está en la tabla `citas`. */
interface FilaCita {
  id: number;
  codigo: string;
  estado: EstadoCita;
  servicio_id: string;
  servicio_nombre: string;
  precio: number;
  duracion_min: number;
  fecha: string;
  inicio_min: number;
  fin_min: number;
  barbero: string;
  cliente_nombre: string;
  cliente_telefono: string;
  notas: string;
  creada_en: string;
  cancelada_en: string | null;
}

function filaACita(fila: FilaCita): Cita {
  return {
    id: fila.id,
    codigo: fila.codigo,
    estado: fila.estado,
    servicioId: fila.servicio_id,
    servicioNombre: fila.servicio_nombre,
    precio: fila.precio,
    duracionMin: fila.duracion_min,
    fecha: fila.fecha,
    horaInicio: minutosAHora(fila.inicio_min),
    horaFin: minutosAHora(fila.fin_min),
    barbero: fila.barbero,
    clienteNombre: fila.cliente_nombre,
    clienteTelefono: fila.cliente_telefono,
    notas: fila.notas,
    creadaEn: fila.creada_en,
  };
}

// Consultas SQL. Las citas 'confirmada' y 'completada' ocupan la agenda; las 'cancelada' no.
const SQL_OCUPADAS =
  "SELECT inicio_min, fin_min FROM citas WHERE fecha = ? AND estado IN ('confirmada', 'completada')";
// Dos intervalos [a, b) y [c, d) se cruzan si a < d y c < b
const SQL_CRUCE =
  "SELECT 1 FROM citas WHERE fecha = ? AND estado IN ('confirmada', 'completada') AND inicio_min < ? AND fin_min > ? LIMIT 1";
const SQL_INSERTAR = `
  INSERT INTO citas (codigo, servicio_id, servicio_nombre, precio, duracion_min, fecha,
                     inicio_min, fin_min, barbero, cliente_nombre, cliente_telefono, notas, creada_en)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING *
`;

/** Convierte las filas que devuelve libSQL al tipo de la tabla. */
function comoFilas(filas: unknown): FilaCita[] {
  return filas as FilaCita[];
}

/** true si la franja ya pasó (con la hora local del servidor). */
function yaPaso(fecha: string, inicioMin: number): boolean {
  const ahora = new Date();
  const hoy = fechaISO(ahora);
  if (fecha !== hoy) return fecha < hoy;
  return inicioMin <= ahora.getHours() * 60 + ahora.getMinutes();
}

/**
 * Lista las franjas del día indicando cuáles están libres para el servicio elegido.
 * Las horas que ya pasaron (solo ocurre hoy) se omiten: no tiene sentido mostrarlas.
 */
export async function obtenerDisponibilidad(fecha: string, servicioId: string): Promise<Franja[]> {
  const servicio = buscarServicio(servicioId);
  if (!servicio) throw new ErrorCita("Servicio no válido.", 400);
  if (!parsearFecha(fecha)) throw new ErrorCita("Fecha no válida.", 400);
  if (!esDiaLaboral(fecha)) return []; // Día cerrado

  const db = await obtenerDb();
  const ocupadas = (await db.execute(SQL_OCUPADAS, [fecha])).rows as unknown as {
    inicio_min: number;
    fin_min: number;
  }[];

  return generarFranjas(servicio.duracionMin)
    .filter((hora) => !yaPaso(fecha, horaAMinutos(hora)))
    .map((hora) => {
      const inicio = horaAMinutos(hora);
      const fin = inicio + servicio.duracionMin;
      const cruza = ocupadas.some((c) => inicio < c.fin_min && c.inicio_min < fin);
      return { hora, disponible: !cruza };
    });
}

/** Código corto legible para el ticket, ej. "BSP-7K2QX9". */
function generarCodigo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I
  const bytes = randomBytes(6);
  return "BSP-" + Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

/** Convierte un JSON desconocido en una solicitud tipada o lanza 400. */
export function leerSolicitud(cuerpo: unknown): SolicitudCita {
  if (typeof cuerpo !== "object" || cuerpo === null) {
    throw new ErrorCita("Cuerpo de la solicitud inválido.", 400);
  }
  const c = cuerpo as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    servicioId: texto(c.servicioId),
    fecha: texto(c.fecha),
    hora: texto(c.hora),
    nombre: texto(c.nombre),
    telefono: texto(c.telefono),
    notas: texto(c.notas),
  };
}

/** Valida todo y guarda la cita. Lanza ErrorCita si algo no cuadra. */
export async function crearCita(solicitud: SolicitudCita): Promise<Cita> {
  // 1. Datos del cliente
  const errores = validarCliente(solicitud);
  if (Object.keys(errores).length > 0) {
    throw new ErrorCita("Revisa los datos del formulario.", 400, errores);
  }

  // 2. Servicio, fecha y hora
  const servicio = buscarServicio(solicitud.servicioId);
  if (!servicio) throw new ErrorCita("Servicio no válido.", 400);
  if (!esDiaLaboral(solicitud.fecha)) {
    throw new ErrorCita("Miguel no atiende ese día.", 400);
  }
  if (!generarFranjas(servicio.duracionMin).includes(solicitud.hora)) {
    throw new ErrorCita("La hora elegida no está dentro del horario de atención.", 400);
  }
  const inicio = horaAMinutos(solicitud.hora);
  const fin = inicio + servicio.duracionMin;
  if (yaPaso(solicitud.fecha, inicio)) {
    throw new ErrorCita("Esa hora ya pasó. Elige otra.", 400);
  }

  // 3. Verificación de cruce + inserción dentro de una transacción exclusiva,
  //    así dos reservas simultáneas nunca pueden tomar el mismo horario.
  const db = await obtenerDb();
  const tx = await db.transaction("write");
  try {
    const cruce = await tx.execute({ sql: SQL_CRUCE, args: [solicitud.fecha, fin, inicio] });
    if (cruce.rows.length > 0) {
      throw new ErrorCita(
        "Ese horario acaba de ser reservado por otra persona. Elige otra hora.",
        409,
      );
    }

    const resultado = await tx.execute({
      sql: SQL_INSERTAR,
      args: [
        generarCodigo(),
        servicio.id,
        servicio.nombre,
        servicio.precio,
        servicio.duracionMin,
        solicitud.fecha,
        inicio,
        fin,
        BARBERO.nombre,
        solicitud.nombre.trim().replace(/\s+/g, " "),
        normalizarTelefono(solicitud.telefono),
        solicitud.notas.trim(),
        ahoraLocal(),
      ],
    });

    await tx.commit();
    return filaACita(comoFilas(resultado.rows)[0]);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Consulta y cancelación por código de reserva
// ---------------------------------------------------------------------------

const SQL_POR_CODIGO = "SELECT * FROM citas WHERE codigo = ?";
// El filtro por estado evita cancelar dos veces si llegan dos peticiones a la vez
const SQL_CANCELAR = `
  UPDATE citas
  SET estado = 'cancelada', cancelada_en = ?
  WHERE id = ? AND estado = 'confirmada'
  RETURNING *
`;

/** Credenciales que el cliente usa para identificar su cita. */
export interface CredencialesCita {
  codigo: string;
  telefono: string;
}

/** Convierte un JSON desconocido en credenciales válidas o lanza 400. */
export function leerCredenciales(cuerpo: unknown): CredencialesCita {
  const c = (typeof cuerpo === "object" && cuerpo !== null ? cuerpo : {}) as Record<string, unknown>;
  const codigo = typeof c.codigo === "string" ? c.codigo.trim() : "";
  const telefono = typeof c.telefono === "string" ? c.telefono.trim() : "";
  if (!codigo || !telefono) {
    throw new ErrorCita("Ingresa tu código de reserva y tu número de celular.", 400);
  }
  return { codigo, telefono };
}

/**
 * Busca la cita y comprueba que el teléfono coincida.
 * Si el código no existe o el teléfono no corresponde se responde lo mismo,
 * para no revelar qué códigos existen.
 */
async function buscarFilaDelCliente({ codigo, telefono }: CredencialesCita): Promise<FilaCita> {
  const db = await obtenerDb();
  const filas = comoFilas((await db.execute(SQL_POR_CODIGO, [normalizarCodigo(codigo)])).rows);
  const fila = filas[0] as FilaCita | undefined;
  if (!fila || !telefonosCoinciden(fila.cliente_telefono, telefono)) {
    throw new ErrorCita("No encontramos una cita con ese código y número de celular.", 404);
  }
  return fila;
}

/** Devuelve la cita (confirmada o cancelada) para mostrarla antes de cancelar. */
export async function consultarCita(credenciales: CredencialesCita): Promise<Cita> {
  return filaACita(await buscarFilaDelCliente(credenciales));
}

/** Cancela la cita: cambia su estado y deja libre el horario para otra reserva. */
export async function cancelarCita(credenciales: CredencialesCita): Promise<Cita> {
  const fila = await buscarFilaDelCliente(credenciales);

  if (fila.estado === "cancelada") {
    throw new ErrorCita("Esta cita ya estaba cancelada.", 409);
  }
  if (fila.estado === "completada") {
    throw new ErrorCita("Esta cita ya fue atendida.", 409);
  }
  if (yaPaso(fila.fecha, fila.inicio_min)) {
    throw new ErrorCita("Esta cita ya comenzó o ya pasó, no se puede cancelar.", 400);
  }

  const db = await obtenerDb();
  const filas = comoFilas((await db.execute(SQL_CANCELAR, [ahoraLocal(), fila.id])).rows);
  const actualizada = filas[0] as FilaCita | undefined;
  if (!actualizada) {
    throw new ErrorCita("Esta cita ya estaba cancelada.", 409);
  }
  // No hace falta tocar nada más: la disponibilidad ignora las citas 'cancelada',
  // así que el horario queda libre de inmediato.
  return filaACita(actualizada);
}

// ---------------------------------------------------------------------------
// Panel del barbero
// ---------------------------------------------------------------------------

const SQL_TODAS = "SELECT * FROM citas ORDER BY fecha ASC, inicio_min ASC";
const SQL_POR_ID = "SELECT * FROM citas WHERE id = ?";
// Igual que SQL_CRUCE pero ignorando la propia cita (para reactivarla)
const SQL_CRUCE_EXCEPTO =
  "SELECT 1 FROM citas WHERE fecha = ? AND estado IN ('confirmada', 'completada') AND inicio_min < ? AND fin_min > ? AND id <> ? LIMIT 1";
const SQL_ACTUALIZAR_ESTADO = `
  UPDATE citas
  SET estado = ?, cancelada_en = ?
  WHERE id = ?
  RETURNING *
`;

/** Cambios de estado que Miguel puede hacer desde su panel. */
const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  confirmada: ["completada", "cancelada"],
  completada: ["confirmada"], // Deshacer un "completada" marcado por error
  cancelada: ["confirmada"], // Reactivar, solo si el horario sigue libre
};

/** Todas las citas, ordenadas por fecha y hora. */
export async function listarCitas(): Promise<Cita[]> {
  const db = await obtenerDb();
  return comoFilas((await db.execute(SQL_TODAS)).rows).map(filaACita);
}

export function esEstadoValido(valor: unknown): valor is EstadoCita {
  return valor === "confirmada" || valor === "completada" || valor === "cancelada";
}

/** Cambia el estado de una cita validando la transición y los cruces de horario. */
export async function cambiarEstadoCita(id: number, nuevo: EstadoCita): Promise<Cita> {
  const db = await obtenerDb();
  const tx = await db.transaction("write");
  try {
    const filas = comoFilas((await tx.execute({ sql: SQL_POR_ID, args: [id] })).rows);
    const fila = filas[0] as FilaCita | undefined;
    if (!fila) throw new ErrorCita("La cita no existe.", 404);

    if (!TRANSICIONES[fila.estado].includes(nuevo)) {
      throw new ErrorCita(`No se puede pasar de "${fila.estado}" a "${nuevo}".`, 400);
    }

    // Al reactivar una cancelada, otra persona pudo haber tomado ese horario
    if (fila.estado === "cancelada") {
      const cruce = await tx.execute({
        sql: SQL_CRUCE_EXCEPTO,
        args: [fila.fecha, fila.fin_min, fila.inicio_min, fila.id],
      });
      if (cruce.rows.length > 0) {
        throw new ErrorCita("No se puede reactivar: ese horario ya fue tomado por otra cita.", 409);
      }
    }

    const actualizada = await tx.execute({
      sql: SQL_ACTUALIZAR_ESTADO,
      args: [nuevo, nuevo === "cancelada" ? ahoraLocal() : null, id],
    });
    await tx.commit();
    return filaACita(comoFilas(actualizada.rows)[0]);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
