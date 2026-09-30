/**
 * PDF Page Thumbnails Vertical Sidebar Component
 * Reference: docs/SRS.md FR-PDF-002, FR-PDF-003 & .agents/rules/pdf-editor.md Section 4
 */

import { useEffect, useRef, type JSX } from 'react';
import type { PageDimensions } from '@/types/document';
import { PdfPageThumbnail } from './PdfPageThumbnail';

export interface PdfThumbnailSidebarProps {
  source: string;
  pages: PageDimensions[];
  activePage: number;
  onSelectPage: (pageNumber: number) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

export function PdfThumbnailSidebar({
  source,
  pages,
  activePage,
  onSelectPage,
  isOpen = true,
  onToggleOpen,
  className = '',
}: PdfThumbnailSidebarProps): JSX.Element {
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active thumbnail into view when activePage changes
  useEffect(() => {
    if (!isOpen || !listRef.current) {
      return;
    }

    const activeEl = listRef.current.querySelector(
      `[data-testid="thumbnail-page-${activePage}"]`
    );

    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activePage, isOpen]);

  if (!isOpen) {
    return (
      <div
        data-testid="pdf-thumbnail-sidebar-collapsed"
        className={`flex flex-col items-center py-2 ${className}`}
      >
        <button
          type="button"
          data-testid="sidebar-expand-button"
          onClick={onToggleOpen}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-xs font-medium text-slate-300 shadow hover:bg-slate-700 hover:text-white transition-colors"
          title="Mở thanh thu nhỏ các trang"
          aria-label="Mở thanh thu nhỏ các trang"
        >
          <span>📑</span>
          <span className="hidden sm:inline">Trang ({pages.length})</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      data-testid="pdf-thumbnail-sidebar"
      data-active-page={activePage}
      aria-label="Thanh thu nhỏ các trang"
      className={`flex w-36 sm:w-44 flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md transition-all ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <span>📑</span>
          <span>Trang</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
            {pages.length}
          </span>
        </div>

        {onToggleOpen && (
          <button
            type="button"
            data-testid="sidebar-collapse-button"
            onClick={onToggleOpen}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Thu gọn thanh trang"
            aria-label="Thu gọn thanh trang"
          >
            ✕
          </button>
        )}
      </div>

      {/* Thumbnails Scrollable Strip */}
      <div
        ref={listRef}
        data-testid="thumbnail-list-container"
        className="flex max-h-[70vh] flex-col items-center gap-3 overflow-y-auto overflow-x-hidden p-3 scroll-smooth"
      >
        {pages.map((page) => (
          <PdfPageThumbnail
            key={page.pageNumber}
            source={source}
            pageNumber={page.pageNumber}
            widthPt={page.widthPt}
            heightPt={page.heightPt}
            rotation={page.rotation}
            isActive={page.pageNumber === activePage}
            onSelect={onSelectPage}
          />
        ))}
      </div>
    </aside>
  );
}
