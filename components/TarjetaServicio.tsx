// Tarjeta que muestra un servicio. Toda la tarjeta es clicable.

import { formatearPrecio, type Servicio } from "@/lib/negocio";

interface TarjetaServicioProps {
  servicio: Servicio;
  seleccionado: boolean;
  onSeleccionar: (servicio: Servicio) => void;
}

export default function TarjetaServicio({
  servicio,
  seleccionado,
  onSeleccionar,
}: TarjetaServicioProps) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(servicio)}
      aria-pressed={seleccionado}
      className={`group relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
        seleccionado
          ? "scale-[1.02] border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10"
          : "border-stone-800 bg-stone-900/60 hover:-translate-y-1 hover:border-amber-500/50"
      }`}
    >
      {/* Etiqueta para el servicio más popular */}
      {servicio.destacado && (
        <span className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-950">
          Más popular
        </span>
      )}

      <span className="font-serif text-xl text-stone-100">{servicio.nombre}</span>
      <span className="mt-1 text-xs uppercase tracking-widest text-stone-500">
        {servicio.duracionMin} min
      </span>
      <span className="mt-4 flex-1 text-sm leading-relaxed text-stone-400">
        {servicio.descripcion}
      </span>

      <span className="mt-6 flex items-center justify-between gap-4">
        <span className="font-serif text-2xl text-amber-400">
          {formatearPrecio(servicio.precio)}
        </span>
        <span
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            seleccionado
              ? "bg-amber-500 text-stone-950"
              : "border border-amber-500/60 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950"
          }`}
        >
          {seleccionado ? "✓ Elegido" : "Elegir"}
        </span>
      </span>
    </button>
  );
}
