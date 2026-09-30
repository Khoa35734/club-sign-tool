/**
 * PDF Viewport Navigation, Mode & Zoom Toolbar Component
 * Reference: docs/SRS.md FR-PDF-003, FR-PDF-004, FR-PDF-005
 */

import { useState, type JSX, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { PdfZoomControls } from './PdfZoomControls';

export type ViewportMode = 'continuous' | 'single';

export interface PdfViewportToolbarProps {
  currentPage: number;
  totalPages: number;
  viewMode: ViewportMode;
  onPageChange: (newPage: number) => void;
  onViewModeChange: (newMode: ViewportMode) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  zoom?: number;
  onZoomChange?: (newZoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
  className?: string;
}

export function PdfViewportToolbar({
  currentPage,
  totalPages,
  viewMode,
  onPageChange,
  onViewModeChange,
  isSidebarOpen = true,
  onToggleSidebar,
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onFitPage,
  className = '',
}: PdfViewportToolbarProps): JSX.Element {
  const [pageInput, setPageInput] = useState(String(currentPage));

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPageInput(e.target.value);
  };

  const handleInputSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div
      data-testid="pdf-viewport-toolbar"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-slate-800/90 px-4 py-2 shadow-md backdrop-blur-sm ${className}`}
    >
      {/* Left controls: Sidebar toggle & View Mode */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            data-testid="toolbar-sidebar-toggle"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
              isSidebarOpen
                ? 'border-indigo-500/50 bg-indigo-600/20 text-indigo-300'
                : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
            title={isSidebarOpen ? 'Ẩn thanh trang thu nhỏ' : 'Hiện thanh trang thu nhỏ'}
            aria-label="Chuyển đổi thanh trang thu nhỏ"
          >
            <span>📑</span>
            <span className="hidden sm:inline">Trang</span>
          </button>
        )}

        <div className="flex items-center gap-1 rounded-md bg-slate-900/60 p-1 border border-slate-700/50">
          <button
            type="button"
            data-testid="viewport-mode-continuous"
            onClick={() => onViewModeChange('continuous')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'continuous'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chế độ cuộn dọc liên tục"
          >
            <span>📜</span>
            <span className="hidden sm:inline">Cuộn liên tục</span>
          </button>
          <button
            type="button"
            data-testid="viewport-mode-single"
            onClick={() => onViewModeChange('single')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chế độ xem từng trang"
          >
            <span>📄</span>
            <span className="hidden sm:inline">Từng trang</span>
          </button>
        </div>
      </div>

      {/* Center controls: Zoom Controls */}
      {zoom !== undefined && onZoomChange && (
        <PdfZoomControls
          zoom={zoom}
          onZoomChange={onZoomChange}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          onFitWidth={onFitWidth}
          onFitPage={onFitPage}
        />
      )}

      {/* Right controls: Page Navigation & Indicator */}
      <div
        data-testid="viewport-page-indicator"
        className="flex items-center gap-2 text-xs text-slate-300"
      >
        <Button
          variant="ghost"
          size="sm"
          data-testid="viewport-prev-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="Trang trước"
          className="!p-1.5 text-slate-300 hover:text-white disabled:text-slate-600"
        >
          ◀
        </Button>

        <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5">
          <span>Trang</span>
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={handleInputChange}
            onBlur={() => setPageInput(String(currentPage))}
            className="w-10 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            aria-label="Số trang hiện tại"
          />
          <span className="text-slate-400">/ {totalPages}</span>
        </form>

        <Button
          variant="ghost"
          size="sm"
          data-testid="viewport-next-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="Trang kế tiếp"
          className="!p-1.5 text-slate-300 hover:text-white disabled:text-slate-600"
        >
          ▶
        </Button>
      </div>
    </div>
  );
}
