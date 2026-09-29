/**
 * Document & Page Metadata Types
 * Reference: docs/SRS.md Section 5, 10.1 & docs/ARCHITECTURE.md
 */

export type DocumentType = 'pdf' | 'docx' | 'doc';

export interface PageDimensions {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  rotation?: number;
}

export interface DocumentMeta {
  filePath: string;
  fileName: string;
  fileType: DocumentType;
  fileSizeBytes: number;
  pageCount: number;
  pages: PageDimensions[];
}

export interface RecentDocument {
  filePath: string;
  fileName: string;
  fileType: DocumentType;
  lastOpened: number; // Unix timestamp in ms
}
