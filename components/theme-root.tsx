"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PetalRain } from "@/components/petal-rain";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const STORAGE = "gardenLetters_theme";

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gateLayout =
    pathname === "/portada" ||
    pathname === "/entrar" ||
    pathname === "/registro";
  const [dark, setDark] = useState(false);
  const [petals, setPetals] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE);
      if (t === "dark") setDark(true);
      else if (t === "light") setDark(false);
      else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      const p = localStorage.getItem("gardenLetters_petals");
      setPetals(p !== "0");
    } catch {
      setDark(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <PetalRain active={petals && !dark} />
      <SiteHeader
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        variant={gateLayout ? "gate" : "full"}
      />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <AnimatedThemeToggler
        isDark={dark}
        onToggle={() => setDark((d) => !d)}
        duration={400}
        className="fixed bottom-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-stone-200/90 bg-[var(--surface)]/95 text-stone-800 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-stone-300 hover:shadow-lg dark:border-white/15 dark:bg-[var(--surface)]/90 dark:text-garden-50 dark:hover:border-white/25"
      />
      <footer className="relative z-10 border-t border-stone-200/60 py-8 text-center text-sm text-stone-500 dark:border-white/10 dark:text-garden-200/80">
        <p className="font-serif-romantic text-stone-700 dark:text-garden-100">
          Hecho con ternura — GARDEN LETTERS
        </p>
        <button
          type="button"
          className="mt-2 text-xs underline decoration-stone-300 underline-offset-4 hover:text-stone-800 dark:decoration-white/20 dark:hover:text-white"
          onClick={() => {
            const next = !petals;
            setPetals(next);
            try {
              localStorage.setItem("gardenLetters_petals", next ? "1" : "0");
            } catch {
              /* ignore */
            }
          }}
        >
          {petals ? "Pausar pétalos" : "Activar pétalos"}
        </button>
      </footer>
    </div>
  );
}
