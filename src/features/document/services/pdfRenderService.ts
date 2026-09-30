/**
 * High-Resolution PDF Page Rendering Service using PDF.js
 * Reference: docs/SRS.md FR-PDF-001 & .agents/rules/pdf-editor.md Section 1, 4
 */

import * as pdfjsLib from 'pdfjs-dist';
import { ensurePdfWorkerConfigured } from './pdfWorkerSetup';
import { readDocumentBytes } from './documentReaderService';
import {
  calculateEffectiveDpi,
  calculateRenderScale,
  MIN_PDF_RENDER_DPI,
} from '@/utils/pdfRender';

export interface RenderPdfPageOptions {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dpi?: number;
  zoom?: number;
  rotation?: number;
  devicePixelRatio?: number;
  onRenderTaskCreated?: (task: pdfjsLib.RenderTask) => void;
}

export interface RenderPdfPageResult {
  pageNumber: number;
  pixelWidth: number;
  pixelHeight: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
  dpi: number;
  cancelled?: boolean;
}

// In-memory cache of parsed PDFDocumentProxy promises keyed by file path or unique string
const pdfDocumentPromiseCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

/**
 * Loads and caches a PDFDocumentProxy from file path, Uint8Array or ArrayBuffer.
 */
export async function getPdfDocument(
  source: string | Uint8Array | ArrayBuffer
): Promise<pdfjsLib.PDFDocumentProxy> {
  ensurePdfWorkerConfigured();

  if (typeof source === 'string') {
    const existing = pdfDocumentPromiseCache.get(source);
    if (existing) {
      return existing;
    }

    const docPromise = (async () => {
      const bytes = await readDocumentBytes(source);
      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        useSystemFonts: true,
        isEvalSupported: false,
      });
      return loadingTask.promise;
    })();

    pdfDocumentPromiseCache.set(source, docPromise);

    // Evict from cache on failure so retry can re-attempt
    docPromise.catch(() => {
      if (pdfDocumentPromiseCache.get(source) === docPromise) {
        pdfDocumentPromiseCache.delete(source);
      }
    });

    return docPromise;
  }

  const data = source instanceof Uint8Array ? source : new Uint8Array(source);
  if (!data || data.byteLength === 0) {
    throw new Error('Dữ liệu tài liệu PDF rỗng (0 bytes).');
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
  });

  return loadingTask.promise;
}

/**
 * Clears cached PDF documents from memory to prevent memory leaks.
 */
export function clearPdfDocumentCache(): void {
  for (const promise of pdfDocumentPromiseCache.values()) {
    void promise.then((doc) => {
      try {
        void doc.destroy();
      } catch {
        // Ignore destroy errors during cleanup
      }
    });
  }
  pdfDocumentPromiseCache.clear();
}

/**
 * Renders a specific PDF page onto an HTML5 canvas at high resolution (min 150 DPI).
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  options: RenderPdfPageOptions
): Promise<RenderPdfPageResult> {
  ensurePdfWorkerConfigured();

  const {
    pageNumber,
    canvas,
    dpi,
    zoom = 1.0,
    rotation,
    devicePixelRatio,
    onRenderTaskCreated,
  } = options;

  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    throw new Error(
      `Số trang không hợp lệ: ${pageNumber} (Tài liệu có ${pdfDoc.numPages} trang).`
    );
  }

  if (!canvas) {
    throw new Error('Canvas element không tồn tại hoặc chưa sẵn sàng để render.');
  }

  const page = await pdfDoc.getPage(pageNumber);

  // Guarantee minimum 150 DPI
  const effectiveDpi = calculateEffectiveDpi({
    requestedDpi: dpi ?? MIN_PDF_RENDER_DPI,
    devicePixelRatio,
  });

  const effectiveScale = calculateRenderScale(effectiveDpi, zoom);
  const effectiveRotation = rotation !== undefined ? rotation : page.rotate;

  const pixelViewport = page.getViewport({
    scale: effectiveScale,
    rotation: effectiveRotation,
  });

  const displayViewport = page.getViewport({
    scale: zoom,
    rotation: effectiveRotation,
  });

  const pixelWidth = Math.max(1, Math.floor(pixelViewport.width));
  const pixelHeight = Math.max(1, Math.floor(pixelViewport.height));
  const displayWidth = Math.max(1, Math.round(displayViewport.width));
  const displayHeight = Math.max(1, Math.round(displayViewport.height));

  // Configure canvas buffer resolution (High-DPI pixels)
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  // Configure CSS display size in layout pixels
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo ngữ cảnh vẽ 2D (2D Canvas Context).');
  }

  ctx.clearRect(0, 0, pixelWidth, pixelHeight);

  const renderContext = {
    canvasContext: ctx,
    viewport: pixelViewport,
  };

  const renderTask = page.render(renderContext);
  if (onRenderTaskCreated) {
    onRenderTaskCreated(renderTask);
  }

  try {
    await renderTask.promise;
    return {
      pageNumber,
      pixelWidth,
      pixelHeight,
      displayWidth,
      displayHeight,
      scale: effectiveScale,
      dpi: effectiveDpi,
      cancelled: false,
    };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name?: string }).name === 'RenderingCancelledException'
    ) {
      return {
        pageNumber,
        pixelWidth,
        pixelHeight,
        displayWidth,
        displayHeight,
        scale: effectiveScale,
        dpi: effectiveDpi,
        cancelled: true,
      };
    }
    const message = err instanceof Error ? err.message : 'Lỗi khi vẽ trang PDF';
    throw new Error(`Lỗi vẽ trang PDF lên canvas: ${message}`, { cause: err });
  }
}
