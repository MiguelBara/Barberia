// Paso 1: elección del servicio.

import TarjetaServicio from "@/components/TarjetaServicio";
import TituloSeccion from "@/components/TituloSeccion";
import { SERVICIOS, type Servicio } from "@/lib/negocio";

interface PasoServicioProps {
  servicioId: string | null;
  onSeleccionar: (servicio: Servicio) => void;
}

export default function PasoServicio({ servicioId, onSeleccionar }: PasoServicioProps) {
  return (
    <section>
      <TituloSeccion
        titulo="Elige tu servicio"
        subtitulo="Todos los servicios incluyen bebida de cortesía."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICIOS.map((servicio) => (
          <TarjetaServicio
            key={servicio.id}
            servicio={servicio}
            seleccionado={servicio.id === servicioId}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </div>
    </section>
  );
}
