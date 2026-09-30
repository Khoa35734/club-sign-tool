/**
 * Hook for managing the PDF.js page rendering lifecycle onto an HTML5 canvas.
 * Reference: docs/SRS.md FR-PDF-001 & .agents/rules/pdf-editor.md Section 4
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import {
  getPdfDocument,
  renderPdfPageToCanvas,
  type RenderPdfPageResult,
} from '../services/pdfRenderService';
import { MIN_PDF_RENDER_DPI } from '@/utils/pdfRender';

export interface UsePdfPageRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy | null;
  pageNumber?: number;
  dpi?: number;
  zoom?: number;
  rotation?: number;
  onRenderSuccess?: (result: RenderPdfPageResult) => void;
  onRenderError?: (error: Error) => void;
}

export interface UsePdfPageRendererResult {
  isRendering: boolean;
  error: string | null;
  lastRenderResult: RenderPdfPageResult | null;
  retry: () => void;
}

export function usePdfPageRenderer(
  options: UsePdfPageRendererOptions
): UsePdfPageRendererResult {
  const {
    canvasRef,
    source,
    pageNumber = 1,
    dpi = MIN_PDF_RENDER_DPI,
    zoom = 1.0,
    rotation,
    onRenderSuccess,
    onRenderError,
  } = options;

  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRenderResult, setLastRenderResult] = useState<RenderPdfPageResult | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const activeTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const retry = useCallback((): void => {
    setError(null);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    // Abort any currently executing render task
    if (activeTaskRef.current) {
      try {
        activeTaskRef.current.cancel();
      } catch {
        // Ignore task cancellation error
      }
      activeTaskRef.current = null;
    }

    const currentSource = source;
    const canvas = canvasRef.current;

    if (!currentSource || !canvas) {
      return;
    }

    async function executeRender(
      activeSource: string | Uint8Array | pdfjsLib.PDFDocumentProxy,
      targetCanvas: HTMLCanvasElement
    ): Promise<void> {
      setIsRendering(true);
      setError(null);

      try {
        const pdfDoc =
          typeof activeSource === 'object' && 'numPages' in activeSource
            ? activeSource
            : await getPdfDocument(activeSource);

        if (isCancelled) {
          return;
        }

        const result = await renderPdfPageToCanvas(pdfDoc, {
          pageNumber,
          canvas: targetCanvas,
          dpi,
          zoom,
          rotation,
          devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
          onRenderTaskCreated: (task) => {
            activeTaskRef.current = task;
          },
        });

        if (isCancelled || result.cancelled) {
          return;
        }

        activeTaskRef.current = null;
        setLastRenderResult(result);
        setIsRendering(false);
        onRenderSuccess?.(result);
      } catch (err: unknown) {
        if (isCancelled) {
          return;
        }

        activeTaskRef.current = null;
        setIsRendering(false);

        const normalizedError =
          err instanceof Error
            ? err
            : new Error('Không thể hiển thị trang PDF lên khung nhìn.');
        setError(normalizedError.message);
        onRenderError?.(normalizedError);
      }
    }

    void executeRender(currentSource, canvas);

    return () => {
      isCancelled = true;
      if (activeTaskRef.current) {
        try {
          activeTaskRef.current.cancel();
        } catch {
          // Ignore cancellation during unmount
        }
        activeTaskRef.current = null;
      }
    };
  }, [
    canvasRef,
    source,
    pageNumber,
    dpi,
    zoom,
    rotation,
    retryTrigger,
    onRenderSuccess,
    onRenderError,
  ]);

  return {
    isRendering: source ? isRendering : false,
    error: source ? error : null,
    lastRenderResult: source ? lastRenderResult : null,
    retry,
  };
}
