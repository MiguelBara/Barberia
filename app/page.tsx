"use client";

// Página principal: flujo de reserva en 4 pasos con Miguel.
//   1. Servicio → 2. Fecha y hora → 3. Datos del cliente → 4. Ticket
// Es un Client Component porque mantiene el estado del flujo.

import { useRef, useState } from "react";
import ModalCancelacion from "@/components/ModalCancelacion";
import NavegacionFlujo from "@/components/NavegacionFlujo";
import PasoDatosCliente from "@/components/PasoDatosCliente";
import PasoFechaHora from "@/components/PasoFechaHora";
import PasoServicio from "@/components/PasoServicio";
import TicketConfirmacion from "@/components/TicketConfirmacion";
import { BARBERO, type Cita, type DatosCliente, type Servicio } from "@/lib/negocio";

type Paso = 1 | 2 | 3 | 4;

const CLIENTE_VACIO: DatosCliente = { nombre: "", telefono: "", notas: "" };

// Tarjetas de atributos del encabezado
const ATRIBUTOS = [
  { icono: "✂", titulo: "Cortes de precisión", texto: "Técnica clásica y estilos actuales, a tu medida." },
  { icono: "🪒", titulo: "Barba y afeitado", texto: "Perfilado, toalla caliente y productos de calidad." },
  { icono: "☕", titulo: "Un lugar tranquilo", texto: "Atención sin prisas, con tu hora reservada." },
];

// Pausa antes de avanzar, para que se vea la tarjeta marcada como elegida
const PAUSA_TRANSICION_MS = 350;

export default function Home() {
  const [paso, setPaso] = useState<Paso>(1);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [cliente, setCliente] = useState<DatosCliente>(CLIENTE_VACIO);
  const [cita, setCita] = useState<Cita | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  // Se incrementa tras una cancelación para que el Paso 2 vuelva a consultar la agenda
  const [versionAgenda, setVersionAgenda] = useState(0);

  const refContenido = useRef<HTMLDivElement>(null);

  /** Cambia de paso y lleva la vista al inicio del contenido. */
  function irA(nuevoPaso: Paso) {
    setPaso(nuevoPaso);
    refContenido.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ----- Manejadores de cada paso -----

  function elegirServicio(elegido: Servicio) {
    // Si cambia el servicio, la hora elegida antes puede no servir (otra duración)
    if (elegido.id !== servicio?.id) setHora(null);
    setServicio(elegido);
    setAviso(null);
    setTimeout(() => irA(2), PAUSA_TRANSICION_MS);
  }

  function elegirFechaHora(nuevaFecha: string, nuevaHora: string) {
    setFecha(nuevaFecha);
    setHora(nuevaHora);
    setAviso(null);
    irA(3);
  }

  function citaConfirmada(nueva: Cita) {
    setCita(nueva);
    irA(4);
  }

  /** La API respondió 409: otro cliente tomó la hora. Volvemos al calendario. */
  function horarioOcupado(mensaje: string) {
    setHora(null); // Los datos del cliente se conservan en `cliente`
    setAviso(mensaje);
    irA(2);
  }

  /** Botón "Atrás" de la barra de navegación del flujo. */
  function atras() {
    setAviso(null);
    if (paso === 3) irA(2);
    else if (paso === 2) irA(1);
  }

  /** Reinicia todo y vuelve al paso 1 ("Salir" o "Volver al inicio"). */
  function nuevaReserva() {
    setServicio(null);
    setFecha(null);
    setHora(null);
    setCliente(CLIENTE_VACIO);
    setCita(null);
    setAviso(null);
    irA(1);
  }

  return (
    <div className="flex-1">
      {/* ===== Encabezado ===== */}
      <header className="relative overflow-hidden border-b border-white/10">
        {/* Textura sutil: líneas diagonales + brillo dorado lateral */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.025)_0_1px,transparent_1px_14px)]" />
        <div className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-28">
          {/* Texto principal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
              Bienvenido a Angel urban style
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Somos expertos en cortes y arreglo de <span className="text-amber-500">barba</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium text-white/60">
              Estilo clásico, precisión moderna. Reserva tu hora con {BARBERO.nombre} en menos de un minuto.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => irA(1)}
                className="bg-amber-500 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-950 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/20 active:scale-[0.98]"
              >
                Haz tu cita
              </button>
              <button
                type="button"
                onClick={() => setModalCancelarAbierto(true)}
                className="border border-white/15 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition-all duration-300 ease-out hover:border-amber-500 hover:text-amber-400 active:scale-[0.98]"
              >
                Cancelar una cita
              </button>
            </div>
          </div>

          {/* Atributos de la barbería (tarjetas con ícono dorado) */}
          <ul className="grid gap-4">
            {ATRIBUTOS.map((a) => (
              <li
                key={a.titulo}
                className="flex overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-amber-500/40"
              >
                <span aria-hidden className="flex w-20 shrink-0 items-center justify-center bg-amber-500 text-3xl text-stone-950">
                  {a.icono}
                </span>
                <span className="p-5">
                  <span className="block font-bold text-white">{a.titulo}</span>
                  <span className="mt-1 block text-sm text-white/60">{a.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* ===== Progreso + Atrás / Salir (fijo bajo la Navbar) ===== */}
      <nav
        aria-label="Progreso de la reserva"
        className="sticky top-16 z-30 border-b border-stone-800 bg-stone-950/85 py-3 backdrop-blur sm:py-4"
      >
        <NavegacionFlujo paso={paso} onAtras={atras} onSalir={nuevaReserva} />
      </nav>

      {/* ===== Contenido del paso actual ===== */}
      <main ref={refContenido} className="mx-auto max-w-5xl scroll-mt-48 px-6 py-16 sm:py-20">
        {/* La key fuerza a React a montar de nuevo el bloque y repetir la animación de entrada */}
        <div key={paso} className="motion-safe:animate-entrada">
          {paso === 1 && (
            <PasoServicio servicioId={servicio?.id ?? null} onSeleccionar={elegirServicio} />
          )}

          {paso === 2 && servicio && (
            <PasoFechaHora
              servicio={servicio}
              fechaInicial={fecha}
              horaInicial={hora}
              aviso={aviso}
              versionAgenda={versionAgenda}
              onContinuar={elegirFechaHora}
            />
          )}

          {paso === 3 && servicio && fecha && hora && (
            <PasoDatosCliente
              servicio={servicio}
              fecha={fecha}
              hora={hora}
              datos={cliente}
              onCambiarDatos={setCliente}
              onConfirmada={citaConfirmada}
              onHorarioOcupado={horarioOcupado}
            />
          )}

          {paso === 4 && cita && (
            <TicketConfirmacion cita={cita} onNuevaReserva={nuevaReserva} />
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-stone-900 py-12 text-center text-xs">
        <p className="font-extrabold uppercase tracking-[0.3em] text-white">
          Angel <span className="text-amber-500">Urban Style</span>
        </p>
        <p className="mt-3 text-white/50">Lunes a lunes · 09:00 a 21:00 hrs</p>
        <button
          type="button"
          onClick={() => setModalCancelarAbierto(true)}
          className="mt-3 text-white/50 underline underline-offset-4 transition-colors hover:text-amber-400"
        >
          ¿Necesitas cancelar tu cita?
        </button>
      </footer>

      {/* Modal de cancelación: se monta solo cuando está abierto */}
      {modalCancelarAbierto && (
        <ModalCancelacion
          onCerrar={() => setModalCancelarAbierto(false)}
          onCancelada={() => setVersionAgenda((v) => v + 1)}
        />
      )}
    </div>
  );
}
