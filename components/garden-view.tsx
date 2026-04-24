"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { EnvelopePreview } from "@/components/envelope-preview";
import { GardenMeadow } from "@/components/garden-meadow";
import { useClientId } from "@/hooks/useClientId";
import { useReadLetterIds } from "@/hooks/useReadLetterIds";
import type { LetterDto } from "@/lib/api-types";

type ExploreFilter = "recent" | "beautiful";

export function GardenView() {
  const { status, data: session } = useSession();
  const clientId = useClientId();
  const { readIds } = useReadLetterIds();
  const [mode, setMode] = useState<"mine" | "explore">("mine");
  const [exploreFilter, setExploreFilter] = useState<ExploreFilter>("recent");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [received, setReceived] = useState<LetterDto[]>([]);
  const [selfGarden, setSelfGarden] = useState<LetterDto[]>([]);
  const [exploreLetters, setExploreLetters] = useState<LetterDto[]>([]);
  const [featured, setFeatured] = useState<LetterDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  const receivedUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("filter", "received");
    if (debouncedQ) p.set("q", debouncedQ);
    return `/api/letters?${p.toString()}`;
  }, [debouncedQ]);

  const selfUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("filter", "self_garden");
    if (debouncedQ) p.set("q", debouncedQ);
    return `/api/letters?${p.toString()}`;
  }, [debouncedQ]);

  const exploreUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("filter", exploreFilter);
    if (debouncedQ) p.set("q", debouncedQ);
    return `/api/letters?${p.toString()}`;
  }, [debouncedQ, exploreFilter]);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [rRes, sRes, featRes] = await Promise.all([
        fetch(receivedUrl, { credentials: "include" }),
        fetch(selfUrl, { credentials: "include" }),
        fetch("/api/letters/featured", { credentials: "include" }),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      const featData = await featRes.json();
      if (!rRes.ok) throw new Error(rData.error ?? "Error");
      if (!sRes.ok) throw new Error(sData.error ?? "Error");
      setReceived(rData.letters as LetterDto[]);
      setSelfGarden(sData.letters as LetterDto[]);
      setFeatured((featData.letter as LetterDto | null) ?? null);
    } catch {
      setErr("No se pudo cargar el jardín. ¿Está la base de datos en marcha?");
      setReceived([]);
      setSelfGarden([]);
    } finally {
      setLoading(false);
    }
  }, [receivedUrl, selfUrl]);

  const loadExplore = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [listRes, featRes] = await Promise.all([
        fetch(exploreUrl, { credentials: "include" }),
        fetch("/api/letters/featured", { credentials: "include" }),
      ]);
      const listData = await listRes.json();
      const featData = await featRes.json();
      if (!listRes.ok) throw new Error(listData.error ?? "Error");
      setExploreLetters(listData.letters as LetterDto[]);
      setFeatured((featData.letter as LetterDto | null) ?? null);
    } catch {
      setErr("No se pudo cargar el jardín público.");
      setExploreLetters([]);
    } finally {
      setLoading(false);
    }
  }, [exploreUrl]);

  useEffect(() => {
    if (status === "loading") return;
    if (mode === "mine" && status === "authenticated") {
      void loadMine();
    } else if (mode === "explore") {
      void loadExplore();
    } else if (mode === "mine" && status !== "authenticated") {
      setReceived([]);
      setSelfGarden([]);
    }
  }, [mode, status, loadMine, loadExplore]);

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="font-serif-romantic text-4xl text-stone-900 dark:text-garden-50">
          Jardín
        </h1>
        <p className="max-w-2xl text-stone-600 dark:text-garden-200/90">
          {status === "authenticated" ? (
            <>
              Acá reunimos lo que{" "}
              <strong className="font-medium text-stone-800 dark:text-garden-100">
                te escribieron otros
              </strong>{" "}
              y lo que{" "}
              <strong className="font-medium text-stone-800 dark:text-garden-100">
                te escribiste a vos mismo
              </strong>
              . En el pasto animado las cartas están enterraditas: tocá una
              para abrirla.
            </>
          ) : (
            <>
              Explorá cartas públicas o{" "}
              <Link href="/entrar" className="underline underline-offset-4">
                iniciá sesión
              </Link>{" "}
              para ver tu jardín personal.
            </>
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={status !== "authenticated"}
          onClick={() => setMode("mine")}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "mine"
              ? "bg-stone-900 text-white dark:bg-garden-100 dark:text-garden-900"
              : "border border-stone-200 bg-white/70 text-stone-700 enabled:hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-garden-100 dark:enabled:hover:border-white/25"
          }`}
        >
          Mi jardín
        </button>
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "explore"
              ? "bg-stone-900 text-white dark:bg-garden-100 dark:text-garden-900"
              : "border border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-garden-100 dark:hover:border-white/25"
          }`}
        >
          Explorar públicas
        </button>
      </div>

      {mode === "explore" && featured ? (
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
                Elegida entre las más queridas del jardín público.
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
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <EnvelopePreview
                    envelopeColor={featured.envelopeColor}
                    flowerType={featured.flowerType}
                    flowerDensity={featured.flowerDensity}
                    paperType={featured.paperType}
                    fontStyle={featured.fontStyle}
                    sticker={featured.sticker}
                    content={featured.content ?? ""}
                    imageUrls={featured.imageAttachments ?? []}
                    recipientName={featured.recipientName}
                    authorName={featured.authorName}
                    createdLabel={new Date(featured.createdAt).toLocaleDateString(
                      "es",
                      { day: "numeric", month: "short" },
                    )}
                    openAmount={0}
                    hideInnerContent
                    showSeal
                    compact
                  />
                </motion.div>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {mode === "explore" ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["recent", "Recientes"],
                ["beautiful", "Más bonitas"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setExploreFilter(key)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  exploreFilter === key
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
            placeholder="Buscar…"
            className="w-full rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm outline-none focus:border-stone-400 sm:max-w-xs dark:border-white/10 dark:bg-black/25 dark:text-garden-50 dark:focus:border-white/30"
          />
        </div>
      ) : (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en tus secciones…"
          className="w-full rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm outline-none focus:border-stone-400 sm:max-w-md dark:border-white/10 dark:bg-black/25 dark:text-garden-50 dark:focus:border-white/30"
        />
      )}

      {mode === "mine" && status !== "authenticated" ? (
        <p className="rounded-2xl border border-stone-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-100">
          Para ver cartas que te enviaron y las que te escribiste a vos mismo,{" "}
          <Link href="/entrar" className="font-medium underline">
            iniciá sesión
          </Link>
          . Mientras tanto podés{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => setMode("explore")}
          >
            explorar el jardín público
          </button>
          .
        </p>
      ) : null}

      {mode === "mine" && status === "unauthenticated" && clientId ? (
        <p className="rounded-2xl border border-stone-200/80 bg-[var(--surface)]/90 px-4 py-3 text-sm text-stone-600 dark:border-white/10 dark:text-garden-200/90">
          En este dispositivo podés seguir creando cartas. Para el jardín
          personal con envíos por nombre de usuario,{" "}
          <Link href="/registro" className="font-medium underline">
            creá una cuenta
          </Link>
          .
        </p>
      ) : null}

      {err ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-100">
          {err}
        </p>
      ) : null}

      {status === "loading" || (mode === "mine" && status === "authenticated" && loading) ? (
        <p className="text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando flores…
        </p>
      ) : null}

      {mode === "explore" && loading ? (
        <p className="text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando flores…
        </p>
      ) : null}

      {mode === "mine" && status === "authenticated" && !loading ? (
        <div className="space-y-14">
          <section className="space-y-4">
            <h2 className="font-serif-romantic text-2xl text-stone-900 dark:text-garden-50">
              Te escribieron
            </h2>
            <p className="text-sm text-stone-600 dark:text-garden-200/85">
              Cartas enviadas a @{session?.user?.username ?? "tu usuario"}.
            </p>
            {received.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-12 text-center text-stone-500 dark:border-white/15 dark:text-garden-300/85">
                Nadie te ha enviado una carta todavía. Pasales tu{" "}
                <strong className="text-stone-700 dark:text-garden-100">
                  nombre de usuario exacto
                </strong>{" "}
                (en crear carta → “Enviar a un usuario”) para que llegue acá.
              </p>
            ) : (
              <GardenMeadow letters={received} variant="incoming" readIds={readIds} />
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-serif-romantic text-2xl text-stone-900 dark:text-garden-50">
              Para vos, de vos
            </h2>
            <p className="text-sm text-stone-600 dark:text-garden-200/85">
              Cartas que te escribiste a vos mismo.
            </p>
            {selfGarden.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-12 text-center text-stone-500 dark:border-white/15 dark:text-garden-300/85">
                Aún no tenés cartas en esta sección. En{" "}
                <Link href="/crear" className="underline underline-offset-4">
                  crear carta
                </Link>{" "}
                podés enviarte a @{session?.user?.username ?? "tu usuario"}.
              </p>
            ) : (
              <GardenMeadow letters={selfGarden} variant="self" readIds={readIds} />
            )}
          </section>
        </div>
      ) : null}

      {mode === "explore" && !loading ? (
        exploreLetters.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center text-stone-500 dark:border-white/15 dark:text-garden-300/85">
            Aún no hay cartas aquí.{" "}
            <Link href="/crear" className="underline underline-offset-4">
              Plantá la primera
            </Link>
            .
          </p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {exploreLetters.map((letter) => (
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
                    imageUrls={letter.imageAttachments ?? []}
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
                    openAmount={0}
                    hideInnerContent
                    showSeal
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
        )
      ) : null}
    </div>
  );
}
