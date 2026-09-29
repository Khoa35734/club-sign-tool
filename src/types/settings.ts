/**
 * Local Settings and App Configuration Types
 * Reference: docs/SRS.md Section 18.2 (config.json)
 */

import type { RecentDocument } from './document';

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  language: 'vi-VN' | 'en-US';
  rememberLastOpenedFolder: boolean;
  lastOpenedFolderPath: string;
  defaultOutputFolder: string;
  libreOfficeExecutablePath: string;
  tempDirectoryPath: string;
  autoCleanupTempOnExit: boolean;
}

export interface EditorDefaults {
  defaultSignatureOpacity: number;
  defaultStampOpacity: number;
  defaultSignatureId: string;
  defaultStampId: string;
  defaultLocationPrefix: string;
  defaultFontFamily: string;
  defaultFontSizePt: number;
}

export interface AppConfig {
  version: string;
  appSettings: AppSettings;
  editorDefaults: EditorDefaults;
  recentDocuments: RecentDocument[];
}
