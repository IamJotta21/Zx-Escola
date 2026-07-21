import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const positionClasses = {
    left: 'left-0 h-full border-r animate-in slide-in-from-left duration-300',
    right: 'right-0 h-full border-l animate-in slide-in-from-right duration-300',
  }[position];

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[size];

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={drawerRef}
        className={`fixed top-0 ${sizeClasses} w-full bg-card shadow-2xl p-6 flex flex-col gap-4 glass-panel border-border/80 ${positionClasses}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          {title ? (
            <h3 className="text-lg font-bold font-sans tracking-tight text-foreground">{title}</h3>
          ) : (
            <div />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-foreground font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Drawer;
