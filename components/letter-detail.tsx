"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { downloadLetterPdf } from "@/lib/letter-pdf-export";
import { EnvelopePreview } from "@/components/envelope-preview";
import { useSession } from "next-auth/react";
import { useClientId } from "@/hooks/useClientId";
import { useFavorites } from "@/hooks/useFavorites";
import { FONT_STYLES, PAPER_TYPES } from "@/lib/options";
import { playSoftChime } from "@/lib/sound";
import type { LetterDto } from "@/lib/api-types";

export function LetterDetail({ id }: { id: string }) {
  const { status } = useSession();
  const clientId = useClientId();
  const { toggle, isFavorite } = useFavorites();
  const reduce = useReducedMotion();
  const [letter, setLetter] = useState<LetterDto | null>(null);
  const [open, setOpen] = useState(0);
  const [userOpened, setUserOpened] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [soundOnOpen, setSoundOnOpen] = useState(true);
  const [focusReading, setFocusReading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const chimePlayed = useRef(false);

  useEffect(() => {
    chimePlayed.current = false;
    setUserOpened(false);
    setOpen(0);
    setFocusReading(false);
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
        if (!cancelled) {
          setLetter(data.letter as LetterDto);
          setUserOpened(false);
          setOpen(0);
        }
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
    if (!userOpened) {
      setOpen(0);
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
    const duration = 2400;

    const tick = (t: number) => {
      if (start === null) start = t;
      const raw = Math.min(1, (t - start) / duration);
      const p = 1 - Math.pow(1 - raw, 1.9);
      setOpen(p);
      if (p >= 0.92 && soundOnOpen && !chimePlayed.current) {
        playSoftChime();
        chimePlayed.current = true;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [letter, reduce, soundOnOpen, userOpened]);

  useEffect(() => {
    if (!letter || letter.locked || !userOpened || focusReading) return;
    if (open < 0.985) return;
    const t = window.setTimeout(() => setFocusReading(true), 520);
    return () => clearTimeout(t);
  }, [letter, open, userOpened, focusReading]);

  useEffect(() => {
    if (!userOpened) setFocusReading(false);
  }, [userOpened]);

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
      setUserOpened(false);
      setOpen(0);
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

  const downloadPdf = useCallback(async () => {
    if (!letter) return;
    setPdfError(null);
    try {
      await downloadLetterPdf(
        {
          title: "Carta",
          content: letter.locked
            ? "(Carta secreta: el contenido no se incluye en el PDF hasta desbloquearla.)"
            : (letter.content ?? ""),
          recipientName: letter.recipientName,
          authorName: letter.authorName,
          createdLabel: new Date(letter.createdAt).toLocaleDateString("es", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          imageAttachments: letter.locked ? [] : (letter.imageAttachments ?? []),
        },
        letter.id,
      );
    } catch {
      setPdfError(
        "No se pudo generar el PDF. Probá con otro navegador o una carta más corta.",
      );
    }
  }, [letter]);

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
        Cargando el sobre…
      </p>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/carta/${id}`;

  const showOpenHint = !letter.locked && !userOpened && open < 0.05;
  const openingInProgress =
    !letter.locked && userOpened && !focusReading && open > 0.04 && open < 0.985;

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
            onClick={() => void downloadPdf()}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
          >
            Descargar PDF
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

      {pdfError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {pdfError}
        </p>
      ) : null}

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
            Desbloquear
          </button>
        </motion.div>
      ) : null}

      {!letter.locked && showOpenHint ? (
        <p className="text-center text-sm text-stone-600 dark:text-garden-200/90">
          Tocá el sobre para abrirlo: primero la animación y después la carta en
          grande para leer cómodo.
        </p>
      ) : null}

      {!letter.locked && openingInProgress ? (
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <p className="text-center text-xs text-stone-500 dark:text-garden-300/85">
            Sacando la carta del sobre…
          </p>
          <button
            type="button"
            onClick={() => setFocusReading(true)}
            className="text-xs font-medium text-rose-700 underline decoration-rose-400 underline-offset-2 dark:text-rose-200"
          >
            Ir a leer en grande
          </button>
        </div>
      ) : null}

      <div
        id="letter-export"
        className={`rounded-3xl bg-garden-soft p-4 sm:p-6 lg:p-10 ${focusReading ? "overflow-visible" : ""}`}
      >
        {focusReading && !letter.locked ? (
          <LetterReadingPanel
            letter={letter}
            onBack={() => setFocusReading(false)}
          />
        ) : (
          <motion.button
            type="button"
            disabled={letter.locked}
            onClick={() => {
              if (!letter.locked && !userOpened) setUserOpened(true);
            }}
            className={`relative mx-auto block w-full max-w-md rounded-3xl border-2 border-transparent p-1 text-left transition ${
              letter.locked
                ? "cursor-default"
                : userOpened
                  ? "pointer-events-none cursor-default"
                  : "cursor-pointer hover:border-stone-300/60 dark:hover:border-white/20"
            }`}
            whileTap={letter.locked || userOpened ? undefined : { scale: 0.985 }}
          >
            <span className={userOpened ? "pointer-events-auto block" : "block"}>
              <EnvelopePreview
                envelopeColor={letter.envelopeColor}
                flowerType={letter.flowerType}
                flowerDensity={letter.flowerDensity}
                paperType={letter.paperType}
                fontStyle={letter.fontStyle}
                sticker={letter.sticker}
                content={letter.content ?? ""}
                imageUrls={letter.imageAttachments ?? []}
                recipientName={letter.recipientName}
                authorName={letter.authorName}
                createdLabel={new Date(letter.createdAt).toLocaleDateString("es", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                openAmount={letter.locked ? 0.12 : open}
                hideInnerContent={false}
                showSeal={!letter.locked && !userOpened}
                readingLayout={false}
              />
            </span>
          </motion.button>
        )}
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

function LetterReadingPanel({
  letter,
  onBack,
}: {
  letter: LetterDto;
  onBack: () => void;
}) {
  const font =
    FONT_STYLES.find((f) => f.id === letter.fontStyle) ?? FONT_STYLES[0];
  const paper =
    PAPER_TYPES.find((p) => p.id === letter.paperType) ?? PAPER_TYPES[0];
  const raw = letter.content ?? "";
  const pages = useMemo(() => {
    const parts = raw.split("\f");
    return parts.length > 1 ? parts : [raw];
  }, [raw]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [letter.id, raw]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      className={`mx-auto w-full max-w-[min(96vw,56rem)] rounded-[2rem] border-[3px] border-stone-900 bg-white px-5 py-8 shadow-[8px_10px_0_0_rgba(28,25,23,0.12)] dark:border-stone-100 dark:bg-stone-100 dark:shadow-[8px_10px_0_0_rgba(0,0,0,0.35)] sm:px-10 sm:py-12 lg:px-14 lg:py-16 ${paper.className}`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-stone-300 bg-white/90 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50 dark:border-white/20 dark:bg-stone-900/40 dark:text-garden-50 dark:hover:bg-stone-900/70"
        >
          ← Ver el sobre otra vez
        </button>
        {letter.recipientName ? (
          <p className="font-hand text-sm text-stone-600 dark:text-stone-700">
            Para:{" "}
            <span className="font-semibold text-stone-900 dark:text-stone-900">
              {letter.recipientName}
            </span>
          </p>
        ) : null}
      </div>

      {pages.length > 1 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                page === i
                  ? "border-stone-900 bg-stone-900 text-white dark:border-garden-100 dark:bg-garden-100 dark:text-garden-900"
                  : "border-stone-300 bg-white/90 text-stone-700 dark:border-white/25 dark:bg-white/10 dark:text-garden-100"
              }`}
            >
              Página {i + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-[min(78vh,52rem)] overflow-y-auto overflow-x-hidden pr-1 [-webkit-overflow-scrolling:touch]">
        <p
          className={`whitespace-pre-wrap text-stone-900 dark:text-stone-900 ${font.className} text-[1.2rem] leading-[1.75] sm:text-[1.45rem] sm:leading-[1.8] lg:text-[1.65rem] lg:leading-[1.85]`}
        >
          {(pages[page] ?? "").trim() || "…"}
        </p>
        {letter.imageAttachments &&
        letter.imageAttachments.length > 0 &&
        (pages.length === 1 || page === pages.length - 1) ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {letter.imageAttachments.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                className="w-full max-w-full rounded-2xl border-2 border-stone-900/15 object-contain dark:border-white/20"
                style={{ maxHeight: "min(70vh, 720px)" }}
                loading="lazy"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-end gap-3 border-t border-stone-200/80 pt-6 dark:border-stone-400/30">
        {letter.authorName ? (
          <span
            className={`text-stone-800 dark:text-stone-900 ${font.className} text-xl font-medium sm:text-2xl`}
          >
            — {letter.authorName}
          </span>
        ) : null}
        <span className="rounded-full border-[3px] border-stone-900 bg-stone-100 px-3 py-1 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-200 dark:text-stone-900">
          {new Date(letter.createdAt).toLocaleDateString("es", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </motion.article>
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
