/**
 * Accessible Toast / Alert Component
 * Reference: docs/SRS.md FR-FILE-ERR, Screen 1 (Home) & .agents/rules/architecture.md
 */

import { useEffect, type JSX } from 'react';

export interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
  autoCloseMs?: number;
  className?: string;
}

const typeStyles: Record<NonNullable<ToastProps['type']>, string> = {
  error: 'border-red-500/50 bg-red-950/80 text-red-200 shadow-red-950/40',
  warning: 'border-amber-500/50 bg-amber-950/80 text-amber-200 shadow-amber-950/40',
  info: 'border-sky-500/50 bg-sky-950/80 text-sky-200 shadow-sky-950/40',
  success: 'border-emerald-500/50 bg-emerald-950/80 text-emerald-200 shadow-emerald-950/40',
};

const typeIcons: Record<NonNullable<ToastProps['type']>, string> = {
  error: '⚠️',
  warning: '⚡',
  info: 'ℹ️',
  success: '✅',
};

export function Toast({
  message,
  type = 'error',
  onClose,
  autoCloseMs,
  className = '',
}: ToastProps): JSX.Element {
  useEffect(() => {
    if (!autoCloseMs || autoCloseMs <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => {
      clearTimeout(timer);
    };
  }, [autoCloseMs, onClose]);

  const styleClass = typeStyles[type];
  const icon = typeIcons[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="toast-alert"
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all duration-200 ${styleClass} ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <span className="text-base select-none" aria-hidden="true">
          {icon}
        </span>
        <span className="font-medium leading-relaxed">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-3 rounded-md p-1 text-xs opacity-75 transition-opacity hover:opacity-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        title="Đóng thông báo"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}
