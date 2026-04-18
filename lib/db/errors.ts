/** Mensaje amigable para fallos típicos de conexión a Neon. */
export function dbErrorHint(e: unknown): string | null {
  const msg = e instanceof Error ? e.message : String(e);
  if (
    /connection|ECONNREFUSED|ETIMEDOUT|fetch failed|NeonDbError|database/i.test(
      msg,
    )
  ) {
    return "No hay conexión con la base de datos. Revisá DATABASE_URL (Neon) en Vercel y en .env local, y que hayas ejecutado lib/db/schema.sql en el SQL Editor.";
  }
  return null;
}
