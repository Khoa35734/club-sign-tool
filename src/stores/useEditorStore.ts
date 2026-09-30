/**
 * Global Editor State Store
 * Reference: docs/SRS.md FR-PDF-005, FR-COORD-001 & .agents/rules/architecture.md Section 4
 */

import { createStore } from './createStore';
import type { EditorState } from './types';

export interface EditorStoreActions {
  setActivePageIndex: (index: number) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedObjectId: (id: string | null) => void;
  reset: () => void;
}

export type EditorStore = EditorState & EditorStoreActions;

const initialState: EditorState = {
  activePageIndex: 0,
  objects: [],
  selectedObjectId: null,
  zoomLevel: 1.0,
  canUndo: false,
  canRedo: false,
};

export const useEditorStore = createStore<EditorStore>((set) => ({
  ...initialState,

  setActivePageIndex: (activePageIndex: number): void => {
    set({ activePageIndex: Math.max(0, activePageIndex) });
  },

  setZoomLevel: (zoomLevel: number): void => {
    const clampedZoom = Math.min(4.0, Math.max(0.25, zoomLevel));
    set({ zoomLevel: clampedZoom });
  },

  setSelectedObjectId: (selectedObjectId: string | null): void => {
    set({ selectedObjectId });
  },

  reset: (): void => {
    set({ ...initialState });
  },
}));
