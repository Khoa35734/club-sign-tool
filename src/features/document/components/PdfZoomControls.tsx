/**
 * PDF Viewport Zoom Controls Component
 * Reference: docs/SRS.md FR-PDF-004 (Zoom 25% to 400%, buttons, slider, reset)
 */

import { type JSX, type ChangeEvent } from 'react';
import { Button } from '@/components/Button';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  clampZoom,
  formatZoom,
  zoomIn,
  zoomOut,
} from '@/utils/zoom';

export interface PdfZoomControlsProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  showSlider?: boolean;
  className?: string;
}

export function PdfZoomControls({
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showSlider = false,
  className = '',
}: PdfZoomControlsProps): JSX.Element {
  const currentZoom = clampZoom(zoom);
  const isMinZoom = currentZoom <= MIN_ZOOM;
  const isMaxZoom = currentZoom >= MAX_ZOOM;

  const handleZoomOut = (): void => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      onZoomChange(zoomOut(currentZoom));
    }
  };

  const handleZoomIn = (): void => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      onZoomChange(zoomIn(currentZoom));
    }
  };

  const handleResetZoom = (): void => {
    if (onResetZoom) {
      onResetZoom();
    } else {
      onZoomChange(DEFAULT_ZOOM);
    }
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onZoomChange(clampZoom(val));
    }
  };

  return (
    <div
      data-testid="pdf-zoom-controls"
      className={`flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/60 p-1 text-xs ${className}`}
    >
      {/* Zoom Out Button */}
      <Button
        variant="ghost"
        size="sm"
        data-testid="zoom-out-button"
        onClick={handleZoomOut}
        disabled={isMinZoom}
        title="Thu nhỏ (-)"
        aria-label="Thu nhỏ"
        className="!p-1 text-slate-300 hover:text-white disabled:text-slate-600 font-mono text-sm leading-none h-6 w-6 flex items-center justify-center"
      >
        −
      </Button>

      {/* Optional Range Slider */}
      {showSlider && (
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={currentZoom}
          onChange={handleSliderChange}
          data-testid="zoom-slider"
          aria-label="Thanh trượt thu phóng"
          className="h-1.5 w-16 cursor-pointer accent-indigo-500 bg-slate-700 rounded-lg appearance-none"
        />
      )}

      {/* Zoom Percentage / Reset Button */}
      <button
        type="button"
        data-testid="zoom-level-indicator"
        onClick={handleResetZoom}
        title="Bấm để đặt lại 100%"
        aria-label={`Thu phóng ${formatZoom(currentZoom)}, bấm để đặt lại 100%`}
        className="min-w-[44px] rounded px-1.5 py-0.5 text-center font-mono text-xs text-slate-200 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
      >
        {formatZoom(currentZoom)}
      </button>

      {/* Zoom In Button */}
      <Button
        variant="ghost"
        size="sm"
        data-testid="zoom-in-button"
        onClick={handleZoomIn}
        disabled={isMaxZoom}
        title="Phóng to (+)"
        aria-label="Phóng to"
        className="!p-1 text-slate-300 hover:text-white disabled:text-slate-600 font-mono text-sm leading-none h-6 w-6 flex items-center justify-center"
      >
        +
      </Button>
    </div>
  );
}
