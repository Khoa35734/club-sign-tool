/**
 * Zoom calculation utilities, Fit Page / Fit Width algorithms, and constants
 * Reference: docs/SRS.md FR-PDF-004, FR-PDF-006 (Zoom 25% to 400%, Fit Page, Fit Width, Mixed Page Sizes)
 */

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_STEP = 0.1;

export const ZOOM_PRESETS: readonly number[] = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0,
];

export interface PageSizeInfo {
  widthPt: number;
  heightPt: number;
  rotation?: number;
}

export interface ViewportFitPadding {
  horizontal?: number;
  vertical?: number;
}

/**
 * Clamps zoom level strictly between 0.25 (25%) and 4.0 (400%).
 */
export function clampZoom(zoom: number): number {
  if (isNaN(zoom) || zoom <= 0) {
    return DEFAULT_ZOOM;
  }
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  // Round to 2 decimal places to avoid floating point precision issues (e.g. 0.30000000000000004)
  return Math.round(clamped * 100) / 100;
}

/**
 * Formats a zoom multiplier into a human-readable percentage string (e.g. 1.25 -> "125%").
 */
export function formatZoom(zoom: number): string {
  const percentage = Math.round(clampZoom(zoom) * 100);
  return `${percentage}%`;
}

/**
 * Calculates the next zoom level stepped up.
 */
export function zoomIn(currentZoom: number, step = ZOOM_STEP): number {
  return clampZoom(currentZoom + step);
}

/**
 * Calculates the next zoom level stepped down.
 */
export function zoomOut(currentZoom: number, step = ZOOM_STEP): number {
  return clampZoom(currentZoom - step);
}

/**
 * Calculates zoom level to fit a page's width inside viewport container.
 * Accounts for 90/270 degree rotation and horizontal padding.
 */
export function calculateFitWidthZoom(
  page: PageSizeInfo,
  viewportWidthPx: number,
  horizontalPadding = 48
): number {
  if (!page || page.widthPt <= 0 || page.heightPt <= 0 || viewportWidthPx <= 0) {
    return DEFAULT_ZOOM;
  }
  const rotation = page.rotation ? ((page.rotation % 360) + 360) % 360 : 0;
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const orientedWidth = isRotated90or270 ? page.heightPt : page.widthPt;

  const availableWidth = Math.max(50, viewportWidthPx - horizontalPadding);
  return clampZoom(availableWidth / orientedWidth);
}

/**
 * Calculates zoom level to fit an entire page (both width and height) inside viewport container.
 * Accounts for 90/270 degree rotation and padding.
 */
export function calculateFitPageZoom(
  page: PageSizeInfo,
  viewportWidthPx: number,
  viewportHeightPx: number,
  padding: ViewportFitPadding = { horizontal: 48, vertical: 48 }
): number {
  if (
    !page ||
    page.widthPt <= 0 ||
    page.heightPt <= 0 ||
    viewportWidthPx <= 0 ||
    viewportHeightPx <= 0
  ) {
    return DEFAULT_ZOOM;
  }
  const rotation = page.rotation ? ((page.rotation % 360) + 360) % 360 : 0;
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const orientedWidth = isRotated90or270 ? page.heightPt : page.widthPt;
  const orientedHeight = isRotated90or270 ? page.widthPt : page.heightPt;

  const hPad = padding.horizontal ?? 48;
  const vPad = padding.vertical ?? 48;

  const availableWidth = Math.max(50, viewportWidthPx - hPad);
  const availableHeight = Math.max(50, viewportHeightPx - vPad);

  const zoomWidth = availableWidth / orientedWidth;
  const zoomHeight = availableHeight / orientedHeight;

  return clampZoom(Math.min(zoomWidth, zoomHeight));
}
