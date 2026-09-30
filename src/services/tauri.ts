/**
 * Tauri IPC Client Bridge
 * Reference: docs/ARCHITECTURE.md Section 3 & .agents/rules/architecture.md Section 2
 */

import type { AppError } from '@/types';

/**
 * Checks whether the app is running inside a Tauri webview context.
 */
function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
  );
}

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
      'InvalidFile',
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
 * Safe wrapper around Tauri's invoke command.
 * Uses a dynamic import so the module can load safely outside the Tauri webview.
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> {
  if (!isTauriEnvironment()) {
    return {
      ok: false,
      error: {
        type: 'IoError',
        message:
          'Ứng dụng không chạy trong môi trường Tauri. Vui lòng khởi chạy bằng lệnh "npm run tauri dev".',
      },
    };
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<T>(command, args);
    return { ok: true, data: result };
  } catch (err: unknown) {
    return { ok: false, error: normalizeAppError(err) };
  }
}
