/**
 * Transparent Konva.js Editor Overlay Stage
 * Reference: docs/SRS.md Section 14, docs/ROADMAP.md Phase 4 (FR-EDITOR-BASE)
 * Rules: .agents/rules/pdf-editor.md Section 4 & .agents/rules/architecture.md Section 2, 3
 */

import { useCallback, type JSX, type ReactNode, type Ref } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '@/stores';

export interface PdfEditorOverlayProps {
  /** 1-based page number */
  pageNumber: number;
  /** 0-based page index (defaults to pageNumber - 1) */
  pageIndex?: number;
  /** Display width in screen pixels (matching PDF canvas width) */
  width: number;
  /** Display height in screen pixels (matching PDF canvas height) */
  height: number;
  /** Current viewport zoom factor */
  zoom?: number;
  /** Optional custom class name for overlay container */
  className?: string;
  /** Konva shapes or custom overlay nodes rendered inside Konva Layer */
  children?: ReactNode;
  /** Ref forwarded to the Konva Stage instance */
  stageRef?: Ref<Konva.Stage>;
  /** Callback fired when user clicks/taps on empty stage background */
  onDeselect?: () => void;
  /** Direct mouse down event handler on Konva Stage */
  onStageMouseDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  /** Custom test ID attribute */
  testId?: string;
}

export function PdfEditorOverlay({
  pageNumber,
  pageIndex,
  width,
  height,
  zoom = 1.0,
  className = '',
  children,
  stageRef,
  onDeselect,
  onStageMouseDown,
  testId = 'pdf-editor-overlay',
}: PdfEditorOverlayProps): JSX.Element {
  const resolvedPageIndex = pageIndex !== undefined ? pageIndex : Math.max(0, pageNumber - 1);
  const setSelectedObjectId = useEditorStore((state) => state.setSelectedObjectId);
  const setActivePageIndex = useEditorStore((state) => state.setActivePageIndex);

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
      // Sync active page on user interaction with this page's overlay
      setActivePageIndex(resolvedPageIndex);

      // Deselect when clicking directly on the empty stage background
      const isDirectStageClick = e.target === e.target.getStage();
      if (isDirectStageClick) {
        if (onDeselect) {
          onDeselect();
        } else {
          setSelectedObjectId(null);
        }
      }

      onStageMouseDown?.(e);
    },
    [resolvedPageIndex, setActivePageIndex, onDeselect, setSelectedObjectId, onStageMouseDown]
  );

  return (
    <div
      data-testid={testId}
      data-page-number={pageNumber}
      data-page-index={resolvedPageIndex}
      data-width={width}
      data-height={height}
      data-zoom={zoom}
      className={`absolute inset-0 pointer-events-auto select-none ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        style={{
          backgroundColor: 'transparent',
        }}
      >
        <Layer data-testid="pdf-editor-overlay-layer">{children}</Layer>
      </Stage>
    </div>
  );
}
