/**
 * Global Document State Store
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002 & .agents/rules/architecture.md Section 4
 */

import { createStore } from './createStore';
import type { DocumentState } from './types';
import type { DocumentMeta } from '@/types/document';
import { createInitialDocumentMeta } from '@/utils/file';

export interface DocumentStoreActions {
  setActiveDocument: (doc: DocumentMeta | null) => void;
  setFilePath: (filePath: string, fileSizeBytes?: number) => void;
  setLoading: (isLoading: boolean) => void;
  setDirty: (isDirty: boolean) => void;
  reset: () => void;
}

export type DocumentStore = DocumentState & DocumentStoreActions;

const initialState: DocumentState = {
  activeDocument: null,
  isLoading: false,
  isDirty: false,
};

export const useDocumentStore = createStore<DocumentStore>((set) => ({
  ...initialState,

  setActiveDocument: (activeDocument: DocumentMeta | null): void => {
    set({ activeDocument, isLoading: false });
  },

  setFilePath: (filePath: string, fileSizeBytes = 0): void => {
    const meta = createInitialDocumentMeta(filePath, fileSizeBytes);
    set({
      activeDocument: meta,
      isLoading: false,
      isDirty: false,
    });
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  setDirty: (isDirty: boolean): void => {
    set({ isDirty });
  },

  reset: (): void => {
    set({ ...initialState });
  },
}));
