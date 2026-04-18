import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeLetter } from "@/lib/letter-serialize";

type Ctx = { params: Promise<{ id: string }> };

const types = ["heart", "blossom", "sparkle"] as const;
type Reaction = (typeof types)[number];

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const type = String(body.type ?? "") as Reaction;
    if (!types.includes(type)) {
      return NextResponse.json({ error: "Reacción no válida." }, { status: 400 });
    }

    const existing = await prisma.letter.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }

    const field =
      type === "heart"
        ? "heartCount"
        : type === "blossom"
          ? "blossomCount"
          : "sparkleCount";

    const letter = await prisma.letter.update({
      where: { id },
      data: { [field]: { increment: 1 } },
    });

    return NextResponse.json({
      letter: serializeLetter(letter, { revealContent: !letter.isSecret }),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo reaccionar." }, { status: 500 });
  }
}
