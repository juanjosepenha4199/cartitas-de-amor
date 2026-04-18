import { NextResponse } from "next/server";
import { incrementLetterReaction } from "@/lib/db/letter-queries";
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

    const field =
      type === "heart"
        ? "heart_count"
        : type === "blossom"
          ? "blossom_count"
          : "sparkle_count";

    const letter = await incrementLetterReaction(id, field);
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      letter: serializeLetter(letter, { revealContent: !letter.isSecret }),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo reaccionar." }, { status: 500 });
  }
}
