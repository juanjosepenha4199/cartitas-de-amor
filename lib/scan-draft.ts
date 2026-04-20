/** Clave compartida entre `/escanear` y el editor al pasar texto extraído. */
export const SCAN_DRAFT_STORAGE_KEY = "cartitas-scan-draft";

export type ScanDraftPayload = { text: string; v: number };

export function writeScanDraftToSession(text: string): void {
  if (typeof window === "undefined") return;
  const payload: ScanDraftPayload = { text, v: Date.now() };
  sessionStorage.setItem(SCAN_DRAFT_STORAGE_KEY, JSON.stringify(payload));
}
