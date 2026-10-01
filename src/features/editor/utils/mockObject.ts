/**
 * Mock Object Generation Utilities
 * Reference: docs/ROADMAP.md Phase 4 (FR-EDITOR-BASE) & docs/SRS.md Section 14
 */

import type { EditorObject } from '@/types/editor';

/**
 * Creates a generic mock placement object (colored rectangle) adhering to the
 * invariant normalized coordinate model [0.0 - 1.0].
 */
export function createMockEditorObject(
  pageIndex = 0,
  partial?: Partial<EditorObject>
): EditorObject {
  return {
    id: partial?.id ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: partial?.type ?? 'signature',
    pageIndex,
    pageNumber: partial?.pageNumber ?? pageIndex + 1,
    x: partial?.x ?? 0.2,
    y: partial?.y ?? 0.2,
    width: partial?.width ?? 0.25,
    height: partial?.height ?? 0.12,
    rotation: partial?.rotation ?? 0,
    opacity: partial?.opacity ?? 0.9,
    zIndex: partial?.zIndex ?? 1,
    color: partial?.color ?? '#4f46e5',
    textPayload: partial?.textPayload ?? 'MOCK OBJECT',
    ...partial,
  };
}
