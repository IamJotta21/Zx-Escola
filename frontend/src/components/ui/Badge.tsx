import React, { HTMLAttributes } from 'react';

export type BadgeVariant =
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans transition-colors duration-200 select-none border';

  const variants: Record<BadgeVariant, string> = {
    default: 'bg-primary border-transparent text-primary-foreground',
    secondary: 'bg-secondary border-transparent text-secondary-foreground',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
    destructive: 'bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400',
    outline: 'border-border text-foreground bg-transparent',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
