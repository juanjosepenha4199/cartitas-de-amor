import { isProbablyImageFile } from "@/lib/image-file-accept";

/**
 * Decodifica la imagen y la vuelve a guardar como JPEG por canvas.
 * Evita fallos raros de Tesseract con JPEG/PNG “crudos” de cámara o del portapapeles.
 */
export async function prepareImageForOcr(file: File): Promise<Blob> {
  if (!isProbablyImageFile(file)) return file;

  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    let w: number;
    let h: number;
    let source: CanvasImageSource;

    try {
      bitmap = await createImageBitmap(file);
      source = bitmap;
      w = bitmap.width;
      h = bitmap.height;
    } catch {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("IMAGE_DECODE"));
        img.src = objectUrl!;
      });
      source = img;
      w = img.naturalWidth || img.width;
      h = img.naturalHeight || img.height;
    }

    if (w < 1 || h < 1) {
      throw new Error("IMAGE_EMPTY");
    }

    const maxSide = 2400;
    let tw = w;
    let th = h;
    if (tw > maxSide || th > maxSide) {
      if (tw >= th) {
        th = Math.round((th * maxSide) / tw);
        tw = maxSide;
      } else {
        tw = Math.round((tw * maxSide) / th);
        th = maxSide;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("NO_2D");
    }
    ctx.drawImage(source, 0, 0, tw, th);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) {
      throw new Error("TO_BLOB");
    }
    return blob;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        /* ignore */
      }
    }
  }
}
