import type { JSX } from "react";

export function App(): JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-slate-100">
      {/* Top Header / App Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✍️</span>
          <h1 className="text-base font-semibold tracking-wide">Club Sign Tool</h1>
          <span className="rounded bg-sky-950 px-2 py-0.5 text-xs font-medium text-sky-400 border border-sky-800">
            MVP
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Local / Offline Desktop Utility
        </div>
      </header>

      {/* Main Workspace Skeleton */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-8 text-center shadow-lg">
          <div className="mb-4 text-4xl">📄</div>
          <h2 className="mb-2 text-lg font-medium text-slate-200">
            Sẵn sàng mở tài liệu
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Kéo và thả tài liệu PDF hoặc Word (.docx, .doc) vào đây để bắt đầu ký duyệt.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>🔒 Hoạt động 100% ngoại tuyến (Air-Gapped)</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
