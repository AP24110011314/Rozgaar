/** Name kept for compatibility; style is flat government portal style. */
import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const GlassSelect = forwardRef(function GlassSelect(
  {
    label,
    id,
    error,
    children,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-bold text-text"
        >
          {label} {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`glass-input w-full appearance-none pr-10 cursor-pointer ${
            error ? 'border-error focus-visible:outline-error' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text">
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <p id={`${selectId}-error`} className="flex items-center text-xs font-bold text-error mt-1 gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export { GlassSelect as Select };
export default GlassSelect;
