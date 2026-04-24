"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopePreview } from "@/components/envelope-preview";
import { GardenGrassStrip } from "@/components/garden-grass-strip";
import type { LetterDto } from "@/lib/api-types";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function letterGridLayout(n: number) {
  if (n <= 0) return { cols: 2, rows: 0 };
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(n * 1.25))));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

export function GardenMeadow({
  letters,
  variant = "incoming",
  readIds,
}: {
  letters: LetterDto[];
  variant?: "incoming" | "self";
  readIds: Set<string>;
}) {
  const sky =
    variant === "incoming"
      ? "from-sky-200/50 via-emerald-100/30 to-transparent dark:from-sky-900/40 dark:via-emerald-950/25"
      : "from-amber-100/45 via-rose-100/35 to-transparent dark:from-amber-950/35 dark:via-rose-950/25";

  const grassId = variant === "incoming" ? "gm-in" : "gm-self";
  const { cols, rows } = letterGridLayout(letters.length);
  const meadowMinH = Math.max(360, 220 + rows * 150);

  const unread = letters.filter((l) => !readIds.has(l.id));

  return (
    <div className="space-y-4">
      {unread.length > 0 ? (
        <div
          className={`rounded-2xl border px-3 py-3 sm:px-4 ${
            variant === "incoming"
              ? "border-amber-300/70 bg-amber-50/80 dark:border-amber-500/35 dark:bg-amber-950/30"
              : "border-rose-300/70 bg-rose-50/80 dark:border-rose-500/35 dark:bg-rose-950/25"
          }`}
        >
          <p className="mb-2 text-center font-hand text-sm font-medium text-emerald-950 dark:text-emerald-100">
            Sin leer ({unread.length}) — tocá para abrir
          </p>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
            {unread.map((letter) => (
              <Link
                key={letter.id}
                href={`/carta/${letter.id}`}
                className="group relative shrink-0 snap-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span
                  className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm dark:bg-amber-400"
                  aria-hidden
                />
                <div className="w-[120px] rounded-2xl shadow-[0_10px_24px_-4px_rgba(15,50,30,0.45)] ring-2 ring-white/50 dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.5)] dark:ring-white/15 sm:w-[132px]">
                  <div className="relative scale-[0.88]">
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
                      createdLabel={new Date(letter.createdAt).toLocaleDateString(
                        "es",
                        { day: "numeric", month: "short" },
                      )}
                      openAmount={0}
                      hideInnerContent
                      showSeal
                      compact
                    />
                  </div>
                </div>
                <p className="mt-1 max-w-[132px] truncate text-center font-hand text-[10px] text-emerald-950/90 dark:text-emerald-50/90">
                  {letter.authorName}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`relative isolate overflow-hidden rounded-[2rem] border border-emerald-300/50 bg-gradient-to-b ${sky} to-emerald-100/55 shadow-inner dark:border-emerald-700/40 dark:to-emerald-950/55`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/50 to-transparent dark:from-white/[0.07] dark:to-transparent" />

        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-lg opacity-40 dark:opacity-30"
              style={{
                left: `${(i * 17) % 92}%`,
                top: `${(i * 23) % 55}%`,
              }}
              animate={{ y: [0, -6, 0], opacity: [0.25, 0.55, 0.25] }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            >
              {variant === "incoming" ? "✨" : "🌷"}
            </motion.span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]">
          <GardenGrassStrip idPrefix={grassId} />
        </div>

        <div
          className="relative z-30 px-2 pb-28 pt-6 sm:px-6 sm:pb-32"
          style={{ minHeight: meadowMinH }}
        >
          <p className="mb-2 text-center font-hand text-sm text-emerald-950/80 dark:text-emerald-100/85">
            Tocá una carta sobre el pasto para abrirla 💌
          </p>
          <div className="relative mx-auto max-w-5xl" style={{ minHeight: meadowMinH - 120 }}>
            {letters.map((letter, i) => {
              const h = hashStr(letter.id);
              const row = Math.floor(i / cols);
              const col = i % cols;
              const span = 88 / cols;
              const jitterX = ((h % 9) - 4) * 0.45;
              const left = Math.min(86, Math.max(4, 6 + col * span + jitterX));
              const bottom =
                rows <= 1
                  ? 16 + (h % 12)
                  : 12 + (row / Math.max(rows - 1, 1)) * 54;
              const rot = -11 + (h % 22);
              const z = 20 + (h % 8);
              const isUnread = !readIds.has(letter.id);

              return (
                <motion.div
                  key={letter.id}
                  className="absolute w-[min(22%,168px)] min-w-[100px] max-w-[168px] sm:w-[min(20%,180px)] sm:max-w-[180px]"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    rotate: `${rot}deg`,
                    zIndex: z,
                  }}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 22,
                    delay: Math.min(i * 0.06, 0.45),
                  }}
                  whileHover={{ y: -10, scale: 1.02, zIndex: 80 }}
                >
                  <Link
                    href={`/carta/${letter.id}`}
                    className="group relative block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {isUnread ? (
                      <span
                        className="absolute -right-1 -top-1 z-20 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:bg-amber-400 dark:ring-emerald-950"
                        title="Sin leer"
                      />
                    ) : null}
                    <div className="relative rounded-2xl shadow-[0_14px_32px_-6px_rgba(15,50,30,0.5)] ring-2 ring-white/50 dark:shadow-[0_14px_32px_-6px_rgba(0,0,0,0.55)] dark:ring-white/15">
                      <div className="relative scale-[0.92]">
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
                          createdLabel={new Date(
                            letter.createdAt,
                          ).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                          })}
                          openAmount={0}
                          hideInnerContent
                          showSeal
                          compact
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-center font-hand text-[11px] text-emerald-950/90 opacity-0 transition group-hover:opacity-100 dark:text-emerald-50/90">
                      {letter.authorName} · ❤️{letter.heartCount}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {letters.length > 0 ? (
        <div className="rounded-2xl border border-stone-200/90 bg-[var(--surface)]/80 px-3 py-3 dark:border-white/10 dark:bg-black/20">
          <p className="mb-2 text-center text-xs font-medium text-stone-600 dark:text-garden-200/90">
            Todas las cartas — vista compacta
          </p>
          <ul className="flex max-h-[220px] flex-wrap justify-center gap-2 overflow-y-auto sm:max-h-[280px]">
            {letters.map((letter) => {
              const unreadDot = !readIds.has(letter.id);
              return (
                <li key={letter.id}>
                  <Link
                    href={`/carta/${letter.id}`}
                    className="flex w-[72px] flex-col items-center gap-0.5 rounded-xl p-1.5 text-center transition hover:bg-stone-100/90 dark:hover:bg-white/10"
                  >
                    <div className="relative w-full">
                      {unreadDot ? (
                        <span className="absolute -right-0.5 -top-0.5 z-10 h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                      ) : null}
                      <div className="origin-top scale-[0.72]">
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
                          createdLabel={new Date(
                            letter.createdAt,
                          ).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                          })}
                          openAmount={0}
                          hideInnerContent
                          showSeal
                          compact
                        />
                      </div>
                    </div>
                    <span className="line-clamp-2 w-full text-[9px] leading-tight text-stone-600 dark:text-garden-300/90">
                      {letter.authorName}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
