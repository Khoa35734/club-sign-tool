/**
 * Document File Reader Service
 * Reference: docs/SRS.md FR-PDF-001, FR-FILE-001 & .agents/rules/architecture.md
 */

import { safeInvoke } from '@/services/tauri';
import { isSupportedDocument } from '@/utils/file';

/**
 * Reads the binary bytes of a local document file via the native Tauri command.
 * Returns a Uint8Array containing the file's raw bytes.
 *
 * Throws a localized, user-friendly Error message if reading fails.
 */
export async function readDocumentBytes(filePath: string): Promise<Uint8Array> {
  const cleanPath = filePath.trim();
  if (!cleanPath) {
    throw new Error('Đường dẫn tệp không được để trống.');
  }

  if (!isSupportedDocument(cleanPath)) {
    throw new Error(
      `Định dạng tệp không được hỗ trợ: "${cleanPath}". Chỉ chấp nhận .pdf, .docx, .doc.`
    );
  }

  const result = await safeInvoke<number[] | Uint8Array>('read_document_bytes', {
    path: cleanPath,
  });

  if (!result.ok) {
    throw new Error(result.error.message || 'Không thể đọc nội dung tệp tin tài liệu.');
  }

  return result.data instanceof Uint8Array ? result.data : new Uint8Array(result.data);
}
