// Selector de hora: muestra las franjas agrupadas por los bloques de HORARIO (mañana y tarde).
// El almuerzo no aparece porque generarFranjas() nunca crea franjas fuera de los bloques.
// Las horas que ya pasaron no llegan desde la API; las ocupadas se ven tachadas.

import { HORARIO, horaAMinutos, minutosAHora, type Franja } from "@/lib/negocio";

interface SelectorHoraProps {
  id: string;
  franjas: Franja[];
  duracionMin: number;
  valor: string | null;
  cargando: boolean;
  error: string | null;
  onCambiar: (hora: string) => void;
}

const NOMBRES_BLOQUE = ["Mañana", "Tarde"];

/** "10:00" + 45 min → "10:00 – 10:45" */
function rango(hora: string, duracionMin: number): string {
  return `${hora} – ${minutosAHora(horaAMinutos(hora) + duracionMin)}`;
}

export default function SelectorHora({
  id,
  franjas,
  duracionMin,
  valor,
  cargando,
  error,
  onCambiar,
}: SelectorHoraProps) {
  if (cargando) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-stone-800/70" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  const libres = franjas.filter((f) => f.disponible).length;
  if (libres === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-700 px-4 py-6 text-center text-sm text-stone-500">
        No quedan horas libres este día. Elige otra fecha.
      </p>
    );
  }

  // Reparte las franjas en sus bloques del horario (mañana / tarde)
  const bloques = HORARIO.bloques
    .map((bloque, i) => ({
      titulo: NOMBRES_BLOQUE[i] ?? `Bloque ${i + 1}`,
      desde: bloque.inicio,
      hasta: bloque.fin,
      franjas: franjas.filter(
        (f) =>
          horaAMinutos(f.hora) >= horaAMinutos(bloque.inicio) &&
          horaAMinutos(f.hora) < horaAMinutos(bloque.fin),
      ),
    }))
    // Un bloque sin franjas (ej. la mañana cuando ya pasó) no se muestra
    .filter((bloque) => bloque.franjas.length > 0);

  return (
    <div id={id} role="radiogroup" aria-label="Hora de la cita" className="space-y-4">
      {bloques.map((bloque) => {
        const libresBloque = bloque.franjas.filter((f) => f.disponible).length;
        return (
          <div key={bloque.titulo}>
            <div>
              <p className="mb-2 flex justify-between text-xs uppercase tracking-widest text-stone-500">
                <span>
                  {bloque.titulo} · {bloque.desde} a {bloque.hasta}
                </span>
                <span className={libresBloque > 0 ? "text-amber-500/80" : ""}>
                  {libresBloque} {libresBloque === 1 ? "libre" : "libres"}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {bloque.franjas.map(({ hora, disponible }) => {
                  const elegida = hora === valor;
                  return (
                    <button
                      key={hora}
                      type="button"
                      role="radio"
                      aria-checked={elegida}
                      disabled={!disponible}
                      title={disponible ? undefined : "No disponible (ocupada o ya pasó)"}
                      onClick={() => onCambiar(hora)}
                      className={`rounded-lg border px-2 py-2 text-sm tabular-nums transition-all duration-200 ${
                        elegida
                          ? "border-amber-500 bg-amber-500 font-semibold text-stone-950 shadow-md shadow-amber-500/20"
                          : disponible
                            ? "border-stone-700 text-stone-200 hover:border-amber-500/70 hover:text-amber-300"
                            : "cursor-not-allowed border-stone-800/60 text-stone-600 line-through"
                      }`}
                    >
                      {rango(hora, duracionMin)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-stone-600">Las horas tachadas ya están ocupadas.</p>
    </div>
  );
}
