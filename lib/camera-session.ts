/** Cierra y libera la cámara (importante en móvil para batería y permisos). */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  });
}

export type FacingPreference = "environment" | "user";

export async function getVideoDeviceIds(): Promise<string[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    return list
      .filter((d) => d.kind === "videoinput")
      .map((d) => d.deviceId)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function openCameraStream(options: {
  facingMode?: FacingPreference;
  deviceId?: string;
}): Promise<MediaStream> {
  const { facingMode, deviceId } = options;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("getUserMedia no disponible", "NotSupportedError");
  }

  if (deviceId) {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: { ideal: deviceId },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: facingMode ?? "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
}

/** Mensaje legible para errores típicos de getUserMedia. */
export function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return "No tenemos permiso para usar la cámara. Revisá los permisos del navegador o del sitio (candado junto a la URL). En iOS: Ajustes → Safari → Cámara.";
    }
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
      return "No se encontró una cámara compatible o el dispositivo la está usando otra app.";
    }
    if (err.name === "NotReadableError") {
      return "La cámara está en uso o no se puede abrir. Cerrá otras apps que la usen y probá de nuevo.";
    }
    if (err.name === "NotSupportedError") {
      return "Este navegador no permite usar la cámara aquí. Probá con Chrome o Safari actualizado, o usá «Galería».";
    }
  }
  return "No se pudo abrir la cámara. Podés elegir una foto desde archivos o la galería.";
}

/**
 * Congela un frame del video en un JPEG (mejor para OCR que PNG pesado).
 */
export function captureVideoFrameToJpegFile(
  video: HTMLVideoElement,
  quality = 0.92,
): Promise<File> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (w < 2 || h < 2) {
    return Promise.reject(new Error("VIDEO_NOT_READY"));
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("NO_2D_CONTEXT"));
  }
  ctx.drawImage(video, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("TO_BLOB_FAILED"));
          return;
        }
        resolve(
          new File([blob], `camara-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      quality,
    );
  });
}
