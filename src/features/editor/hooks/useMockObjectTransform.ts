/**
 * Hook for managing Konva object selection, drag-and-drop, and Transformer controls.
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 4 (FR-EDITOR-BASE)
 * Rules: .agents/rules/pdf-editor.md Section 1, 2, 4 & .agents/rules/architecture.md Section 2
 */

import { useRef, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import type { EditorObject } from '@/types/editor';
import { screenToNormalized } from '@/utils/coordinates';

export interface UseMockObjectTransformProps {
  object: EditorObject;
  stageWidth: number;
  stageHeight: number;
  screenCoords: { x: number; y: number; width: number; height: number };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onTransformEnd?: (id: string, updates: Partial<EditorObject>) => void;
}

export interface UseMockObjectTransformReturn {
  groupRef: React.RefObject<Konva.Group | null>;
  trRef: React.RefObject<Konva.Transformer | null>;
  handleClick: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  handleDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleTransformEnd: () => void;
  handleMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  boundBoxFunc: (oldBox: Konva.Box, newBox: Konva.Box) => Konva.Box;
}

export function useMockObjectTransform({
  object,
  stageWidth,
  stageHeight,
  screenCoords,
  isSelected = false,
  onSelect,
  onTransformEnd,
}: UseMockObjectTransformProps): UseMockObjectTransformReturn {
  const groupRef = useRef<Konva.Group | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  // Synchronize Konva Transformer node attachment to the selected group
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    isSelected,
    screenCoords.x,
    screenCoords.y,
    screenCoords.width,
    screenCoords.height,
    object.rotation,
  ]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
      e.cancelBubble = true;
      onSelect?.(object.id);
    },
    [object.id, onSelect]
  );

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>): void => {
      e.cancelBubble = true;
      onSelect?.(object.id);
    },
    [object.id, onSelect]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>): void => {
      const node = e.target;
      const newScreenX = node.x();
      const newScreenY = node.y();

      // Convert new screen coordinates back to normalized space [0.0 - 1.0]
      const normalized = screenToNormalized(
        {
          x: newScreenX,
          y: newScreenY,
          width: screenCoords.width,
          height: screenCoords.height,
        },
        stageWidth,
        stageHeight,
        { clamp: true, round: true }
      );

      onTransformEnd?.(object.id, {
        x: normalized.x,
        y: normalized.y,
      });
    },
    [object.id, screenCoords.width, screenCoords.height, stageWidth, stageHeight, onTransformEnd]
  );

  const handleTransformEnd = useCallback((): void => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 on the Konva node after computing dimensions to prevent compound scaling
    node.scaleX(1);
    node.scaleY(1);

    const rawWidth = Math.max(10, screenCoords.width * scaleX);
    const rawHeight = Math.max(10, screenCoords.height * scaleY);
    const newX = node.x();
    const newY = node.y();
    const rawRotation = node.rotation();
    const normalizedRotation = Math.round(((rawRotation % 360) + 360) % 360);

    // Convert new bounds back to normalized space [0.0 - 1.0]
    const normalized = screenToNormalized(
      {
        x: newX,
        y: newY,
        width: rawWidth,
        height: rawHeight,
      },
      stageWidth,
      stageHeight,
      { clamp: true, round: true }
    );

    onTransformEnd?.(object.id, {
      x: normalized.x,
      y: normalized.y,
      width: normalized.width,
      height: normalized.height,
      rotation: normalizedRotation,
    });
  }, [
    object.id,
    screenCoords.width,
    screenCoords.height,
    stageWidth,
    stageHeight,
    onTransformEnd,
  ]);

  const handleMouseEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      const stage = e.target.getStage();
      if (stage && !object.isLocked) {
        stage.container().style.cursor = isSelected ? 'move' : 'pointer';
      }
    },
    [object.isLocked, isSelected]
  );

  const handleMouseLeave = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      const stage = e.target.getStage();
      if (stage) {
        stage.container().style.cursor = 'default';
      }
    },
    []
  );

  const boundBoxFunc = useCallback((oldBox: Konva.Box, newBox: Konva.Box): Konva.Box => {
    // Prevent inverted or miniature dimensions (< 10px)
    if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
      return oldBox;
    }
    return newBox;
  }, []);

  return {
    groupRef,
    trRef,
    handleClick,
    handleDragStart,
    handleDragEnd,
    handleTransformEnd,
    handleMouseEnter,
    handleMouseLeave,
    boundBoxFunc,
  };
}
