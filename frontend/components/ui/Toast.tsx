'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = { id: number; message: string; type: ToastType; sub?: string };

type ToastContextValue = {
  toast: (message: string, type?: ToastType, sub?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, { wrapper: string; icon: string; Icon: typeof Info }> = {
  success: {
    wrapper: 'border-success/20 bg-success-light/60',
    icon: 'text-success',
    Icon: CheckCircle,
  },
  error: {
    wrapper: 'border-danger/20 bg-danger-light/60',
    icon: 'text-danger',
    Icon: AlertTriangle,
  },
  warning: {
    wrapper: 'border-warning/20 bg-warning-light/60',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
  info: {
    wrapper: 'border-primary/20 bg-primary-light/60',
    icon: 'text-primary',
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success', sub?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, sub }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="animate-toast fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const style = toastStyles[t.type];
          const Icon = style.Icon;
          return (
            <div
              key={t.id}
              className={cn(
                'flex min-w-[260px] max-w-[380px] items-start gap-3 rounded-[var(--radius-lg)] border bg-surface px-4 py-3 shadow-[var(--shadow-lg)]',
                style.wrapper
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.icon)} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{t.message}</p>
                {t.sub && <p className="mt-0.5 text-[12px] text-muted">{t.sub}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
