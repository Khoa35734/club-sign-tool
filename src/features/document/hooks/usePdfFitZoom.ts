/**
 * Hook for Fit Page and Fit Width zoom calculations
 * Reference: docs/SRS.md FR-PDF-004, FR-PDF-006
 */

import { useCallback, type RefObject } from 'react';
import type { PageDimensions } from '@/types/document';
import { calculateFitWidthZoom, calculateFitPageZoom } from '@/utils/zoom';

export interface UsePdfFitZoomOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  currentPage: number;
  pages: PageDimensions[];
  onZoomChange: (zoom: number) => void;
}

export interface UsePdfFitZoomResult {
  handleFitWidth: () => void;
  handleFitPage: () => void;
}

export function usePdfFitZoom({
  containerRef,
  currentPage,
  pages,
  onZoomChange,
}: UsePdfFitZoomOptions): UsePdfFitZoomResult {
  const getTargetPage = useCallback((): PageDimensions | undefined => {
    return pages.find((p) => p.pageNumber === currentPage) ?? pages[0];
  }, [currentPage, pages]);

  const handleFitWidth = useCallback((): void => {
    const container = containerRef.current;
    const targetPage = getTargetPage();
    if (!container || !targetPage) {
      return;
    }
    const fitZoom = calculateFitWidthZoom(targetPage, container.clientWidth);
    onZoomChange(fitZoom);
  }, [containerRef, getTargetPage, onZoomChange]);

  const handleFitPage = useCallback((): void => {
    const container = containerRef.current;
    const targetPage = getTargetPage();
    if (!container || !targetPage) {
      return;
    }
    const fitZoom = calculateFitPageZoom(
      targetPage,
      container.clientWidth,
      container.clientHeight
    );
    onZoomChange(fitZoom);
  }, [containerRef, getTargetPage, onZoomChange]);

  return {
    handleFitWidth,
    handleFitPage,
  };
}
