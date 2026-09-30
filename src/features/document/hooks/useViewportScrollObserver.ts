/**
 * Custom hook to track active PDF page during continuous vertical scrolling
 * Reference: docs/SRS.md FR-PDF-005 & .agents/rules/pdf-editor.md Section 4
 */

import { useEffect, type RefObject } from 'react';

export interface UseViewportScrollObserverOptions {
  containerRef: RefObject<HTMLElement | null>;
  totalPages: number;
  enabled: boolean;
  onPageChange: (pageNumber: number) => void;
}

export function useViewportScrollObserver({
  containerRef,
  totalPages,
  enabled,
  onPageChange,
}: UseViewportScrollObserverOptions): void {
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const container = containerRef.current;
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
              onPageChange(pageNum);
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

    for (let i = 1; i <= totalPages; i++) {
      const el = document.getElementById(`pdf-page-${i}`);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [containerRef, totalPages, enabled, onPageChange]);
}
