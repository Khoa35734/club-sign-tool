/**
 * High-Resolution PDF Page Viewport Canvas Component
 * Reference: docs/SRS.md FR-PDF-001 & .agents/rules/pdf-editor.md Section 4
 */

import { useRef, type JSX } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import { usePdfPageRenderer } from '../hooks/usePdfPageRenderer';
import type { RenderPdfPageResult } from '../services/pdfRenderService';
import { Button } from '@/components/Button';
import { MIN_PDF_RENDER_DPI } from '@/utils/pdfRender';

export interface PdfPageViewProps {
  source: string | Uint8Array | pdfjsLib.PDFDocumentProxy | null;
  pageNumber?: number;
  dpi?: number;
  zoom?: number;
  rotation?: number;
  className?: string;
  onRenderSuccess?: (result: RenderPdfPageResult) => void;
  onRenderError?: (error: Error) => void;
}

export function PdfPageView({
  source,
  pageNumber = 1,
  dpi = MIN_PDF_RENDER_DPI,
  zoom = 1.0,
  rotation,
  className = '',
  onRenderSuccess,
  onRenderError,
}: PdfPageViewProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { isRendering, error, lastRenderResult, retry } = usePdfPageRenderer({
    canvasRef,
    source,
    pageNumber,
    dpi,
    zoom,
    rotation,
    onRenderSuccess,
    onRenderError,
  });

  return (
    <div
      data-testid="pdf-page-view-container"
      className={`relative inline-flex flex-col items-center select-none ${className}`}
    >
      {/* High-Resolution Document Canvas */}
      <div className="relative overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-slate-900/10">
        <canvas
          ref={canvasRef}
          data-testid="pdf-page-canvas"
          role="img"
          aria-label={`Trang ${pageNumber} của tài liệu PDF`}
          className="block bg-white transition-opacity duration-150"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        {/* Loading Spinner Overlay */}
        {isRendering && (
          <div
            data-testid="pdf-page-loading-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-[1px]"
          >
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/85 px-4 py-2 text-xs font-medium text-slate-200 shadow-lg border border-slate-700/60">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <span>Đang kết xuất trang {pageNumber} ({dpi} DPI)...</span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && !isRendering && (
          <div
            data-testid="pdf-page-error-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 p-6 text-center backdrop-blur-sm"
          >
            <span className="mb-2 text-3xl">⚠️</span>
            <p className="mb-1 text-sm font-semibold text-rose-200">
              Không thể hiển thị trang {pageNumber}
            </p>
            <p className="mb-4 max-w-xs text-xs text-rose-300/90">{error}</p>
            <Button variant="secondary" size="sm" onClick={retry}>
              Thử lại
            </Button>
          </div>
        )}
      </div>

      {/* Page Info Footer Badge */}
      {lastRenderResult && (
        <div
          data-testid="pdf-page-info-badge"
          className="mt-2 flex items-center gap-3 text-[11px] text-slate-400"
        >
          <span>Trang {lastRenderResult.pageNumber}</span>
          <span className="text-slate-600">•</span>
          <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300 font-mono text-[10px]">
            {lastRenderResult.dpi} DPI ({lastRenderResult.pixelWidth} × {lastRenderResult.pixelHeight} px)
          </span>
        </div>
      )}
    </div>
  );
}
