/**
 * Invariant Editor Coordinate Model & Object Specification
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 3 (FR-COORD-001)
 * Rules: .agents/rules/pdf-editor.md Section 1, 2
 */

/**
 * Normalized 2D Bounding Box in unit space [0.0, 1.0].
 *
 * CRITICAL INVARIANT:
 * - Coordinates are strictly relative to the unscaled canonical dimensions of the PDF page.
 * - Origin (0,0) is at the TOP-LEFT of the page (matching Web Canvas conventions).
 * - x = distance from left edge / page width (0.0 to 1.0)
 * - y = distance from top edge / page height (0.0 to 1.0)
 * - width = object width / page width (0.0 to 1.0)
 * - height = object height / page height (0.0 to 1.0)
 * - Values MUST remain invariant regardless of zoom factor, screen resolution, window resize, or device DPI.
 */
export interface NormalizedCoordinates {
  /** Distance from left edge of page divided by page width, in range [0.0, 1.0] */
  x: number;
  /** Distance from top edge of page divided by page height, in range [0.0, 1.0] */
  y: number;
  /** Width of the object divided by page width, in range [0.0, 1.0] */
  width: number;
  /** Height of the object divided by page height, in range [0.0, 1.0] */
  height: number;
}

/**
 * 2D Screen pixel coordinates / bounding box relative to rendered page container.
 */
export interface ScreenCoordinates {
  /** X position in screen pixels relative to page container top-left */
  x: number;
  /** Y position in screen pixels relative to page container top-left */
  y: number;
  /** Width in screen pixels */
  width: number;
  /** Height in screen pixels */
  height: number;
}

/**
 * Single 2D point in normalized coordinates [0.0, 1.0].
 */
export interface NormalizedPoint {
  /** Distance from left edge of page divided by page width, in range [0.0, 1.0] */
  x: number;
  /** Distance from top edge of page divided by page height, in range [0.0, 1.0] */
  y: number;
}

/**
 * Single 2D point in screen pixels relative to page container top-left.
 */
export interface ScreenPoint {
  /** X position in screen pixels */
  x: number;
  /** Y position in screen pixels */
  y: number;
}

/**
 * Rendered dimensions of a PDF page in screen pixels.
 */
export interface RenderedPageDimensions {
  /** Rendered width of the page in screen pixels (typically widthPt * zoom) */
  width: number;
  /** Rendered height of the page in screen pixels (typically heightPt * zoom) */
  height: number;
}

/**
 * Valid object types that can be placed on a document page.
 */
export type EditorObjectType = 'signature' | 'stamp' | 'text' | 'date';

/**
 * Core placement object interface adhering to the invariant normalized coordinate model.
 * Reference: .agents/rules/pdf-editor.md Section 2 & docs/SRS.md Section 14
 */
export interface EditorObject extends NormalizedCoordinates {
  /** Unique UUID v4 identifier */
  id: string;
  /** Type of placement object */
  type: EditorObjectType;
  /** 0-based page index */
  pageIndex: number;
  /** 1-based page number for compatibility with PDF page specifications */
  pageNumber?: number;

  // Normalized Bounding Box [0.0 - 1.0]
  /** Normalized X position [0.0 - 1.0] relative to canonical page width */
  x: number;
  /** Normalized Y position [0.0 - 1.0] relative to canonical page height */
  y: number;
  /** Normalized width [0.0 - 1.0] relative to canonical page width */
  width: number;
  /** Normalized height [0.0 - 1.0] relative to canonical page height */
  height: number;

  /** Rotation angle in degrees [0, 360) */
  rotation: number;
  /** Opacity level [0.0, 1.0] (default 1.0 for signatures, 0.85-0.90 for stamps) */
  opacity: number;
  /** Z-index layer order on the same page */
  zIndex: number;
  /** Lock flag to prevent accidental movement or transformation */
  isLocked?: boolean;

  // Type-specific payloads
  /** Referenced image asset ID in local library (for signature / stamp) */
  assetId?: string;
  /** Lock aspect ratio during resize operations (default true for signatures / circular stamps) */
  aspectRatioLocked?: boolean;
  /** Text content for text/date types */
  textPayload?: string;
  /** Font family (e.g. 'Times New Roman' | 'Arial' | 'Roboto') */
  fontFamily?: string;
  /** Font size in standard PDF Points (e.g. 13) */
  fontSizePt?: number;
  /** Font size normalized to canonical page height */
  fontSizeNormalized?: number;
  /** Font weight */
  fontWeight?: 'normal' | 'bold';
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Hex color string (e.g. '#000000', '#C00000') */
  color?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Date pattern for date objects */
  datePattern?: string;
}
