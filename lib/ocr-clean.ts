/**
 * Normaliza la salida de OCR para que sea más fácil de leer y editar.
 */
export function cleanOcrOutput(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  const lines = s.split("\n").map((line) => line.trimEnd());
  const rejoined = lines.join("\n");
  return rejoined.replace(/\n{3,}/g, "\n\n").trim();
}
