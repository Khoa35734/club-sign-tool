/**
 * Zoom calculation utilities and constants
 * Reference: docs/SRS.md FR-PDF-004 (Zoom 25% to 400%)
 */

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_STEP = 0.1;

export const ZOOM_PRESETS: readonly number[] = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0,
];

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
