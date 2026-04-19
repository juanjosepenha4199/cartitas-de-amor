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

export function GardenMeadow({
  letters,
  variant = "incoming",
}: {
  letters: LetterDto[];
  variant?: "incoming" | "self";
}) {
  const sky =
    variant === "incoming"
      ? "from-sky-200/50 via-emerald-100/30 to-transparent dark:from-sky-900/40 dark:via-emerald-950/25"
      : "from-amber-100/45 via-rose-100/35 to-transparent dark:from-amber-950/35 dark:via-rose-950/25";

  const grassId = variant === "incoming" ? "gm-in" : "gm-self";

  return (
    <div
      className={`relative isolate min-h-[360px] overflow-hidden rounded-[2rem] border border-emerald-300/50 bg-gradient-to-b ${sky} to-emerald-100/55 shadow-inner dark:border-emerald-700/40 dark:to-emerald-950/55`}
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

      {/* Pasto vectorial detrás; cartas en capa superior (z-30) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]">
        <GardenGrassStrip idPrefix={grassId} />
      </div>

      <div className="relative z-30 min-h-[360px] px-2 pb-28 pt-6 sm:px-6 sm:pb-32">
        <p className="mb-2 text-center font-hand text-sm text-emerald-950/80 dark:text-emerald-100/85">
          Tocá una carta sobre el pasto para abrirla 💌
        </p>
        <div className="relative mx-auto min-h-[280px] max-w-4xl">
          {letters.map((letter, i) => {
            const h = hashStr(letter.id);
            const left = 2 + (h % 72);
            const bottom = 14 + ((h >> 7) % 22);
            const rot = -16 + (h % 32);
            const z = 20 + (h % 8);
            return (
              <motion.div
                key={letter.id}
                className="absolute w-[min(46%,200px)] max-w-[200px]"
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
                  className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
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
  );
}
