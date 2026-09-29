/**
 * Project File Format (.clbsign) Types
 * Reference: docs/SRS.md Section 19
 */

import type { CanvasPlacementObject } from './canvas';

export interface SourceDocumentRef {
  originalPath: string;
  fileHashSha256: string;
  totalPageCount: number;
}

export interface ProjectFile {
  formatVersion: number;
  generator: string;
  savedAt: string;
  sourceDocument: SourceDocumentRef;
  objects: CanvasPlacementObject[];
}
