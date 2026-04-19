"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadLetterPdf } from "@/lib/letter-pdf-export";
import { useSession } from "next-auth/react";
import { EnvelopePreview } from "@/components/envelope-preview";
import {
  DEFAULT_FLOWER_DENSITY,
  ENVELOPE_COLORS,
  FLOWER_TYPES,
  FONT_STYLES,
  PAPER_TYPES,
  STICKERS,
} from "@/lib/options";
import { useClientId } from "@/hooks/useClientId";
import { playSoftChime } from "@/lib/sound";
import type { LetterDto } from "@/lib/api-types";
import {
  compressImageToDataUrl,
  MAX_LETTER_IMAGES,
} from "@/lib/image-attach";
import { MAX_LETTER_CONTENT_CHARS } from "@/lib/letter-limits";

type WizardStep = 1 | 2 | 3;
type DestinationMode = "self" | "one" | "multi";

function parseNickList(raw: string): string[] {
  const parts = raw.split(/[\s,;]+/);
  const out: string[] = [];
  for (const p of parts) {
    const n = p.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

export function LetterEditor() {
  const { data: session, status } = useSession();
  const clientId = useClientId();
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [content, setContent] = useState("");
  const [imageAttachments, setImageAttachments] = useState<string[]>([]);
  const [envelopeColor, setEnvelopeColor] = useState("cream");
  const [flowerType, setFlowerType] = useState("rose");
  const [paperType, setPaperType] = useState("textured");
  const [fontStyle, setFontStyle] = useState("handwriting");
  const [sticker, setSticker] = useState("none");
  const [recipientName, setRecipientName] = useState("");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [destinationMode, setDestinationMode] =
    useState<DestinationMode>("one");
  const [multiUsernamesText, setMultiUsernamesText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSecret, setIsSecret] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [soundOnSave, setSoundOnSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<LetterDto | null>(null);
  const [savedLetters, setSavedLetters] = useState<LetterDto[]>([]);
  const [savedHadRecipient, setSavedHadRecipient] = useState(false);
  const [saveInsertKey, setSaveInsertKey] = useState(0);

  const previewOpen = 0.55;

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    setAuthorName((prev) => {
      if (prev.trim()) return prev;
      return session.user.name?.trim() || session.user.username || "";
    });
  }, [status, session]);

  const onSave = useCallback(async () => {
    setError(null);
    if (!content.trim()) {
      setError("Primero escribí el mensaje (paso 1).");
      return;
    }
    if (!authorName.trim()) {
      setError("Indicá cómo firmás la carta.");
      return;
    }
    if (status !== "authenticated" || !session?.user?.id) {
      setError("Para enviar tenés que iniciar sesión.");
      return;
    }
    const selfU = session.user.username?.trim().toLowerCase();
    let recipientUsernamePayload: string | null = null;
    let recipientUsernamesPayload: string[] | undefined;

    if (destinationMode === "self") {
      if (!selfU) {
        setError("Tu cuenta no tiene nombre de usuario; no podés enviarte a vos mismo por nick.");
        return;
      }
      recipientUsernamePayload = selfU;
    } else if (destinationMode === "one") {
      const nick = recipientUsername.trim().toLowerCase();
      if (!nick) {
        setError("Escribí el nick de la persona destinataria.");
        return;
      }
      recipientUsernamePayload = nick;
    } else {
      const list = parseNickList(multiUsernamesText);
      if (list.length < 2) {
        setError("En «varias personas» necesitás al menos dos nicks distintos.");
        return;
      }
      recipientUsernamesPayload = list;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          envelopeColor,
          flowerType,
          flowerDensity: DEFAULT_FLOWER_DENSITY,
          paperType,
          fontStyle,
          sticker,
          recipientName: recipientName || null,
          recipientUsername: recipientUsernamesPayload
            ? null
            : recipientUsernamePayload,
          recipientUsernames: recipientUsernamesPayload,
          imageAttachments,
          authorName: authorName.trim() || "Anónimo",
          isPublic,
          isSecret,
          password: isSecret ? secretPassword : "",
          clientAuthorId: clientId,
          scheduledAt: scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }
      const multi = Array.isArray(data.letters) ? (data.letters as LetterDto[]) : null;
      if (multi && multi.length > 0) {
        setSavedLetters(multi);
        setSaved(multi[0] ?? null);
      } else {
        setSavedLetters([]);
        setSaved(data.letter as LetterDto);
      }
      setSavedHadRecipient(true);
      setSaveInsertKey((k) => k + 1);
      if (soundOnSave) playSoftChime();
    } catch {
      setError("No hay conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }, [
    authorName,
    clientId,
    content,
    destinationMode,
    envelopeColor,
    flowerType,
    fontStyle,
    imageAttachments,
    isPublic,
    isSecret,
    multiUsernamesText,
    paperType,
    recipientName,
    recipientUsername,
    scheduledAt,
    secretPassword,
    session,
    status,
    sticker,
    soundOnSave,
  ]);

  const onPickImages = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);
      const next = [...imageAttachments];
      for (let i = 0; i < files.length && next.length < MAX_LETTER_IMAGES; i++) {
        const f = files[i];
        if (!f?.type.startsWith("image/")) continue;
        try {
          const dataUrl = await compressImageToDataUrl(f);
          next.push(dataUrl);
        } catch {
          setError("No se pudo procesar una de las imágenes.");
        }
      }
      setImageAttachments(next);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [imageAttachments],
  );

  const downloadPdf = useCallback(async () => {
    if (!content.trim()) {
      setError("Escribí algo en la carta antes de exportar el PDF.");
      return;
    }
    setError(null);
    try {
      await downloadLetterPdf(
        {
          title: "Borrador de carta",
          content,
          recipientName: recipientName || null,
          authorName: authorName.trim() || "Anónimo",
          createdLabel: new Date().toLocaleDateString("es", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          imageAttachments,
        },
        `borrador-${Date.now()}`,
      );
    } catch {
      setError(
        "No se pudo generar el PDF. Si la carta es muy larga, probá otro navegador.",
      );
    }
  }, [
    authorName,
    content,
    imageAttachments,
    recipientName,
  ]);

  const shareUrl =
    typeof window !== "undefined" && saved
      ? `${window.location.origin}/carta/${saved.id}`
      : "";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-rose-200/50 bg-gradient-to-br from-rose-50/90 via-[var(--surface)]/95 to-violet-50/80 p-1 shadow-lg dark:border-white/10 dark:from-rose-950/20 dark:via-white/[0.03] dark:to-violet-950/25"
      >
        <div className="rounded-[1.35rem] border border-white/60 bg-white/40 p-5 dark:border-white/10 dark:bg-black/20 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif-romantic text-3xl text-stone-900 dark:text-garden-50">
                Crear carta
              </h1>
              <p className="mt-1 max-w-md text-sm text-stone-600 dark:text-garden-200/90">
                Seguí los tres pasos en orden: redactar, personalizar y elegir
                destinatario. No se puede saltar ninguno.
              </p>
            </div>
            <motion.div
              className="hidden text-4xl sm:block"
              animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              💌
            </motion.div>
          </div>

          <ol className="mb-5 flex list-none flex-wrap gap-2 rounded-2xl bg-white/60 p-2 text-xs font-medium dark:bg-black/25 sm:text-sm">
            {(
              [
                [1, "1. Redactar", "Texto y fotos"],
                [2, "2. Personalizar", "Sobre y papel"],
                [3, "3. Enviar", "Destino y opciones"],
              ] as const
            ).map(([n, label, hint]) => (
              <li
                key={n}
                className={`flex min-w-[120px] flex-1 flex-col rounded-xl px-2 py-2 text-center sm:px-3 ${
                  step === n
                    ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-md"
                    : step > n
                      ? "text-emerald-800 dark:text-emerald-200/90"
                      : "text-stone-400 dark:text-white/35"
                }`}
              >
                <span>{label}</span>
                <span className="mt-0.5 hidden text-[10px] font-normal opacity-90 sm:block">
                  {hint}
                </span>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 1 ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              {step === 1 ? (
                <>
                  <div className="rounded-2xl border-2 border-dashed border-rose-300/70 bg-gradient-to-b from-white/90 to-rose-50/50 p-1 dark:border-rose-500/30 dark:from-white/5 dark:to-rose-950/20">
                    <label className="block p-3">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-900 dark:text-rose-100">
                        <span className="text-lg">📝</span> Tu mensaje
                      </span>
                      <textarea
                        value={content}
                        onChange={(e) =>
                          setContent(
                            e.target.value.slice(0, MAX_LETTER_CONTENT_CHARS),
                          )
                        }
                        maxLength={MAX_LETTER_CONTENT_CHARS}
                        rows={12}
                        placeholder="Escribí con el corazón…"
                        className="min-h-[220px] w-full resize-y rounded-xl border-0 bg-transparent px-2 py-2 font-hand text-lg text-stone-900 outline-none placeholder:text-stone-400 dark:text-garden-50 dark:placeholder:text-garden-400/60"
                      />
                      <div className="mt-2 flex justify-between text-xs text-stone-500 dark:text-garden-300/80">
                        <span>Podés borrar y reescribir las veces que quieras</span>
                        <span>
                          {content.length.toLocaleString("es")}/
                          {MAX_LETTER_CONTENT_CHARS.toLocaleString("es")}
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="rounded-2xl border border-stone-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-black/20">
                    <p className="mb-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      📷 Fotos dentro de la carta (opcional, máx. {MAX_LETTER_IMAGES})
                    </p>
                    <p className="mb-3 text-xs text-stone-500 dark:text-garden-300/85">
                      Se comprimen al subir. Para varias hojas de texto podés
                      pegar un salto de página (carácter form feed, Ctrl+L en
                      algunos editores) entre párrafos.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => void onPickImages(e.target.files)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 dark:border-white/20 dark:bg-white/10 dark:text-garden-50"
                      >
                        Elegir imágenes
                      </button>
                      {imageAttachments.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setImageAttachments([])}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-800 dark:border-red-500/40 dark:text-red-200"
                        >
                          Quitar todas
                        </button>
                      ) : null}
                    </div>
                    {imageAttachments.length > 0 ? (
                      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {imageAttachments.map((src, i) => (
                          <li
                            key={i}
                            className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-white/10"
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white"
                              onClick={() =>
                                setImageAttachments((prev) =>
                                  prev.filter((_, j) => j !== i),
                                )
                              }
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!content.trim()}
                      onClick={() => setStep(2)}
                      className="rounded-full bg-gradient-to-r from-rose-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Continuar a personalizar →
                    </button>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      <span>💌</span> Color del sobre — tocá uno
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ENVELOPE_COLORS.map((c) => (
                        <motion.button
                          key={c.id}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setEnvelopeColor(c.id)}
                          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-sm transition ${
                            c.bg
                          } ${c.border} ${
                            envelopeColor === c.id
                              ? "ring-2 ring-offset-2 ring-rose-500 ring-offset-white dark:ring-offset-stone-900"
                              : "opacity-85 hover:opacity-100"
                          }`}
                          title={c.label}
                        >
                          <span className="sr-only">{c.label}</span>
                          {envelopeColor === c.id ? (
                            <span className="text-lg drop-shadow">✓</span>
                          ) : null}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      🌸 Flores del sobre
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FLOWER_TYPES.map((f) => (
                        <motion.button
                          key={f.id}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFlowerType(f.id)}
                          className={`rounded-2xl border px-3 py-2 text-sm transition ${
                            flowerType === f.id
                              ? "border-rose-400 bg-rose-100 font-medium text-rose-950 shadow-inner dark:border-rose-400/60 dark:bg-rose-950/40 dark:text-rose-50"
                              : "border-stone-200/80 bg-white/70 text-stone-700 hover:border-rose-200 dark:border-white/10 dark:bg-white/5 dark:text-garden-100"
                          }`}
                        >
                          <span className="mr-1">{f.emoji}</span>
                          {f.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      📄 Papel de la carta
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {PAPER_TYPES.map((p) => (
                        <motion.button
                          key={p.id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPaperType(p.id)}
                          className={`min-w-[120px] shrink-0 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
                            paperType === p.id
                              ? "border-violet-400 bg-violet-100/90 text-violet-950 dark:border-violet-400/50 dark:bg-violet-950/50 dark:text-violet-100"
                              : "border-stone-200 bg-white/80 text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-garden-100"
                          }`}
                        >
                          {p.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      ✒️ Tipografía
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {FONT_STYLES.map((f) => (
                        <motion.button
                          key={f.id}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setFontStyle(f.id)}
                          className={`min-w-[140px] shrink-0 rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                            fontStyle === f.id
                              ? "border-amber-400 bg-amber-100/90 text-amber-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50"
                              : "border-stone-200 bg-white/80 dark:border-white/10 dark:bg-white/5"
                          }`}
                        >
                          <span className={f.className}>{f.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-800 dark:text-garden-100">
                      ✨ Sticker
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STICKERS.map((s) => (
                        <motion.button
                          key={s.id}
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setSticker(s.id)}
                          className={`rounded-full border px-4 py-2 text-sm ${
                            sticker === s.id
                              ? "border-amber-500 bg-amber-100 font-medium dark:border-amber-400/60 dark:bg-amber-950/35"
                              : "border-stone-200 bg-white/70 dark:border-white/10 dark:bg-white/5"
                          }`}
                        >
                          {s.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-800 dark:border-white/15 dark:text-garden-50"
                    >
                      ← Volver al texto
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-full bg-gradient-to-r from-rose-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:brightness-110"
                    >
                      Continuar a enviar →
                    </button>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
                        💕 Nombre en el sobre (decorativo)
                      </span>
                      <input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="input-like"
                        placeholder="Ej. Mi amor"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
                        ✍️ Firma
                      </span>
                      <input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="input-like"
                        placeholder="Cómo firmás"
                      />
                    </label>
                  </div>

                  {status === "authenticated" ? (
                    <div className="space-y-3 rounded-2xl border-2 border-violet-300/60 bg-gradient-to-br from-violet-50/90 to-white/80 p-4 dark:border-violet-500/35 dark:from-violet-950/35 dark:to-black/20">
                      <span className="flex items-center gap-2 text-sm font-semibold text-violet-950 dark:text-violet-100">
                        <span className="text-lg">🎯</span> ¿A quién va la carta?
                      </span>
                      <div className="flex flex-col gap-2 text-sm">
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-transparent p-2 hover:bg-white/60 dark:hover:bg-white/5">
                          <input
                            type="radio"
                            name="dest"
                            checked={destinationMode === "self"}
                            onChange={() => {
                              setDestinationMode("self");
                              setRecipientUsername("");
                            }}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium text-violet-950 dark:text-violet-50">
                              Mandármela a mí
                            </span>
                            <span className="mt-0.5 block text-xs text-violet-900/80 dark:text-violet-100/80">
                              Llega a tu jardín (mismo nick: @
                              {session?.user?.username ?? "…"}).
                            </span>
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-transparent p-2 hover:bg-white/60 dark:hover:bg-white/5">
                          <input
                            type="radio"
                            name="dest"
                            checked={destinationMode === "one"}
                            onChange={() => setDestinationMode("one")}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium text-violet-950 dark:text-violet-50">
                              Una persona
                            </span>
                            <span className="mt-0.5 block text-xs text-violet-900/80 dark:text-violet-100/80">
                              Un nick; la carta va a su &quot;Te escribieron&quot;.
                            </span>
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-transparent p-2 hover:bg-white/60 dark:hover:bg-white/5">
                          <input
                            type="radio"
                            name="dest"
                            checked={destinationMode === "multi"}
                            onChange={() => setDestinationMode("multi")}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium text-violet-950 dark:text-violet-50">
                              Varias personas
                            </span>
                            <span className="mt-0.5 block text-xs text-violet-900/80 dark:text-violet-100/80">
                              Se crea una carta por cada nick (mismo texto y diseño).
                            </span>
                          </span>
                        </label>
                      </div>
                      {destinationMode === "one" ? (
                        <input
                          value={recipientUsername}
                          onChange={(e) =>
                            setRecipientUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, ""),
                            )
                          }
                          className="input-like w-full"
                          placeholder="nickname del destinatario"
                          autoComplete="off"
                        />
                      ) : null}
                      {destinationMode === "multi" ? (
                        <label className="block space-y-1">
                          <span className="text-xs text-violet-900/85 dark:text-violet-100/85">
                            Nicks separados por coma, espacio o punto y coma (mínimo
                            2 personas distintas).
                          </span>
                          <textarea
                            value={multiUsernamesText}
                            onChange={(e) =>
                              setMultiUsernamesText(e.target.value)
                            }
                            rows={3}
                            className="input-like w-full resize-y font-mono text-sm"
                            placeholder="ana, bob, carla"
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                      <Link href="/entrar" className="font-medium underline">
                        Iniciá sesión
                      </Link>{" "}
                      para elegir destinatario y enviar la carta.
                    </p>
                  )}

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
                      🗓️ Programar (opcional)
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="input-like"
                    />
                    <span className="text-xs text-stone-500 dark:text-garden-300/80">
                      En el jardín público no se muestra hasta esa fecha. Vos y
                      quien reciba la carta sí pueden verla antes en vuestros
                      jardines personales.
                    </span>
                  </label>

                  <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-black/15">
                    <Toggle
                      checked={isPublic}
                      onChange={setIsPublic}
                      title="Publicar en el jardín público"
                      hint="Si lo apagás, solo quien tenga el enlace y el destinatario la verán."
                    />
                    <Toggle
                      checked={isSecret}
                      onChange={(v) => {
                        setIsSecret(v);
                        if (!v) setSecretPassword("");
                      }}
                      title="Carta secreta con clave"
                      hint="El contenido se oculta hasta que pongan la clave."
                    />
                    {isSecret ? (
                      <input
                        type="password"
                        value={secretPassword}
                        onChange={(e) => setSecretPassword(e.target.value)}
                        className="input-like"
                        placeholder="Clave (mín. 4 caracteres)"
                      />
                    ) : null}
                    <Toggle
                      checked={soundOnSave}
                      onChange={setSoundOnSave}
                      title="Sonido al guardar"
                      hint="Una campanilla suave al confirmar."
                    />
                  </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-800 dark:border-white/15 dark:text-garden-50"
                    >
                      ← Volver a personalizar
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {step === 3 ? (
              <motion.button
                type="button"
                onClick={() => void onSave()}
                disabled={
                  busy ||
                  !content.trim() ||
                  status !== "authenticated" ||
                  (destinationMode === "one" && !recipientUsername.trim()) ||
                  (destinationMode === "multi" &&
                    parseNickList(multiUsernamesText).length < 2)
                }
                whileTap={{ scale: busy ? 1 : 0.97 }}
                className="rounded-full bg-gradient-to-r from-rose-600 to-violet-600 px-7 py-2.5 text-sm font-medium text-white shadow-md transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Enviando…" : "Enviar carta 💌"}
              </motion.button>
            ) : null}
            <button
              type="button"
              onClick={() => void downloadPdf()}
              className="rounded-full border border-stone-200 bg-white/90 px-5 py-2.5 text-sm text-stone-800 dark:border-white/15 dark:bg-transparent dark:text-garden-50"
            >
              Descargar PDF
            </button>
          </div>

          {saved ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-emerald-300/80 bg-emerald-50/90 p-4 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-100"
            >
              <p className="font-medium">
                ¡Listo!{" "}
                {savedLetters.length > 1
                  ? `Se enviaron ${savedLetters.length} cartas 🌿`
                  : "Carta guardada 🌿"}
              </p>
              {savedHadRecipient ? (
                <p className="mt-2 text-xs leading-relaxed opacity-95">
                  {savedLetters.length > 1 ? (
                    <>
                      Cada destinatario tiene su enlace abajo. Las cartas
                      aparecen en el jardín de cada quien en{" "}
                      <Link href="/jardin" className="font-semibold underline">
                        Te escribieron
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Quien la reciba la verá en{" "}
                      <Link href="/jardin" className="font-semibold underline">
                        su jardín
                      </Link>{" "}
                      (pastito). Si es carta a vos misma, mirá{" "}
                      <strong>Para vos, de vos</strong>.
                    </>
                  )}
                </p>
              ) : null}
              {savedLetters.length > 1 ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-[11px]">
                  {savedLetters.map((L) => (
                    <li key={L.id} className="break-all opacity-95">
                      <Link
                        href={`/carta/${L.id}`}
                        className="font-medium underline"
                      >
                        /carta/{L.id}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 break-all text-xs opacity-90">{shareUrl}</p>
              )}
              <button
                type="button"
                className="mt-3 rounded-full bg-emerald-800 px-4 py-1.5 text-xs text-white dark:bg-emerald-600"
                onClick={() => {
                  const origin =
                    typeof window !== "undefined" ? window.location.origin : "";
                  const text =
                    savedLetters.length > 1
                      ? savedLetters
                          .map((L) => `${origin}/carta/${L.id}`)
                          .join("\n")
                      : shareUrl;
                  void navigator.clipboard.writeText(text);
                }}
              >
                Copiar enlace{savedLetters.length > 1 ? "s" : ""}
              </button>
            </motion.div>
          ) : null}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="lg:sticky lg:top-24"
      >
        <div className="rounded-3xl border border-rose-200/50 bg-gradient-to-b from-white/90 via-rose-50/40 to-violet-50/50 p-6 shadow-md dark:border-white/10 dark:from-white/[0.07] dark:via-rose-950/15 dark:to-violet-950/20">
          <motion.p
            className="text-center font-serif-romantic text-lg text-stone-800 dark:text-garden-50"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Preview en vivo
          </motion.p>
          <p className="mb-4 text-center text-xs text-stone-500 dark:text-garden-300/80">
            Se actualiza mientras tocás las opciones ✨
          </p>
          <div ref={exportRef} className="rounded-2xl bg-garden-soft p-4">
            <EnvelopePreview
              envelopeColor={envelopeColor}
              flowerType={flowerType}
              flowerDensity={DEFAULT_FLOWER_DENSITY}
              paperType={paperType}
              fontStyle={fontStyle}
              sticker={sticker}
              content={content}
              imageUrls={imageAttachments}
              recipientName={recipientName || null}
              authorName={authorName || null}
              createdLabel={new Date().toLocaleDateString("es", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              openAmount={previewOpen}
              showSeal={false}
              saveInsertKey={saveInsertKey}
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition hover:border-stone-200/80 dark:hover:border-white/10"
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-stone-900 dark:bg-garden-200" : "bg-stone-300 dark:bg-white/20"}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-stone-800 dark:text-garden-50">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-stone-500 dark:text-garden-300/85">
          {hint}
        </span>
      </span>
    </button>
  );
}
