/**
 * Generic Mock Placement Object Component
 * Reference: docs/SRS.md Section 13.2, 14 & docs/ROADMAP.md Phase 4 (FR-EDITOR-BASE)
 * Rules: .agents/rules/pdf-editor.md Section 1, 2
 */

import { useCallback, type JSX } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { EditorObject } from '@/types/editor';
import { normalizedToScreen } from '@/utils/coordinates';

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
}

export function MockEditorObject({
  object,
  stageWidth,
  stageHeight,
  isSelected = false,
  onSelect,
}: MockEditorObjectProps): JSX.Element | null {
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
      e.cancelBubble = true;
      onSelect?.(object.id);
    },
    [object.id, onSelect]
  );

  const handleMouseEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      const stage = e.target.getStage();
      if (stage) {
        stage.container().style.cursor = 'pointer';
      }
    },
    []
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

  if (stageWidth <= 0 || stageHeight <= 0) {
    return null;
  }

  // Calculate screen coordinates dynamically from normalized coordinates (0.0 - 1.0)
  const screenCoords = normalizedToScreen(
    {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    },
    stageWidth,
    stageHeight
  );

  const labelText = object.textPayload ?? 'MOCK OBJECT';
  const fontSize = Math.max(9, Math.min(14, Math.round(screenCoords.height * 0.3)));

  return (
    <Group
      id={object.id}
      name="mock-editor-object"
      x={screenCoords.x}
      y={screenCoords.y}
      rotation={object.rotation ?? 0}
      opacity={object.opacity ?? 1.0}
      onClick={handleClick}
      onTap={handleClick}
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
  );
}
