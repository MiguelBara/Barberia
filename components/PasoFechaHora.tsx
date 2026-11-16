"use client";

// Paso 2: formulario unificado de fecha y hora con Miguel.
// El usuario elige la fecha (calendario desplegable) y la hora (lista agrupada),
// revisa el resumen y pulsa "Continuar". Nada avanza solo con un clic suelto.

import { useEffect, useState, type FormEvent } from "react";
import PerfilBarbero from "@/components/PerfilBarbero";
import SelectorFecha from "@/components/SelectorFecha";
import SelectorHora from "@/components/SelectorHora";
import TituloSeccion from "@/components/TituloSeccion";
import {
  formatearFechaLarga,
  formatearPrecio,
  horaAMinutos,
  minutosAHora,
  proximosDiasLaborales,
  type Franja,
  type Servicio,
} from "@/lib/negocio";

interface PasoFechaHoraProps {
  servicio: Servicio;
  fechaInicial: string | null;
  horaInicial: string | null;
  aviso?: string | null; // Mensaje externo, ej. "ese horario se ocupó"
  versionAgenda: number; // Cambia cuando hay que volver a consultar (ej. tras una cancelación)
  onContinuar: (fecha: string, hora: string) => void;
}

/** Resultado de la última consulta, identificado por su "clave" (día + servicio + versión). */
interface Disponibilidad {
  clave: string;
  franjas: Franja[];
  error: string | null;
}

export default function PasoFechaHora({
  servicio,
  fechaInicial,
  horaInicial,
  aviso,
  versionAgenda,
  onContinuar,
}: PasoFechaHoraProps) {
  // Este paso solo se renderiza en el navegador (tras interactuar), así que la fecha es la del cliente
  const [dias] = useState(() => proximosDiasLaborales());
  const [fecha, setFecha] = useState(fechaInicial ?? dias[0]);
  const [hora, setHora] = useState<string | null>(horaInicial);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);

  const claveActual = `${fecha}|${servicio.id}|${versionAgenda}`;
  const cargando = disponibilidad?.clave !== claveActual;

  // Carga las franjas del día elegido
  useEffect(() => {
    const control = new AbortController();
    const clave = `${fecha}|${servicio.id}|${versionAgenda}`;

    fetch(`/api/citas?fecha=${fecha}&servicio=${servicio.id}`, { signal: control.signal })
      .then(async (res) => {
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error ?? "No se pudo cargar la agenda.");
        setDisponibilidad({ clave, franjas: datos.franjas, error: null });
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setDisponibilidad({ clave, franjas: [], error: error.message });
      });

    // Cancela la petición si el usuario cambia de día antes de que responda
    return () => control.abort();
  }, [fecha, servicio.id, versionAgenda]);

  // La hora elegida solo es válida si sigue libre en la agenda recién cargada
  const horaValida =
    !cargando && hora !== null && !!disponibilidad?.franjas.some((f) => f.hora === hora && f.disponible);

  function cambiarFecha(nueva: string) {
    if (nueva !== fecha) setHora(null); // Las horas libres cambian de un día a otro
    setFecha(nueva);
  }

  function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (horaValida) onContinuar(fecha, hora!);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <TituloSeccion titulo="Elige día y hora" subtitulo="Agenda tu cita con Miguel." />

      {aviso && (
        <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {aviso}
        </p>
      )}

      {/* ===== Bloque de formulario unificado ===== */}
      <form
        onSubmit={continuar}
        className="rounded-3xl border border-stone-800 bg-stone-900/40 p-5 shadow-xl shadow-black/30 sm:p-8"
      >
        <PerfilBarbero compacto />

        <div className="mt-6 space-y-6">
          {/* Campo 1: Fecha */}
          <div>
            <label htmlFor="fecha-cita" className="mb-2 block text-sm font-medium text-stone-300">
              <span className="mr-2 text-amber-500">1.</span>Fecha
            </label>
            <SelectorFecha
              id="fecha-cita"
              valor={fecha}
              diasHabilitados={dias}
              onCambiar={cambiarFecha}
            />
          </div>

          {/* Campo 2: Hora */}
          <div>
            <p className="mb-2 text-sm font-medium text-stone-300">
              <span className="mr-2 text-amber-500">2.</span>Hora
              <span className="ml-2 text-xs font-normal text-stone-500">
                ({servicio.duracionMin} min)
              </span>
            </p>
            <SelectorHora
              id="hora-cita"
              franjas={disponibilidad?.franjas ?? []}
              duracionMin={servicio.duracionMin}
              valor={hora}
              cargando={cargando}
              error={disponibilidad?.error ?? null}
              onCambiar={setHora}
            />
          </div>
        </div>

        {/* Resumen de la selección */}
        <div className="mt-8 flex flex-col gap-4 border-t border-stone-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-serif text-lg text-stone-100">{servicio.nombre}</p>
            <p className="text-stone-400">
              {horaValida
                ? `${formatearFechaLarga(fecha)} · ${hora} – ${minutosAHora(horaAMinutos(hora!) + servicio.duracionMin)} hrs`
                : "Elige una hora para continuar"}
            </p>
            <p className="font-serif text-amber-400">{formatearPrecio(servicio.precio)}</p>
          </div>

          <button
            type="submit"
            disabled={!horaValida}
            className="bg-amber-500 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] text-stone-950 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continuar →
          </button>
        </div>
      </form>
    </section>
  );
}
