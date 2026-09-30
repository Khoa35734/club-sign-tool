/**
 * Global Editor State Store
 * Reference: docs/SRS.md FR-PDF-004, FR-PDF-005, FR-COORD-001 & .agents/rules/architecture.md Section 4
 */

import { createStore } from './createStore';
import type { EditorState } from './types';
import { clampZoom, zoomIn, zoomOut, DEFAULT_ZOOM } from '@/utils/zoom';

export interface EditorStoreActions {
  setActivePageIndex: (index: number) => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetZoom: () => void;
  setSelectedObjectId: (id: string | null) => void;
  reset: () => void;
}

export type EditorStore = EditorState & EditorStoreActions;

const initialState: EditorState = {
  activePageIndex: 0,
  objects: [],
  selectedObjectId: null,
  zoomLevel: DEFAULT_ZOOM,
  canUndo: false,
  canRedo: false,
};

export const useEditorStore = createStore<EditorStore>((set, get) => ({
  ...initialState,

  setActivePageIndex: (activePageIndex: number): void => {
    set({ activePageIndex: Math.max(0, activePageIndex) });
  },

  setZoomLevel: (zoomLevel: number): void => {
    const clampedZoom = Math.min(4.0, Math.max(0.25, zoomLevel));
    set({ zoomLevel: clampZoom(clampedZoom) });
  },

  zoomIn: (step?: number): void => {
    const current = get().zoomLevel;
    set({ zoomLevel: zoomIn(current, step) });
  },

  zoomOut: (step?: number): void => {
    const current = get().zoomLevel;
    set({ zoomLevel: zoomOut(current, step) });
  },

  resetZoom: (): void => {
    set({ zoomLevel: DEFAULT_ZOOM });
  },

  setSelectedObjectId: (selectedObjectId: string | null): void => {
    set({ selectedObjectId });
  },

  reset: (): void => {
    set({ ...initialState });
  },
}));
