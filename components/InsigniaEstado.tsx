// Etiqueta de color con el estado de una cita.

import { INFO_ESTADO, type EstadoCita } from "@/lib/negocio";

export default function InsigniaEstado({ estado }: { estado: EstadoCita }) {
  const { etiqueta, clases } = INFO_ESTADO[estado];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${clases}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {etiqueta}
    </span>
  );
}
