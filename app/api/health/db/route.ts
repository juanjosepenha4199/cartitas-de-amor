import { NextResponse } from "next/server";

import { sql } from "@/lib/db/sql";

/**
 * Comprueba conexión a Neon y si existen las tablas del proyecto.
 * Público (sin sesión) para diagnosticar deploy / .env.
 */
export async function GET() {
  try {
    await sql`SELECT 1 AS ping`;
    const rows = await sql`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS has_users,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'letters'
        ) AS has_letters
    `;
    const row = rows[0] as {
      has_users?: boolean;
      has_letters?: boolean;
    } | undefined;
    return NextResponse.json({
      ok: true,
      connected: true,
      tables: {
        users: Boolean(row?.has_users),
        letters: Boolean(row?.has_letters),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: message,
      },
      { status: 503 },
    );
  }
}
