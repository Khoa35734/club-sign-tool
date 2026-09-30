/**
 * Invariant Coordinate Model Utilities
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 3 (FR-COORD-001)
 * Rules: .agents/rules/pdf-editor.md Section 1
 */

import type { NormalizedCoordinates } from '@/types/editor';

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
