"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  ENVELOPE_COLORS,
  FLOWER_DENSITY,
  FONT_STYLES,
  FLOWER_TYPES,
  PAPER_TYPES,
  STICKERS,
} from "@/lib/options";

export type EnvelopePreviewProps = {
  envelopeColor: string;
  flowerType: string;
  flowerDensity: string;
  paperType: string;
  fontStyle: string;
  sticker: string;
  content: string;
  /** Fotos incrustadas (data URLs) debajo del texto. */
  imageUrls?: string[];
  recipientName?: string | null;
  authorName?: string | null;
  createdLabel?: string | null;
  openAmount?: number;
  compact?: boolean;
  className?: string;
  hideInnerContent?: boolean;
  showSeal?: boolean;
  /** Hoja desplegable con scroll (lectura de carta larga). */
  readingLayout?: boolean;
  /** Incrementar para reproducir la animación de la hoja entrando al sobre (p. ej. al guardar). */
  saveInsertKey?: number;
};

function stickerEmoji(id: string) {
  if (id === "hearts") return "💗";
  if (id === "stars") return "✦";
  if (id === "moon") return "🌙";
  return "";
}

/** Relleno plano estilo ilustración / carta mano. */
const DOODLE_FILL: Record<string, { shell: string; flap: string; darkShell: string; darkFlap: string }> = {
  beige: {
    shell: "#f3e4cf",
    flap: "#e8d4bc",
    darkShell: "#3d3428",
    darkFlap: "#4a4034",
  },
  rose: {
    shell: "#fce0e8",
    flap: "#f7ccd8",
    darkShell: "#3d2a30",
    darkFlap: "#4a323c",
  },
  sky: {
    shell: "#dbeaf5",
    flap: "#c8dff0",
    darkShell: "#283440",
    darkFlap: "#2f3d4c",
  },
  lavender: {
    shell: "#ebe4f7",
    flap: "#ddd2f0",
    darkShell: "#322c3d",
    darkFlap: "#3a3348",
  },
  cream: {
    shell: "#faf5e8",
    flap: "#f0e8d8",
    darkShell: "#3a342c",
    darkFlap: "#454039",
  },
};

const STROKE = "border-[3px] border-stone-900 dark:border-stone-100";
const STROKE_COMPACT = "border-[2.5px] border-stone-900 dark:border-stone-100";

/** Posición vertical de la hoja (%): mayor = más abajo (metida en el sobre). */
function paperYFromOpen(
  open: number,
  compact: boolean,
  readingLayout: boolean,
): number {
  const tucked = compact ? 46 : 42;
  const pulled = compact ? -30 : readingLayout ? -56 : -38;
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, open)), 2.1);
  return tucked * (1 - e) + pulled * e;
}

/** Durante “meter la carta”: 0 = hoja arriba (fuera), 1 = adentro. */
function paperYFromInsert(t: number, compact: boolean): number {
  const eased = 1 - Math.pow(1 - t, 2.6);
  const start = compact ? -52 : -48;
  const end = compact ? 46 : 42;
  return start + (end - start) * eased;
}

