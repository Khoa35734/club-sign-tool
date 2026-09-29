/**
 * Native Document File Picker Service
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002 & docs/ARCHITECTURE.md Section 3
 */

import { safeInvoke } from '@/services/tauri';
import { isSupportedDocument } from '@/utils/file';

/**
 * Triggers the native Windows File Picker dialog restricted to .pdf, .docx, and .doc.
 * Returns the chosen file path, or null if cancelled by the user.
 */
export async function openDocumentDialog(): Promise<string | null> {
  const result = await safeInvoke<string | null>('open_file_dialog');

  if (!result.ok) {
    throw new Error(result.error.message || 'Không thể mở hộp thoại chọn tệp.');
  }

  const selectedPath = result.data;
  if (!selectedPath) {
    return null; // User cancelled
  }

  if (!isSupportedDocument(selectedPath)) {
    throw new Error(
      `Định dạng tệp không được hỗ trợ: "${selectedPath}". Chỉ chấp nhận .pdf, .docx, .doc.`
    );
  }

  return selectedPath;
}
