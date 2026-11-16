// Envoltorio reutilizable para campos de formulario: etiqueta + control + mensaje de error.

import type { ReactNode } from "react";

interface CampoFormularioProps {
  id: string;
  etiqueta: string;
  error?: string;
  opcional?: boolean;
  ayuda?: string; // Texto secundario bajo el campo cuando no hay error
  children: ReactNode; // El <input> o <textarea>
}

/** Clases de Tailwind compartidas por inputs y textareas. */
export function clasesCampo(error?: string): string {
  return `w-full rounded-xl border bg-stone-900/60 px-4 py-3 text-stone-100 placeholder:text-stone-600 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 ${
    error ? "border-red-500/70" : "border-stone-700"
  }`;
}

export default function CampoFormulario({
  id,
  etiqueta,
  error,
  opcional,
  ayuda,
  children,
}: CampoFormularioProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-stone-300">
        {etiqueta}
        {opcional && <span className="ml-1 text-stone-500">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-stone-500">{ayuda}</p>
      )}
    </div>
  );
}
