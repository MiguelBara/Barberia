// Conexión a la base de datos (solo servidor) con libSQL, compatible con SQLite.
//
// - En tu computador: usa el archivo local `data/barberia.db` (no hay que configurar nada).
// - En producción: si existe TURSO_DATABASE_URL se conecta a Turso (SQLite en la nube),
//   porque los hostings gratuitos borran el disco en cada despliegue.

import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";

function crearCliente(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  mkdirSync("data", { recursive: true });
  return createClient({ url: "file:data/barberia.db" }); // Relativo a la carpeta del proyecto
}

/** Crea el esquema si no existe y aplica migraciones idempotentes. */
async function preparar(cliente: Client): Promise<Client> {
  await cliente.executeMultiple(`
    CREATE TABLE IF NOT EXISTS citas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo           TEXT    NOT NULL UNIQUE,
      servicio_id      TEXT    NOT NULL,
      servicio_nombre  TEXT    NOT NULL,
      precio           INTEGER NOT NULL,
      duracion_min     INTEGER NOT NULL,
      fecha            TEXT    NOT NULL,          -- YYYY-MM-DD
      inicio_min       INTEGER NOT NULL,          -- minutos desde medianoche
      fin_min          INTEGER NOT NULL,
      barbero          TEXT    NOT NULL,
      cliente_nombre   TEXT    NOT NULL,
      cliente_telefono TEXT    NOT NULL,
      notas            TEXT    NOT NULL DEFAULT '',
      estado           TEXT    NOT NULL DEFAULT 'confirmada',
      creada_en        TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      cancelada_en     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas (fecha, estado);
  `);

  // v2: bases de datos creadas antes de que existiera la columna cancelada_en
  const columnas = await cliente.execute("SELECT name FROM pragma_table_info('citas')");
  if (!columnas.rows.some((c) => c.name === "cancelada_en")) {
    await cliente.execute("ALTER TABLE citas ADD COLUMN cancelada_en TEXT");
  }

  return cliente;
}

// En desarrollo Next recarga los módulos en cada cambio; guardamos la conexión
// en globalThis para no abrir una nueva en cada recarga.
const globalConDb = globalThis as typeof globalThis & { __dbBarberiaLibsql?: Promise<Client> };

/** Devuelve la conexión lista para usar (la primera llamada crea el esquema). */
export function obtenerDb(): Promise<Client> {
  globalConDb.__dbBarberiaLibsql ??= preparar(crearCliente()).catch((error) => {
    // Si falló (ej. sin red), se reintenta en la próxima petición en vez de quedar roto
    globalConDb.__dbBarberiaLibsql = undefined;
    throw error;
  });
  return globalConDb.__dbBarberiaLibsql;
}

/** Fecha y hora local "YYYY-MM-DD HH:MM:SS" según el reloj del servidor (variable TZ). */
export function ahoraLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
