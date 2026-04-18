"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { EnvelopePreview } from "@/components/envelope-preview";
import {
  ENVELOPE_COLORS,
  FLOWER_DENSITY,
  FLOWER_TYPES,
  FONT_STYLES,
  PAPER_TYPES,
  STICKERS,
} from "@/lib/options";
import { useClientId } from "@/hooks/useClientId";
import { playSoftChime } from "@/lib/sound";
import type { LetterDto } from "@/lib/api-types";

const MAX_LEN = 300;

export function LetterEditor() {
  const clientId = useClientId();
  const exportRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [envelopeColor, setEnvelopeColor] = useState("cream");
  const [flowerType, setFlowerType] = useState("rose");
  const [flowerDensity, setFlowerDensity] = useState("medium");
  const [paperType, setPaperType] = useState("textured");
  const [fontStyle, setFontStyle] = useState("handwriting");
  const [sticker, setSticker] = useState("none");
  const [recipientName, setRecipientName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSecret, setIsSecret] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [soundOnSave, setSoundOnSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<LetterDto | null>(null);

  const previewOpen = 0.55;

  const onSave = useCallback(async () => {
    setError(null);
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
          flowerDensity,
          paperType,
          fontStyle,
          sticker,
          recipientName: recipientName || null,
          authorName: authorName || "Anónimo",
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
      setSaved(data.letter as LetterDto);
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
    envelopeColor,
    flowerDensity,
    flowerType,
    fontStyle,
    isPublic,
    isSecret,
    paperType,
    recipientName,
    scheduledAt,
    secretPassword,
    sticker,
    soundOnSave,
  ]);

  const downloadPng = useCallback(async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `garden-letter-${Date.now()}.png`;
      a.click();
    } catch {
      setError("No se pudo exportar la imagen.");
    }
  }, []);

  const shareUrl =
    typeof window !== "undefined" && saved
      ? `${window.location.origin}/carta/${saved.id}`
      : "";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div>
          <h1 className="font-serif-romantic text-3xl text-stone-900 dark:text-garden-50">
            Crear carta
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-garden-200/90">
            Personaliza cada detalle. El preview a la derecha se actualiza al instante.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Tu mensaje
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            rows={5}
            placeholder="Escribe algo que te haga sonreír..."
            className="w-full resize-none rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-900 shadow-inner outline-none ring-0 transition focus:border-stone-400 dark:border-white/10 dark:bg-black/20 dark:text-garden-50 dark:focus:border-white/30"
          />
          <span className="text-xs text-stone-500 dark:text-garden-300/80">
            {content.length}/{MAX_LEN}
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Color del sobre">
            <select
              value={envelopeColor}
              onChange={(e) => setEnvelopeColor(e.target.value)}
              className="select-like"
            >
              {ENVELOPE_COLORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Flores">
            <select
              value={flowerType}
              onChange={(e) => setFlowerType(e.target.value)}
              className="select-like"
            >
              {FLOWER_TYPES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad de flores">
            <select
              value={flowerDensity}
              onChange={(e) => setFlowerDensity(e.target.value)}
              className="select-like"
            >
              {FLOWER_DENSITY.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Papel">
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className="select-like"
            >
              {PAPER_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipografía">
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value)}
              className="select-like"
            >
              {FONT_STYLES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sticker">
            <select
              value={sticker}
              onChange={(e) => setSticker(e.target.value)}
              className="select-like"
            >
              {STICKERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
              Para (opcional)
            </span>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="input-like"
              placeholder="Nombre de quien la recibe"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
              Firma
            </span>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="input-like"
              placeholder="Tu nombre o apodo"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Programar apertura (opcional)
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="input-like"
          />
          <span className="text-xs text-stone-500 dark:text-garden-300/80">
            Hasta esa fecha la carta no aparecerá en el jardín público.
          </span>
        </label>

        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-black/15">
          <Toggle
            checked={isPublic}
            onChange={setIsPublic}
            title="Publicar en el jardín"
            hint="Si está desactivado, solo quien tenga el enlace (y tú en “Solo mías”) podrá verla."
          />
          <Toggle
            checked={isSecret}
            onChange={(v) => {
              setIsSecret(v);
              if (!v) setSecretPassword("");
            }}
            title="Carta secreta con clave"
            hint="El contenido se oculta hasta que alguien escriba la clave correcta."
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
            title="Sonido suave al guardar"
            hint="Un campanilla breve al confirmar."
          />
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={busy || !content.trim()}
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-garden-100 dark:text-garden-900 dark:hover:bg-white"
          >
            {busy ? "Guardando…" : "Guardar carta"}
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm text-stone-800 transition hover:border-stone-300 dark:border-white/15 dark:bg-transparent dark:text-garden-50 dark:hover:border-white/30"
          >
            Descargar imagen
          </button>
        </div>

        {saved ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100"
          >
            <p className="font-medium">Carta guardada</p>
            <p className="mt-1 break-all opacity-90">{shareUrl}</p>
            <button
              type="button"
              className="mt-3 rounded-full bg-emerald-800 px-4 py-1.5 text-xs text-white dark:bg-emerald-600"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copiar enlace privado
            </button>
          </motion.div>
        ) : null}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="lg:sticky lg:top-24"
      >
        <div className="rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white/80 to-stone-50/80 p-6 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-black/20">
          <p className="text-center font-serif-romantic text-lg text-stone-800 dark:text-garden-50">
            Preview en vivo
          </p>
          <p className="mb-4 text-center text-xs text-stone-500 dark:text-garden-300/80">
            Así se verá tu sobre antes de entregarlo.
          </p>
          <div ref={exportRef} className="rounded-2xl bg-garden-soft p-4">
            <EnvelopePreview
              envelopeColor={envelopeColor}
              flowerType={flowerType}
              flowerDensity={flowerDensity}
              paperType={paperType}
              fontStyle={fontStyle}
              sticker={sticker}
              content={content}
              recipientName={recipientName || null}
              authorName={authorName || null}
              createdLabel={new Date().toLocaleDateString("es", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              openAmount={previewOpen}
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
        {label}
      </span>
      {children}
    </label>
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
