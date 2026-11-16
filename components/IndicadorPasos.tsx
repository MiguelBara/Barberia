// Barra de progreso del flujo de reserva (Servicio → Fecha → Datos → Ticket).

const PASOS = ["Servicio", "Fecha y hora", "Tus datos", "Confirmación"];

interface IndicadorPasosProps {
  pasoActual: number; // 1 a 4
}

export default function IndicadorPasos({ pasoActual }: IndicadorPasosProps) {
  return (
    <ol className="mx-auto flex max-w-2xl items-center px-4">
      {PASOS.map((nombre, i) => {
        const numero = i + 1;
        const completado = numero < pasoActual;
        const activo = numero === pasoActual;

        return (
          <li key={nombre} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-500 ${
                  completado
                    ? "border-amber-500 bg-amber-500 text-stone-950"
                    : activo
                      ? "scale-110 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20"
                      : "border-stone-700 text-stone-500"
                }`}
              >
                {completado ? "✓" : numero}
              </span>
              <span
                className={`hidden text-xs uppercase tracking-wider sm:block ${
                  activo ? "text-amber-400" : "text-stone-500"
                }`}
              >
                {nombre}
              </span>
            </div>
            {/* Línea que une un paso con el siguiente */}
            {numero < PASOS.length && (
              <div className="mx-2 h-px flex-1 bg-stone-800 sm:mb-6">
                <div
                  className={`h-full bg-amber-500 transition-all duration-700 ${
                    completado ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
