"use client";

// Panel de Miguel: métricas del día, filtros y agenda de citas.
// Se actualiza solo cada 15 segundos (y al volver a la pestaña) para ver
// las reservas nuevas casi en tiempo real.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilaCita, { COLUMNAS_TABLA } from "@/components/admin/FilaCita";
import TarjetaEstadistica from "@/components/admin/TarjetaEstadistica";
import { cerrarSesion } from "@/app/admin/acciones";
import {
  formatearFechaLarga,
  formatearPrecio,
  horaAMinutos,
  type Cita,
  type EstadoCita,
} from "@/lib/negocio";

const INTERVALO_ACTUALIZACION_MS = 15_000;

type Vista = "proximas" | "hoy" | "historial" | "todas";
type FiltroEstado = "todos" | EstadoCita;

const VISTAS: { id: Vista; etiqueta: string }[] = [
  { id: "proximas", etiqueta: "Próximas" },
  { id: "hoy", etiqueta: "Hoy" },
  { id: "historial", etiqueta: "Historial" },
  { id: "todas", etiqueta: "Todas" },
];

const FILTROS_ESTADO: { id: FiltroEstado; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos los estados" },
  { id: "confirmada", etiqueta: "Confirmadas" },
  { id: "completada", etiqueta: "Completadas" },
  { id: "cancelada", etiqueta: "Canceladas" },
];

interface PanelCitasProps {
  citasIniciales: Cita[]; // Vienen del servidor en la primera carga
  generadoEn: string; // Momento (ISO) en que el servidor leyó las citas
  hoy: string; // Fecha de hoy según el servidor (la misma en servidor y navegador)
}

