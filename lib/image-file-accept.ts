/**
 * Algunos móviles entregan HEIC sin type MIME o con type vacío.
 */
export function isProbablyImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".heic") ||
    n.endsWith(".heif") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".png") ||
    n.endsWith(".webp") ||
    n.endsWith(".gif")
  );
}

/** Valor sugerido para <input accept> (galería + muchos formatos). */
export const GALLERY_INPUT_ACCEPT =
  "image/*,.heic,.heif,image/heic,image/heif";
