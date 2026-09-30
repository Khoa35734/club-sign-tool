/**
 * Multi-Page Vertical Scrolling Document Viewport Component
 * Reference: docs/SRS.md FR-PDF-005 & .agents/rules/pdf-editor.md Section 4
 */

import { useState, useRef, useEffect, useCallback, type JSX } from 'react';
import type { PageDimensions } from '@/types/document';
import { PdfPageView } from './PdfPageView';
import { PdfViewportToolbar, type ViewportMode } from './PdfViewportToolbar';
import { useEditorStore } from '@/stores';
import { MIN_PDF_RENDER_DPI } from '@/utils/pdfRender';

export interface PdfDocumentViewportProps {
  source: string;
  pages: PageDimensions[];
  initialPage?: number;
  dpi?: number;
  zoom?: number;
  className?: string;
  onActivePageChange?: (pageNumber: number) => void;
}

export function PdfDocumentViewport({
  source,
  pages,
  initialPage = 1,
  dpi = MIN_PDF_RENDER_DPI,
  zoom = 1.0,
  className = '',
  onActivePageChange,
}: PdfDocumentViewportProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<ViewportMode>('continuous');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const setActivePageIndex = useEditorStore((state) => state.setActivePageIndex);

  const totalPages = pages.length > 0 ? pages.length : 1;

  // Handle active page update
  const handlePageChange = useCallback(
    (targetPage: number): void => {
      const clampedPage = Math.min(totalPages, Math.max(1, targetPage));
      setCurrentPage(clampedPage);
      setActivePageIndex(clampedPage - 1);
      onActivePageChange?.(clampedPage);

      if (viewMode === 'continuous') {
        const pageElement = document.getElementById(`pdf-page-${clampedPage}`);
        if (pageElement && scrollContainerRef.current) {
          pageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    },
    [totalPages, viewMode, setActivePageIndex, onActivePageChange]
  );

  // Track active page during continuous vertical scrolling
  useEffect(() => {
    if (viewMode !== 'continuous' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry?.target) {
          const pageAttr = bestEntry.target.getAttribute('data-page-number');
          if (pageAttr) {
            const pageNum = parseInt(pageAttr, 10);
            if (!isNaN(pageNum)) {
              setCurrentPage(pageNum);
              setActivePageIndex(pageNum - 1);
              onActivePageChange?.(pageNum);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.1, 0.3, 0.6],
        rootMargin: '-50px 0px -50px 0px',
      }
    );

    // Observe each page wrapper
    for (let i = 1; i <= totalPages; i++) {
      const el = document.getElementById(`pdf-page-${i}`);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [viewMode, totalPages, setActivePageIndex, onActivePageChange]);

  const activeSinglePage = pages.find((p) => p.pageNumber === currentPage) ?? pages[0] ?? {
    pageNumber: 1,
    widthPt: 595.28,
    heightPt: 841.89,
  };

  return (
    <div
      data-testid="pdf-document-viewport-root"
      className={`flex w-full flex-col items-center gap-4 ${className}`}
    >
      {/* Viewport Control Bar */}
      <PdfViewportToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        viewMode={viewMode}
        onPageChange={handlePageChange}
        onViewModeChange={setViewMode}
        className="w-full max-w-2xl"
      />

      {/* Main Document Viewport Area */}
      <div
        ref={scrollContainerRef}
        data-testid="pdf-document-viewport"
        className="relative flex w-full max-w-4xl flex-col items-center overflow-y-auto overflow-x-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-md scroll-smooth max-h-[75vh]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {viewMode === 'continuous' ? (
          /* Multi-Page Continuous Vertical Scroll */
          <div
            data-testid="continuous-page-list"
            className="flex w-full flex-col items-center gap-8 py-2"
          >
            {pages.map((page) => (
              <div
                key={page.pageNumber}
                id={`pdf-page-${page.pageNumber}`}
                data-page-number={page.pageNumber}
                className="flex flex-col items-center scroll-mt-6"
              >
                <PdfPageView
                  source={source}
                  pageNumber={page.pageNumber}
                  widthPt={page.widthPt}
                  heightPt={page.heightPt}
                  dpi={dpi}
                  zoom={zoom}
                  rotation={page.rotation}
                  lazy={true}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Single Page Mode */
          <div
            data-testid="single-page-view"
            className="flex w-full flex-col items-center justify-center py-2"
          >
            <PdfPageView
              source={source}
              pageNumber={activeSinglePage.pageNumber}
              widthPt={activeSinglePage.widthPt}
              heightPt={activeSinglePage.heightPt}
              dpi={dpi}
              zoom={zoom}
              rotation={activeSinglePage.rotation}
              lazy={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
