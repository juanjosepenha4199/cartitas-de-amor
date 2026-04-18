"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef, useMemo } from "react";
import {
  ENVELOPE_COLORS,
  FLOWER_DENSITY,
  FONT_STYLES,
  PAPER_TYPES,
  STICKERS,
} from "@/lib/options";
import { flowerImageSrc } from "@/lib/flower-art";

export type EnvelopePreviewProps = {
  envelopeColor: string;
  flowerType: string;
  flowerDensity: string;
  paperType: string;
  fontStyle: string;
  sticker: string;
  content: string;
  recipientName?: string | null;
  authorName?: string | null;
  createdLabel?: string | null;
  openAmount?: number;
  compact?: boolean;
  className?: string;
};

function stickerEmoji(id: string) {
  if (id === "hearts") return "💗";
  if (id === "stars") return "✦";
  if (id === "moon") return "🌙";
  return "";
}

/** Kraft + tinte según paleta elegida (inspiración: sobre reciclado). */
const ENVELOPE_KRAFT: Record<
  string,
  { shell: string; flapTop: string; flapBottom: string; border: string }
> = {
  beige: {
    shell: "linear-gradient(168deg, #dcc7a8 0%, #c4a574 42%, #9e7349 100%)",
    flapTop: "#d1b48a",
    flapBottom: "#7d5534",
    border: "rgba(90, 62, 38, 0.35)",
  },
  rose: {
    shell: "linear-gradient(168deg, #e8cfcf 0%, #cfa39a 45%, #a67b76 100%)",
    flapTop: "#deb8b4",
    flapBottom: "#7a4e4a",
    border: "rgba(120, 70, 70, 0.32)",
  },
  sky: {
    shell: "linear-gradient(168deg, #c9dae8 0%, #9eb8cc 45%, #6d8aa3 100%)",
    flapTop: "#b5ccde",
    flapBottom: "#4a6278",
    border: "rgba(55, 80, 100, 0.32)",
  },
  lavender: {
    shell: "linear-gradient(168deg, #ddd0ea 0%, #b9a0cf 45%, #8a6fa8 100%)",
    flapTop: "#cbb3e0",
    flapBottom: "#5c4572",
    border: "rgba(75, 55, 95, 0.3)",
  },
  cream: {
    shell: "linear-gradient(168deg, #ebe0d0 0%, #d1bfaa 45%, #a89078 100%)",
    flapTop: "#dccfbd",
    flapBottom: "#6b5340",
    border: "rgba(90, 70, 55, 0.3)",
  },
};

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
      recipientName,
      authorName,
      createdLabel,
      openAmount = 0,
      compact = false,
      className = "",
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

    const kraft = ENVELOPE_KRAFT[env.id] ?? ENVELOPE_KRAFT.cream;
    const flowerSrc = flowerImageSrc(flowerType);

    const flapOpen = reduce ? Math.min(1, openAmount) * 180 : openAmount * 180;
    const lift = openAmount * (compact ? 6 : 11);

    const densityScale = useMemo(() => {
      if (density.id === "low") return { img: 0.82, opacity: 0.74, extra: false };
      if (density.id === "high")
        return { img: 1.06, opacity: 0.9, extra: true };
      return { img: 0.94, opacity: 0.84, extra: false };
    }, [density.id]);

    const pad = compact ? "px-3 pb-10 pt-5" : "px-4 pb-12 pt-7 sm:px-5 sm:pb-14 sm:pt-8";
    const textClamp = compact ? "line-clamp-4" : "line-clamp-[10]";
    const minH = compact ? "min-h-[200px]" : "min-h-[260px] sm:min-h-[320px]";

    return (
      <div
        ref={ref}
        className={`relative mx-auto w-full max-w-md select-none ${className}`}
        style={{ perspective: "1400px" }}
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl border-2 shadow-[0_22px_48px_-24px_rgba(55,40,30,0.55)] dark:shadow-[0_22px_48px_-24px_rgba(0,0,0,0.65)]"
          style={{
            background: kraft.shell,
            borderColor: kraft.border,
          }}
          animate={{ y: -lift * 0.22 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          {/* Veta / papel */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply dark:opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(95deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 3px), radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35), transparent 55%)",
            }}
          />

          <div className={`relative ${minH} ${pad}`}>
            {/* Capa 1 — flores detrás (ilustración acuarela) */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-6 top-6 z-[1] overflow-visible sm:bottom-8 sm:top-8"
              aria-hidden
            >
              {densityScale.extra ? (
                <motion.img
                  src={flowerSrc}
                  alt=""
                  className="absolute bottom-0 left-1/2 max-h-[min(105%,420px)] w-[135%] max-w-none -translate-x-1/2 object-contain object-bottom opacity-45 blur-[1.5px] saturate-[0.85] dark:opacity-35"
                  style={{ transform: "translateX(-50%) scale(1.12)" }}
                  animate={
                    reduce
                      ? undefined
                      : { y: [0, -5, 0], rotate: [0, -0.5, 0] }
                  }
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
              <motion.img
                src={flowerSrc}
                alt=""
                className="absolute bottom-0 left-1/2 max-h-[min(100%,400px)] w-[128%] max-w-none -translate-x-1/2 object-contain object-bottom dark:brightness-[0.92]"
                style={{
                  opacity: densityScale.opacity,
                  transform: `translateX(-50%) scale(${compact ? densityScale.img * 0.88 : densityScale.img})`,
                }}
                animate={
                  reduce
                    ? undefined
                    : { y: [0, -7, 0], rotate: [0, 0.6, 0] }
                }
                transition={{
                  duration: 6.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* “Para:” sobre el bolsillo (como referencia) */}
            {recipientName ? (
              <p
                className="absolute bottom-[26%] left-2 z-[5] max-w-[45%] text-left font-hand text-[11px] leading-snug text-stone-900/85 sm:left-3 sm:bottom-[24%] sm:text-xs dark:text-stone-100/90"
              >
                Para:{" "}
                <span className="font-medium text-stone-950 dark:text-white">
                  {recipientName}
                </span>
              </p>
            ) : null}

            {/* Capa 2 — tarjeta / carta (delante de las flores) */}
            <motion.div
              className={`relative z-10 mx-auto w-[90%] rounded-md border border-stone-300/45 bg-[#faf9f6] shadow-[0_14px_32px_-12px_rgba(30,22,18,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/12 dark:bg-[#2a2622] dark:shadow-[0_14px_32px_-12px_rgba(0,0,0,0.5)] ${paper.className}`}
              animate={{
                y: lift * 0.55,
                opacity: 0.4 + openAmount * 0.6,
              }}
              transition={{ duration: reduce ? 0 : 0.75, ease: "easeOut" }}
            >
              <div
                className={`relative z-10 px-4 py-8 sm:px-6 sm:py-10 ${compact ? "py-6 sm:py-8" : ""}`}
              >
                {stickerId !== "none" && (
                  <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden rounded-md opacity-[0.2]">
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

                <p
                  className={`whitespace-pre-wrap text-stone-800 dark:text-garden-50 ${font.className} ${compact ? "text-sm leading-relaxed" : "text-base leading-relaxed sm:text-[1.05rem]"} ${textClamp}`}
                >
                  {content || "Escribe algo que te haga sonreír..."}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-xs text-stone-500 dark:text-garden-200/90">
                  {authorName ? (
                    <span className={`${font.className} text-stone-700 dark:text-garden-100`}>
                      — {authorName}
                    </span>
                  ) : null}
                  {createdLabel ? (
                    <span className="rounded-full bg-stone-200/55 px-2 py-0.5 dark:bg-white/10">
                      {createdLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>

            {/* Capa 3 — solapa frontal del sobre (delante de la tarjeta abajo) */}
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-[32%] w-[108%] max-w-[108%] -translate-x-1/2 sm:h-[30%]"
              style={{
                clipPath:
                  "polygon(0% 100%, 5% 42%, 50% 8%, 95% 42%, 100% 100%)",
                background: `linear-gradient(180deg, ${kraft.flapTop} 0%, ${kraft.flapBottom} 100%)`,
                boxShadow:
                  "0 -10px 24px rgba(40,28,20,0.12), inset 0 2px 0 rgba(255,255,255,0.2)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 z-[21] h-[32%] w-[108%] max-w-[108%] -translate-x-1/2 opacity-[0.14] mix-blend-overlay sm:h-[30%]"
              style={{
                clipPath:
                  "polygon(0% 100%, 5% 42%, 50% 8%, 95% 42%, 100% 100%)",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              }}
              aria-hidden
            />

            {/* Solapa superior triangular */}
            <motion.div
              className="absolute left-1/2 top-0 z-[25] h-[44%] w-[112%] max-w-[112%] -translate-x-1/2 origin-top"
              style={{
                transformStyle: "preserve-3d",
                clipPath: "polygon(0 0, 50% 88%, 100% 0)",
                background: `linear-gradient(180deg, ${kraft.flapTop} 0%, ${kraft.flapBottom}dd 100%)`,
                boxShadow: "0 10px 24px rgba(40,28,20,0.12)",
              }}
              animate={{ rotateX: -flapOpen }}
              transition={{
                duration: reduce ? 0 : 0.95,
                ease: [0.22, 1, 0.36, 1],
              }}
            />

            <div className="pointer-events-none absolute bottom-3 left-1/2 z-[30] h-2 w-[42%] -translate-x-1/2 rounded-full bg-black/12 blur-md dark:bg-black/35" />
          </div>
        </motion.div>
      </div>
    );
  },
);
