// Autenticación del Portal del Barbero (solo servidor).
//
// - La contraseña vive en la variable de entorno ADMIN_PASSWORD (.env.local).
// - La sesión es una cookie httpOnly con la fecha de expiración firmada con HMAC-SHA256
//   (ADMIN_SESSION_SECRET). Sin el secreto nadie puede fabricar o alargar una sesión.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const NOMBRE_COOKIE = "bsp_admin";
const DURACION_SESION_SEG = 60 * 60 * 12; // 12 horas: una jornada de trabajo

// Protección contra fuerza bruta: tras 5 intentos fallidos se bloquea 5 minutos
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 5 * 60 * 1000;

function leerVariable(nombre: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET"): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el archivo .env.local`);
  }
  return valor;
}

/** Compara dos textos en tiempo constante (evita ataques de tiempo). */
function igualesSeguro(a: string, b: string): boolean {
  // Se comparan los hashes para que ambos buffers midan lo mismo
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function firmar(valor: string): string {
  return createHmac("sha256", leerVariable("ADMIN_SESSION_SECRET")).update(valor).digest("hex");
}

/** Token con formato "<expiraEnMs>.<firma>". */
function crearToken(): string {
  const expira = String(Date.now() + DURACION_SESION_SEG * 1000);
  return `${expira}.${firmar(expira)}`;
}

function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const [expira, firma] = token.split(".");
  if (!expira || !firma) return false;
  return igualesSeguro(firma, firmar(expira)) && Number(expira) > Date.now();
}

// ---------------------------------------------------------------------------
// Intentos fallidos (en memoria: suficiente para un único servidor)
// ---------------------------------------------------------------------------

const intentos = new Map<string, { fallos: number; bloqueadoHasta: number }>();

/** Minutos restantes de bloqueo para esa IP, o 0 si puede intentar. */
export function minutosBloqueado(ip: string): number {
  const registro = intentos.get(ip);
  if (!registro || registro.bloqueadoHasta < Date.now()) return 0;
  return Math.ceil((registro.bloqueadoHasta - Date.now()) / 60000);
}

function registrarFallo(ip: string): void {
  const registro = intentos.get(ip) ?? { fallos: 0, bloqueadoHasta: 0 };
  registro.fallos += 1;
  if (registro.fallos >= MAX_INTENTOS) {
    registro.fallos = 0;
    registro.bloqueadoHasta = Date.now() + BLOQUEO_MS;
  }
  intentos.set(ip, registro);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Verifica la contraseña; si es correcta abre la sesión. */
export async function intentarLogin(password: string, ip: string): Promise<boolean> {
  if (!igualesSeguro(password, leerVariable("ADMIN_PASSWORD"))) {
    registrarFallo(ip);
    return false;
  }
  intentos.delete(ip);

  (await cookies()).set(NOMBRE_COOKIE, crearToken(), {
    httpOnly: true, // JavaScript del navegador no puede leerla
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
  return true;
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE);
}

/** true si la petición actual trae una sesión de barbero válida. */
export async function haySesion(): Promise<boolean> {
  // Comparar con la hora actual (Date.now) exige evaluar en cada petición, nunca al prerenderizar
  await connection();
  return tokenValido((await cookies()).get(NOMBRE_COOKIE)?.value);
}

/** Para páginas: redirige al login si no hay sesión. */
export async function requerirSesion(): Promise<void> {
  if (!(await haySesion())) redirect("/admin/login");
}

/** Para rutas de la API: respuesta 401 si no hay sesión, o null si está autorizada. */
export async function rechazarSinSesion(): Promise<Response | null> {
  if (await haySesion()) return null;
  return Response.json({ error: "Sesión expirada. Vuelve a iniciar sesión." }, { status: 401 });
}
