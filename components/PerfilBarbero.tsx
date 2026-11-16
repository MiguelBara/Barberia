// Tarjeta de presentación de Miguel, el único barbero.

import { BARBERO } from "@/lib/negocio";

interface PerfilBarberoProps {
  compacto?: boolean; // Versión reducida para mostrar dentro de los pasos
}

export default function PerfilBarbero({ compacto = false }: PerfilBarberoProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900/60 ${
        compacto ? "p-4" : "p-6"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-serif text-stone-950 ${
          compacto ? "h-12 w-12 text-xl" : "h-16 w-16 text-2xl"
        }`}
      >
        {BARBERO.iniciales}
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-amber-500">Barbero</p>
        <p className="font-serif text-xl text-stone-100">{BARBERO.nombre}</p>
      </div>
    </div>
  );
}
