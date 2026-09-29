import type { JSX } from 'react';
import { AppShell } from '@/app/AppShell';
import { Button } from '@/components';

export function App(): JSX.Element {
  return (
    <AppShell title="Club Sign Tool" badge="MVP">
      <div className="flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">📄</div>
        <h2 className="mb-2 text-lg font-medium text-slate-200">
          Sẵn sàng mở tài liệu
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Kéo và thả tài liệu PDF hoặc Word (.docx, .doc) vào đây để bắt đầu ký duyệt.
        </p>
        <div className="mb-6 flex gap-3">
          <Button variant="primary" size="md">
            Chọn tệp từ máy
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>🔒 Hoạt động 100% ngoại tuyến (Air-Gapped)</span>
        </div>
      </div>
    </AppShell>
  );
}

export default App;
