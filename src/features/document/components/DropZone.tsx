/**
 * Interactive Drag & Drop Zone for opening PDF & Word documents
 * Reference: docs/SRS.md FR-FILE-001, FR-FILE-002, Screen 1 (Home)
 */

import type { JSX } from 'react';
import { Button } from '@/components';
import { useFileDrop } from '../hooks/useFileDrop';

export interface DropZoneProps {
  onOpenFile: () => void;
  isLoading?: boolean;
  buttonLabel?: string;
}

export function DropZone({
  onOpenFile,
  isLoading = false,
  buttonLabel = 'Chọn tệp từ máy',
}: DropZoneProps): JSX.Element {
  const {
    isDragging,
    error,
    clearError,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  } = useFileDrop();

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      {error && (
        <div
          role="alert"
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200 shadow-md"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-3 text-xs text-red-300 hover:text-white"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      <div
        data-testid="drop-zone"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 shadow-xl ${
          isDragging
            ? 'scale-[1.02] border-indigo-400 bg-indigo-950/50 ring-4 ring-indigo-500/30'
            : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
        }`}
      >
        <div
          className={`mb-4 text-5xl transition-transform duration-200 ${
            isDragging ? 'scale-125' : ''
          }`}
        >
          {isDragging ? '📥' : '📄'}
        </div>

        <h2 className="mb-2 text-xl font-semibold text-slate-100">
          {isDragging ? 'Thả tài liệu vào đây' : 'Sẵn sàng mở tài liệu'}
        </h2>

        <p className="mb-6 max-w-xs text-sm text-slate-400">
          {isDragging
            ? 'Thả tệp để bắt đầu nạp vào trình ký duyệt'
            : 'Kéo và thả tài liệu PDF hoặc Word (.docx, .doc) vào đây để bắt đầu ký duyệt.'}
        </p>

        <div className="mb-6 flex gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onOpenFile}
            disabled={isLoading}
          >
            {isLoading ? 'Đang mở hộp thoại...' : buttonLabel}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
          <div className="flex gap-2">
            <span className="rounded bg-slate-700/60 px-2 py-0.5 font-mono text-slate-300">
              .PDF
            </span>
            <span className="rounded bg-slate-700/60 px-2 py-0.5 font-mono text-slate-300">
              .DOCX
            </span>
            <span className="rounded bg-slate-700/60 px-2 py-0.5 font-mono text-slate-300">
              .DOC
            </span>
          </div>
          <span className="mt-1">🔒 Hoạt động 100% ngoại tuyến (Air-Gapped)</span>
        </div>
      </div>
    </div>
  );
}

export default DropZone;
