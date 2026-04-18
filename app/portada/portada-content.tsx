"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function PortadaContent() {
  const searchParams = useSearchParams();
  const callback = searchParams.get("callbackUrl") ?? "/";
  const entrarHref = `/entrar?${new URLSearchParams({ callbackUrl: callback }).toString()}`;
  const registroHref = `/registro?${new URLSearchParams({ callbackUrl: callback }).toString()}`;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 sm:min-h-[calc(100vh-6rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#e8d4e0]/50 blur-3xl dark:bg-[#5c3d52]/45" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#c8e0d0]/50 blur-3xl dark:bg-[#2f4a3c]/40" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-rose-200/25 blur-3xl dark:bg-rose-900/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500 dark:text-garden-200/85">
          GARDEN LETTERS
        </p>
        <h1 className="mt-5 font-serif-romantic text-4xl leading-tight text-stone-900 sm:text-5xl dark:text-garden-50">
          Bienvenida al jardín
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-stone-600 dark:text-garden-200/90">
          Para crear, guardar y compartir cartas necesitás una cuenta. Entrá o
          registrate para empezar.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href={entrarHref}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-stone-900 px-10 text-sm font-medium text-white shadow-lg shadow-stone-900/20 transition hover:bg-stone-800 dark:bg-garden-100 dark:text-garden-900 dark:hover:bg-white"
          >
            Ya tengo cuenta
          </Link>
          <Link
            href={registroHref}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-stone-200 bg-white/85 px-10 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-50 dark:hover:border-white/30"
          >
            Crear cuenta
          </Link>
        </div>

        <p className="mx-auto mt-10 max-w-sm text-xs text-stone-500 dark:text-garden-200/70">
          Tus cartas quedan asociadas a tu perfil. Sin cuenta no podés usar el
          jardín.
        </p>

        <div className="mt-12 flex justify-center gap-6 text-3xl sm:text-4xl">
          {["🌷", "💌", "🌿"].map((emoji, i) => (
            <motion.span
              key={emoji}
              aria-hidden
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
