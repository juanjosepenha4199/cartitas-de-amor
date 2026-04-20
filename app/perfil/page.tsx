"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { EmailChangeForm } from "@/components/email-change-form";
import { EnvelopePreview } from "@/components/envelope-preview";
import { useFavorites } from "@/hooks/useFavorites";
import type { LetterDto } from "@/lib/api-types";

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const { favoriteIds, toggle } = useFavorites();
  const [mine, setMine] = useState<LetterDto[]>([]);
  const [faves, setFaves] = useState<LetterDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const mineRes = await fetch("/api/letters?filter=mine", {
          credentials: "include",
        });
        const mineData = await mineRes.json();
        if (!cancelled && mineRes.ok) setMine(mineData.letters as LetterDto[]);

        const favList: LetterDto[] = [];
        for (const fid of favoriteIds) {
          const r = await fetch(`/api/letters/${fid}`, {
            credentials: "include",
          });
          const d = await r.json();
          if (r.ok) favList.push(d.letter as LetterDto);
        }
        if (!cancelled) setFaves(favList);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [favoriteIds, status]);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-serif-romantic text-4xl text-stone-900 dark:text-garden-50">
          Tu rincón
        </h1>
        <p className="mt-2 max-w-xl text-stone-600 dark:text-garden-200/90">
          Hola{session?.user?.name ? `, ${session.user.name}` : ""}. Acá están
          las cartas de tu cuenta y tus favoritas.
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-garden-300/80">
          @{session?.user?.username} · {session?.user?.email}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-serif-romantic text-2xl text-stone-800 dark:text-garden-50">
          Correo electrónico
        </h2>
        <p className="max-w-xl text-sm text-stone-600 dark:text-garden-200/85">
          Las notificaciones de cartas nuevas se envían a tu correo. Podés
          cambiarlo cuando quieras; te pediremos la contraseña para confirmar.
        </p>
        <EmailChangeForm />
      </section>

      {loading || status === "loading" ? (
        <p className="text-sm text-stone-500">Cargando…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="font-serif-romantic text-2xl text-stone-800 dark:text-garden-50">
              Cartas que escribiste
            </h2>
            <p className="text-sm text-stone-600 dark:text-garden-200/85">
              Todas las que creaste con tu cuenta (para vos o para otros).
            </p>
            {mine.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-garden-300/85">
                Aún no hay cartas en tu jardín.{" "}
                <Link href="/crear" className="underline underline-offset-4">
                  Plantá la primera
                </Link>
                .
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {mine.map((letter) => (
                  <motion.div key={letter.id} layout>
                    <Link href={`/carta/${letter.id}`} className="block">
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
                        openAmount={0}
                        hideInnerContent
                        showSeal
                        compact
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-serif-romantic text-2xl text-stone-800 dark:text-garden-50">
              Favoritas
            </h2>
            {faves.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-garden-300/85">
                Toca “Favorito” al leer una carta para guardarla aquí.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {faves.map((letter) => (
                  <div key={letter.id} className="space-y-2">
                    <Link href={`/carta/${letter.id}`} className="block">
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
                        openAmount={0}
                        hideInnerContent
                        showSeal
                        compact
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(letter.id)}
                      className="text-xs text-stone-500 underline dark:text-garden-300/85"
                    >
                      Quitar de favoritos
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
