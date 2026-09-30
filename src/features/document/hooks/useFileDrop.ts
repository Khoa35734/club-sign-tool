/**
 * Hook for managing Drag & Drop zone file drops
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002
 */

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { useDocumentStore } from '@/stores';
import { isSupportedDocument, createDocumentMeta } from '@/utils/file';
import { validateDocumentFile } from '../services/fileValidationService';
import { loadPdfDocumentMetadata } from '../services/pdfMetadataService';

export interface UseFileDropResult {
  isDragging: boolean;
  error: string | null;
  clearError: () => void;
  processDroppedPath: (filePath: string) => Promise<boolean>;
  onDragEnter: (e: DragEvent<HTMLElement>) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
}

export function useFileDrop(): UseFileDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const setFilePath = useDocumentStore((state) => state.setFilePath);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const processDroppedPath = useCallback(
    async (filePath: string): Promise<boolean> => {
      setError(null);
      const cleanPath = filePath.trim();
      if (!cleanPath) {
        return false;
      }

      if (!isSupportedDocument(cleanPath)) {
        setError(
          `Định dạng tệp không được hỗ trợ: "${cleanPath}". Chỉ chấp nhận .pdf, .docx, .doc.`
        );
        return false;
      }

      try {
        const validation = await validateDocumentFile(cleanPath);
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
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể mở tài liệu. Tệp tin bị lỗi hoặc không thể đọc.';
        setError(msg);
        return false;
      }
    },
    [setActiveDocument, setFilePath]
  );

  const onDragEnter = useCallback((e: DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      if (!file) return;

      if (file.size === 0) {
        setError('Tệp tin rỗng (0 bytes). Vui lòng chọn một tài liệu hợp lệ.');
        return;
      }

      const filePath = (file as unknown as { path?: string }).path || file.name;
      void processDroppedPath(filePath);
    },
    [processDroppedPath]
  );

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let isMounted = true;

    async function setupTauriDropListener(): Promise<void> {
      try {
        if (
          typeof window !== 'undefined' &&
          '__TAURI_INTERNALS__' in window
        ) {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const unlistenFn = await getCurrentWindow().onDragDropEvent((event) => {
            if (!isMounted) return;

            if (event.payload.type === 'enter' || event.payload.type === 'over') {
              setIsDragging(true);
            } else if (event.payload.type === 'leave') {
              setIsDragging(false);
            } else if (event.payload.type === 'drop') {
              setIsDragging(false);
              const paths = event.payload.paths;
              if (paths && paths.length > 0 && paths[0]) {
                void processDroppedPath(paths[0]);
              }
            }
          });

          if (isMounted) {
            unlisten = unlistenFn;
          } else {
            unlistenFn();
          }
        }
      } catch {
        // Fallback gracefully in non-Tauri browser or test environments
      }
    }

    void setupTauriDropListener();

    return () => {
      isMounted = false;
      if (unlisten) {
        unlisten();
      }
    };
  }, [processDroppedPath]);

  return {
    isDragging,
    error,
    clearError,
    processDroppedPath,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
