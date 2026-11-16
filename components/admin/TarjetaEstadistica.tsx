// Tarjeta pequeña con una métrica del día para el panel del barbero.

interface TarjetaEstadisticaProps {
  titulo: string;
  valor: string;
  detalle?: string;
  destacada?: boolean;
}

export default function TarjetaEstadistica({ titulo, valor, detalle, destacada }: TarjetaEstadisticaProps) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        destacada ? "border-amber-500/40 bg-amber-500/5" : "border-stone-800 bg-stone-900/50"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-stone-500">{titulo}</p>
      <p
        className={`mt-2 font-serif text-2xl tabular-nums sm:text-3xl ${
          destacada ? "text-amber-400" : "text-stone-100"
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-stone-500">{detalle}</p>}
    </div>
  );
}
