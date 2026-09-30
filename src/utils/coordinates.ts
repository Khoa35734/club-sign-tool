/**
 * Invariant Coordinate Model Utilities
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 3 (FR-COORD-001)
 * Rules: .agents/rules/pdf-editor.md Section 1
 */

import type {
  NormalizedCoordinates,
  ScreenCoordinates,
  NormalizedPoint,
  ScreenPoint,
  RenderedPageDimensions,
} from '@/types/editor';

/** Small epsilon tolerance for floating-point boundary checks */
export const COORDINATE_EPSILON = 1e-6;

/**
 * Checks whether a single scalar value is a valid normalized coordinate in range [0.0, 1.0].
 */
export function isNormalizedCoordinate(val: number): boolean {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0.0 - COORDINATE_EPSILON && val <= 1.0 + COORDINATE_EPSILON;
}

/**
 * Clamps a single scalar coordinate strictly into range [0.0, 1.0].
 */
export function clampNormalizedCoordinate(val: number): number {
  if (!Number.isFinite(val) || Number.isNaN(val)) {
    return 0.0;
  }
  return Math.min(1.0, Math.max(0.0, val));
}

/**
 * Validates whether a NormalizedCoordinates bounding box fits completely within the [0.0, 1.0] page bounds.
 */
export function isNormalizedRect(coords: NormalizedCoordinates): boolean {
  if (!coords) return false;
  const { x, y, width, height } = coords;

  if (
    !isNormalizedCoordinate(x) ||
    !isNormalizedCoordinate(y) ||
    !isNormalizedCoordinate(width) ||
    !isNormalizedCoordinate(height)
  ) {
    return false;
  }

  // Width and height must be non-negative
  if (width < 0 || height < 0) {
    return false;
  }

  // Right and bottom edges must not exceed 1.0 (with epsilon tolerance)
  if (x + width > 1.0 + COORDINATE_EPSILON || y + height > 1.0 + COORDINATE_EPSILON) {
    return false;
  }

  return true;
}

/**
 * Rounds a normalized coordinate value to 6 decimal places to prevent IEEE 754 floating-point drift.
 */
export function roundNormalized(val: number): number {
  return Math.round(val * 1e6) / 1e6;
}

/**
 * Clamps a 2D bounding box so that it strictly resides within [0.0, 1.0] in both dimensions.
 * Ensures:
 * - 0.0 <= x <= 1.0
 * - 0.0 <= y <= 1.0
 * - 0.0 <= width <= 1.0 - x
 * - 0.0 <= height <= 1.0 - y
 */
export function clampNormalizedRect(coords: NormalizedCoordinates): NormalizedCoordinates {
  const x = roundNormalized(clampNormalizedCoordinate(coords.x));
  const y = roundNormalized(clampNormalizedCoordinate(coords.y));

  // Maximum allowed width and height given the clamped (x, y) origin
  const maxW = Math.max(0.0, roundNormalized(1.0 - x));
  const maxH = Math.max(0.0, roundNormalized(1.0 - y));

  const rawW = Number.isFinite(coords.width) ? Math.max(0.0, coords.width) : 0.0;
  const rawH = Number.isFinite(coords.height) ? Math.max(0.0, coords.height) : 0.0;

  const width = Math.min(maxW, roundNormalized(rawW));
  const height = Math.min(maxH, roundNormalized(rawH));

  return { x, y, width, height };
}

/**
 * Creates and clamps a NormalizedCoordinates object from raw coordinates.
 */
export function createNormalizedCoordinates(
  x: number,
  y: number,
  width: number,
  height: number
): NormalizedCoordinates {
  return clampNormalizedRect({ x, y, width, height });
}

/**
 * Options for coordinate conversion.
 */
export interface CoordinateConversionOptions {
  /**
   * Whether to round normalized coordinate results to 6 decimal places.
   * Defaults to true to eliminate IEEE 754 precision drift.
   */
  round?: boolean;
  /**
   * Whether to clamp coordinates within canonical bounds [0.0, 1.0].
   * Defaults to false to allow detecting or handling temporary out-of-bounds drag positions.
   */
  clamp?: boolean;
}

/**
 * Converts normalized coordinates [0.0 - 1.0] to screen pixel coordinates
 * based on current rendered page dimensions (canonical page size * zoom).
 *
 * Mathematical Formula (SRS Section 13.2):
 * X_screen = x_norm * W_rendered_page
 * Y_screen = y_norm * H_rendered_page
 * Width_screen = width_norm * W_rendered_page
 * Height_screen = height_norm * H_rendered_page
 */
export function normalizedToScreen(
  coords: NormalizedCoordinates,
  pageDimensions: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number }
): ScreenCoordinates;
export function normalizedToScreen(
  coords: NormalizedCoordinates,
  renderedWidth: number,
  renderedHeight: number
): ScreenCoordinates;
export function normalizedToScreen(
  coords: NormalizedCoordinates,
  dimOrWidth: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number } | number,
  maybeHeight?: number
): ScreenCoordinates {
  let width = 0;
  let height = 0;

  if (typeof dimOrWidth === 'number') {
    width = dimOrWidth;
    height = typeof maybeHeight === 'number' ? maybeHeight : 0;
  } else if (typeof dimOrWidth === 'object' && dimOrWidth !== null) {
    width = 'renderedWidth' in dimOrWidth ? dimOrWidth.renderedWidth : dimOrWidth.width;
    height = 'renderedHeight' in dimOrWidth ? dimOrWidth.renderedHeight : dimOrWidth.height;
  }

  return {
    x: coords.x * width,
    y: coords.y * height,
    width: coords.width * width,
    height: coords.height * height,
  };
}

