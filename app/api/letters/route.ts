import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { dbErrorHint } from "@/lib/db/errors";
import {
  insertLetter,
  listLettersForClient,
  listLettersForUser,
  listLettersReceivedByUser,
  listLettersSelfToSelf,
  listPublicLetters,
} from "@/lib/db/letter-queries";
import { findUserByUsername } from "@/lib/db/users";
import { serializeLetter } from "@/lib/letter-serialize";
import { attachmentsJsonFromBody } from "@/lib/image-attach";
import { MAX_LETTER_CONTENT_CHARS } from "@/lib/letter-limits";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { scheduleLetterReceivedEmail } from "@/lib/email/letter-received-notification";

const MAX_MULTI_RECIPIENTS = 25;

function parseRecipientUsernames(body: unknown): string[] | null {
  if (body === null || typeof body !== "object") return null;
  const raw = (body as { recipientUsernames?: unknown }).recipientUsernames;
  if (!Array.isArray(raw)) return null;
  const names: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const u = normalizeUsername(x.replace(/^@/, ""));
    if (!isValidUsername(u)) continue;
    if (!names.includes(u)) names.push(u);
  }
  return names;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "recent";
  const search = searchParams.get("q")?.trim() ?? "";
  const clientId = searchParams.get("clientId")?.trim() ?? "";

  try {
    const session = await auth();
    const uid = session?.user?.id;

    if (filter === "received") {
      if (!uid) {
        return NextResponse.json(
          { error: "Tenés que iniciar sesión." },
          { status: 401 },
        );
      }
      const letters = await listLettersReceivedByUser({ userId: uid, search });
      return NextResponse.json({
        letters: letters.map((l) =>
          serializeLetter(l, { revealContent: true }),
        ),
      });
    }

    if (filter === "self_garden") {
      if (!uid) {
        return NextResponse.json(
          { error: "Tenés que iniciar sesión." },
          { status: 401 },
        );
      }
      const letters = await listLettersSelfToSelf({ userId: uid, search });
      return NextResponse.json({
        letters: letters.map((l) =>
          serializeLetter(l, { revealContent: true }),
        ),
      });
    }

    if (filter === "mine") {
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
    const recipientUsernameRaw =
      typeof body.recipientUsername === "string"
        ? body.recipientUsername.trim()
        : "";
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
    if (content.length > MAX_LETTER_CONTENT_CHARS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_LETTER_CONTENT_CHARS.toLocaleString("es")} caracteres.` },
        { status: 400 },
      );
    }
    if (isSecret && password.length < 4) {
      return NextResponse.json(
        { error: "La clave secreta debe tener al menos 4 caracteres." },
        { status: 400 },
      );
    }

    const att = attachmentsJsonFromBody(body);
    if (att.error) {
      return NextResponse.json({ error: att.error }, { status: 400 });
    }
    const imageAttachmentsJson = att.json;

    const multiNames = parseRecipientUsernames(body);
    const passwordHash =
      isSecret && password ? await bcrypt.hash(password, 10) : null;

    const baseInsert = {
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
      imageAttachmentsJson,
      scheduledAt,
    };

    if (multiNames !== null && multiNames.length > 0) {
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            error:
              "Para enviar a varias personas tenés que iniciar sesión.",
          },
          { status: 401 },
        );
      }
      if (multiNames.length < 2) {
        return NextResponse.json(
          {
            error:
              "En modo varias personas necesitás al menos dos nicks distintos.",
          },
          { status: 400 },
        );
      }
      if (multiNames.length > MAX_MULTI_RECIPIENTS) {
        return NextResponse.json(
          {
            error: `Como máximo ${MAX_MULTI_RECIPIENTS} destinatarios por envío.`,
          },
          { status: 400 },
        );
      }
      const resolved: { username: string; id: string }[] = [];
      for (const uname of multiNames) {
        const dest = await findUserByUsername(uname);
        if (!dest) {
          return NextResponse.json(
            { error: `No existe ningún usuario con el nick «${uname}».` },
            { status: 404 },
          );
        }
        resolved.push({ username: uname, id: dest.id });
      }
      const seen = new Set<string>();
      const unique = resolved.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      if (unique.length < 2) {
        return NextResponse.json(
          {
            error:
              "Los nicks tienen que corresponder a al menos dos personas distintas.",
          },
          { status: 400 },
        );
      }

      const letters = [];
      const senderId = session?.user?.id ?? null;
      for (const { id: recipientUserId } of unique) {
        const letter = await insertLetter({
          ...baseInsert,
          recipientUserId,
        });
        letters.push(serializeLetter(letter, { revealContent: true }));
        scheduleLetterReceivedEmail({
          request,
          recipientUserId,
          senderUserId: senderId,
          letterId: letter.id,
          authorDisplayName: authorName,
        });
      }
      return NextResponse.json({
        letters,
        letter: letters[0],
        multiCount: letters.length,
      });
    }

    let recipientUserId: string | null = null;
    if (recipientUsernameRaw) {
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            error:
              "Para enviar por nombre de usuario tenés que iniciar sesión.",
          },
          { status: 401 },
        );
      }
      const uname = normalizeUsername(recipientUsernameRaw.replace(/^@/, ""));
      if (!isValidUsername(uname)) {
        return NextResponse.json(
          { error: "Nombre de usuario del destinatario no válido." },
          { status: 400 },
        );
      }
      const dest = await findUserByUsername(uname);
      if (!dest) {
        return NextResponse.json(
          { error: "No existe ningún usuario con ese nombre." },
          { status: 404 },
        );
      }
      recipientUserId = dest.id;
    }

    const letter = await insertLetter({
      ...baseInsert,
      recipientUserId: recipientUserId ?? null,
    });

    if (letter.recipientUserId) {
      scheduleLetterReceivedEmail({
        request,
        recipientUserId: letter.recipientUserId,
        senderUserId: session?.user?.id ?? null,
        letterId: letter.id,
        authorDisplayName: authorName,
      });
    }

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
