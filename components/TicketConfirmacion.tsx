// Paso 4: ticket digital con los detalles de la cita confirmada.

import { formatearFechaLarga, formatearPrecio, type Cita } from "@/lib/negocio";

interface TicketConfirmacionProps {
  cita: Cita;
  onNuevaReserva: () => void;
}

/** Fila "etiqueta ........ valor" del ticket. */
function FilaTicket({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-xs uppercase tracking-widest text-stone-500">{etiqueta}</dt>
      <dd className="text-right text-stone-100">{valor}</dd>
    </div>
  );
}

export default function TicketConfirmacion({ cita, onNuevaReserva }: TicketConfirmacionProps) {
  return (
    <section className="mx-auto max-w-md text-center">
      {/* Ícono de éxito animado */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-3xl text-stone-950 shadow-lg shadow-amber-500/30 motion-safe:animate-aparecer">
        ✓
      </div>
      <h2 className="font-serif text-3xl text-stone-100">¡Reserva confirmada!</h2>
      <p className="mt-2 text-sm text-stone-400">
        Te esperamos, {cita.clienteNombre.split(" ")[0]}. Guarda este ticket.
      </p>

      {/* ===== Ticket ===== */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-amber-500/40 bg-stone-900 text-left shadow-2xl shadow-black/40">
        {/* Cabecera del ticket */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-stone-950">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]">Angel urban style</p>
          <p className="mt-1 font-serif text-2xl">{cita.servicioNombre}</p>
        </div>

        <dl className="divide-y divide-stone-800 px-6 py-3">
          <FilaTicket etiqueta="Fecha" valor={formatearFechaLarga(cita.fecha)} />
          <FilaTicket etiqueta="Hora" valor={`${cita.horaInicio} – ${cita.horaFin} hrs`} />
          <FilaTicket etiqueta="Barbero" valor={cita.barbero} />
          <FilaTicket etiqueta="Cliente" valor={cita.clienteNombre} />
          <FilaTicket etiqueta="WhatsApp" valor={cita.clienteTelefono} />
          {cita.notas && <FilaTicket etiqueta="Notas" valor={cita.notas} />}
        </dl>

        {/* Línea perforada con muescas laterales */}
        <div className="relative flex items-center px-6">
          <span className="absolute -left-3 h-6 w-6 rounded-full bg-stone-950" />
          <span className="w-full border-t-2 border-dashed border-stone-700" />
          <span className="absolute -right-3 h-6 w-6 rounded-full bg-stone-950" />
        </div>

        <div className="flex items-end justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500">Código</p>
            <p className="font-mono text-lg tracking-widest text-amber-400">{cita.codigo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-stone-500">Total</p>
            <p className="font-serif text-2xl text-stone-100">{formatearPrecio(cita.precio)}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        El pago se realiza en el local. Si no puedes asistir, cancela con tu código desde
        &quot;¿Necesitas cancelar tu cita?&quot; para liberar la hora.
      </p>

      <button
        type="button"
        onClick={onNuevaReserva}
        className="mt-8 border border-amber-500 px-8 py-4 text-xs uppercase tracking-[0.2em] font-semibold text-amber-400 transition-colors hover:bg-amber-500 hover:text-stone-950"
      >
        Hacer otra reserva
      </button>
    </section>
  );
}
