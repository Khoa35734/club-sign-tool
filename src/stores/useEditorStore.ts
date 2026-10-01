/**
 * Global Editor State Store
 * Reference: docs/SRS.md FR-PDF-004, FR-PDF-005, FR-COORD-001 & .agents/rules/architecture.md Section 4
 */

import { createStore } from './createStore';
import type { EditorState } from './types';
import { clampZoom, zoomIn, zoomOut, DEFAULT_ZOOM } from '@/utils/zoom';

import type { EditorObject } from '@/types';

export interface EditorStoreActions {
  setActivePageIndex: (index: number) => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetZoom: () => void;
  setSelectedObjectId: (id: string | null) => void;
  addObject: (object: EditorObject) => void;
  updateObject: (id: string, updates: Partial<EditorObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: EditorObject[]) => void;
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

  addObject: (object: EditorObject): void => {
    set((state) => ({
      objects: [...state.objects, object],
    }));
  },

  updateObject: (id: string, updates: Partial<EditorObject>): void => {
    set((state) => ({
      objects: state.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
    }));
  },

  removeObject: (id: string): void => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
  },

  setObjects: (objects: EditorObject[]): void => {
    set({ objects });
  },

  reset: (): void => {
    set({ ...initialState });
  },
}));
