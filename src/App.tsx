import type { JSX } from 'react';
import { AppShell } from '@/app/AppShell';
import { Button, Toast } from '@/components';
import { useDocumentStore } from '@/stores';
import { useOpenFile, DropZone } from '@/features/document';

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
        <div className="mb-4 w-full max-w-lg">
          <Toast message={error} onClose={clearError} type="error" />
        </div>
      )}

      {!activeDocument ? (
        <DropZone
          onOpenFile={handleSelectFile}
          isLoading={isLoading}
          buttonLabel="Chọn tệp từ máy"
        />
      ) : (
        <div className="flex w-full max-w-lg flex-col rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {activeDocument.fileName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-medium uppercase text-indigo-300">
                    Định dạng: {activeDocument.fileType}
                  </span>
                  {activeDocument.pageCount > 0 && (
                    <span
                      data-testid="document-page-count"
                      className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300"
                    >
                      {activeDocument.pageCount} trang
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetDocument}>
              Đóng tệp
            </Button>
          </div>

          <div className="mb-4 rounded-lg bg-slate-900/60 p-3 font-mono text-xs text-slate-400 break-all">
            <div className="text-slate-500">Đường dẫn tệp cục bộ:</div>
            <div className="text-slate-200">{activeDocument.filePath}</div>
          </div>

          {activeDocument.pages.length > 0 && (
            <div
              data-testid="document-page-dimensions"
              className="mb-6 rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 text-xs text-slate-300"
            >
              <div className="mb-1.5 font-semibold text-slate-400">
                Thông số trang tài liệu:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeDocument.pages.slice(0, 3).map((page) => (
                  <span
                    key={page.pageNumber}
                    className="rounded bg-slate-800 px-2 py-1 text-slate-300 border border-slate-700/60"
                  >
                    Trang {page.pageNumber}: {page.widthPt} × {page.heightPt} pt
                    {page.rotation ? ` (${page.rotation}°)` : ''}
                  </span>
                ))}
                {activeDocument.pages.length > 3 && (
                  <span className="self-center text-slate-500">
                    +{activeDocument.pages.length - 3} trang khác
                  </span>
                )}
              </div>
            </div>
          )}

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

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>🔒</span>
        <span>Bảo mật dữ liệu: Hoạt động 100% ngoại tuyến (Air-Gapped)</span>
      </div>
    </AppShell>
  );
}

export default App;
