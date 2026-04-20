"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Camera, Images, ScanLine, SwitchCamera } from "lucide-react";

import {
  cameraErrorMessage,
  captureVideoFrameToJpegFile,
  getVideoDeviceIds,
  openCameraStream,
  stopMediaStream,
  type FacingPreference,
} from "@/lib/camera-session";
import { GALLERY_INPUT_ACCEPT, isProbablyImageFile } from "@/lib/image-file-accept";
import { MAX_LETTER_CONTENT_CHARS } from "@/lib/letter-limits";
import { cleanOcrOutput } from "@/lib/ocr-clean";
import { prepareImageForOcr } from "@/lib/ocr-image-prep";
import { writeScanDraftToSession } from "@/lib/scan-draft";

type Phase = "idle" | "ocr" | "done" | "error";

export function LetterScanView() {
  const router = useRouter();
  const galleryInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] =
    useState<FacingPreference>("environment");
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      stopMediaStream(mediaStreamRef.current);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !mediaStream) return;
    v.srcObject = mediaStream;
    setVideoReady(false);
    void v.play().catch(() => {
      /* iOS a veces exige gesto; el usuario ya tocó «Abrir cámara» */
    });
  }, [mediaStream]);

  const applyPickedFile = useCallback(
    (file: File, label?: string) => {
      if (!isProbablyImageFile(file)) {
        setError(
          "Elegí una imagen (JPG, PNG, WebP, GIF o HEIC si el navegador la soporta).",
        );
        return;
      }
      setError(null);
      stopMediaStream(mediaStream);
      setMediaStream(null);
      setVideoReady(false);
      setCamLoading(false);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setPickedName(label ?? file.name ?? "imagen");
      setSourceFile(file);
      setEditedText("");
      setPhase("idle");
      setProgress(0);
      setStatusLabel("");
    },
    [mediaStream],
  );

  const resetPick = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    stopMediaStream(mediaStream);
    setMediaStream(null);
    setCamLoading(false);
    setVideoReady(false);
    setDeviceIds([]);
    setDeviceIndex(0);
    setFacingMode("environment");
    setPreviewUrl(null);
    setPickedName(null);
    setSourceFile(null);
    setEditedText("");
    setPhase("idle");
    setProgress(0);
    setStatusLabel("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [previewUrl, mediaStream]);

  const openCamera = useCallback(async () => {
    setError(null);
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1") {
        setError(
          "La cámara en la web suele requerir HTTPS. Si estás en producción, abrí el sitio con https://.",
        );
        return;
      }
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Tu navegador no permite acceder a la cámara. Usá «Galería o archivo» o probá otro navegador.",
      );
      return;
    }

    setCamLoading(true);
    stopMediaStream(mediaStream);
    setMediaStream(null);
    setVideoReady(false);
    try {
      const stream = await openCameraStream({
        facingMode: "environment",
      });
      setFacingMode("environment");
      setMediaStream(stream);
      const ids = (await getVideoDeviceIds()).filter(Boolean);
      setDeviceIds(ids);
      setDeviceIndex(0);
    } catch (e) {
      console.error(e);
      setError(cameraErrorMessage(e));
    } finally {
      setCamLoading(false);
    }
  }, [mediaStream]);

  const closeCamera = useCallback(() => {
    stopMediaStream(mediaStream);
    setMediaStream(null);
    setVideoReady(false);
    setCamLoading(false);
  }, [mediaStream]);

  const switchPhysicalCamera = useCallback(async () => {
    if (!mediaStream || camLoading) return;
    setError(null);
    setCamLoading(true);
    stopMediaStream(mediaStream);
    setMediaStream(null);
    setVideoReady(false);
    try {
      if (deviceIds.length > 1) {
        const nextIdx = (deviceIndex + 1) % deviceIds.length;
        setDeviceIndex(nextIdx);
        const stream = await openCameraStream({
          deviceId: deviceIds[nextIdx],
        });
        setMediaStream(stream);
      } else {
        const nextFacing: FacingPreference =
          facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextFacing);
        const stream = await openCameraStream({
          facingMode: nextFacing,
        });
        setMediaStream(stream);
      }
    } catch (e) {
      console.error(e);
      setError(cameraErrorMessage(e));
    } finally {
      setCamLoading(false);
    }
  }, [mediaStream, camLoading, deviceIds, deviceIndex, facingMode]);

  const captureFromCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !videoReady) {
      setError("Esperá un segundo a que la cámara muestre la imagen y probá de nuevo.");
      return;
    }
    setError(null);
    try {
      const file = await captureVideoFrameToJpegFile(video);
      closeCamera();
      applyPickedFile(file, "Foto de cámara");
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo capturar el fotograma. Asegurate de que la imagen se vea en pantalla y probá otra vez.",
      );
    }
  }, [videoReady, closeCamera, applyPickedFile]);

  const runOcr = useCallback(async () => {
    if (!sourceFile) return;
    setError(null);
    setPhase("ocr");
    setProgress(0);
    setStatusLabel("Preparando imagen…");

    let imageBlob: Blob;
    try {
      imageBlob = await prepareImageForOcr(sourceFile);
    } catch (e) {
      console.error("[ocr] prepareImageForOcr", e);
      setPhase("error");
      setStatusLabel("");
      if (e instanceof Error && e.message === "IMAGE_DECODE") {
        setError(
          "No se pudo abrir esta imagen en el navegador. Probá guardarla como JPG o PNG y volver a cargarla.",
        );
      } else if (e instanceof Error && e.message === "IMAGE_EMPTY") {
        setError(
          "La imagen parece vacía o corrupta. Sacá otra foto más nítida o elegí otro archivo.",
        );
      } else {
        setError(
          "Falló el preprocesado de la imagen. Probá otra foto, otro formato (JPG/PNG) o recargá la página.",
        );
      }
      return;
    }

    setStatusLabel("Cargando motor de lectura (primera vez puede tardar)…");

    const { createWorker, PSM } = await import("tesseract.js");
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      worker = await createWorker("spa+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(typeof m.progress === "number" ? m.progress : 0);
            setStatusLabel("Leyendo texto en la foto…");
          } else if (m.status === "loading tesseract core") {
            setStatusLabel("Cargando núcleo OCR…");
          } else if (m.status === "initializing tesseract") {
            setStatusLabel("Inicializando…");
          } else if (m.status === "loading language traineddata") {
            setStatusLabel("Descargando datos de idioma…");
          } else if (m.status === "initializing api") {
            setStatusLabel("Preparando API…");
          }
        },
      });

      // AUTO: mejor para fotos con varias líneas / escenas (webcam, carta en mano).
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      const { data } = await worker.recognize(imageBlob);

      const cleaned = cleanOcrOutput(data.text || "");
      setEditedText(cleaned);
      setPhase(cleaned ? "done" : "error");
      if (!cleaned) {
        setError(
          "No se detectó texto claro. Acercá más la carta a la cámara, mejorá la luz o probá con letra más impresa; la manuscrita suele fallar.",
        );
      }
      setProgress(1);
      setStatusLabel("");
    } catch (e) {
      console.error("[ocr] tesseract", e);
      setPhase("error");
      setStatusLabel("");
      const msg = e instanceof Error ? e.message : String(e);
      if (/network|fetch|load.*failed|failed to fetch/i.test(msg)) {
        setError(
          "No se pudo descargar el motor de lectura (red o firewall). Comprobá tu conexión o probá otra red; la primera vez hace falta internet.",
        );
      } else {
        setError(
          "El lector de texto falló al procesar la imagen. Probá con Chrome o Edge actualizado, recargá la página o usá una foto JPG más pequeña. Si usás HEIC, exportá como JPG.",
        );
      }
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          /* ignore */
        }
      }
    }
  }, [sourceFile]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      applyPickedFile(file);
    },
    [applyPickedFile],
  );

  const openGalleryPicker = useCallback(() => {
    setError(null);
    fileRef.current?.click();
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f && isProbablyImageFile(f)) {
        e.preventDefault();
        applyPickedFile(f, f.name || "Pegado del portapapeles");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [applyPickedFile]);

  const goToEditor = useCallback(() => {
    const t = editedText.trim();
    if (!t) return;
    const clipped =
      t.length > MAX_LETTER_CONTENT_CHARS
        ? t.slice(0, MAX_LETTER_CONTENT_CHARS)
        : t;
    writeScanDraftToSession(clipped);
    router.push("/crear");
  }, [editedText, router]);

  const busy = phase === "ocr";
  const cameraActive = Boolean(mediaStream);
  const showPreview = Boolean(previewUrl) && !cameraActive;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-stone-500 dark:text-garden-300/90">
            <ScanLine className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">
              Escanear carta
            </span>
          </div>
          <h1 className="font-serif-romantic text-4xl text-stone-900 dark:text-garden-50">
            De foto a texto
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600 dark:text-garden-200/90">
            Sacá una foto con la cámara (frontal o trasera), elegí de la galería
            o pegá una imagen desde el portapapeles. El OCR corre en tu
            navegador.
          </p>
          <p className="mt-2 max-w-2xl text-xs text-stone-500 dark:text-garden-300/80">
            Mejor resultado con texto impreso, buena luz y enfoque. HEIC puede
            fallar en algunos navegadores: si pasa, exportá la foto como JPG.
            La letra a mano suele salir con errores.
          </p>
        </div>
        <Link
          href="/crear"
          className="shrink-0 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm text-stone-800 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-50 dark:hover:border-white/25"
        >
          Ir a crear sin escanear
        </Link>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <h2 className="font-serif-romantic text-xl text-stone-800 dark:text-garden-50">
            1. Foto
          </h2>

          <input
            ref={fileRef}
            id={galleryInputId}
            type="file"
            accept={GALLERY_INPUT_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />

          {!cameraActive ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={busy || camLoading}
                onClick={() => void openCamera()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-garden-200 dark:text-stone-900 dark:hover:bg-garden-100 sm:min-w-[140px]"
              >
                <Camera className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {camLoading ? "Abriendo…" : "Usar cámara"}
              </button>
              <button
                type="button"
                disabled={busy || camLoading}
                onClick={openGalleryPicker}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-medium text-stone-800 transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-garden-50 dark:hover:border-white/25 sm:min-w-[140px]"
              >
                <Images className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                Galería o archivo
              </button>
            </div>
          ) : null}

          {cameraActive ? (
            <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-stone-950/5 p-3 dark:border-white/10 dark:bg-black/25">
              <div className="relative aspect-[3/4] max-h-[min(520px,65vh)] w-full overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  onLoadedMetadata={() => setVideoReady(true)}
                  aria-label="Vista previa de la cámara"
                />
                {!videoReady ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                    Iniciando cámara…
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || camLoading || !videoReady}
                  onClick={() => void captureFromCamera()}
                  className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-garden-200 dark:text-stone-900 dark:hover:bg-garden-100"
                >
                  Capturar foto
                </button>
                <button
                  type="button"
                  disabled={busy || camLoading}
                  onClick={() => void switchPhysicalCamera()}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white/90 px-4 py-2.5 text-sm text-stone-800 transition hover:border-stone-300 disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-garden-50 dark:hover:border-white/25"
                  title={
                    deviceIds.length > 1
                      ? "Pasar a otra cámara del dispositivo"
                      : "Cambiar entre cámara frontal y trasera"
                  }
                >
                  <SwitchCamera className="h-4 w-4" aria-hidden />
                  {deviceIds.length > 1
                    ? "Otra cámara"
                    : facingMode === "environment"
                      ? "Cámara frontal"
                      : "Cámara trasera"}
                </button>
                <button
                  type="button"
                  disabled={busy || camLoading}
                  onClick={closeCamera}
                  className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 dark:border-white/15 dark:bg-white/5 dark:text-garden-100 dark:hover:border-white/25"
                >
                  Cerrar cámara
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-garden-300/85">
                {deviceIds.length > 1
                  ? `Hay ${deviceIds.length} cámaras: el botón «Otra cámara» las recorre.`
                  : "Si solo ves una cámara, el botón alterna entre frontal y trasera (según el dispositivo)."}
              </p>
            </div>
          ) : null}

          {!cameraActive ? (
            <p className="text-xs text-stone-500 dark:text-garden-300/80">
              En computadora podés pegar una captura con{" "}
              <kbd className="rounded border border-stone-300 bg-stone-100 px-1 dark:border-white/20 dark:bg-white/10">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-stone-300 bg-stone-100 px-1 dark:border-white/20 dark:bg-white/10">
                V
              </kbd>{" "}
              (o{" "}
              <kbd className="rounded border border-stone-300 bg-stone-100 px-1 dark:border-white/20 dark:bg-white/10">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-stone-300 bg-stone-100 px-1 dark:border-white/20 dark:bg-white/10">
                V
              </kbd>{" "}
              en Mac).
            </p>
          ) : null}

          {showPreview ? (
            <>
              {pickedName ? (
                <p className="text-xs text-stone-500 dark:text-garden-300/85">
                  {pickedName}
                </p>
              ) : null}
              <div className="flex max-h-[min(420px,55vh)] w-full items-center justify-center overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 dark:border-white/10 dark:bg-stone-900/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL local */}
                <img
                  src={previewUrl!}
                  alt="Vista previa de la carta a escanear"
                  className="max-h-[min(420px,55vh)] w-full object-contain"
                />
              </div>
            </>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!sourceFile || busy || cameraActive}
              onClick={() => void runOcr()}
              className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-garden-200 dark:text-stone-900 dark:hover:bg-garden-100"
            >
              {busy ? "Leyendo…" : "Extraer texto de la foto"}
            </button>
            {showPreview ? (
              <button
                type="button"
                disabled={busy || camLoading}
                onClick={resetPick}
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-garden-100 dark:hover:border-white/25"
              >
                Otra foto
              </button>
            ) : null}
          </div>

          {busy ? (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-[width] duration-200 dark:bg-emerald-400"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              {statusLabel ? (
                <p className="text-xs text-stone-600 dark:text-garden-200/85">
                  {statusLabel}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <h2 className="font-serif-romantic text-xl text-stone-800 dark:text-garden-50">
            2. Texto (editable)
          </h2>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={16}
            className="input-like min-h-[280px] resize-y font-sans text-sm leading-relaxed"
            placeholder={
              phase === "done" || editedText
                ? ""
                : "Acá va el texto que salga del escaneo. Podés editarlo libremente."
            }
            maxLength={MAX_LETTER_CONTENT_CHARS}
          />
          <p className="text-xs text-stone-500 dark:text-garden-300/80">
            {editedText.length.toLocaleString("es")} /{" "}
            {MAX_LETTER_CONTENT_CHARS.toLocaleString("es")} caracteres
          </p>
          <button
            type="button"
            disabled={!editedText.trim() || busy}
            onClick={goToEditor}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-garden-200 dark:text-stone-900 dark:hover:bg-garden-100"
          >
            Continuar en crear carta
          </button>
          <p className="text-center text-xs text-stone-500 dark:text-garden-300/80">
            Se abre el flujo normal de carta con este texto en el paso del
            mensaje.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
