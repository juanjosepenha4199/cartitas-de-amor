/** Máximo de fotos por carta (cliente + API). */
export const MAX_LETTER_IMAGES = 8;
/** Tamaño máximo total aproximado de todas las imágenes (caracteres en data URL). */
export const MAX_ATTACHMENTS_JSON_CHARS = 4_500_000;
/** Una sola imagen data URL no puede superar esto (bytes aprox. en string). */
export const MAX_SINGLE_DATA_URL_CHARS = 900_000;

/** Valida y serializa adjuntos desde el body JSON del POST (uso en API). */
export function attachmentsJsonFromBody(body: unknown): { json: string; error?: string } {
  const raw =
    body !== null && typeof body === "object"
      ? (body as { imageAttachments?: unknown }).imageAttachments
      : undefined;
  if (!Array.isArray(raw)) return { json: "[]" };
  const urls = raw
    .filter((x): x is string => typeof x === "string" && x.startsWith("data:image/"))
    .slice(0, MAX_LETTER_IMAGES);
  for (const u of urls) {
    if (u.length > MAX_SINGLE_DATA_URL_CHARS) {
      return { json: "[]", error: "Una de las imágenes es demasiado grande." };
    }
  }
  const json = JSON.stringify(urls);
  if (json.length > MAX_ATTACHMENTS_JSON_CHARS) {
    return {
      json: "[]",
      error: "Las imágenes juntas superan el tamaño máximo permitido.",
    };
  }
  return { json };
}

/**
 * Comprime una imagen a JPEG en base64 (data URL) para guardar en BD.
 * Redimensiona el lado mayor a `maxSide`.
 */
export function compressImageToDataUrl(
  file: File,
  maxSide = 1280,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width < 1 || height < 1) {
        reject(new Error("Imagen inválida"));
        return;
      }
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("No se pudo exportar JPEG"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}
