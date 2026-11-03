/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassPanel({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`bg-surface border border-border rounded-lg shadow-flat p-6 text-text ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export { GlassPanel as Panel };
export default GlassPanel;
