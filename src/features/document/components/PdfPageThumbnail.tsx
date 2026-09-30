/**
 * Single PDF Page Thumbnail Component
 * Reference: docs/SRS.md FR-PDF-002, FR-PDF-003 & .agents/rules/pdf-editor.md Section 4
 */

import { useState, useEffect, useRef, type JSX } from 'react';
import { renderPdfPageThumbnail, getCachedThumbnail } from '../services/pdfThumbnailService';

export interface PdfPageThumbnailProps {
  source: string;
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  rotation?: number;
  isActive: boolean;
  onSelect: (pageNumber: number) => void;
  className?: string;
}

export function PdfPageThumbnail({
  source,
  pageNumber,
  widthPt,
  heightPt,
  rotation,
  isActive,
  onSelect,
  className = '',
}: PdfPageThumbnailProps): JSX.Element {
  const containerRef = useRef<HTMLButtonElement | null>(null);

  const initialCached = getCachedThumbnail(source, pageNumber, rotation);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialCached ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(
    Boolean(initialCached) || typeof IntersectionObserver === 'undefined'
  );

  // Lazy visibility tracking via IntersectionObserver
  useEffect(() => {
    if (isVisible || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '100px 0px' }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  // Render thumbnail when visible
  useEffect(() => {
    if (!isVisible || thumbnailUrl) {
      return;
    }

    let isMounted = true;

    renderPdfPageThumbnail(source, pageNumber, rotation)
      .then((url) => {
        if (isMounted) {
          setThumbnailUrl(url);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Lỗi tạo ảnh thu nhỏ';
          setError(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isVisible, source, pageNumber, rotation, thumbnailUrl]);

  const isLoading = !thumbnailUrl && !error;
  const aspectRatio = widthPt > 0 && heightPt > 0 ? widthPt / heightPt : 0.707;

  return (
    <button
      ref={containerRef}
      type="button"
      data-testid={`thumbnail-page-${pageNumber}`}
      data-page-number={pageNumber}
      data-active={isActive ? 'true' : 'false'}
      onClick={() => onSelect(pageNumber)}
      aria-label={`Trang ${pageNumber}${isActive ? ' (đang chọn)' : ''}`}
      className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        isActive
          ? 'bg-indigo-950/40 ring-2 ring-indigo-500 shadow-md'
          : 'hover:bg-slate-800/60 border border-transparent'
      } ${className}`}
    >
      {/* Thumbnail Aspect Box */}
      <div
        className={`relative w-28 overflow-hidden rounded border transition-colors shadow-sm ${
          isActive
            ? 'border-indigo-400 bg-white'
            : 'border-slate-700/80 bg-slate-900 group-hover:border-slate-500'
        }`}
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Ảnh thu nhỏ trang ${pageNumber}`}
            data-testid={`thumbnail-img-${pageNumber}`}
            className="h-full w-full object-contain pointer-events-none select-none"
            loading="lazy"
          />
        ) : error ? (
          <div
            data-testid={`thumbnail-error-${pageNumber}`}
            className="flex h-full w-full items-center justify-center bg-red-950/40 p-1 text-center text-[10px] text-red-400"
            title={error}
          >
            <span>Lỗi</span>
          </div>
        ) : isLoading ? (
          <div
            data-testid={`thumbnail-loading-${pageNumber}`}
            className="flex h-full w-full animate-pulse items-center justify-center bg-slate-800 text-xs text-slate-500"
          >
            <span>Đang tải...</span>
          </div>
        ) : null}
      </div>

      {/* Page Badge Label */}
      <span
        data-testid={`thumbnail-badge-${pageNumber}`}
        className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
            : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
        }`}
      >
        Trang {pageNumber}
      </span>
    </button>
  );
}
