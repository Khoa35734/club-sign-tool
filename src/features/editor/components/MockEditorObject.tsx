/**
 * Generic Mock Placement Object Component with Drag & Transform Controls
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 4 (FR-EDITOR-BASE)
 * Rules: .agents/rules/pdf-editor.md Section 1, 2, 4 & .agents/rules/architecture.md Section 2
 */

import type { JSX } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import type { EditorObject } from '@/types/editor';
import { normalizedToScreen } from '@/utils/coordinates';
import { useMockObjectTransform } from '../hooks/useMockObjectTransform';

export interface MockEditorObjectProps {
  /** The editor object adhering to the invariant normalized coordinate model */
  object: EditorObject;
  /** Current display width of the page stage in screen pixels */
  stageWidth: number;
  /** Current display height of the page stage in screen pixels */
  stageHeight: number;
  /** Whether this object is currently selected */
  isSelected?: boolean;
  /** Callback fired when user clicks or taps this object */
  onSelect?: (id: string) => void;
  /** Callback fired when dragging or transformation completes with new normalized coordinates */
  onTransformEnd?: (id: string, updates: Partial<EditorObject>) => void;
}

export function MockEditorObject({
  object,
  stageWidth,
  stageHeight,
  isSelected = false,
  onSelect,
  onTransformEnd,
}: MockEditorObjectProps): JSX.Element | null {
  // Calculate screen coordinates dynamically from normalized coordinates (0.0 - 1.0)
  const screenCoords =
    stageWidth > 0 && stageHeight > 0
      ? normalizedToScreen(
          {
            x: object.x,
            y: object.y,
            width: object.width,
            height: object.height,
          },
          stageWidth,
          stageHeight
        )
      : { x: 0, y: 0, width: 0, height: 0 };

  const {
    groupRef,
    trRef,
    handleClick,
    handleDragStart,
    handleDragEnd,
    handleTransformEnd,
    handleMouseEnter,
    handleMouseLeave,
    boundBoxFunc,
  } = useMockObjectTransform({
    object,
    stageWidth,
    stageHeight,
    screenCoords,
    isSelected,
    onSelect,
    onTransformEnd,
  });

  if (stageWidth <= 0 || stageHeight <= 0) {
    return null;
  }

  const labelText = object.textPayload ?? 'MOCK OBJECT';
  const fontSize = Math.max(9, Math.min(14, Math.round(screenCoords.height * 0.3)));
  const isDraggable = !object.isLocked;

  return (
    <>
      <Group
        ref={groupRef}
        id={object.id}
        name="mock-editor-object"
        x={screenCoords.x}
        y={screenCoords.y}
        rotation={object.rotation ?? 0}
        opacity={object.opacity ?? 1.0}
        draggable={isDraggable}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Colored Mock Rectangle */}
        <Rect
          x={0}
          y={0}
          width={screenCoords.width}
          height={screenCoords.height}
          fill={object.color ?? '#4f46e5'}
          stroke={isSelected ? '#38bdf8' : '#312e81'}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={4}
          shadowColor={isSelected ? '#38bdf8' : '#000000'}
          shadowBlur={isSelected ? 8 : 4}
          shadowOpacity={isSelected ? 0.5 : 0.25}
          shadowOffset={{ x: 0, y: 2 }}
        />

        {/* Label Text Overlay */}
        <Text
          x={0}
          y={0}
          width={screenCoords.width}
          height={screenCoords.height}
          text={labelText}
          align="center"
          verticalAlign="middle"
          fill="#ffffff"
          fontSize={fontSize}
          fontStyle="bold"
          listening={false}
        />
      </Group>

      {/* Konva Transformer Controls for Selected Object */}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={!object.isLocked}
          enabledAnchors={
            object.isLocked
              ? []
              : [
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'middle-left',
                  'middle-right',
                  'top-center',
                  'bottom-center',
                ]
          }
          boundBoxFunc={boundBoxFunc}
          keepRatio={object.aspectRatioLocked ?? false}
          anchorSize={8}
          anchorCornerRadius={2}
          borderStroke="#38bdf8"
          borderDash={[3, 3]}
          borderStrokeWidth={1.5}
          anchorStroke="#38bdf8"
          anchorFill="#ffffff"
          anchorStrokeWidth={1.5}
        />
      )}
    </>
  );
}
