import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeLetter } from "@/lib/letter-serialize";

type Ctx = { params: Promise<{ id: string }> };

function scheduledVisible(scheduledAt: Date | null) {
  if (!scheduledAt) return true;
  return scheduledAt <= new Date();
}

export async function GET(request: Request, context: Ctx) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";

  try {
    const session = await auth();
    const letter = await prisma.letter.findUnique({ where: { id } });
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }
    if (!scheduledVisible(letter.scheduledAt)) {
      return NextResponse.json({ error: "Esta carta aún no florece." }, { status: 404 });
    }

    const isOwner = Boolean(
      (session?.user?.id &&
        letter.userId &&
        session.user.id === letter.userId) ||
        (clientId &&
          letter.clientAuthorId &&
          clientId === letter.clientAuthorId),
    );
    if (!letter.isPublic && !isOwner) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      letter: serializeLetter(letter, {
        revealContent: !letter.isSecret || isOwner,
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo cargar la carta." },
      { status: 500 },
    );
  }
}
