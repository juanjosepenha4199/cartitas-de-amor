import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findLetterById } from "@/lib/db/letter-queries";
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
    const letter = await findLetterById(id);
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }

    const uid = session?.user?.id;
    const isOwner = Boolean(
      (uid && letter.userId && uid === letter.userId) ||
        (clientId &&
          letter.clientAuthorId &&
          clientId === letter.clientAuthorId),
    );
    const isRecipient = Boolean(
      uid && letter.recipientUserId && uid === letter.recipientUserId,
    );

    if (
      !scheduledVisible(letter.scheduledAt) &&
      !isOwner &&
      !isRecipient
    ) {
      return NextResponse.json({ error: "Esta carta aún no florece." }, { status: 404 });
    }
    const canReadPrivate = isOwner || isRecipient;

    if (!letter.isPublic && !canReadPrivate) {
      return NextResponse.json({ error: "Carta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      letter: serializeLetter(letter, {
        revealContent: !letter.isSecret || isOwner || isRecipient,
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