/**
 * Converts screen pixel coordinates to normalized coordinates [0.0 - 1.0]
 * based on current rendered page dimensions.
 *
 * Mathematical Formula (SRS Section 13.2):
 * x_norm = X_screen / W_rendered_page
 * y_norm = Y_screen / H_rendered_page
 * width_norm = Width_screen / W_rendered_page
 * height_norm = Height_screen / H_rendered_page
 */
export function screenToNormalized(
  screen: ScreenCoordinates,
  pageDimensions: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number },
  options?: CoordinateConversionOptions
): NormalizedCoordinates;
export function screenToNormalized(
  screen: ScreenCoordinates,
  renderedWidth: number,
  renderedHeight: number,
  options?: CoordinateConversionOptions
): NormalizedCoordinates;
export function screenToNormalized(
  screen: ScreenCoordinates,
  dimOrWidth: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number } | number,
  maybeHeightOrOptions?: number | CoordinateConversionOptions,
  maybeOptions?: CoordinateConversionOptions
): NormalizedCoordinates {
  let width = 0;
  let height = 0;
  let options: CoordinateConversionOptions | undefined;

  if (typeof dimOrWidth === 'number') {
    width = dimOrWidth;
    height = typeof maybeHeightOrOptions === 'number' ? maybeHeightOrOptions : 0;
    options = maybeOptions;
  } else if (typeof dimOrWidth === 'object' && dimOrWidth !== null) {
    width = 'renderedWidth' in dimOrWidth ? dimOrWidth.renderedWidth : dimOrWidth.width;
    height = 'renderedHeight' in dimOrWidth ? dimOrWidth.renderedHeight : dimOrWidth.height;
    if (typeof maybeHeightOrOptions === 'object' && maybeHeightOrOptions !== null) {
      options = maybeHeightOrOptions;
    }
  }

  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let rawX = screen.x / width;
  let rawY = screen.y / height;
  let rawW = screen.width / width;
  let rawH = screen.height / height;

  const shouldRound = options?.round ?? true;
  if (shouldRound) {
    rawX = roundNormalized(rawX);
    rawY = roundNormalized(rawY);
    rawW = roundNormalized(rawW);
    rawH = roundNormalized(rawH);
  }

  const result: NormalizedCoordinates = {
    x: rawX,
    y: rawY,
    width: rawW,
    height: rawH,
  };

  if (options?.clamp) {
    return clampNormalizedRect(result);
  }

  return result;
}

/**
 * Converts a normalized single point [0.0 - 1.0] to screen pixel coordinates.
 */
export function normalizedPointToScreen(
  point: NormalizedPoint,
  renderedWidth: number,
  renderedHeight: number
): ScreenPoint;
export function normalizedPointToScreen(
  point: NormalizedPoint,
  pageDimensions: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number }
): ScreenPoint;
export function normalizedPointToScreen(
  point: NormalizedPoint,
  dimOrWidth: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number } | number,
  maybeHeight?: number
): ScreenPoint {
  let width = 0;
  let height = 0;

  if (typeof dimOrWidth === 'number') {
    width = dimOrWidth;
    height = typeof maybeHeight === 'number' ? maybeHeight : 0;
  } else if (typeof dimOrWidth === 'object' && dimOrWidth !== null) {
    width = 'renderedWidth' in dimOrWidth ? dimOrWidth.renderedWidth : dimOrWidth.width;
    height = 'renderedHeight' in dimOrWidth ? dimOrWidth.renderedHeight : dimOrWidth.height;
  }

  return {
    x: point.x * width,
    y: point.y * height,
  };
}

/**
 * Converts a screen pixel point to a normalized point [0.0 - 1.0].
 */
export function screenPointToNormalized(
  point: ScreenPoint,
  renderedWidth: number,
  renderedHeight: number,
  options?: CoordinateConversionOptions
): NormalizedPoint;
export function screenPointToNormalized(
  point: ScreenPoint,
  pageDimensions: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number },
  options?: CoordinateConversionOptions
): NormalizedPoint;
export function screenPointToNormalized(
  point: ScreenPoint,
  dimOrWidth: RenderedPageDimensions | { renderedWidth: number; renderedHeight: number } | number,
  maybeHeightOrOptions?: number | CoordinateConversionOptions,
  maybeOptions?: CoordinateConversionOptions
): NormalizedPoint {
  let width = 0;
  let height = 0;
  let options: CoordinateConversionOptions | undefined;

  if (typeof dimOrWidth === 'number') {
    width = dimOrWidth;
    height = typeof maybeHeightOrOptions === 'number' ? maybeHeightOrOptions : 0;
    options = maybeOptions;
  } else if (typeof dimOrWidth === 'object' && dimOrWidth !== null) {
    width = 'renderedWidth' in dimOrWidth ? dimOrWidth.renderedWidth : dimOrWidth.width;
    height = 'renderedHeight' in dimOrWidth ? dimOrWidth.renderedHeight : dimOrWidth.height;
    if (typeof maybeHeightOrOptions === 'object' && maybeHeightOrOptions !== null) {
      options = maybeHeightOrOptions;
    }
  }

  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }

  let rawX = point.x / width;
  let rawY = point.y / height;

  const shouldRound = options?.round ?? true;
  if (shouldRound) {
    rawX = roundNormalized(rawX);
    rawY = roundNormalized(rawY);
  }

  if (options?.clamp) {
    return {
      x: clampNormalizedCoordinate(rawX),
      y: clampNormalizedCoordinate(rawY),
    };
  }

  return { x: rawX, y: rawY };
}

