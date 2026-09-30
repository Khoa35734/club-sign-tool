/**
 * Multi-Page Vertical Scrolling Document Viewport with Thumbnail Sidebar & Zoom
 * Reference: docs/SRS.md FR-PDF-002, FR-PDF-003, FR-PDF-004, FR-PDF-005 & .agents/rules/pdf-editor.md
 */

import { useState, useRef, useCallback, type JSX } from 'react';
import type { PageDimensions } from '@/types/document';
import { PdfPageView } from './PdfPageView';
import { PdfViewportToolbar, type ViewportMode } from './PdfViewportToolbar';
import { PdfThumbnailSidebar } from './PdfThumbnailSidebar';
import { useEditorStore } from '@/stores';
import { useViewportScrollObserver } from '../hooks/useViewportScrollObserver';
import { useZoomWheel } from '../hooks/useZoomWheel';
import { usePdfFitZoom } from '../hooks/usePdfFitZoom';
import { MIN_PDF_RENDER_DPI } from '@/utils/pdfRender';

export interface PdfDocumentViewportProps {
  source: string;
  pages: PageDimensions[];
  initialPage?: number;
  dpi?: number;
  zoom?: number;
  showSidebar?: boolean;
  className?: string;
  onActivePageChange?: (pageNumber: number) => void;
}

export function PdfDocumentViewport({
  source,
  pages,
  initialPage = 1,
  dpi = MIN_PDF_RENDER_DPI,
  zoom,
  showSidebar = true,
  className = '',
  onActivePageChange,
}: PdfDocumentViewportProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<ViewportMode>('continuous');
  const [isSidebarOpen, setIsSidebarOpen] = useState(showSidebar);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Global Editor State
  const setActivePageIndex = useEditorStore((state) => state.setActivePageIndex);
  const zoomLevel = useEditorStore((state) => state.zoomLevel);
  const setZoomLevel = useEditorStore((state) => state.setZoomLevel);
  const storeZoomIn = useEditorStore((state) => state.zoomIn);
  const storeZoomOut = useEditorStore((state) => state.zoomOut);
  const storeResetZoom = useEditorStore((state) => state.resetZoom);

  const effectiveZoom = zoom !== undefined ? zoom : zoomLevel;
  const totalPages = pages.length > 0 ? pages.length : 1;

  // Handle active page update and viewport scrolling
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

  // Hook: Track active page during continuous vertical scrolling
  useViewportScrollObserver({
    containerRef: scrollContainerRef,
    totalPages,
    enabled: viewMode === 'continuous',
    onPageChange: (pageNum) => {
      setCurrentPage(pageNum);
      setActivePageIndex(pageNum - 1);
      onActivePageChange?.(pageNum);
    },
  });

  // Hook: Ctrl + Wheel / Ctrl + Scroll zooming on viewport
  useZoomWheel({
    containerRef: scrollContainerRef,
    enabled: true,
  });

  // Hook: Fit Width and Fit Page zoom calculations (FR-PDF-004, FR-PDF-006)
  const { handleFitWidth, handleFitPage } = usePdfFitZoom({
    containerRef: scrollContainerRef,
    currentPage,
    pages,
    onZoomChange: setZoomLevel,
  });

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
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        zoom={effectiveZoom}
        onZoomChange={setZoomLevel}
        onZoomIn={storeZoomIn}
        onZoomOut={storeZoomOut}
        onResetZoom={storeResetZoom}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        className="w-full max-w-4xl"
      />

      {/* Main Viewport Container with Sidebar */}
      <div className="flex w-full max-w-5xl items-start justify-center gap-4">
        {pages.length > 0 && (
          <PdfThumbnailSidebar
            source={source}
            pages={pages}
            activePage={currentPage}
            onSelectPage={handlePageChange}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
            className="shrink-0"
          />
        )}

        {/* Scrollable Document Canvas Viewport */}
        <div
          ref={scrollContainerRef}
          data-testid="pdf-document-viewport"
          className="relative flex flex-1 flex-col items-center overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-md scroll-smooth max-h-[75vh]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {viewMode === 'continuous' ? (
            <div
              data-testid="continuous-page-list"
              className="flex w-full min-w-full flex-col items-center gap-8 py-2"
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
                    zoom={effectiveZoom}
                    rotation={page.rotation}
                    lazy={true}
                  />
                </div>
              ))}
            </div>
          ) : (
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
                zoom={effectiveZoom}
                rotation={activeSinglePage.rotation}
                lazy={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
