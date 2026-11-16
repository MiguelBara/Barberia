"use client";

// Barra de navegación global, fija en la parte superior de todas las páginas.

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const ruta = usePathname();
  const enAdmin = ruta.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-stone-950/80 backdrop-blur-md">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6"
      >
        {/* Logo: monograma + nombre */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-amber-500 text-sm font-extrabold tracking-tight text-amber-500 transition-all duration-300 ease-out group-hover:bg-amber-500 group-hover:text-stone-950">
            AUS
          </span>
          <span className="leading-none">
            <span className="block text-base font-extrabold uppercase tracking-wide text-white">
              Angel
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-500">
              Urban Style
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/"
            aria-current={ruta === "/" ? "page" : undefined}
            className={`hidden text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 sm:block ${
              ruta === "/" ? "text-amber-500" : "text-white/70 hover:text-amber-400"
            }`}
          >
            Reservas
          </Link>

          {/* Botón destacado */}
          <Link
            href="/admin"
            aria-current={enAdmin ? "page" : undefined}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${
              enAdmin
                ? "bg-amber-500 text-stone-950"
                : "border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-stone-950"
            }`}
          >
            <span className="hidden sm:inline">Portal del Barbero</span>
            <span className="sm:hidden">Barbero</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
