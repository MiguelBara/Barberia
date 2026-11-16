"use client";

// Botón de doble clic para acciones delicadas: el primer clic pide confirmación
// ("¿Seguro?") y el segundo la ejecuta. Vuelve solo a su estado normal tras unos segundos.

import { useEffect, useRef, useState, type ReactNode } from "react";

interface BotonConfirmarProps {
  onConfirmar: () => void;
  children: ReactNode; // Contenido normal del botón
  textoConfirmar?: string;
  className: string; // Estilo normal
  clasesConfirmar: string; // Estilo mientras espera la confirmación
  disabled?: boolean;
  titulo?: string;
}

const ESPERA_MS = 3500;

export default function BotonConfirmar({
  onConfirmar,
  children,
  textoConfirmar = "¿Seguro?",
  className,
  clasesConfirmar,
  disabled,
  titulo,
}: BotonConfirmarProps) {
  const [armado, setArmado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia el temporizador si el componente se desmonta
  useEffect(() => () => clearTimeout(temporizador.current ?? undefined), []);

  function alClic() {
    if (armado) {
      clearTimeout(temporizador.current ?? undefined);
      setArmado(false);
      onConfirmar();
      return;
    }
    setArmado(true);
    temporizador.current = setTimeout(() => setArmado(false), ESPERA_MS);
  }

  return (
    <button
      type="button"
      onClick={alClic}
      disabled={disabled}
      title={titulo}
      aria-live="polite"
      className={`${armado ? clasesConfirmar : className} transition-all duration-200 disabled:cursor-wait disabled:opacity-50`}
    >
      {armado ? textoConfirmar : children}
    </button>
  );
}
