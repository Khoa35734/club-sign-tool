import type { JSX } from 'react';
import { AppShell } from '@/app/AppShell';
import { Button } from '@/components';
import { useDocumentStore } from '@/stores';
import { useOpenFile } from '@/features/document';

export function App(): JSX.Element {
  const activeDocument = useDocumentStore((state) => state.activeDocument);
  const resetDocument = useDocumentStore((state) => state.reset);
  const { openFile, isLoading, error, clearError } = useOpenFile();

  const handleSelectFile = async (): Promise<void> => {
    await openFile();
  };

  return (
    <AppShell title="Club Sign Tool" badge="MVP">
      {error && (
        <div className="mb-4 flex w-full max-w-lg items-center justify-between rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200 shadow-md">
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

      {!activeDocument ? (
        <div className="flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-8 text-center shadow-lg">
          <div className="mb-4 text-4xl">📄</div>
          <h2 className="mb-2 text-lg font-medium text-slate-200">
            Sẵn sàng mở tài liệu
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Chọn hoặc kéo thả tài liệu PDF hoặc Word (.docx, .doc) vào đây để bắt đầu ký duyệt.
          </p>
          <div className="mb-6 flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSelectFile}
              disabled={isLoading}
            >
              {isLoading ? 'Đang mở hộp thoại...' : 'Chọn tệp từ máy'}
            </Button>
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
            <span>Hỗ trợ: PDF, DOCX, DOC</span>
            <span>🔒 Hoạt động 100% ngoại tuyến (Air-Gapped)</span>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-lg flex-col rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {activeDocument.fileName}
                </h2>
                <span className="inline-block rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-medium uppercase text-indigo-300">
                  Định dạng: {activeDocument.fileType}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetDocument}>
              Đóng tệp
            </Button>
          </div>

          <div className="mb-6 rounded-lg bg-slate-900/60 p-3 font-mono text-xs text-slate-400 break-all">
            <div className="text-slate-500">Đường dẫn tệp cục bộ:</div>
            <div className="text-slate-200">{activeDocument.filePath}</div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span>●</span> Đã nhận diện tệp thành công vào App State
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectFile}
              disabled={isLoading}
            >
              Chọn tệp khác
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default App;
