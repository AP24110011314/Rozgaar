/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function GlassToast({
  message,
  type = 'info', // 'success' | 'error' | 'info' | 'warning'
  onClose,
  className = '',
}) {
  const styles = {
    success: 'bg-mint text-mint-text border-2 border-mint-text',
    error: 'bg-error-bg text-error border-2 border-error',
    info: 'bg-sand text-text border border-border',
    warning: 'bg-warning-bg text-text border border-border',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-mint-text shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-error shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-text shrink-0" aria-hidden="true" />,
    warning: <Info className="w-5 h-5 text-text shrink-0" aria-hidden="true" />,
  };

  return (
    <div
      role="status"
      className={`p-4 rounded-md shadow-flat flex items-center justify-between gap-3 text-sm font-semibold ${
        styles[type] || styles.info
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-sm text-text hover:bg-black/10 min-h-[36px] min-w-[36px] flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export { GlassToast as Toast };
export default GlassToast;
