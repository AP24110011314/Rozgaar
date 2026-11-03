/** Name kept for compatibility; style is flat government portal style. */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Solid dark-tinted overlay (no blur) */}
      <div
        className="fixed inset-0 bg-overlay transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} bg-surface border border-border rounded-lg shadow-flat p-6 my-8 z-10 text-text ${className}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-divider">
          <h2 id="modal-title" className="text-xl font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-sand transition-colors focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

export { GlassModal as Modal };
export default GlassModal;
