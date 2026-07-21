import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      const duration = toast.duration ?? 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          // Icons and styles based on toast type
          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type];

          const colorClasses = {
            success:
              'border-emerald-500/20 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300',
            error: 'border-red-500/20 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300',
            warning:
              'border-amber-500/20 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300',
            info: 'border-blue-500/20 bg-blue-50 text-blue-900 dark:bg-blue-950/20 dark:text-blue-300',
          }[t.type];

          const iconColors = {
            success: 'text-emerald-500',
            error: 'text-red-500',
            warning: 'text-amber-500',
            info: 'text-blue-500',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg glass-panel animate-in slide-in-from-bottom-5 fade-in duration-300 ${colorClasses}`}
              role="alert"
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColors}`} />
              <div className="flex-1 space-y-1">
                {t.title && (
                  <h4 className="font-semibold text-sm leading-none font-sans">{t.title}</h4>
                )}
                <p className="text-xs opacity-90 leading-relaxed font-sans">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded p-0.5 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
