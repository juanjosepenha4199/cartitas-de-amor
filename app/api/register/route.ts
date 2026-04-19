import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  emailExists,
  insertUser,
  usernameExists,
} from "@/lib/db/users";
import { isValidUsername, normalizeUsername } from "@/lib/username";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const usernameRaw = normalizeUsername(String(body.username ?? ""));
    const name = body.name ? String(body.name).trim().slice(0, 80) : null;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
    }
    if (!isValidUsername(usernameRaw)) {
      return NextResponse.json(
        {
          error:
            "El nombre de usuario debe tener 3–20 caracteres, solo letras minúsculas, números y guión bajo.",
        },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (await emailExists(email)) {
      return NextResponse.json(
        { error: "Ese email ya está registrado." },
        { status: 409 },
      );
    }

    if (await usernameExists(usernameRaw)) {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya está en uso." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await insertUser({
      email,
      username: usernameRaw,
      name: name || null,
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    const msg = registerErrorMessage(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function registerErrorMessage(e: unknown): string {
  const raw =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : String(e);
  const code =
    e && typeof e === "object" && "code" in e
      ? String((e as { code: unknown }).code)
      : "";

  if (code === "23505" && /username/i.test(raw)) {
    return "Ese nombre de usuario ya está en uso.";
  }
  if (code === "42P01" || /relation .* does not exist/i.test(raw)) {
    return "La base no tiene las tablas. Ejecutá lib/db/schema.sql en Neon (SQL Editor).";
  }
  if (
    /DATABASE_URL|connection refused|fetch failed|ENOTFOUND|timeout/i.test(raw)
  ) {
    return "No se pudo conectar a la base. Revisá DATABASE_URL en el servidor.";
  }
  return "No se pudo crear la cuenta.";
}
