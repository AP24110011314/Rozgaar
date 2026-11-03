/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`bg-surface border border-border rounded-lg shadow-flat p-6 text-text ${
        hoverEffect ? 'hover:border-brand-dark' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export { GlassCard as Card };
export default GlassCard;
