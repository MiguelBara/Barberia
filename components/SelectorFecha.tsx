"use client";

// Selector de fecha con calendario desplegable.
// Solo permite elegir los días recibidos en `diasHabilitados` (laborales y dentro del rango reservable).

import { useEffect, useRef, useState } from "react";
import { fechaISO, formatearFechaLarga, parsearFecha } from "@/lib/negocio";

interface SelectorFechaProps {
  id: string;
  valor: string; // "YYYY-MM-DD"
  diasHabilitados: string[];
  onCambiar: (fecha: string) => void;
}

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

/** Primer día del mes de una fecha ISO. */
function inicioDeMes(iso: string): Date {
  const d = parsearFecha(iso)!;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function SelectorFecha({ id, valor, diasHabilitados, onCambiar }: SelectorFechaProps) {
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => inicioDeMes(valor));
  const refContenedor = useRef<HTMLDivElement>(null);

  // Límites de navegación: no se puede ir a meses sin días habilitados
  const primerMes = inicioDeMes(diasHabilitados[0]);
  const ultimoMes = inicioDeMes(diasHabilitados[diasHabilitados.length - 1]);
  const puedeRetroceder = mesVisible > primerMes;
  const puedeAvanzar = mesVisible < ultimoMes;

  // Cierra el calendario al hacer clic fuera o al presionar Escape
  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(e: MouseEvent) {
      if (!refContenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  function alternar() {
    if (!abierto) setMesVisible(inicioDeMes(valor)); // Abre en el mes de la fecha elegida
    setAbierto(!abierto);
  }

  function moverMes(delta: number) {
    setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function elegir(iso: string) {
    onCambiar(iso);
    setAbierto(false);
  }

  // Celdas del mes: huecos iniciales (semana empieza en lunes) + días del mes
  const desfase = (mesVisible.getDay() + 6) % 7;
  const diasDelMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
  const hoy = fechaISO(new Date());

  return (
    <div ref={refContenedor} className="relative">
      {/* Campo que muestra la fecha elegida */}
      <button
        id={id}
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`flex w-full items-center gap-3 rounded-xl border bg-stone-900/60 px-4 py-3 text-left text-stone-100 transition-colors hover:border-amber-500/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
          abierto ? "border-amber-500" : "border-stone-700"
        }`}
      >
        <span aria-hidden className="text-amber-400">📅</span>
        <span className="flex-1">{formatearFechaLarga(valor)}</span>
        <span
          aria-hidden
          className={`text-stone-500 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {/* Calendario desplegable */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-stone-700 bg-stone-900 p-4 shadow-2xl shadow-black/60 motion-safe:animate-entrada sm:right-auto sm:w-80"
        >
          {/* Navegación entre meses */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moverMes(-1)}
              disabled={!puedeRetroceder}
              aria-label="Mes anterior"
              className="h-8 w-8 rounded-full text-stone-300 hover:bg-stone-800 disabled:opacity-20"
            >
              ‹
            </button>
            <p className="text-sm font-semibold capitalize text-stone-100">
              {mesVisible.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => moverMes(1)}
              disabled={!puedeAvanzar}
              aria-label="Mes siguiente"
              className="h-8 w-8 rounded-full text-stone-300 hover:bg-stone-800 disabled:opacity-20"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="pb-1 text-xs font-medium text-stone-500">
                {d}
              </span>
            ))}

            {Array.from({ length: desfase }, (_, i) => (
              <span key={`hueco-${i}`} />
            ))}

            {Array.from({ length: diasDelMes }, (_, i) => {
              const iso = fechaISO(
                new Date(mesVisible.getFullYear(), mesVisible.getMonth(), i + 1),
              );
              const habilitado = diasHabilitados.includes(iso);
              const elegido = iso === valor;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!habilitado}
                  onClick={() => elegir(iso)}
                  aria-pressed={elegido}
                  aria-label={formatearFechaLarga(iso)}
                  className={`relative h-9 rounded-lg text-sm transition-colors ${
                    elegido
                      ? "bg-amber-500 font-semibold text-stone-950"
                      : habilitado
                        ? "text-stone-200 hover:bg-amber-500/20 hover:text-amber-300"
                        : "cursor-not-allowed text-stone-700"
                  }`}
                >
                  {i + 1}
                  {/* Punto que marca el día de hoy */}
                  {iso === hoy && !elegido && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 border-t border-stone-800 pt-3 text-xs text-stone-500">
            Atendemos de lunes a lunes · 09:00 a 21:00 hrs
          </p>
        </div>
      )}
    </div>
  );
}
