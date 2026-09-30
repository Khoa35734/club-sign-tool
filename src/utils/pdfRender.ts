/**
 * Mathematical calculations and scaling for PDF rendering at high resolution.
 * Reference: docs/SRS.md FR-PDF-001 & .agents/rules/pdf-editor.md Section 1, 4
 */

export const MIN_PDF_RENDER_DPI = 150;
export const PDF_POINTS_PER_INCH = 72;

export interface PageCanvasDimensions {
  pixelWidth: number;
  pixelHeight: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
  dpi: number;
}

export interface RenderDimensionsOptions {
  dpi?: number;
  zoom?: number;
  devicePixelRatio?: number;
  rotation?: number;
}

/**
 * Calculates effective rendering DPI ensuring minimum 150 DPI is strictly enforced.
 */
export function calculateEffectiveDpi(options?: {
  requestedDpi?: number;
  devicePixelRatio?: number;
  minDpi?: number;
}): number {
  const minDpi = options?.minDpi ?? MIN_PDF_RENDER_DPI;
  const requestedDpi = options?.requestedDpi ?? MIN_PDF_RENDER_DPI;
  const screenDpi = options?.devicePixelRatio
    ? options.devicePixelRatio * PDF_POINTS_PER_INCH
    : 0;

  return Math.max(minDpi, requestedDpi, screenDpi);
}

/**
 * Calculates effective render scale for PDF.js viewport.
 */
export function calculateRenderScale(dpi: number, zoom = 1.0): number {
  const safeDpi = Math.max(MIN_PDF_RENDER_DPI, dpi);
  const safeZoom = zoom > 0 ? zoom : 1.0;
  return (safeDpi / PDF_POINTS_PER_INCH) * safeZoom;
}

/**
 * Calculates physical canvas buffer dimensions and CSS display dimensions for a PDF page.
 */
export function calculatePageCanvasDimensions(
  widthPt: number,
  heightPt: number,
  options?: RenderDimensionsOptions
): PageCanvasDimensions {
  if (widthPt <= 0 || heightPt <= 0) {
    throw new Error('Kích thước trang PDF không hợp lệ (chiều dài hoặc chiều rộng <= 0).');
  }

  const effectiveDpi = calculateEffectiveDpi({
    requestedDpi: options?.dpi,
    devicePixelRatio: options?.devicePixelRatio,
  });

  const zoom = options?.zoom && options.zoom > 0 ? options.zoom : 1.0;
  const rotation = options?.rotation ? ((options.rotation % 360) + 360) % 360 : 0;
  const isRotated90or270 = rotation === 90 || rotation === 270;

  const orientedWidthPt = isRotated90or270 ? heightPt : widthPt;
  const orientedHeightPt = isRotated90or270 ? widthPt : heightPt;

  const scale = calculateRenderScale(effectiveDpi, zoom);

  const pixelWidth = Math.max(1, Math.floor(orientedWidthPt * scale));
  const pixelHeight = Math.max(1, Math.floor(orientedHeightPt * scale));

  const displayWidth = Math.max(1, Math.round(orientedWidthPt * zoom));
  const displayHeight = Math.max(1, Math.round(orientedHeightPt * zoom));

  return {
    pixelWidth,
    pixelHeight,
    displayWidth,
    displayHeight,
    scale,
    dpi: effectiveDpi,
  };
}