/** Minutos desde medianoche de "ahora", para comparar con la hora de las citas. */
function minutosAhora(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export default function PanelCitas({ citasIniciales, generadoEn, hoy }: PanelCitasProps) {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>(citasIniciales);
  // Se parte de la hora del servidor para que el HTML inicial y el navegador coincidan
  const [actualizadoEn, setActualizadoEn] = useState(() => new Date(generadoEn));
  const [vista, setVista] = useState<Vista>("proximas");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [idsOcupados, setIdsOcupados] = useState<number[]>([]);
  const [aviso, setAviso] = useState<{ tipo: "error" | "ok"; texto: string } | null>(null);


  /** Muestra un aviso flotante que desaparece solo. */
  const mostrarAviso = useCallback((tipo: "error" | "ok", texto: string) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4500);
  }, []);

  /** Vuelve a pedir todas las citas al servidor. */
  const recargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/citas", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login"); // La sesión expiró
        return;
      }
      const datos = await res.json();
      setCitas(datos.citas);
      setActualizadoEn(new Date());
    } catch {
      // Sin conexión: se mantiene la última lista y se reintenta en el siguiente ciclo
    }
  }, [router]);

  // Actualización periódica + al volver a la pestaña
  useEffect(() => {
    const intervalo = setInterval(recargar, INTERVALO_ACTUALIZACION_MS);
    const alVolver = () => document.visibilityState === "visible" && recargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [recargar]);

  /** Envía el nuevo estado a la API y actualiza la cita en la lista. */
  async function cambiarEstado(cita: Cita, estado: EstadoCita) {
    setIdsOcupados((ids) => [...ids, cita.id]);
    try {
      const res = await fetch(`/api/admin/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const datos = await res.json();
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(datos.error ?? "No se pudo actualizar la cita.");

      setCitas((lista) => lista.map((c) => (c.id === cita.id ? datos.cita : c)));
      const textos: Record<EstadoCita, string> = {
        completada: "se marcó como completada",
        cancelada: "se canceló. El horario quedó libre",
        confirmada: "vuelve a estar confirmada",
      };
      mostrarAviso("ok", `La cita de ${cita.clienteNombre} ${textos[estado]}.`);
    } catch (error) {
      mostrarAviso("error", error instanceof Error ? error.message : "Error de conexión.");
    } finally {
      setIdsOcupados((ids) => ids.filter((id) => id !== cita.id));
    }
  }

  // ----- Métricas del día -----
  const metricas = useMemo(() => {
    const deHoy = citas.filter((c) => c.fecha === hoy && c.estado !== "cancelada");
    const suma = (lista: Cita[]) => lista.reduce((total, c) => total + c.precio, 0);
    const ahora = minutosAhora();
    return {
      citasHoy: deHoy.length,
      pendientesHoy: deHoy.filter((c) => c.estado === "confirmada").length,
      ingresosHoy: suma(deHoy.filter((c) => c.estado === "completada")),
      porCobrarHoy: suma(deHoy.filter((c) => c.estado === "confirmada")),
      proximas: citas.filter(
        (c) =>
          c.estado === "confirmada" &&
          (c.fecha > hoy || (c.fecha === hoy && horaAMinutos(c.horaInicio) >= ahora)),
      ).length,
      canceladas: citas.filter((c) => c.estado === "cancelada" && c.fecha >= hoy).length,
    };
  }, [citas, hoy]);

  // La próxima cita confirmada desde ahora (se resalta en la lista)
  const idSiguiente = useMemo(() => {
    const ahora = minutosAhora();
    return citas.find(
      (c) =>
        c.estado === "confirmada" &&
        (c.fecha > hoy || (c.fecha === hoy && horaAMinutos(c.horaFin) > ahora)),
    )?.id;
  }, [citas, hoy]);

  // ----- Filtros y agrupación por día -----
  const grupos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    let lista = citas.filter((c) => {
      if (vista === "hoy" && c.fecha !== hoy) return false;
      if (vista === "proximas" && c.fecha < hoy) return false;
      if (vista === "historial" && c.fecha >= hoy) return false;
      if (filtroEstado !== "todos" && c.estado !== filtroEstado) return false;
      if (!texto) return true;
      return (
        c.clienteNombre.toLowerCase().includes(texto) ||
        c.clienteTelefono.includes(texto.replace(/\D/g, "") || "—") ||
        c.codigo.toLowerCase().includes(texto)
      );
    });
    // El historial se lee de lo más reciente a lo más antiguo
    if (vista === "historial") lista = [...lista].reverse();

    const porDia = new Map<string, Cita[]>();
    for (const cita of lista) {
      porDia.set(cita.fecha, [...(porDia.get(cita.fecha) ?? []), cita]);
    }
    return [...porDia.entries()];
  }, [citas, vista, filtroEstado, busqueda, hoy]);

  const totalFiltradas = grupos.reduce((n, [, lista]) => n + lista.length, 0);

  return (
    <div className="space-y-8">
      {/* ===== Cabecera del panel ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Portal del Barbero</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-100 sm:text-4xl">Hola, Miguel</h1>
          <p className="mt-1 text-sm text-stone-400">{formatearFechaLarga(hoy)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={recargar}
            className="flex items-center gap-2 rounded-full border border-stone-800 px-3 py-2 text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-200"
            title="Actualizar ahora"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            En vivo ·{" "}
            {/* La zona horaria del servidor puede diferir de la del navegador */}
            <span suppressHydrationWarning>
              {actualizadoEn.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </button>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-full border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 transition-colors hover:border-red-500/50 hover:text-red-300"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {/* ===== Métricas ===== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaEstadistica
          titulo="Citas hoy"
          valor={String(metricas.citasHoy)}
          detalle={`${metricas.pendientesHoy} por atender`}
          destacada
        />
        <TarjetaEstadistica
          titulo="Ingresos hoy"
          valor={formatearPrecio(metricas.ingresosHoy)}
          detalle={`+${formatearPrecio(metricas.porCobrarHoy)} por cobrar`}
        />
        <TarjetaEstadistica
          titulo="Próximas"
          valor={String(metricas.proximas)}
          detalle="confirmadas desde ahora"
        />
        <TarjetaEstadistica
          titulo="Canceladas"
          valor={String(metricas.canceladas)}
          detalle="de hoy en adelante"
        />
      </div>

      {/* ===== Filtros ===== */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-full border border-stone-800 bg-stone-900/50 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVista(v.id)}
              aria-pressed={vista === v.id}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                vista === v.id
                  ? "bg-amber-500 font-semibold text-stone-950"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {v.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            aria-label="Filtrar por estado"
            className="rounded-full border border-stone-800 bg-stone-900 px-4 py-2 text-sm text-stone-300 outline-none [color-scheme:dark] focus:border-amber-500"
          >
            {FILTROS_ESTADO.map((f) => (
              <option key={f.id} value={f.id}>
                {f.etiqueta}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, celular o código…"
            aria-label="Buscar citas"
            className="rounded-full border border-stone-800 bg-stone-900 px-4 py-2 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus:border-amber-500 sm:w-72"
          />
        </div>
      </div>

      {/* ===== Agenda ===== */}
      {totalFiltradas === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-800 px-6 py-16 text-center">
          <p className="text-4xl">✂</p>
          <p className="mt-3 font-serif text-xl text-stone-300">No hay citas para mostrar</p>
          <p className="mt-1 text-sm text-stone-500">Prueba con otra vista o quita los filtros.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map(([fecha, lista]) => {
            const ingresosDia = lista
              .filter((c) => c.estado !== "cancelada")
              .reduce((t, c) => t + c.precio, 0);
            return (
              <section key={fecha}>
                {/* Encabezado del día */}
                <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
                  <h2 className="font-serif text-lg text-stone-200">
                    {fecha === hoy && <span className="mr-2 text-amber-400">Hoy ·</span>}
                    {formatearFechaLarga(fecha)}
                  </h2>
                  <p className="shrink-0 text-xs text-stone-500">
                    {lista.length} {lista.length === 1 ? "cita" : "citas"} ·{" "}
                    {formatearPrecio(ingresosDia)}
                  </p>
                </div>

                <div className="md:overflow-hidden md:rounded-2xl md:border md:border-stone-800 md:bg-stone-900/30">
                  {/* Cabecera de tabla (solo escritorio) */}
                  <div
                    className={`hidden border-b border-stone-800 bg-stone-900/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 ${COLUMNAS_TABLA}`}
                  >
                    <span>Hora</span>
                    <span>Cliente</span>
                    <span>WhatsApp</span>
                    <span>Servicio</span>
                    <span>Precio</span>
                    <span>Estado</span>
                    <span className="text-right">Acciones</span>
                  </div>
                  <ul className="space-y-3 md:space-y-0">
                    {lista.map((cita) => (
                      <FilaCita
                        key={cita.id}
                        cita={cita}
                        esSiguiente={cita.id === idSiguiente}
                        ocupada={idsOcupados.includes(cita.id)}
                        onCambiarEstado={cambiarEstado}
                      />
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ===== Aviso flotante ===== */}
      {aviso && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm shadow-2xl motion-safe:animate-entrada ${
            aviso.tipo === "ok"
              ? "border-emerald-500/40 bg-stone-900 text-emerald-300"
              : "border-red-500/40 bg-stone-900 text-red-300"
          }`}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
