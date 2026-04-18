"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import { EnvelopePreview } from "@/components/envelope-preview";
import { useSession } from "next-auth/react";
import { useClientId } from "@/hooks/useClientId";
import { useFavorites } from "@/hooks/useFavorites";
import { playSoftChime } from "@/lib/sound";
import type { LetterDto } from "@/lib/api-types";

export function LetterDetail({ id }: { id: string }) {
  const { status } = useSession();
  const clientId = useClientId();
  const { toggle, isFavorite } = useFavorites();
  const reduce = useReducedMotion();
  const [letter, setLetter] = useState<LetterDto | null>(null);
  const [open, setOpen] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [soundOnOpen, setSoundOnOpen] = useState(true);
  const chimePlayed = useRef(false);

  useEffect(() => {
    chimePlayed.current = false;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoadError(null);
      try {
        const p = new URLSearchParams();
        if (status !== "authenticated" && clientId) p.set("clientId", clientId);
        const res = await fetch(`/api/letters/${id}?${p.toString()}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No encontrada");
        if (!cancelled) setLetter(data.letter as LetterDto);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Error al cargar");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id, clientId, status]);

  useEffect(() => {
    if (!letter || letter.locked) {
      setOpen(letter?.locked ? 0.12 : 0);
      return;
    }

    if (reduce) {
      setOpen(1);
      if (soundOnOpen && !chimePlayed.current) {
        playSoftChime();
        chimePlayed.current = true;
      }
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const duration = 1600;

    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setOpen(p);
      if (p >= 0.92 && soundOnOpen && !chimePlayed.current) {
        playSoftChime();
        chimePlayed.current = true;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [letter, reduce, soundOnOpen]);

  const unlock = async () => {
    setPwError(null);
    try {
      const res = await fetch(`/api/letters/${id}/unlock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "No se pudo abrir");
        return;
      }
      setLetter(data.letter as LetterDto);
      setPw("");
      chimePlayed.current = false;
    } catch {
      setPwError("Error de red");
    }
  };

  const react = async (type: "heart" | "blossom" | "sparkle") => {
    try {
      const res = await fetch(`/api/letters/${id}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) setLetter(data.letter as LetterDto);
    } catch {
      /* ignore */
    }
  };

  const downloadPng = useCallback(async () => {
    const el = document.getElementById("letter-export");
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `garden-letter-${id}.png`;
      a.click();
    } catch {
      /* ignore */
    }
  }, [id]);

  if (loadError) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-[var(--surface)]/90 p-10 text-center dark:border-white/10">
        <p className="text-stone-700 dark:text-garden-100">{loadError}</p>
        <Link
          href="/jardin"
          className="mt-4 inline-block rounded-full bg-stone-900 px-5 py-2 text-sm text-white dark:bg-garden-100 dark:text-garden-900"
        >
          Volver al jardín
        </Link>
      </div>
    );
  }

  if (!letter) {
    return (
      <p className="text-center text-stone-500 dark:text-garden-300/80">
        Abriendo el sobre…
      </p>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/carta/${id}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jardin"
          className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-garden-200/90"
        >
          ← Jardín
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggle(id)}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
          >
            {isFavorite(id) ? "Quitar de favoritos" : "Favorito 💗"}
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
          >
            Copiar enlace
          </button>
          <button
            type="button"
            onClick={() => void downloadPng()}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
          >
            Descargar imagen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 dark:text-garden-200/85">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={soundOnOpen}
            onChange={(e) => setSoundOnOpen(e.target.checked)}
          />
          Sonido al abrir
        </label>
      </div>

      {letter.locked ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-[var(--surface)]/95 p-6 dark:border-white/10"
        >
          <p className="font-serif-romantic text-xl text-stone-900 dark:text-garden-50">
            Carta secreta
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-garden-200/85">
            Solo quien conozca la clave podrá leer el mensaje.
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/25 dark:text-garden-50"
            placeholder="Clave"
          />
          {pwError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">{pwError}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void unlock()}
            className="mt-4 w-full rounded-full bg-stone-900 py-2 text-sm text-white dark:bg-garden-100 dark:text-garden-900"
          >
            Abrir sobre
          </button>
        </motion.div>
      ) : null}

      <div id="letter-export" className="rounded-3xl bg-garden-soft p-4 sm:p-8">
        <EnvelopePreview
          envelopeColor={letter.envelopeColor}
          flowerType={letter.flowerType}
          flowerDensity={letter.flowerDensity}
          paperType={letter.paperType}
          fontStyle={letter.fontStyle}
          sticker={letter.sticker}
          content={letter.content ?? ""}
          recipientName={letter.recipientName}
          authorName={letter.authorName}
          createdLabel={new Date(letter.createdAt).toLocaleDateString("es", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          openAmount={letter.locked ? 0.12 : open}
        />
      </div>

      {!letter.locked ? (
        <div className="flex flex-wrap justify-center gap-3">
          <ReactionButton
            emoji="❤️"
            label={`${letter.heartCount}`}
            onClick={() => void react("heart")}
          />
          <ReactionButton
            emoji="🌸"
            label={`${letter.blossomCount}`}
            onClick={() => void react("blossom")}
          />
          <ReactionButton
            emoji="✨"
            label={`${letter.sparkleCount}`}
            onClick={() => void react("sparkle")}
          />
        </div>
      ) : null}
    </div>
  );
}

function ReactionButton({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </motion.button>
  );
}
