"use client";

// Formulario de acceso de Miguel. Usa la Server Action `iniciarSesion`.

import { useActionState, useState } from "react";
import { iniciarSesion, type EstadoLogin } from "@/app/admin/acciones";
import { clasesCampo } from "@/components/CampoFormulario";

const ESTADO_INICIAL: EstadoLogin = { error: null };

export default function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);
  const [mostrar, setMostrar] = useState(false);

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-300">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={mostrar ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            placeholder="••••••••"
            aria-invalid={!!estado.error}
            aria-describedby={estado.error ? "error-login" : undefined}
            className={`${clasesCampo(estado.error ?? undefined)} pr-20`}
          />
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs text-stone-500 hover:text-amber-400"
          >
            {mostrar ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {estado.error && (
          <p id="error-login" role="alert" className="mt-2 text-sm text-red-400">
            {estado.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 bg-amber-500 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-950 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        {enviando && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
        )}
        {enviando ? "Verificando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
