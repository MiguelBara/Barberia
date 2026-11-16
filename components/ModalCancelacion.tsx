"use client";

// Modal para que el cliente cancele su cita con su código de reserva y su celular.
// Flujo: 1) buscar la cita → 2) revisar y confirmar → 3) cancelada.
// Se monta solo cuando está abierto, así su estado se reinicia en cada apertura.

import { useEffect, useRef, useState, type FormEvent } from "react";
import CampoFormulario, { clasesCampo } from "@/components/CampoFormulario";
import InsigniaEstado from "@/components/InsigniaEstado";
import { formatearFechaLarga, formatearPrecio, type Cita } from "@/lib/negocio";

interface ModalCancelacionProps {
  onCerrar: () => void;
  onCancelada: (cita: Cita) => void; // Avisa a la página para refrescar la agenda
}

type Fase = "buscar" | "confirmar" | "cancelada";

/** Envía código y teléfono a una ruta de la API y devuelve la cita o lanza el mensaje de error. */
async function llamarApi(ruta: string, codigo: string, telefono: string): Promise<Cita> {
  const res = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, telefono }),
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.error ?? "Ocurrió un error. Intenta de nuevo.");
  return datos.cita;
}

export default function ModalCancelacion({ onCerrar, onCancelada }: ModalCancelacionProps) {
  const refDialogo = useRef<HTMLDialogElement>(null);
  const [fase, setFase] = useState<Fase>("buscar");
  const [codigo, setCodigo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cita, setCita] = useState<Cita | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Abre el <dialog> nativo como modal (bloquea el fondo y gestiona el foco)
  useEffect(() => {
    refDialogo.current?.showModal();
  }, []);

  /** Ejecuta una llamada mostrando el estado de carga y capturando errores. */
  async function ejecutar(accion: () => Promise<void>) {
    setError(null);
    setCargando(true);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No hay conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!codigo.trim() || !telefono.trim()) {
      setError("Completa ambos campos.");
      return;
    }
    ejecutar(async () => {
      setCita(await llamarApi("/api/citas/buscar", codigo, telefono));
      setFase("confirmar");
    });
  }

  function cancelar() {
    ejecutar(async () => {
      const cancelada = await llamarApi("/api/citas/cancelar", codigo, telefono);
      setCita(cancelada);
      setFase("cancelada");
      onCancelada(cancelada);
    });
  }

  return (
    <dialog
      ref={refDialogo}
      onClose={onCerrar} // Se dispara con Escape o al llamar close()
      onClick={(e) => e.target === refDialogo.current && refDialogo.current?.close()} // Clic en el fondo
      aria-labelledby="titulo-cancelacion"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-700 bg-stone-900 p-0 text-stone-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm motion-safe:animate-entrada"
    >
      <div className="p-6 sm:p-8">
        {/* Cabecera */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-cancelacion" className="font-serif text-2xl text-stone-100">
              {fase === "cancelada" ? "Cita cancelada" : "Cancelar mi cita"}
            </h2>
            {fase === "buscar" && (
              <p className="mt-1 text-sm text-stone-400">
                Ingresa el código de tu ticket y el celular con que reservaste.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => refDialogo.current?.close()}
            aria-label="Cerrar"
            className="h-8 w-8 shrink-0 rounded-full text-xl text-stone-500 hover:bg-stone-800 hover:text-stone-200"
          >
            ×
          </button>
        </div>

        {/* ===== Fase 1: buscar ===== */}
        {fase === "buscar" && (
          <form onSubmit={buscar} noValidate className="space-y-5">
            <CampoFormulario id="codigo-reserva" etiqueta="Código de reserva">
              <input
                id="codigo-reserva"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="BSP-SF6Y8P"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className={`${clasesCampo()} font-mono tracking-widest`}
              />
            </CampoFormulario>
            <CampoFormulario id="telefono-cancelacion" etiqueta="Celular / WhatsApp">
              <input
                id="telefono-cancelacion"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+56 9 1234 5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={clasesCampo()}
              />
            </CampoFormulario>

            {error && <MensajeError texto={error} />}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-amber-500 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
            >
              {cargando ? "Buscando…" : "Buscar mi cita"}
            </button>
          </form>
        )}

        {/* ===== Fase 2: revisar y confirmar ===== */}
        {fase === "confirmar" && cita && (
          <div className="space-y-5">
            <ResumenCita cita={cita} />

            {cita.estado !== "confirmada" ? (
              <p className="rounded-xl border border-stone-700 bg-stone-800/50 px-4 py-3 text-sm text-stone-400">
                {cita.estado === "cancelada"
                  ? "Esta cita ya estaba cancelada. No necesitas hacer nada más."
                  : "Esta cita ya fue atendida, por lo que no se puede cancelar."}
              </p>
            ) : (
              <p className="text-sm text-stone-400">
                ¿Seguro que quieres cancelar? El horario quedará libre para otra persona.
              </p>
            )}

            {error && <MensajeError texto={error} />}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setFase("buscar");
                  setError(null);
                }}
                className="flex-1 rounded-full border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 hover:border-stone-500"
              >
                Volver
              </button>
              {cita.estado === "confirmada" && (
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={cargando}
                  className="flex-1 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {cargando ? "Cancelando…" : "Sí, cancelar cita"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== Fase 3: listo ===== */}
        {fase === "cancelada" && cita && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-2xl text-stone-300 motion-safe:animate-aparecer">
              ✕
            </div>
            <p className="text-sm text-stone-400">
              Tu cita del{" "}
              <span className="text-stone-200">{formatearFechaLarga(cita.fecha).toLowerCase()}</span> a
              las <span className="text-stone-200">{cita.horaInicio}</span> fue cancelada. ¡Esperamos
              verte pronto!
            </p>
            <button
              type="button"
              onClick={() => refDialogo.current?.close()}
              className="w-full border border-amber-500 px-6 py-4 text-xs uppercase tracking-[0.2em] font-semibold text-amber-400 transition-colors hover:bg-amber-500 hover:text-stone-950"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

/** Caja con los datos principales de la cita encontrada. */
function ResumenCita({ cita }: { cita: Cita }) {
  return (
    <div className="rounded-2xl border border-stone-700 bg-stone-950/60 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg text-stone-100">{cita.servicioNombre}</p>
          <p className="text-stone-400">
            {formatearFechaLarga(cita.fecha)} · {cita.horaInicio} – {cita.horaFin} hrs
          </p>
          <p className="text-stone-500">
            {cita.clienteNombre} · con {cita.barbero}
          </p>
        </div>
        <InsigniaEstado estado={cita.estado} />
      </div>
      <div className="mt-3 flex justify-between border-t border-stone-800 pt-3">
        <span className="font-mono tracking-widest text-amber-400">{cita.codigo}</span>
        <span className="text-stone-300">{formatearPrecio(cita.precio)}</span>
      </div>
    </div>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {texto}
    </p>
  );
}
