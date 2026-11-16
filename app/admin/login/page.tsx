// /admin/login — Pantalla de acceso al Portal del Barbero.

import type { Metadata } from "next";
import Link from "next/link";
import FormularioLogin from "./FormularioLogin";

export const metadata: Metadata = {
  title: "Portal del Barbero | Angel urban style",
  robots: { index: false }, // Que los buscadores no indexen el acceso
};

export default function PaginaLogin() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
      {/* Textura diagonal + brillo dorado decorativo */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.025)_0_1px,transparent_1px_14px)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative w-full max-w-sm motion-safe:animate-entrada">
        <div className="mb-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center bg-amber-500 text-2xl font-extrabold text-stone-950 shadow-lg shadow-amber-500/20">
            M
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
            Acceso privado
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Portal del Barbero</h1>
          <p className="mt-3 text-sm font-medium text-white/60">Acceso exclusivo para Miguel.</p>
        </div>

        <div className="border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
          <FormularioLogin />
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-white/50 transition-colors hover:text-amber-400">
            ← Volver a reservas
          </Link>
        </p>
      </div>
    </main>
  );
}
