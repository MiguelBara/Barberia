// Reglas de negocio compartidas entre cliente y servidor.
// Este archivo NO debe importar nada de Node: lo usan también los componentes del navegador.

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Servicio que ofrece la barbería. */
export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number; // Pesos, sin decimales
  duracionMin: number; // Duración en minutos (define cuánto bloquea la agenda)
  destacado?: boolean;
}

/** Datos que el cliente ingresa en el formulario. */
export interface DatosCliente {
  nombre: string;
  telefono: string;
  notas: string;
}

/** Cuerpo que el frontend envía a POST /api/citas. */
export interface SolicitudCita extends DatosCliente {
  servicioId: string;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:MM"
}

export type EstadoCita = "confirmada" | "completada" | "cancelada";

/** Estados que ocupan la agenda de Miguel (una cita cancelada libera su horario). */
export const ESTADOS_QUE_OCUPAN: EstadoCita[] = ["confirmada", "completada"];

/** Textos y estilos de cada estado, compartidos por el ticket, el modal y el panel. */
export const INFO_ESTADO: Record<EstadoCita, { etiqueta: string; clases: string }> = {
  confirmada: { etiqueta: "Confirmada", clases: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  completada: { etiqueta: "Completada", clases: "bg-sky-500/15 text-sky-400 ring-sky-500/30" },
  cancelada: { etiqueta: "Cancelada", clases: "bg-stone-700/40 text-stone-400 ring-stone-600/40" },
};

/** Cita ya guardada, tal como la devuelve la API. */
export interface Cita {
  id: number;
  codigo: string;
  estado: EstadoCita;
  servicioId: string;
  servicioNombre: string;
  precio: number;
  duracionMin: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  barbero: string;
  clienteNombre: string;
  clienteTelefono: string;
  notas: string;
  creadaEn: string;
}

/** Franja horaria con su disponibilidad (respuesta de GET /api/citas). */
export interface Franja {
  hora: string;
  disponible: boolean;
}

export type ErroresCliente = Partial<Record<keyof DatosCliente, string>>;

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/** Único barbero del sistema. */
export const BARBERO = {
  nombre: "Miguel Angel Murcia",
  iniciales: "M",
} as const;

export const SERVICIOS: Servicio[] = [
  {
    id: "corte-clasico",
    nombre: "Corte Clásico",
    descripcion:
      "Corte a tijera y máquina con lavado, peinado y terminación a navaja.",
    precio: 15000,
    duracionMin: 45,
  },
  {
    id: "arreglo-barba",
    nombre: "Arreglo de Barba",
    descripcion:
      "Perfilado, toalla caliente y aceite hidratante para una barba impecable.",
    precio: 5000,
    duracionMin: 20,
  },
  {
    id: "combo-real",
    nombre: "Combo Real",
    descripcion:
      "Corte + Barba + Ceja. La experiencia completa para salir como un rey.",
    precio: 22000,
    duracionMin: 75,
    destacado: true,
  },
  {
    id: "corte-nino",
    nombre: "Corte de Niño",
    descripcion:
      "Corte a la moda para los más pequeños, con paciencia y un acabado impecable.",
    precio: 17000,
    duracionMin: 30,
  },
];

/**
 * Horario de atención de Miguel, en bloques.
 * Entre bloques (12:00 a 13:30) no se puede reservar: es la pausa de almuerzo.
 * Cada cita debe empezar y terminar dentro de un mismo bloque.
 */
export const HORARIO = {
  bloques: [
    { inicio: "09:00", fin: "12:00" }, // Mañana
    { inicio: "13:30", fin: "21:00" }, // Tarde
  ],
  intervaloMin: 30, // Cada cuánto empieza una franja dentro de un bloque
  diasLaborales: [0, 1, 2, 3, 4, 5, 6], // 0 = domingo … 6 = sábado
  diasReservables: 14, // Cuántos días hacia adelante se puede reservar
} as const;

export function buscarServicio(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Utilidades de formato
// ---------------------------------------------------------------------------

/** 15000 → "$15.000" */
export function formatearPrecio(valor: number): string {
  return `$${valor.toLocaleString("es-CL")}`;
}

/** "10:30" → 630 */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** 630 → "10:30" */
export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Fecha local → "YYYY-MM-DD" (sin pasar por UTC para no correr el día). */
export function fechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date local a medianoche, o null si el texto no es una fecha real. */
export function parsearFecha(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  // Rechaza fechas inexistentes como 2026-02-31
  return fechaISO(fecha) === iso ? fecha : null;
}

/** "2026-10-30" → "Viernes, 30 de octubre" */
export function formatearFechaLarga(iso: string): string {
  const fecha = parsearFecha(iso);
  if (!fecha) return iso;
  const texto = fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // Solo la primera letra en mayúscula (la clase `capitalize` lo haría en cada palabra)
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

export function esDiaLaboral(iso: string): boolean {
  const fecha = parsearFecha(iso);
  return fecha !== null && (HORARIO.diasLaborales as readonly number[]).includes(fecha.getDay());
}

/**
 * Días laborales reservables desde hoy. Hoy se omite si ya pasó la hora de cierre,
 * para que el calendario no abra en un día sin horas disponibles.
 */
export function proximosDiasLaborales(desde: Date = new Date()): string[] {
  const dias: string[] = [];
  const cierre = horaAMinutos(HORARIO.bloques[HORARIO.bloques.length - 1].fin);
  const yaCerroHoy = desde.getHours() * 60 + desde.getMinutes() >= cierre;
  for (let i = yaCerroHoy ? 1 : 0; i < HORARIO.diasReservables; i++) {
    const dia = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    const iso = fechaISO(dia);
    if (esDiaLaboral(iso)) dias.push(iso);
  }
  return dias;
}

/** Horas de inicio posibles para un servicio, de modo que termine antes del fin de su bloque. */
export function generarFranjas(duracionMin: number): string[] {
  const franjas: string[] = [];
  for (const bloque of HORARIO.bloques) {
    const fin = horaAMinutos(bloque.fin);
    for (let t = horaAMinutos(bloque.inicio); t + duracionMin <= fin; t += HORARIO.intervaloMin) {
      franjas.push(minutosAHora(t));
    }
  }
  return franjas;
}

// ---------------------------------------------------------------------------
// Validación del formulario (se ejecuta en el navegador Y en la API)
// ---------------------------------------------------------------------------

/** Deja solo dígitos y un "+" inicial: "+56 9 1234-5678" → "+56912345678" */
export function normalizarTelefono(telefono: string): string {
  const limpio = telefono.trim();
  const digitos = limpio.replace(/\D/g, "");
  return limpio.startsWith("+") ? `+${digitos}` : digitos;
}

/**
 * Compara dos teléfonos ignorando formato y prefijo de país:
 * "+56 9 1234 5678" coincide con "912345678" (se comparan los últimos dígitos).
 */
export function telefonosCoinciden(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  const [corto, largo] = da.length <= db.length ? [da, db] : [db, da];
  return corto.length >= 8 && largo.endsWith(corto);
}

/** Normaliza un código de reserva: " bsp-sf6y8p " o "SF6Y8P" → "BSP-SF6Y8P". */
export function normalizarCodigo(codigo: string): string {
  const limpio = codigo.trim().toUpperCase().replace(/\s+/g, "");
  return limpio.startsWith("BSP-") ? limpio : `BSP-${limpio.replace(/^BSP/, "")}`;
}

export function validarCliente(datos: DatosCliente): ErroresCliente {
  const errores: ErroresCliente = {};
  const nombre = datos.nombre.trim().replace(/\s+/g, " ");

  if (nombre.length < 3 || nombre.length > 80) {
    errores.nombre = "Ingresa tu nombre completo (3 a 80 caracteres).";
  } else if (nombre.split(" ").length < 2) {
    errores.nombre = "Ingresa nombre y apellido.";
  } else if (!/^[\p{L}\s'.-]+$/u.test(nombre)) {
    errores.nombre = "El nombre solo puede contener letras.";
  }

  const digitos = normalizarTelefono(datos.telefono).replace("+", "");
  if (digitos.length < 8 || digitos.length > 15) {
    errores.telefono = "Ingresa un número de celular válido (8 a 15 dígitos).";
  }

  if (datos.notas.length > 300) {
    errores.notas = "Las notas no pueden superar los 300 caracteres.";
  }

  return errores;
}
