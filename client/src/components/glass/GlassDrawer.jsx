/** Name kept for compatibility; style is flat government portal style. */
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function GlassDrawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // 'right' | 'bottom'
  width = 'max-w-md',
}) {
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
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Solid dark-tinted overlay (no blur) */}
      <div
        className="fixed inset-0 bg-overlay transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          position === 'right' ? 'right-0' : 'left-0'
        } max-w-full flex pl-10`}
      >
        <div
          className={`w-screen ${width} bg-surface border-l border-border p-6 flex flex-col justify-between overflow-y-auto shadow-flat text-text`}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-divider">
              <h2 className="text-xl font-bold text-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-sand transition-colors focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="pt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { GlassDrawer as Drawer };
export default GlassDrawer;
