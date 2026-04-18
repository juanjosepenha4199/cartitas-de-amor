import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findLetterById } from "@/lib/db/letter-queries";
import { serializeLetter } from "@/lib/letter-serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    const letter = await findLetterById(id);
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }
    if (!letter.isSecret || !letter.passwordHash) {
      return NextResponse.json({
        letter: serializeLetter(letter, { revealContent: true }),
      });
    }

    const ok = await bcrypt.compare(password, letter.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
    }

    return NextResponse.json({
      letter: serializeLetter(letter, { revealContent: true }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo abrir la carta." }, { status: 500 });
  }
}
