import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      containerClassName = '',
      className = '',
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    const selectId = id || Math.random().toString(36).substring(2, 9);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`
              w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm font-sans
              appearance-none transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary/40'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-3 pointer-events-none text-muted-foreground shrink-0">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';
