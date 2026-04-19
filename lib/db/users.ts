import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db/sql";

export type UserAuthRow = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  image: string | null;
  password_hash: string | null;
};

export async function findUserByEmail(
  email: string,
): Promise<UserAuthRow | null> {
  const rows = await sql`
    SELECT id, email, username, name, image, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  return (rows[0] as UserAuthRow | undefined) ?? null;
}

export async function findUserByUsername(
  username: string,
): Promise<{ id: string } | null> {
  const rows = await sql`
    SELECT id FROM users WHERE lower(username) = lower(${username}) LIMIT 1
  `;
  const r = rows[0] as { id: string } | undefined;
  return r ?? null;
}

export async function insertUser(data: {
  email: string;
  username: string;
  name: string | null;
  passwordHash: string;
}): Promise<void> {
  const id = randomUUID();
  await sql`
    INSERT INTO users (id, email, username, name, password_hash)
    VALUES (${id}, ${data.email}, ${data.username}, ${data.name}, ${data.passwordHash})
  `;
}

export async function emailExists(email: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM users WHERE email = ${email} LIMIT 1
  `;
  return rows.length > 0;
}

export async function usernameExists(username: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM users WHERE lower(username) = lower(${username}) LIMIT 1
  `;
  return rows.length > 0;
}
