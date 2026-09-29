/**
 * Asset Management Types
 * Reference: docs/SRS.md Section 10.5 & 18.1
 */

export type AssetType = 'signature' | 'stamp';

export interface AssetMetadata {
  id: string;
  name: string;
  type: AssetType;
  filePath: string;
  createdAt: number;
  isDefault: boolean;
  defaultWidth: number;
  defaultHeight: number;
  defaultOpacity: number;
}

export interface AssetsCatalog {
  version: string;
  signatures: AssetMetadata[];
  stamps: AssetMetadata[];
}
