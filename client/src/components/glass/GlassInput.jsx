/** Name kept for compatibility; style is flat government portal style. */
import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const GlassInput = forwardRef(function GlassInput(
  {
    label,
    id,
    error,
    icon: Icon,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold text-text"
        >
          {label} {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`glass-input w-full ${Icon ? 'pl-10' : ''} ${
            error ? 'border-error focus-visible:outline-error' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="flex items-center text-xs font-bold text-error mt-1 gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export { GlassInput as Input };
export default GlassInput;
