/**
 * Document File Utilities & Validation
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002
 */

import type { DocumentMeta, DocumentType } from '@/types/document';
import { getFileExtension } from './format';

const SUPPORTED_EXTENSIONS: readonly DocumentType[] = ['pdf', 'docx', 'doc'] as const;

export { getFileExtension };

/**
 * Extracts the file name including extension from a path (supports both \ and /).
 */
export function getFileName(filePath: string): string {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return normalized;
  return normalized.slice(lastSlash + 1);
}

/**
 * Checks if the file path has a supported extension (.pdf, .docx, .doc).
 */
export function isSupportedDocument(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return SUPPORTED_EXTENSIONS.includes(ext as DocumentType);
}

/**
 * Maps the file path to a supported DocumentType, or returns null if unsupported.
 */
export function getDocumentType(filePath: string): DocumentType | null {
  const ext = getFileExtension(filePath);
  if (SUPPORTED_EXTENSIONS.includes(ext as DocumentType)) {
    return ext as DocumentType;
  }
  return null;
}

/**
 * Creates an initial DocumentMeta record for a newly selected file path.
 */
export function createInitialDocumentMeta(filePath: string, fileSizeBytes = 0): DocumentMeta {
  const fileType = getDocumentType(filePath);
  if (!fileType) {
    throw new Error(
      `Unsupported document format for "${filePath}". Supported formats: .pdf, .docx, .doc`
    );
  }

  return {
    filePath,
    fileName: getFileName(filePath),
    fileType,
    fileSizeBytes,
    pageCount: 0,
    pages: [],
  };
}
