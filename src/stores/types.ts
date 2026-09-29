/**
 * Store State Contracts and Types
 * Reference: docs/ARCHITECTURE.md Section 3 & .agents/rules/architecture.md Section 4
 */

import type {
  CanvasPlacementObject,
  DocumentMeta,
  AssetMetadata,
  AppSettings,
  EditorDefaults,
} from '@/types';

export interface DocumentState {
  activeDocument: DocumentMeta | null;
  isLoading: boolean;
  isDirty: boolean;
}

export interface EditorState {
  activePageIndex: number;
  objects: CanvasPlacementObject[];
  selectedObjectId: string | null;
  zoomLevel: number; // 0.25 to 4.0 (1.0 = 100%)
  canUndo: boolean;
  canRedo: boolean;
}

export interface AssetState {
  signatures: AssetMetadata[];
  stamps: AssetMetadata[];
  defaultSignatureId: string | null;
  defaultStampId: string | null;
}

export interface SettingsState {
  settings: AppSettings;
  defaults: EditorDefaults;
}
