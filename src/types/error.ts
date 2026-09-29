/**
 * Centralized Application Error Types
 * Typed representation of Rust AppError from src-tauri/src/errors/mod.rs
 */

export type AppError =
  | { type: 'IoError'; message: string }
  | { type: 'ConversionError'; message: string }
  | { type: 'PdfError'; message: string }
  | { type: 'InvalidPath'; message: string }
  | { type: 'InvalidFile'; message: string }
  | { type: 'LibreOfficeNotFound'; message?: string }
  | { type: 'Cancelled'; message?: string };
