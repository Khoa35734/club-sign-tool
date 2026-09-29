/**
 * Canvas & Placement Object Model Specification
 * Reference: docs/SRS.md Section 14
 */

export type ObjectType = 'signature' | 'stamp' | 'text' | 'date';

export interface BasePlacementObject {
  /** UUID v4 identifier */
  id: string;
  /** Type of placement object */
  type: ObjectType;
  /** Page number where object is placed (1-based index) */
  pageNumber: number;

  // Normalized Coordinates [0.0 - 1.0] relative to page dimensions
  /** Distance from left edge of page divided by page width */
  x: number;
  /** Distance from top edge of page divided by page height */
  y: number;
  /** Object width divided by page width */
  width: number;
  /** Object height divided by page height */
  height: number;

  /** Rotation angle in degrees (0 - 360) */
  rotation: number;
  /** Opacity level (0.1 - 1.0) */
  opacity: number;
  /** Z-index layer order on the same page */
  zIndex: number;
  /** Lock flag to prevent accidental movement/resizing */
  isLocked: boolean;
}

export interface ImagePlacementObject extends BasePlacementObject {
  type: 'signature' | 'stamp';
  /** Reference ID in Asset Manager (assets.json) */
  assetId: string;
  /** Lock aspect ratio during resize operations */
  aspectRatioLocked: boolean;
}

export interface TextPlacementObject extends BasePlacementObject {
  type: 'text' | 'date';
  /** Display text content */
  content: string;
  /** Font family (e.g. 'Times New Roman' | 'Arial' | 'Roboto') */
  fontFamily: string;
  /** Font size in standard PDF Points (e.g. 13) */
  fontSizePt: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold';
  /** Font style */
  fontStyle: 'normal' | 'italic';
  /** Hex color code (e.g. '#000000', '#C00000') */
  textColor: string;
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right';
  /** Date pattern for date objects */
  datePattern?: string;
}

export type CanvasPlacementObject = ImagePlacementObject | TextPlacementObject;
