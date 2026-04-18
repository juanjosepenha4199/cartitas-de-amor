"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader({
  dark,
  onToggleDark,
  variant = "full",
}: {
  dark: boolean;
  onToggleDark: () => void;
  variant?: "full" | "gate";
}) {
  const { status } = useSession();
  const homeHref = variant === "gate" ? "/portada" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[var(--surface)]/85 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={homeHref} className="group flex items-center gap-2">
          <motion.span
            className="text-xl sm:text-2xl"
            whileHover={{ scale: 1.06, rotate: [-2, 2, 0] }}
            transition={{ type: "spring", stiffness: 400, damping: 14 }}
            aria-hidden
          >
            🌸
          </motion.span>
          <div className="leading-tight">
            <p className="font-serif-romantic text-lg tracking-wide text-stone-800 dark:text-garden-50">
              GARDEN LETTERS
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-garden-200/80">
              cartas en flor
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {variant === "full" ? (
            <>
              <Link
                href="/crear"
                className="rounded-full bg-stone-900 px-3 py-1.5 text-sm text-white shadow-sm transition hover:bg-stone-800 dark:bg-garden-100 dark:text-garden-900 dark:hover:bg-white"
              >
                Crear
              </Link>
              <Link
                href="/jardin"
                className="rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-sm text-stone-800 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-50 dark:hover:border-white/25"
              >
                Jardín
              </Link>
            </>
          ) : null}
          {variant === "full" && status === "authenticated" ? (
            <>
              <Link
                href="/perfil"
                className="rounded-full border border-transparent px-2 py-1.5 text-sm text-stone-600 hover:text-stone-900 dark:text-garden-200 dark:hover:text-white"
              >
                Perfil
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/portada" })}
                className="rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-xs text-stone-700 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-100 sm:text-sm"
              >
                Salir
              </button>
            </>
          ) : null}
          {variant === "full" && status !== "authenticated" ? (
            <Link
              href="/entrar"
              className="rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-sm text-stone-800 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-50"
            >
              Entrar
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onToggleDark}
            className="rounded-full border border-stone-200 bg-white/80 p-2 text-sm text-stone-700 shadow-sm transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-100"
            aria-label={dark ? "Modo día" : "Modo nocturno romántico"}
            title={dark ? "Modo día" : "Modo nocturno"}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </nav>
      </div>
    </header>
  );
}
