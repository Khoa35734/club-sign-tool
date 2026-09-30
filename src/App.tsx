import type { JSX } from 'react';
import { AppShell } from '@/app/AppShell';
import { Button, Toast } from '@/components';
import { useDocumentStore } from '@/stores';
import { useOpenFile, DropZone, PdfPageView } from '@/features/document';

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
        <div className="flex w-full max-w-4xl flex-col items-center">
          <div className="mb-6 flex w-full flex-col rounded-xl border border-slate-700 bg-slate-800/80 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectFile}
                  disabled={isLoading}
                >
                  Chọn tệp khác
                </Button>
                <Button variant="ghost" size="sm" onClick={resetDocument}>
                  Đóng tệp
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <div className="font-mono truncate max-w-md text-slate-400">
                <span className="text-slate-500">Đường dẫn: </span>
                {activeDocument.filePath}
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 shrink-0">
                <span>●</span> Đã nạp thành công vào bộ nhớ
              </span>
            </div>

            {activeDocument.pages.length > 0 && (
              <div
                data-testid="document-page-dimensions"
                className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300 border-t border-slate-700/40 pt-3"
              >
                <span className="font-semibold text-slate-400">Thông số trang:</span>
                {activeDocument.pages.slice(0, 3).map((page) => (
                  <span
                    key={page.pageNumber}
                    className="rounded bg-slate-900/60 px-2 py-0.5 text-slate-300 border border-slate-700/60"
                  >
                    Trang {page.pageNumber}: {page.widthPt} × {page.heightPt} pt
                    {page.rotation ? ` (${page.rotation}°)` : ''}
                  </span>
                ))}
                {activeDocument.pages.length > 3 && (
                  <span className="text-slate-500">
                    +{activeDocument.pages.length - 3} trang khác
                  </span>
                )}
              </div>
            )}
          </div>

          {activeDocument.fileType === 'pdf' && (
            <div className="flex w-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-md">
              <PdfPageView
                source={activeDocument.filePath}
                pageNumber={1}
              />
            </div>
          )}
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
