import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmModal — Reusable confirmation dialog.
 * Replaces all native window.confirm() calls throughout the application.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar Ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800/50',
      button: 'destructive' as const,
    },
    warning: {
      icon: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      button: 'primary' as const,
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      button: 'primary' as const,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${styles.border}`}
      >
        <div className="p-6 space-y-4">
          {/* Icon + Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${styles.bg}`}>
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <h2 id="confirm-modal-title" className="text-base font-bold text-foreground">
              {title}
            </h2>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed pl-12">{message}</p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={styles.button} size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
