import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PDF_BODY_FONT_PX = 17;
const PDF_BODY_LINE_HEIGHT = 1;

/** Datos completos de la carta para el PDF (sin truncar). */
export type LetterPdfPayload = {
  content: string;
  recipientName?: string | null;
  authorName: string;
  createdLabel: string;
  imageAttachments: string[];
  /** Título opcional en la cabecera del PDF */
  title?: string;
};

function appendTextBlock(
  root: HTMLElement,
  text: string,
  styles: Partial<CSSStyleDeclaration> = {},
) {
  const pre = document.createElement("pre");
  pre.textContent = text;
  pre.style.whiteSpace = "pre-wrap";
  pre.style.wordBreak = "break-word";
  pre.style.margin = "0 0 1.25rem";
  pre.style.fontSize = `${PDF_BODY_FONT_PX}px`;
  pre.style.lineHeight = String(PDF_BODY_LINE_HEIGHT);
  pre.style.fontFamily = "Georgia, 'Times New Roman', serif";
  pre.style.color = "#1c1917";
  Object.assign(pre.style, styles);
  root.appendChild(pre);
}

/**
 * Construye un nodo DOM fuera de pantalla con todo el contenido (texto completo + imágenes).
 */
export function buildLetterPdfSourceElement(payload: LetterPdfPayload): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-letter-pdf-source", "true");
  root.style.boxSizing = "border-box";
  root.style.width = "720px";
  root.style.padding = "40px 48px 48px";
  root.style.background = "#fffaf5";
  root.style.color = "#1c1917";
  root.style.position = "fixed";
  root.style.left = "-12000px";
  root.style.top = "0";
  root.style.zIndex = "0";
  root.style.overflow = "visible";

  const title = document.createElement("h1");
  title.textContent = payload.title ?? "Carta";
  title.style.margin = "0 0 8px";
  title.style.fontSize = "22px";
  title.style.fontWeight = "700";
  title.style.fontFamily = "Georgia, serif";
  root.appendChild(title);

  const meta = document.createElement("p");
  meta.style.margin = "0 0 28px";
  meta.style.fontSize = "14px";
  meta.style.color = "#57534e";
  meta.style.lineHeight = "1.5";
  const bits: string[] = [];
  if (payload.recipientName?.trim()) {
    bits.push(`Para: ${payload.recipientName.trim()}`);
  }
  bits.push(`Fecha: ${payload.createdLabel}`);
  meta.textContent = bits.join(" · ");
  root.appendChild(meta);

  const parts = payload.content.split("\f");
  const sections = parts.length > 1 ? parts : [payload.content];

  sections.forEach((section, idx) => {
    if (sections.length > 1) {
      const ph = document.createElement("p");
      ph.textContent = `Página ${idx + 1}`;
      ph.style.margin = "0 0 8px";
      ph.style.fontSize = "13px";
      ph.style.fontWeight = "600";
      ph.style.color = "#78716c";
      ph.style.textTransform = "uppercase";
      ph.style.letterSpacing = "0.06em";
      root.appendChild(ph);
    }
    appendTextBlock(root, section.trim() ? section : " ");
  });

  for (const src of payload.imageAttachments) {
    if (!src.startsWith("data:image/")) continue;
    const wrap = document.createElement("div");
    wrap.style.marginTop = "20px";
    wrap.style.marginBottom = "8px";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.border = "1px solid #d6d3d1";
    wrap.appendChild(img);
    root.appendChild(wrap);
  }

  const foot = document.createElement("div");
  foot.style.marginTop = "36px";
  foot.style.paddingTop = "20px";
  foot.style.borderTop = "1px solid #d6d3d1";
  foot.style.fontSize = "16px";
  foot.style.fontFamily = "Georgia, serif";
  foot.style.color = "#44403c";
  foot.textContent = `— ${payload.authorName.trim() || "Anónimo"}`;
  root.appendChild(foot);

  document.body.appendChild(root);
  return root;
}

/**
 * Píxeles verticales del canvas por píxel de layout (scrollHeight → canvas.height).
 */
function canvasYScale(el: HTMLElement, canvasHeight: number): number {
  const cssH = Math.max(1, el.scrollHeight);
  return canvasHeight / cssH;
}

/**
 * Cortes seguros entre páginas: entre líneas de cada <pre> y bordes de imágenes.
 * Así el PDF no parte una línea de texto por el medio (bitmap + corte fijo).
 */
