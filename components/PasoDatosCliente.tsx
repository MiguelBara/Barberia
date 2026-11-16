"use client";

// Paso 3: formulario con los datos del cliente y envío de la reserva a POST /api/citas.

import { useState, type FormEvent } from "react";
import CampoFormulario, { clasesCampo } from "@/components/CampoFormulario";
import TituloSeccion from "@/components/TituloSeccion";
import {
  BARBERO,
  formatearFechaLarga,
  formatearPrecio,
  validarCliente,
  type Cita,
  type DatosCliente,
  type ErroresCliente,
  type Servicio,
} from "@/lib/negocio";

interface PasoDatosClienteProps {
  servicio: Servicio;
  fecha: string;
  hora: string;
  datos: DatosCliente; // Controlado por la página: se conserva al ir "Atrás"
  onCambiarDatos: (datos: DatosCliente) => void;
  onConfirmada: (cita: Cita) => void;
  onHorarioOcupado: (mensaje: string) => void; // Respuesta 409 de la API
}

export default function PasoDatosCliente({
  servicio,
  fecha,
  hora,
  datos,
  onCambiarDatos,
  onConfirmada,
  onHorarioOcupado,
}: PasoDatosClienteProps) {
  const [errores, setErrores] = useState<ErroresCliente>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /** Actualiza un campo y limpia su error mientras el usuario escribe. */
  function cambiar(campo: keyof DatosCliente, valor: string) {
    onCambiarDatos({ ...datos, [campo]: valor });
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    // Validación en el navegador (la API vuelve a validar por seguridad)
    const erroresLocales = validarCliente(datos);
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicioId: servicio.id, fecha, hora, ...datos }),
      });
      const respuesta = await res.json();

      if (res.status === 201) {
        onConfirmada(respuesta.cita);
        return;
      }
      if (res.status === 409) {
        onHorarioOcupado(respuesta.error);
        return;
      }
      setErrores(respuesta.errores ?? {});
      setErrorGeneral(respuesta.error ?? "No se pudo completar la reserva.");
    } catch {
      setErrorGeneral("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <TituloSeccion titulo="Tus datos" subtitulo="Último paso para asegurar tu hora." />

      {/* Resumen de lo elegido */}
      <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-lg text-stone-100">{servicio.nombre}</p>
            <p className="text-stone-400">
              {formatearFechaLarga(fecha)} · {hora} hrs
            </p>
            <p className="text-stone-500">Con {BARBERO.nombre}</p>
          </div>
          <p className="font-serif text-xl text-amber-400">
            {formatearPrecio(servicio.precio)}
          </p>
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="space-y-5">
        <CampoFormulario id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
          <input
            id="nombre"
            type="text"
            autoComplete="name"
            placeholder="Ej: Juan Pérez"
            value={datos.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            aria-invalid={!!errores.nombre}
            aria-describedby={errores.nombre ? "nombre-error" : undefined}
            className={clasesCampo(errores.nombre)}
          />
        </CampoFormulario>

        <CampoFormulario
          id="telefono"
          etiqueta="Celular / WhatsApp"
          error={errores.telefono}
          ayuda="Te escribiremos a este número para recordarte la cita."
        >
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ej: +56 9 1234 5678"
            value={datos.telefono}
            onChange={(e) => cambiar("telefono", e.target.value)}
            aria-invalid={!!errores.telefono}
            aria-describedby={errores.telefono ? "telefono-error" : undefined}
            className={clasesCampo(errores.telefono)}
          />
        </CampoFormulario>

        <CampoFormulario id="notas" etiqueta="Notas" opcional error={errores.notas}>
          <textarea
            id="notas"
            rows={3}
            maxLength={300}
            placeholder="Ej: quiero un degradado bajo, tengo el pelo rizado…"
            value={datos.notas}
            onChange={(e) => cambiar("notas", e.target.value)}
            aria-invalid={!!errores.notas}
            className={`${clasesCampo(errores.notas)} resize-y`}
          />
        </CampoFormulario>

        {errorGeneral && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorGeneral}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 bg-amber-500 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] text-stone-950 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 disabled:cursor-wait disabled:opacity-60"
        >
          {enviando && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
          )}
          {enviando ? "Reservando…" : "Confirmar reserva"}
        </button>
      </form>
    </section>
  );
}
