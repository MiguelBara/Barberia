// Encabezado reutilizable para cada paso del flujo de reserva.

interface TituloSeccionProps {
  titulo: string;
  subtitulo?: string;
}

export default function TituloSeccion({ titulo, subtitulo }: TituloSeccionProps) {
  return (
    <div className="mb-10 text-center">
      {/* Filete dorado decorativo sobre el título */}
      <span aria-hidden className="mx-auto mb-4 block h-0.5 w-12 bg-amber-500" />
      <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{titulo}</h2>
      {subtitulo && <p className="mt-3 text-sm font-medium text-white/60">{subtitulo}</p>}
    </div>
  );
}
