/**
 * Custom hook to handle Ctrl + Wheel / Ctrl + Scroll zooming on PDF viewport
 * Reference: docs/SRS.md FR-PDF-004
 */

import { useEffect, type RefObject } from 'react';
import { useEditorStore } from '@/stores';
import { clampZoom, ZOOM_STEP } from '@/utils/zoom';

export interface UseZoomWheelOptions {
  containerRef: RefObject<HTMLElement | null>;
  step?: number;
  enabled?: boolean;
}

export function useZoomWheel({
  containerRef,
  step = ZOOM_STEP,
  enabled = true,
}: UseZoomWheelOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (e: WheelEvent): void => {
      // Only zoom when Ctrl or Meta (Command on macOS) key is held
      const isZoomModifier = e.ctrlKey || e.metaKey;
      if (!isZoomModifier) {
        return;
      }

      e.preventDefault();

      const currentZoom = useEditorStore.getState().zoomLevel;
      // Scroll up (deltaY < 0) zooms in, scroll down (deltaY > 0) zooms out
      const delta = e.deltaY < 0 ? step : -step;
      const nextZoom = clampZoom(currentZoom + delta);

      if (nextZoom !== currentZoom) {
        useEditorStore.getState().setZoomLevel(nextZoom);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, step, enabled]);
}
