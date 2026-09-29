/**
 * Document File Validation Service
 * Reference: docs/SRS.md FR-FILE-ERR, EC-001, EC-002 & .agents/rules/architecture.md
 */

import { safeInvoke } from '@/services/tauri';
import { isSupportedDocument } from '@/utils/file';

export interface DocumentValidationResult {
  path: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
}

/**
 * Validates a document file by checking existence, readability, size (> 0 bytes),
 * and magic byte header signatures via native Tauri command.
 *
 * Throws a localized, user-friendly Error message if validation fails.
 */
export async function validateDocumentFile(
  filePath: string
): Promise<DocumentValidationResult> {
  const cleanPath = filePath.trim();
  if (!cleanPath) {
    throw new Error('Đường dẫn tệp không được để trống.');
  }

  if (!isSupportedDocument(cleanPath)) {
    throw new Error(
      `Định dạng tệp không được hỗ trợ: "${cleanPath}". Chỉ chấp nhận .pdf, .docx, .doc.`
    );
  }

  const result = await safeInvoke<DocumentValidationResult>(
    'validate_document_file',
    { path: cleanPath }
  );

  if (!result.ok) {
    throw new Error(result.error.message || 'Tệp tin không hợp lệ hoặc không thể đọc.');
  }

  return result.data;
}
