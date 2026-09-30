/**
 * Hook for coordinating document file selection and store updates
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002
 */

import { useState, useCallback } from 'react';
import { openDocumentDialog } from '../services/fileDialogService';
import { validateDocumentFile } from '../services/fileValidationService';
import { loadPdfDocumentMetadata } from '../services/pdfMetadataService';
import { useDocumentStore } from '@/stores';
import { createDocumentMeta } from '@/utils/file';

export interface UseOpenFileResult {
  openFile: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOpenFile(): UseOpenFileResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const setFilePath = useDocumentStore((state) => state.setFilePath);
  const setLoading = useDocumentStore((state) => state.setLoading);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const openFile = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const selectedPath = await openDocumentDialog();
      if (selectedPath) {
        const validation = await validateDocumentFile(selectedPath);
        if (validation.fileType === 'pdf') {
          const metadata = await loadPdfDocumentMetadata(validation.path);
          const doc = createDocumentMeta(
            validation.path,
            validation.fileSizeBytes,
            metadata.pages
          );
          setActiveDocument(doc);
        } else {
          setFilePath(validation.path, validation.fileSizeBytes);
        }
      }
      return selectedPath;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể mở tệp tài liệu đã chọn. Vui lòng thử lại.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [setActiveDocument, setFilePath, setLoading]);

  return {
    openFile,
    isLoading,
    error,
    clearError,
  };
}
