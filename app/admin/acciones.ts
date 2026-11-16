"use server";

// Server Actions del Portal del Barbero: iniciar y cerrar sesión.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cerrarSesion as borrarCookie, intentarLogin, minutosBloqueado } from "@/lib/auth";

export interface EstadoLogin {
  error: string | null;
}

/** IP del cliente (o "local" en desarrollo) para limitar intentos fallidos. */
async function ipCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function iniciarSesion(_previo: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const ip = await ipCliente();

  const bloqueo = minutosBloqueado(ip);
  if (bloqueo > 0) {
    return { error: `Demasiados intentos. Espera ${bloqueo} min e inténtalo de nuevo.` };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "Ingresa la contraseña." };
  }

  if (!(await intentarLogin(password, ip))) {
    return { error: "Contraseña incorrecta." };
  }

  redirect("/admin"); // Lanza una excepción especial: debe ir fuera de try/catch
}

export async function cerrarSesion(): Promise<void> {
  await borrarCookie();
  redirect("/admin/login");
}
