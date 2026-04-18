import { NextResponse } from "next/server";
import { listPublicLetters } from "@/lib/db/letter-queries";
import { serializeLetter } from "@/lib/letter-serialize";

export async function GET() {
  try {
    const letters = await listPublicLetters("", { limit: 80 });
    if (letters.length === 0) {
      return NextResponse.json({ letter: null });
    }

    const dayKey = new Date().toISOString().slice(0, 10);
    let seed = 0;
    for (let i = 0; i < dayKey.length; i++) seed += dayKey.charCodeAt(i);
    const scored = letters.map((l) => ({
      l,
      s: l.heartCount * 3 + l.blossomCount * 2 + l.sparkleCount,
    }));
    scored.sort((a, b) => b.s - a.s);
    const top = scored.filter((x) => x.s === scored[0]?.s);
    const pick = top[seed % top.length]?.l ?? letters[0];

    return NextResponse.json({
      letter: serializeLetter(pick, { revealContent: !pick.isSecret }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo cargar la carta del día." },
      { status: 500 },
    );
  }
}
