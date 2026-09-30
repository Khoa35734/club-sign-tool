/**
 * Dedicated Low-Resolution PDF Thumbnail Rendering & Caching Pipeline
 * Reference: docs/SRS.md FR-PDF-002, FR-PDF-003 & .agents/rules/pdf-editor.md Section 4
 */

import type * as pdfjsLib from 'pdfjs-dist';
import { getPdfDocument } from './pdfRenderService';
import { ensurePdfWorkerConfigured } from './pdfWorkerSetup';

export const THUMBNAIL_SCALE = 0.25;

// In-memory cache of rendered thumbnail image data URLs
// Key format: `${sourceKey}_p${pageNumber}_r${rotation}`
const thumbnailCache = new Map<string, string>();

/**
 * Generates a cache key for thumbnail caching.
 */
export function getThumbnailCacheKey(
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  rotation?: number
): string {
  const sourceKey = typeof source === 'string' ? source : 'in_memory_doc';
  const rotKey = rotation !== undefined ? `_r${rotation}` : '';
  return `${sourceKey}_p${pageNumber}${rotKey}`;
}

/**
 * Clears the thumbnail image cache to free memory.
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}

/**
 * Retrieves a rendered thumbnail data URL from memory cache if available.
 */
export function getCachedThumbnail(
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  rotation?: number
): string | undefined {
  const key = getThumbnailCacheKey(source, pageNumber, rotation);
  return thumbnailCache.get(key);
}

/**
 * Sets a thumbnail data URL directly into the cache (useful for testing or pre-warming).
 */
export function setCachedThumbnail(
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  dataUrl: string,
  rotation?: number
): void {
  const key = getThumbnailCacheKey(source, pageNumber, rotation);
  thumbnailCache.set(key, dataUrl);
}

/**
 * Renders a PDF page to a compact, low-resolution thumbnail image data URL (scale 0.25).
 * Cached in memory for near-instant retrieval.
 */
export async function renderPdfPageThumbnail(
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  rotation?: number,
  customCanvas?: HTMLCanvasElement
): Promise<string> {
  ensurePdfWorkerConfigured();

  const cacheKey = getThumbnailCacheKey(source, pageNumber, rotation);
  const cached = thumbnailCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pdfDoc =
    typeof source === 'object' && 'numPages' in source
      ? source
      : await getPdfDocument(source);

  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    throw new Error(
      `Số trang thumbnail không hợp lệ: ${pageNumber} (Tài liệu có ${pdfDoc.numPages} trang).`
    );
  }

  const page = await pdfDoc.getPage(pageNumber);
  const effectiveRotation = rotation !== undefined ? rotation : page.rotate;

  const viewport = page.getViewport({
    scale: THUMBNAIL_SCALE,
    rotation: effectiveRotation,
  });

  const width = Math.max(1, Math.floor(viewport.width));
  const height = Math.max(1, Math.floor(viewport.height));

  let canvas: HTMLCanvasElement;
  if (customCanvas) {
    canvas = customCanvas;
  } else if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
  } else {
    throw new Error('Môi trường không hỗ trợ HTMLCanvasElement để tạo thumbnail.');
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo ngữ cảnh vẽ 2D cho thumbnail.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  const renderTask = page.render(renderContext);
  await renderTask.promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  thumbnailCache.set(cacheKey, dataUrl);

  return dataUrl;
}
