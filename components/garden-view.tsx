"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { EnvelopePreview } from "@/components/envelope-preview";
import { useClientId } from "@/hooks/useClientId";
import type { LetterDto } from "@/lib/api-types";

type FilterKey = "recent" | "beautiful" | "mine";

export function GardenView() {
  const { status } = useSession();
  const clientId = useClientId();
  const [filter, setFilter] = useState<FilterKey>("recent");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [letters, setLetters] = useState<LetterDto[]>([]);
  const [featured, setFeatured] = useState<LetterDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("filter", filter);
    if (debouncedQ) p.set("q", debouncedQ);
    if (filter === "mine" && status !== "authenticated" && clientId) {
      p.set("clientId", clientId);
    }
    return `/api/letters?${p.toString()}`;
  }, [filter, debouncedQ, clientId, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [listRes, featRes] = await Promise.all([
        fetch(queryUrl, { credentials: "include" }),
        fetch("/api/letters/featured", { credentials: "include" }),
      ]);
      const listData = await listRes.json();
      const featData = await featRes.json();
      if (!listRes.ok) throw new Error(listData.error ?? "Error");
      setLetters(listData.letters as LetterDto[]);
      setFeatured((featData.letter as LetterDto | null) ?? null);
    } catch {
      setErr("No se pudo cargar el jardín. ¿Está la base de datos en marcha?");
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }, [queryUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="font-serif-romantic text-4xl text-stone-900 dark:text-garden-50">
          Jardín público
        </h1>
        <p className="max-w-2xl text-stone-600 dark:text-garden-200/90">
          Un muro de sobres floridos. En{" "}
          <strong className="font-medium text-stone-800 dark:text-garden-100">
            Solo mías
          </strong>{" "}
          verás tu jardín si{" "}
          <Link href="/entrar" className="underline underline-offset-4">
            iniciás sesión
          </Link>
          .
        </p>
      </header>

      {featured && filter !== "mine" ? (
        <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white/80 to-rose-50/80 p-6 shadow-sm dark:border-amber-500/25 dark:from-amber-950/30 dark:via-black/20 dark:to-rose-950/25">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-800/90 dark:text-amber-200/90">
                Carta del día
              </p>
              <p className="font-serif-romantic text-2xl text-stone-900 dark:text-garden-50">
                Hoy brilla esta carta
              </p>
              <p className="text-sm text-stone-600 dark:text-garden-200/85">
                Elegida entre las más queridas del jardín (con un toque de magia
                diaria).
              </p>
              <Link
                href={`/carta/${featured.id}`}
                className="inline-flex rounded-full bg-stone-900 px-5 py-2 text-sm text-white dark:bg-garden-100 dark:text-garden-900"
              >
                Abrir carta del día
              </Link>
            </div>
            <div className="mx-auto w-full max-w-sm flex-1">
              <Link href={`/carta/${featured.id}`} className="block">
                <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                  <EnvelopePreview
                    envelopeColor={featured.envelopeColor}
                    flowerType={featured.flowerType}
                    flowerDensity={featured.flowerDensity}
                    paperType={featured.paperType}
                    fontStyle={featured.fontStyle}
                    sticker={featured.sticker}
                    content={
                      featured.locked
                        ? "🔒 Carta secreta — ábrela para leer"
                        : featured.content ?? ""
                    }
                    recipientName={featured.recipientName}
                    authorName={featured.authorName}
                    createdLabel={new Date(featured.createdAt).toLocaleDateString(
                      "es",
                      { day: "numeric", month: "short" },
                    )}
                    openAmount={0.35}
                    compact
                  />
                </motion.div>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["recent", "Recientes"],
              ["beautiful", "Más bonitas"],
              ["mine", "Solo mías"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                filter === key
                  ? "bg-stone-900 text-white dark:bg-garden-100 dark:text-garden-900"
                  : "border border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-garden-100 dark:hover:border-white/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por texto o autor…"
          className="w-full rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm outline-none focus:border-stone-400 sm:max-w-xs dark:border-white/10 dark:bg-black/25 dark:text-garden-50 dark:focus:border-white/30"
        />
      </div>

      {filter === "mine" && status === "unauthenticated" && !clientId ? (
        <p className="rounded-2xl border border-stone-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-100">
          Estamos preparando tu espacio… o{" "}
          <Link href="/entrar" className="font-medium underline">
            entrá
          </Link>{" "}
          para ver tu jardín personal.
        </p>
      ) : null}
      {filter === "mine" && status === "unauthenticated" && clientId ? (
        <p className="rounded-2xl border border-stone-200/80 bg-[var(--surface)]/90 px-4 py-3 text-sm text-stone-600 dark:border-white/10 dark:text-garden-200/90">
          Estás viendo cartas anónimas de este dispositivo.{" "}
          <Link href="/registro" className="font-medium underline">
            Creá una cuenta
          </Link>{" "}
          para guardar todo en tu perfil.
        </p>
      ) : null}

      {err ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-100">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando flores…
        </p>
      ) : letters.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center text-stone-500 dark:border-white/15 dark:text-garden-300/85">
          Aún no hay cartas aquí.{" "}
          <Link href="/crear" className="underline underline-offset-4">
            Plantá la primera
          </Link>
          .
        </p>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {letters.map((letter) => (
            <motion.div
              key={letter.id}
              className="mb-6 break-inside-avoid"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              <Link href={`/carta/${letter.id}`} className="block">
                <EnvelopePreview
                  envelopeColor={letter.envelopeColor}
                  flowerType={letter.flowerType}
                  flowerDensity={letter.flowerDensity}
                  paperType={letter.paperType}
                  fontStyle={letter.fontStyle}
                  sticker={letter.sticker}
                  content={
                    letter.locked
                      ? "🔒 Carta secreta"
                      : (letter.content ?? "").slice(0, 180) +
                        ((letter.content?.length ?? 0) > 180 ? "…" : "")
                  }
                  recipientName={letter.recipientName}
                  authorName={letter.authorName}
                  createdLabel={new Date(letter.createdAt).toLocaleDateString(
                    "es",
                    { day: "numeric", month: "short" },
                  )}
                  openAmount={Math.min(
                    0.52,
                    0.28 + (letter.score ?? 0) * 0.002,
                  )}
                  compact
                />
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-500 dark:text-garden-300/85">
                  <span>❤️ {letter.heartCount}</span>
                  <span>🌸 {letter.blossomCount}</span>
                  <span>✨ {letter.sparkleCount}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
