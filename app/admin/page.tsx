// /admin — Dashboard de Miguel (protegido con sesión).
//
// Con Cache Components, leer la cookie de sesión es un dato de la petición:
// por eso la verificación y la carga de citas van dentro de <Suspense>.
// Fuera del Suspense queda solo el "esqueleto" estático, que carga al instante.

import type { Metadata } from "next";
import { Suspense } from "react";
import PanelCitas from "@/components/admin/PanelCitas";
import { requerirSesion } from "@/lib/auth";
import { listarCitas } from "@/lib/citas";
import { fechaISO } from "@/lib/negocio";

export const metadata: Metadata = {
  title: "Agenda de Miguel | Angel urban style",
  robots: { index: false },
};

/** Verifica la sesión (o redirige al login) y carga las citas desde la base de datos. */
async function PanelProtegido() {
  await requerirSesion();
  const ahora = new Date(); // Seguro aquí: tras leer la sesión, la página ya es dinámica
  return (
    <PanelCitas
      citasIniciales={await listarCitas()}
      generadoEn={ahora.toISOString()}
      hoy={fechaISO(ahora)}
    />
  );
}

/** Esqueleto que se muestra mientras se verifica la sesión. */
function CargandoPanel() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Cargando panel">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-stone-800" />
        <div className="h-9 w-56 rounded bg-stone-800" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-stone-900" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-stone-900" />
    </div>
  );
}

export default function PaginaAdmin() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-12">
      <Suspense fallback={<CargandoPanel />}>
        <PanelProtegido />
      </Suspense>
    </main>
  );
}