function buildPdfVerticalCuts(el: HTMLElement, canvasHeight: number): {
  cuts: number[];
  lineStepPx: number;
} {
  void el.offsetHeight;
  const yScale = canvasYScale(el, canvasHeight);
  const lineStepPx = Math.max(
    8,
    Math.floor(PDF_BODY_FONT_PX * PDF_BODY_LINE_HEIGHT * yScale),
  );
  const cuts = new Set<number>([0, canvasHeight]);
  const rootRect = el.getBoundingClientRect();

  for (const pre of el.querySelectorAll("pre")) {
    const r = pre.getBoundingClientRect();
    const topPx = (r.top - rootRect.top) * yScale;
    const bottomPx = (r.bottom - rootRect.top) * yScale;
    let y = topPx;
    while (y <= bottomPx + 0.5) {
      const row = Math.max(0, Math.min(canvasHeight, Math.floor(y)));
      cuts.add(row);
      y += lineStepPx;
    }
  }

  for (const img of el.querySelectorAll("img")) {
    const r = img.getBoundingClientRect();
    const top = Math.max(0, Math.min(canvasHeight, Math.floor((r.top - rootRect.top) * yScale)));
    const bottom = Math.max(0, Math.min(canvasHeight, Math.floor((r.bottom - rootRect.top) * yScale)));
    cuts.add(top);
    cuts.add(bottom);
  }

  const sorted = [...cuts].sort((a, b) => a - b);
  return { cuts: sorted, lineStepPx };
}

function pickPdfSliceEnd(
  cursorPx: number,
  rawEndPx: number,
  ch: number,
  cuts: number[],
  lineStepPx: number,
): number {
  if (rawEndPx >= ch) return ch;
  let best = -1;
  for (const c of cuts) {
    if (c > cursorPx && c <= rawEndPx && c > best) best = c;
  }
  if (best > cursorPx) return best;
  const step = Math.max(1, lineStepPx);
  return Math.min(ch, Math.max(cursorPx + 1, Math.min(rawEndPx, cursorPx + step)));
}

/**
 * Reparte el bitmap en páginas A4; los límites de franja se alinean a líneas de texto medidas en el DOM.
 */
function canvasToMultiPagePdf(
  canvas: HTMLCanvasElement,
  filename: string,
  layoutEl: HTMLElement,
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginMm = 18;
  const usableW = pageWidth - 2 * marginMm;
  const usableH = pageHeight - 2 * marginMm;

  const cw = Math.max(1, canvas.width);
  const ch = Math.max(1, canvas.height);

  const { cuts, lineStepPx } = buildPdfVerticalCuts(layoutEl, ch);

  const imgWidthMm = usableW;
  const imgHeightMm = (ch * imgWidthMm) / cw;

  const pxPerPage = Math.max(1, Math.floor((usableH / imgHeightMm) * ch));

  let cursorPx = 0;
  let pageIndex = 0;

  while (cursorPx < ch) {
    if (pageIndex > 0) pdf.addPage();
    pageIndex += 1;

    const rawEnd = Math.min(cursorPx + pxPerPage, ch);
    const sliceBottom = pickPdfSliceEnd(cursorPx, rawEnd, ch, cuts, lineStepPx);
    const hPx = Math.max(1, sliceBottom - cursorPx);

    pdf.setFillColor(255, 250, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const slice = document.createElement("canvas");
    slice.width = cw;
    slice.height = hPx;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    ctx.fillStyle = "#fffaf5";
    ctx.fillRect(0, 0, cw, hPx);
    ctx.drawImage(canvas, 0, cursorPx, cw, hPx, 0, 0, cw, hPx);

    const sliceData = slice.toDataURL("image/png");
    const sliceMm = (hPx / ch) * imgHeightMm;
    pdf.addImage(sliceData, "PNG", marginMm, marginMm, imgWidthMm, sliceMm);

    cursorPx = sliceBottom;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/**
 * Genera y descarga un PDF con el contenido íntegro y las imágenes embebidas.
 */
export async function downloadLetterPdf(
  payload: LetterPdfPayload,
  filenameBase: string,
): Promise<void> {
  const el = buildLetterPdfSourceElement(payload);

  try {
    const imgs = el.querySelectorAll("img");
    await Promise.all(
      [...imgs].map((img) =>
        img
          .decode()
          .catch(() => undefined),
      ),
    );

    const maxSide = 14000;
    const scale = Math.min(
      2,
      maxSide / Math.max(el.scrollWidth, el.scrollHeight, 1),
    );

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      backgroundColor: "#fffaf5",
    });

    const safeName = filenameBase.replace(/[^\w\-]+/g, "-").slice(0, 80);
    canvasToMultiPagePdf(canvas, `carta-${safeName}.pdf`, el);
  } finally {
    el.remove();
  }
}
