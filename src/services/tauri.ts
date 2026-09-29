/**
 * Tauri IPC Client Bridge
 * Reference: docs/ARCHITECTURE.md Section 3 & .agents/rules/architecture.md Section 2
 */

import { invoke } from '@tauri-apps/api/core';
import type { AppError } from '@/types';

/**
 * Type guard to check if an unknown error object conforms to the AppError discriminated union
 */
export function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as Record<string, unknown>;
  return (
    typeof candidate.type === 'string' &&
    [
      'IoError',
      'ConversionError',
      'PdfError',
      'InvalidPath',
      'LibreOfficeNotFound',
      'Cancelled',
    ].includes(candidate.type)
  );
}

/**
 * Normalizes an unknown caught error into a typed AppError
 */
export function normalizeAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return { type: 'IoError', message: error.message };
  }
  if (typeof error === 'string') {
    return { type: 'IoError', message: error };
  }
  return { type: 'IoError', message: 'An unknown error occurred' };
}

/**
 * Safe wrapper around Tauri's invoke command
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> {
  try {
    const result = await invoke<T>(command, args);
    return { ok: true, data: result };
  } catch (err: unknown) {
    return { ok: false, error: normalizeAppError(err) };
  }
}
