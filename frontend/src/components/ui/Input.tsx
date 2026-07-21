import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || Math.random().toString(36).substring(2, 9);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted-foreground pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={`
              w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm font-sans
              transition-all duration-200
              placeholder:text-muted-foreground/60
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary/40'}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-muted-foreground pointer-events-none shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs font-medium text-destructive font-sans animate-in fade-in duration-200">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span className="text-xs text-muted-foreground font-sans leading-relaxed">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
