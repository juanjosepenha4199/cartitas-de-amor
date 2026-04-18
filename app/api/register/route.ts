import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { emailExists, insertUser } from "@/lib/db/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim().slice(0, 80) : null;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
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

    const passwordHash = await bcrypt.hash(password, 10);
    await insertUser({
      email,
      name: name || null,
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta." },
      { status: 500 },
    );
  }
}
