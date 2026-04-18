import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { dbErrorHint } from "@/lib/db/errors";
import {
  insertLetter,
  listLettersForClient,
  listLettersForUser,
  listPublicLetters,
} from "@/lib/db/letter-queries";
import { serializeLetter } from "@/lib/letter-serialize";

const MAX_CONTENT = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "recent";
  const search = searchParams.get("q")?.trim() ?? "";
  const clientId = searchParams.get("clientId")?.trim() ?? "";

  try {
    if (filter === "mine") {
      const session = await auth();
      const uid = session?.user?.id;

      if (uid) {
        const letters = await listLettersForUser({ userId: uid, search });
        return NextResponse.json({
          letters: letters.map((l) =>
            serializeLetter(l, { revealContent: true }),
          ),
        });
      }

      if (!clientId) {
        return NextResponse.json({ letters: [] });
      }
      const letters = await listLettersForClient({
        clientAuthorId: clientId,
        search,
      });
      return NextResponse.json({
        letters: letters.map((l) =>
          serializeLetter(l, { revealContent: true }),
        ),
      });
    }

    if (filter === "beautiful") {
      const letters = await listPublicLetters(search, { limit: 120 });
      const sorted = [...letters].sort((a, b) => {
        const sa = a.heartCount * 3 + a.blossomCount * 2 + a.sparkleCount;
        const sb = b.heartCount * 3 + b.blossomCount * 2 + b.sparkleCount;
        if (sb !== sa) return sb - sa;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      return NextResponse.json({
        letters: sorted.map((l) =>
          serializeLetter(l, { revealContent: !l.isSecret }),
        ),
      });
    }

    const letters = await listPublicLetters(search, { limit: 120 });

    return NextResponse.json({
      letters: letters.map((l) =>
        serializeLetter(l, { revealContent: !l.isSecret }),
      ),
    });
  } catch (e) {
    console.error(e);
    const hint = dbErrorHint(e);
    return NextResponse.json(
      { error: hint ?? "No se pudieron cargar las cartas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const content = String(body.content ?? "").trim();
    const envelopeColor = String(body.envelopeColor ?? "cream");
    const flowerType = String(body.flowerType ?? "rose");
    const flowerDensity = String(body.flowerDensity ?? "medium");
    const paperType = String(body.paperType ?? "textured");
    const fontStyle = String(body.fontStyle ?? "handwriting");
    const sticker = String(body.sticker ?? "none");
    const recipientName = body.recipientName
      ? String(body.recipientName).trim().slice(0, 80)
      : null;
    const authorName = String(body.authorName ?? "Anónimo").trim().slice(0, 80);
    const isPublic = Boolean(body.isPublic);
    const isSecret = Boolean(body.isSecret);
    const password = body.password ? String(body.password) : "";
    const clientAuthorId = body.clientAuthorId
      ? String(body.clientAuthorId).trim().slice(0, 64)
      : null;
    let scheduledAt: Date | null = null;
    if (body.scheduledAt) {
      const d = new Date(String(body.scheduledAt));
      if (!Number.isNaN(d.getTime())) scheduledAt = d;
    }

    if (!content) {
      return NextResponse.json(
        { error: "La carta no puede estar vacía." },
        { status: 400 },
      );
    }
    if (content.length > MAX_CONTENT) {
      return NextResponse.json(
        { error: `Máximo ${MAX_CONTENT} caracteres.` },
        { status: 400 },
      );
    }
    if (isSecret && password.length < 4) {
      return NextResponse.json(
        { error: "La clave secreta debe tener al menos 4 caracteres." },
        { status: 400 },
      );
    }

    const passwordHash =
      isSecret && password ? await bcrypt.hash(password, 10) : null;

    const letter = await insertLetter({
      content,
      envelopeColor,
      flowerType,
      flowerDensity,
      paperType,
      fontStyle,
      sticker,
      recipientName,
      authorName,
      isPublic,
      isSecret,
      passwordHash,
      clientAuthorId: session?.user?.id ? null : clientAuthorId,
      userId: session?.user?.id ?? null,
      scheduledAt,
    });

    return NextResponse.json({
      letter: serializeLetter(letter, { revealContent: true }),
    });
  } catch (e) {
    console.error(e);
    const hint = dbErrorHint(e);
    return NextResponse.json(
      { error: hint ?? "No se pudo guardar la carta." },
      { status: 500 },
    );
  }
}
