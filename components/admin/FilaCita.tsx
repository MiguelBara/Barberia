"use client";

// Una cita dentro de la agenda del barbero.
// En escritorio se ve como fila de tabla (grid de 7 columnas); en móvil, como tarjeta.

import BotonConfirmar from "@/components/BotonConfirmar";
import InsigniaEstado from "@/components/InsigniaEstado";
import { formatearPrecio, type Cita, type EstadoCita } from "@/lib/negocio";

/** Columnas compartidas con la cabecera de la tabla (ver PanelCitas). */
export const COLUMNAS_TABLA =
  "md:grid md:grid-cols-[6.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_7.5rem_11rem] md:items-center md:gap-4";

interface FilaCitaProps {
  cita: Cita;
  esSiguiente: boolean; // La próxima cita del día: se resalta
  ocupada: boolean; // Hay una petición en curso para esta cita
  onCambiarEstado: (cita: Cita, estado: EstadoCita) => void;
}

/** Enlace directo al chat de WhatsApp (solo dígitos, como exige wa.me). */
function enlaceWhatsApp(telefono: string): string {
  return `https://wa.me/${telefono.replace(/\D/g, "")}`;
}

const btnBase = "rounded-lg px-3 py-1.5 text-xs font-semibold";

export default function FilaCita({ cita, esSiguiente, ocupada, onCambiarEstado }: FilaCitaProps) {
  const cancelada = cita.estado === "cancelada";

  return (
    <li
      className={`relative rounded-2xl border p-4 transition-colors md:rounded-none md:border-x-0 md:border-t-0 md:px-5 md:py-3.5 ${COLUMNAS_TABLA} ${
        esSiguiente
          ? "border-amber-500/40 bg-amber-500/5 md:border-b-stone-800"
          : "border-stone-800 bg-stone-900/40 md:bg-transparent md:hover:bg-stone-900/60"
      } ${cancelada ? "opacity-60" : ""}`}
    >
      {/* Barra lateral dorada para la siguiente cita */}
      {esSiguiente && (
        <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-amber-500 md:rounded-none" />
      )}

      {/* Hora */}
      <div className="flex items-center justify-between md:block">
        <p className={`font-serif text-lg tabular-nums ${cancelada ? "line-through" : "text-stone-100"}`}>
          {cita.horaInicio}
        </p>
        <p className="text-xs tabular-nums text-stone-500">hasta {cita.horaFin}</p>
        {/* En móvil el estado va junto a la hora */}
        <span className="md:hidden">
          <InsigniaEstado estado={cita.estado} />
        </span>
      </div>

      {/* Cliente */}
      <div className="mt-3 min-w-0 md:mt-0">
        <p className="truncate font-medium text-stone-100">
          {cita.clienteNombre}
          {esSiguiente && (
            <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-stone-950">
              Siguiente
            </span>
          )}
        </p>
        <p className="font-mono text-xs tracking-wider text-stone-500">{cita.codigo}</p>
        {cita.notas && (
          <p className="mt-1 line-clamp-2 text-xs italic text-stone-400" title={cita.notas}>
            “{cita.notas}”
          </p>
        )}
      </div>

      {/* WhatsApp */}
      <a
        href={enlaceWhatsApp(cita.clienteTelefono)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm tabular-nums text-emerald-400 hover:text-emerald-300 hover:underline md:mt-0"
        title="Abrir chat de WhatsApp"
      >
        <span aria-hidden>💬</span>
        {cita.clienteTelefono}
      </a>

      {/* Servicio */}
      <p className="mt-1 text-sm text-stone-300 md:mt-0">
        {cita.servicioNombre}
        <span className="block text-xs text-stone-500">{cita.duracionMin} min</span>
      </p>

      {/* Precio */}
      <p className="mt-1 font-serif tabular-nums text-amber-400 md:mt-0">
        {formatearPrecio(cita.precio)}
      </p>

      {/* Estado (escritorio) */}
      <div className="hidden md:block">
        <InsigniaEstado estado={cita.estado} />
      </div>

      {/* Acciones según el estado actual */}
      <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:justify-end">
        {cita.estado === "confirmada" && (
          <>
            <button
              type="button"
              disabled={ocupada}
              onClick={() => onCambiarEstado(cita, "completada")}
              className={`${btnBase} bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/25 disabled:opacity-50`}
            >
              ✓ Completar
            </button>
            <BotonConfirmar
              disabled={ocupada}
              onConfirmar={() => onCambiarEstado(cita, "cancelada")}
              textoConfirmar="¿Cancelar?"
              className={`${btnBase} text-stone-400 ring-1 ring-stone-700 hover:text-red-300 hover:ring-red-500/40`}
              clasesConfirmar={`${btnBase} bg-red-600 text-white ring-1 ring-red-500`}
            >
              Cancelar
            </BotonConfirmar>
          </>
        )}
        {cita.estado === "completada" && (
          <button
            type="button"
            disabled={ocupada}
            onClick={() => onCambiarEstado(cita, "confirmada")}
            className={`${btnBase} text-stone-400 ring-1 ring-stone-700 hover:text-stone-200 disabled:opacity-50`}
          >
            ↺ Deshacer
          </button>
        )}
        {cita.estado === "cancelada" && (
          <button
            type="button"
            disabled={ocupada}
            onClick={() => onCambiarEstado(cita, "confirmada")}
            className={`${btnBase} text-stone-400 ring-1 ring-stone-700 hover:text-emerald-300 hover:ring-emerald-500/40 disabled:opacity-50`}
          >
            ↺ Reactivar
          </button>
        )}
        {ocupada && (
          <span className="h-4 w-4 animate-spin self-center rounded-full border-2 border-amber-500 border-t-transparent" />
        )}
      </div>
    </li>
  );
}
