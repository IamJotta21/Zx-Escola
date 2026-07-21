import React, { HTMLAttributes } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  showIcon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  showIcon = true,
  className = '',
  ...props
}) => {
  const Icon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    destructive: AlertCircle,
  }[variant];

  const variantClasses = {
    info: 'bg-blue-50 border-blue-500/20 text-blue-900 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-500/30',
    success:
      'bg-emerald-50 border-emerald-500/20 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-500/30',
    warning:
      'bg-amber-50 border-amber-500/20 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-500/30',
    destructive:
      'bg-red-50 border-red-500/20 text-red-900 dark:bg-red-950/20 dark:text-red-300 dark:border-red-500/30',
  }[variant];

  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    destructive: 'text-red-600 dark:text-red-400',
  }[variant];

  return (
    <div
      className={`flex gap-3 rounded-lg border p-4 text-sm leading-relaxed glass-panel notion-shadow ${variantClasses} ${className}`}
      role="alert"
      {...props}
    >
      {showIcon && <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColors}`} />}
      <div className="flex flex-col gap-1 w-full">
        {title && (
          <h5 className="font-bold tracking-tight font-sans text-sm leading-none">{title}</h5>
        )}
        <div className="font-sans text-xs opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';
export default Alert;
