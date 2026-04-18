import { neon } from "@neondatabase/serverless";

let instance: ReturnType<typeof neon> | null = null;

function getNeon(): ReturnType<typeof neon> {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL no está definida");
    }
    instance = neon(url);
  }
  return instance;
}

export type SqlRow = Record<string, unknown>;

/**
 * Cliente Neon (HTTP). Filas como objetos; uso: await sql`SELECT ...`.
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlRow[]> {
  return getNeon()(strings, ...values) as Promise<SqlRow[]>;
}
