import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeLetter } from "@/lib/letter-serialize";

function prismaErrorHint(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P1001") {
      return "No hay conexión con la base de datos. Revisá DATABASE_URL (Neon) en Vercel y en .env local.";
    }
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return "La base de datos no está lista. Cierra el servidor de desarrollo, ejecuta npx prisma generate y npx prisma db push, y vuelve a iniciar.";
  }
  return null;
}

const MAX_CONTENT = 300;

function scheduledOk() {
  return {
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "recent";
  const search = searchParams.get("q")?.trim() ?? "";
  const clientId = searchParams.get("clientId")?.trim() ?? "";

  const searchWhere =
    search.length > 0
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            { authorName: { contains: search, mode: "insensitive" as const } },
            { recipientName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

  try {
    if (filter === "mine") {
      const session = await auth();
      const uid = session?.user?.id;

      if (uid) {
        const letters = await prisma.letter.findMany({
          where: {
            userId: uid,
            ...searchWhere,
            ...scheduledOk(),
          },
          orderBy: { createdAt: "desc" },
          take: 120,
        });
        return NextResponse.json({
          letters: letters.map((l) =>
            serializeLetter(l, { revealContent: true }),
          ),
        });
      }

      if (!clientId) {
        return NextResponse.json({ letters: [] });
      }
      const letters = await prisma.letter.findMany({
        where: {
          clientAuthorId: clientId,
          ...searchWhere,
          ...scheduledOk(),
        },
        orderBy: { createdAt: "desc" },
        take: 120,
      });
      return NextResponse.json({
        letters: letters.map((l) =>
          serializeLetter(l, { revealContent: true }),
        ),
      });
    }

    const baseWhere = {
      isPublic: true,
      ...scheduledOk(),
      ...searchWhere,
    };

    if (filter === "beautiful") {
      const letters = await prisma.letter.findMany({
        where: baseWhere,
        take: 120,
      });
      const sorted = [...letters].sort((a, b) => {
        const sa =
          a.heartCount * 3 + a.blossomCount * 2 + a.sparkleCount;
        const sb =
          b.heartCount * 3 + b.blossomCount * 2 + b.sparkleCount;
        if (sb !== sa) return sb - sa;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      return NextResponse.json({
        letters: sorted.map((l) =>
          serializeLetter(l, { revealContent: !l.isSecret }),
        ),
      });
    }

    const letters = await prisma.letter.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 120,
    });

    return NextResponse.json({
      letters: letters.map((l) =>
        serializeLetter(l, { revealContent: !l.isSecret }),
      ),
    });
  } catch (e) {
    console.error(e);
    const hint = prismaErrorHint(e);
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

    const letter = await prisma.letter.create({
      data: {
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
        userId: session?.user?.id ?? undefined,
        scheduledAt,
      },
    });

    return NextResponse.json({
      letter: serializeLetter(letter, { revealContent: true }),
    });
  } catch (e) {
    console.error(e);
    const hint = prismaErrorHint(e);
    return NextResponse.json(
      { error: hint ?? "No se pudo guardar la carta." },
      { status: 500 },
    );
  }
}