export const EnvelopePreview = forwardRef<HTMLDivElement, EnvelopePreviewProps>(
  function EnvelopePreview(
    {
      envelopeColor,
      flowerType,
      flowerDensity,
      paperType,
      fontStyle,
      sticker,
      content,
      imageUrls = [],
      recipientName,
      authorName,
      createdLabel,
      openAmount = 0,
      compact = false,
      className = "",
      hideInnerContent = false,
      showSeal = true,
      readingLayout = false,
      saveInsertKey = 0,
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const env =
      ENVELOPE_COLORS.find((c) => c.id === envelopeColor) ?? ENVELOPE_COLORS[4];
    const density =
      FLOWER_DENSITY.find((d) => d.id === flowerDensity) ?? FLOWER_DENSITY[1];
    const paper =
      PAPER_TYPES.find((p) => p.id === paperType) ?? PAPER_TYPES[0];
    const font =
      FONT_STYLES.find((f) => f.id === fontStyle) ?? FONT_STYLES[0];
    const stickerId =
      STICKERS.find((s) => s.id === sticker)?.id ?? "none";

    const doodle = DOODLE_FILL[env.id] ?? DOODLE_FILL.cream;
    const flowerEmoji =
      FLOWER_TYPES.find((f) => f.id === flowerType)?.emoji ?? "🌹";

    const [insertT, setInsertT] = useState<number | null>(null);
    const [contentPage, setContentPage] = useState(0);
    const lastSaveKey = useRef(0);

    const contentPages = useMemo(() => {
      const parts = content.split("\f");
      return parts.length > 1 ? parts : [content];
    }, [content]);

    useEffect(() => {
      setContentPage(0);
    }, [content]);

    useEffect(() => {
      if (!saveInsertKey || saveInsertKey === lastSaveKey.current) return;
      lastSaveKey.current = saveInsertKey;
      if (reduce) {
        setInsertT(null);
        return;
      }
      setInsertT(0);
      let raf = 0;
      const start = performance.now();
      const duration = 1500;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setInsertT(p);
        if (p < 1) raf = requestAnimationFrame(tick);
        else {
          setInsertT(null);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [saveInsertKey, reduce]);

    const densityScale = useMemo(() => {
      if (density.id === "low") return { opacity: 0.5, extra: false };
      if (density.id === "high") return { opacity: 0.72, extra: true };
      return { opacity: 0.6, extra: false };
    }, [density.id]);

    const inserting = insertT !== null;
    /** Pliegue 2D (sin rotateX 3D) para que la solapa no “vuele” fuera del sobre. */
    const flapFold = inserting ? 0 : reduce ? Math.min(1, openAmount) : openAmount;

    const paperYPercent = inserting
      ? paperYFromInsert(insertT ?? 0, compact)
      : paperYFromOpen(openAmount, compact, readingLayout);

    const sealVisible = showSeal && !inserting && openAmount < 0.12;
    const innerHidden = hideInnerContent || (!inserting && openAmount < 0.08);
    const innerFade = innerHidden
      ? 0
      : Math.min(1, (openAmount - 0.08) / 0.42);

    const readingUnfold =
      readingLayout && !compact && openAmount >= 0.94 && !inserting;
    const pad = compact ? "px-2 pb-9 pt-4" : "px-3 pb-12 pt-6 sm:px-5 sm:pb-14 sm:pt-8";
    const textClamp = readingUnfold
      ? ""
      : compact
        ? "line-clamp-4"
        : "line-clamp-[10]";
    const minH = compact
      ? "min-h-[190px]"
      : readingUnfold
        ? "min-h-[320px] sm:min-h-[380px]"
        : "min-h-[260px] sm:min-h-[300px]";
    const stroke = compact ? STROKE_COMPACT : STROKE;
    return (
      <div ref={ref} className={`relative mx-auto w-full max-w-md select-none ${className}`}>
        <motion.div
          className={`relative overflow-hidden rounded-2xl bg-[var(--env-shell)] shadow-[6px_8px_0_0_rgba(28,25,23,0.12)] dark:shadow-[6px_8px_0_0_rgba(0,0,0,0.35)] ${stroke}`}
          style={
            {
              "--env-shell": doodle.shell,
            } as React.CSSProperties
          }
        >
          <div className={`relative ${minH} ${pad}`}>
            {/* Acento floral pequeño (estilo sello) */}
            <div
              className="pointer-events-none absolute right-3 top-3 z-[1] text-2xl opacity-[var(--fo)] drop-shadow-sm sm:right-4 sm:top-4 sm:text-3xl"
              style={{ ["--fo" as string]: String(densityScale.opacity) }}
              aria-hidden
            >
              {densityScale.extra ? (
                <span className="absolute -left-3 top-2 text-xl opacity-60">
                  {flowerEmoji}
                </span>
              ) : null}
              <span>{flowerEmoji}</span>
            </div>

            {recipientName ? (
              <p
                className={`absolute bottom-[30%] left-2 z-[5] max-w-[55%] font-hand text-[10px] leading-tight text-stone-900 sm:left-3 sm:bottom-[28%] sm:text-xs dark:text-stone-100`}
              >
                Para:{" "}
                <span className="font-semibold">{recipientName}</span>
              </p>
            ) : null}

            {/* Hoja — animación clara de sacar / meter */}
            <motion.div
              className={`relative z-10 mx-auto w-[88%] rounded-lg bg-white ${stroke} shadow-[4px_5px_0_0_rgba(28,25,23,0.08)] dark:bg-stone-100 dark:shadow-[4px_5px_0_0_rgba(0,0,0,0.25)] ${paper.className} ${readingUnfold ? "max-w-[min(100%,28rem)]" : ""}`}
              initial={false}
              animate={{ y: `${paperYPercent}%` }}
              transition={
                reduce
                  ? { duration: 0 }
                  : inserting
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 200, damping: 24 }
              }
            >
              <div
                className={`relative z-10 px-3 py-7 sm:px-5 sm:py-9 ${compact ? "py-5 sm:py-7" : ""}`}
              >
                {stickerId !== "none" && (
                  <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden rounded-md opacity-25">
                    {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute text-base sm:text-lg"
                        style={{
                          left: `${(i * 23) % 88}%`,
                          top: `${(i * 31) % 82}%`,
                          transform: `rotate(${(i * 41) % 80}deg)`,
                        }}
                      >
                        {stickerEmoji(stickerId)}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={
                    readingUnfold
                      ? "max-h-[min(70vh,640px)] overflow-y-auto overflow-x-hidden pr-1 [-webkit-overflow-scrolling:touch]"
                      : undefined
                  }
                >
                  {!innerHidden &&
                  readingUnfold &&
                  !compact &&
                  contentPages.length > 1 ? (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {contentPages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setContentPage(i)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                            contentPage === i
                              ? "border-stone-900 bg-stone-900 text-white dark:border-garden-100 dark:bg-garden-100 dark:text-garden-900"
                              : "border-stone-300 bg-white/80 text-stone-700 dark:border-white/20 dark:bg-white/10 dark:text-garden-100"
                          }`}
                        >
                          Página {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <p
                    className={`whitespace-pre-wrap text-stone-900 transition-[opacity,filter] duration-400 dark:text-stone-900 ${font.className} ${compact ? "text-sm leading-relaxed" : "text-base leading-relaxed sm:text-[1.05rem]"} ${textClamp}`}
                    style={{
                      opacity: innerHidden ? 0.35 : innerFade,
                      filter: innerHidden ? "blur(6px)" : "blur(0px)",
                    }}
                  >
                    {innerHidden
                      ? "······\n······\n······"
                      : readingUnfold && !compact && contentPages.length > 1
                        ? (contentPages[contentPage] ?? "").trim() ||
                          "…"
                        : content.trim() ||
                          "Escribe algo que te haga sonreír…"}
                  </p>
                  {!innerHidden &&
                  imageUrls.length > 0 &&
                  (!readingUnfold ||
                    compact ||
                    contentPage === contentPages.length - 1) ? (
                    <div
                      className={`mt-4 grid gap-3 ${readingUnfold ? "sm:grid-cols-2" : "grid-cols-1"}`}
                    >
                      {imageUrls.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt=""
                          className="max-h-72 w-full rounded-lg border border-stone-200/80 object-contain dark:border-stone-600/60"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div
                  className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs text-stone-600 transition-opacity dark:text-stone-700"
                  style={{ opacity: innerHidden ? 0.2 : innerFade }}
                >
                  {authorName && !innerHidden ? (
                    <span className={`${font.className} font-medium`}>
                      — {authorName}
                    </span>
                  ) : null}
                  {createdLabel && !innerHidden ? (
                    <span className={`rounded-full ${stroke} bg-stone-100 px-2 py-0.5 text-[10px] dark:bg-stone-200`}>
                      {createdLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>

            {/* Solapa inferior (bolsillo) */}
            <div
              className={`pointer-events-none absolute bottom-0 left-1/2 z-20 h-[34%] w-[104%] max-w-[104%] -translate-x-1/2 sm:h-[32%] ${stroke} border-b-0 dark:brightness-[0.88]`}
              style={{
                clipPath: "polygon(0% 100%, 6% 40%, 50% 6%, 94% 40%, 100% 100%)",
                backgroundColor: doodle.flap,
              }}
              aria-hidden
            />

            {/* Solapa superior — animación 2D para no romper el layout con perspectiva 3D */}
            <motion.div
              className={`absolute left-1/2 top-0 z-[25] h-[46%] w-[108%] max-w-[108%] -translate-x-1/2 origin-top ${stroke} border-b-0 dark:brightness-[0.88]`}
              style={{
                clipPath: "polygon(0 0, 50% 92%, 100% 0)",
                backgroundColor: doodle.flap,
                transformOrigin: "50% 0%",
              }}
              initial={false}
              animate={{
                scaleY: Math.max(0.06, 1 - flapFold * 0.88),
                y: -flapFold * (compact ? 2 : 3),
                opacity: 0.2 + (1 - flapFold) * 0.8,
              }}
              transition={{
                duration: reduce ? 0 : 0.75,
                ease: [0.25, 0.8, 0.25, 1],
              }}
            />

            {sealVisible ? (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-[16%] z-[28] -translate-x-1/2"
                initial={false}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 ${stroke} sm:h-14 sm:w-14`}
                  aria-hidden
                >
                  <span className="text-lg text-white drop-shadow-sm">♥</span>
                </div>
                <p className="mt-0.5 text-center font-hand text-[9px] font-medium text-stone-800 dark:text-stone-200">
                  cerrado
                </p>
              </motion.div>
            ) : null}

            <div
              className="pointer-events-none absolute bottom-2 left-1/2 z-[30] h-1.5 w-[40%] -translate-x-1/2 rounded-full bg-stone-900/10 dark:bg-white/15"
              aria-hidden
            />
          </div>
        </motion.div>
      </div>
    );
  },
);
