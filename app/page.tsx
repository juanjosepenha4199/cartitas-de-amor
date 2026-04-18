"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";

const float = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 2, -2, 0],
  },
  transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#e8d4e0]/40 blur-3xl dark:bg-[#5c3d52]/40" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#c8e0d0]/45 blur-3xl dark:bg-[#2f4a3c]/35" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm uppercase tracking-[0.35em] text-stone-500 dark:text-garden-200/85"
        >
          GARDEN LETTERS
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 font-serif-romantic text-4xl leading-tight text-stone-900 sm:text-5xl dark:text-garden-50"
        >
          Un jardín de cartas para dos
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-lg text-stone-600 dark:text-garden-200/90"
        >
          Escribe con flores, sobres suaves y un aire vintage. Guarda lo íntimo,
          comparte lo bonito, y deja que el jardín conserve vuestros momentos.
        </motion.p>

        <div className="relative left-1/2 mt-12 w-screen max-w-[100vw] -translate-x-1/2 border-y border-stone-200/70 bg-gradient-to-r from-[#f3e9df]/90 via-white/50 to-[#e4dcf5]/80 py-5 shadow-inner dark:border-white/10 dark:from-[#2a1f2e]/90 dark:via-black/25 dark:to-[#1e2430]/80">
          <ScrollVelocityContainer className="text-4xl font-bold text-stone-800 md:text-7xl dark:text-garden-50">
            <ScrollVelocityRow
              baseVelocity={20}
              direction={1}
              className="font-serif-romantic py-1"
            >
              <span className="inline-flex items-center gap-6 px-6">
                un Hub para redactarnos cartitas amor{" "}
                <span aria-hidden className="text-rose-400 dark:text-rose-300">
                  {"<3"}
                </span>
                <span className="text-stone-300 dark:text-white/25">✿</span>
              </span>
            </ScrollVelocityRow>
            <ScrollVelocityRow
              baseVelocity={20}
              direction={-1}
              className="font-serif-romantic py-1 text-stone-600 dark:text-garden-200/95"
            >
              <span className="inline-flex items-center gap-6 px-6">
                un Hub para redactarnos cartitas amor{" "}
                <span aria-hidden className="text-rose-400 dark:text-rose-300">
                  {"<3"}
                </span>
                <span className="text-stone-300 dark:text-white/25">✿</span>
              </span>
            </ScrollVelocityRow>
          </ScrollVelocityContainer>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/crear"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 dark:bg-garden-100 dark:text-garden-900 dark:hover:bg-white"
          >
            Crear carta
          </Link>
          <Link
            href="/jardin"
            className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/80 px-8 py-3 text-sm font-medium text-stone-800 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-50 dark:hover:border-white/30"
          >
            Ver jardín
          </Link>
        </motion.div>

        <div className="mt-16 flex justify-center gap-8 text-4xl sm:gap-12 sm:text-5xl">
          {["🌷", "💌", "🌿", "✨"].map((emoji, i) => (
            <motion.span
              key={emoji}
              {...float}
              transition={{
                ...float.transition,
                delay: i * 0.35,
              }}
              aria-hidden
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-16 grid max-w-lg gap-3 text-left text-sm text-stone-600 dark:text-garden-200/85"
        >
          <li className="rounded-2xl border border-stone-200/70 bg-[var(--surface)]/80 px-4 py-3 dark:border-white/10">
            <span className="font-medium text-stone-800 dark:text-garden-50">
              Preview en vivo
            </span>{" "}
            mientras eliges color del sobre, flores y papel.
          </li>
          <li className="rounded-2xl border border-stone-200/70 bg-[var(--surface)]/80 px-4 py-3 dark:border-white/10">
            <span className="font-medium text-stone-800 dark:text-garden-50">
              Carta secreta
            </span>{" "}
            con clave, programación para aniversarios y enlace para compartir.
          </li>
          <li className="rounded-2xl border border-stone-200/70 bg-[var(--surface)]/80 px-4 py-3 dark:border-white/10">
            <span className="font-medium text-stone-800 dark:text-garden-50">
              Jardín tipo Pinterest
            </span>{" "}
            con filtros, búsqueda y reacciones ❤️ 🌸 ✨.
          </li>
        </motion.ul>
      </div>
    </div>
  );
}
