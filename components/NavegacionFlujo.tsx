"use client";

// Barra fija del flujo de reserva: botón "Atrás", progreso y "Salir / Volver al inicio".
// Siempre visible mientras el cliente reserva, para que nunca se sienta atrapado.

import BotonConfirmar from "@/components/BotonConfirmar";
import IndicadorPasos from "@/components/IndicadorPasos";

interface NavegacionFlujoProps {
  paso: number;
  onAtras: () => void;
  onSalir: () => void; // Reinicia la reserva y vuelve al paso 1
}

const estiloBoton =
  "flex h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors sm:px-4";

export default function NavegacionFlujo({ paso, onAtras, onSalir }: NavegacionFlujoProps) {
  const puedeVolver = paso === 2 || paso === 3;

  return (
    <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 sm:gap-4">
      {/* Izquierda: Atrás (ancho fijo para que el progreso quede centrado) */}
      <div className="w-12 shrink-0 sm:w-32">
        {puedeVolver && (
          <button
            type="button"
            onClick={onAtras}
            className={`${estiloBoton} border-stone-700 text-stone-300 hover:border-amber-500/60 hover:text-amber-400`}
            aria-label="Volver al paso anterior"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Atrás</span>
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <IndicadorPasos pasoActual={paso} />
      </div>

      {/* Derecha: salir del flujo */}
      <div className="flex w-12 shrink-0 justify-end sm:w-32">
        {puedeVolver && (
          // Pide confirmación: se perdería lo elegido hasta ahora
          <BotonConfirmar
            onConfirmar={onSalir}
            textoConfirmar="¿Salir?"
            titulo="Cancelar la reserva y volver al inicio"
            className={`${estiloBoton} border-stone-700 text-stone-400 hover:border-red-500/50 hover:text-red-300`}
            clasesConfirmar={`${estiloBoton} border-red-500 bg-red-600 text-white`}
          >
            <span aria-hidden>✕</span>
            <span className="hidden sm:inline">Salir</span>
          </BotonConfirmar>
        )}
        {paso === 4 && (
          <button
            type="button"
            onClick={onSalir}
            className={`${estiloBoton} border-amber-500/60 text-amber-400 hover:bg-amber-500 hover:text-stone-950`}
            aria-label="Volver al inicio"
          >
            <span aria-hidden>⌂</span>
            <span className="hidden sm:inline">Inicio</span>
          </button>
        )}
      </div>
    </div>
  );
}
