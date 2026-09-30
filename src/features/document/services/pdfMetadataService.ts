/**
 * PDF Metadata Extraction Service using PDF.js
 * Reference: docs/SRS.md FR-PDF-001, UC-001 & docs/ROADMAP.md Phase 2
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { PageDimensions } from '@/types/document';
import { readDocumentBytes } from './documentReaderService';

export interface PdfMetadataResult {
  pageCount: number;
  pages: PageDimensions[];
}

import { ensurePdfWorkerConfigured } from './pdfWorkerSetup';

ensurePdfWorkerConfigured();

/**
 * Parses raw PDF bytes with PDF.js and extracts total page count and page dimensions.
 */
export async function extractPdfMetadata(
  source: Uint8Array | ArrayBuffer
): Promise<PdfMetadataResult> {
  const data = source instanceof Uint8Array ? source : new Uint8Array(source);

  if (!data || data.byteLength === 0) {
    throw new Error('Dữ liệu tài liệu PDF rỗng (0 bytes).');
  }

  let pdfDoc: pdfjsLib.PDFDocumentProxy;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err) {
      const errorName = (err as { name?: string }).name;
      if (errorName === 'PasswordException') {
        throw new Error(
          'Tệp PDF được bảo vệ bằng mật khẩu. Vui lòng mở khóa tệp trước khi nạp.',
          { cause: err }
        );
      }
      if (errorName === 'InvalidPDFException') {
        throw new Error(
          'Tệp tin không đúng định dạng PDF chuẩn hoặc đã bị hỏng. Vui lòng kiểm tra lại nguồn file.',
          { cause: err }
        );
      }
    }
    const message = err instanceof Error ? err.message : 'Không thể đọc cấu trúc tệp PDF.';
    throw new Error(`Lỗi nạp tài liệu PDF: ${message}`, { cause: err });
  }

  const pageCount = pdfDoc.numPages;
  const pages: PageDimensions[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    pages.push({
      pageNumber,
      widthPt: Math.round(viewport.width * 100) / 100,
      heightPt: Math.round(viewport.height * 100) / 100,
      rotation: page.rotate,
    });
  }

  return {
    pageCount,
    pages,
  };
}

/**
 * Loads a PDF file from either a local file path or in-memory binary bytes,
 * and extracts its metadata (page count and dimensions).
 */
export async function loadPdfDocumentMetadata(
  source: string | Uint8Array | ArrayBuffer
): Promise<PdfMetadataResult> {
  let bytes: Uint8Array;

  if (typeof source === 'string') {
    bytes = await readDocumentBytes(source);
  } else if (source instanceof Uint8Array) {
    bytes = source;
  } else {
    bytes = new Uint8Array(source);
  }

  return extractPdfMetadata(bytes);
}
