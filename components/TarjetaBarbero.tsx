// Tarjeta seleccionable para elegir el barbero favorito.

import type { Barbero } from "@/lib/datos";

interface TarjetaBarberoProps {
  barbero: Barbero;
  seleccionado: boolean;
  onSeleccionar: (id: string) => void;
}

export default function TarjetaBarbero({
  barbero,
  seleccionado,
  onSeleccionar,
}: TarjetaBarberoProps) {
  return (
    // Toda la tarjeta es un botón para facilitar la selección en móvil
    <button
      type="button"
      onClick={() => onSeleccionar(barbero.id)}
      aria-pressed={seleccionado}
      className={`flex w-full items-center gap-5 rounded-2xl border p-5 text-left transition-all duration-300 ${
        seleccionado
          ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
          : "border-stone-800 bg-stone-900/60 hover:border-stone-600"
      }`}
    >
      {/* Avatar con las iniciales del barbero */}
      <span
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-serif text-2xl transition-colors ${
          seleccionado
            ? "bg-amber-500 text-stone-950"
            : "bg-stone-800 text-amber-400"
        }`}
      >
        {barbero.iniciales}
      </span>

      <span className="flex-1">
        <span className="block font-serif text-xl text-stone-100">
          {barbero.nombre}
        </span>
        <span className="block text-sm text-stone-400">
          {barbero.especialidad}
        </span>
        <span className="mt-1 block text-xs uppercase tracking-widest text-stone-500">
          {barbero.experiencia}
        </span>
      </span>

      {/* Indicador tipo radio */}
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          seleccionado ? "border-amber-500" : "border-stone-600"
        }`}
      >
        {seleccionado && <span className="h-3 w-3 rounded-full bg-amber-500" />}
      </span>
    </button>
  );
}
