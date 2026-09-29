import type { JSX, ReactNode } from 'react';

export interface AppShellProps {
  title?: string;
  badge?: string;
  children: ReactNode;
}

export function AppShell({
  title = 'Club Sign Tool',
  badge = 'MVP',
  children,
}: AppShellProps): JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-slate-100">
      {/* Top Header / App Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✍️</span>
          <h1 className="text-base font-semibold tracking-wide">{title}</h1>
          {badge && (
            <span className="rounded border border-sky-800 bg-sky-950 px-2 py-0.5 text-xs font-medium text-sky-400">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          Local / Offline Desktop Utility
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex flex-1 items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
