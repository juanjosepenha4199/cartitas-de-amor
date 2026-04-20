import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { dbErrorHint } from "@/lib/db/errors";
import {
  emailExistsForOtherUser,
  findUserAuthById,
  updateUserEmail,
} from "@/lib/db/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const uid = session?.user?.id;
    if (!uid) {
      return NextResponse.json(
        { error: "Tenés que iniciar sesión." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const newEmail = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!EMAIL_RE.test(newEmail)) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json(
        { error: "Ingresá tu contraseña actual para confirmar." },
        { status: 400 },
      );
    }

    const row = await findUserAuthById(uid);
    if (!row?.password_hash) {
      return NextResponse.json(
        { error: "No se pudo verificar la cuenta." },
        { status: 400 },
      );
    }

    if (newEmail === row.email) {
      return NextResponse.json(
        { error: "Ese ya es tu correo electrónico." },
        { status: 400 },
      );
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "La contraseña no es correcta." },
        { status: 401 },
      );
    }

    if (await emailExistsForOtherUser(newEmail, uid)) {
      return NextResponse.json(
        { error: "Ese email ya está registrado en otra cuenta." },
        { status: 409 },
      );
    }

    await updateUserEmail(uid, newEmail);

    return NextResponse.json({ ok: true, email: newEmail });
  } catch (e) {
    console.error(e);
    const hint = dbErrorHint(e);
    return NextResponse.json(
      { error: hint ?? "No se pudo actualizar el correo." },
      { status: 500 },
    );
  }
}
