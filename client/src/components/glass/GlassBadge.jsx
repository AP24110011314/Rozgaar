/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassBadge({
  children,
  variant = 'neutral',
  className = '',
  icon: Icon,
}) {
  const variantStyles = {
    applied: 'bg-sand text-text border border-border',
    reviewing: 'bg-mint text-text border border-divider',
    interviewing: 'bg-accent text-text border border-border',
    offered: 'bg-surface text-text border-2 border-brand-dark',
    hired: 'bg-mint text-mint-text border-2 border-mint-text',
    rejected: 'bg-error-bg text-error border border-error',
    withdrawn: 'bg-divider text-text border border-border',

    // Generic aliases
    neutral: 'bg-sand text-text border border-border',
    success: 'bg-mint text-mint-text border-2 border-mint-text',
    warning: 'bg-warning-bg text-text border border-border',
    danger: 'bg-error-bg text-error border border-error',
    info: 'bg-sand text-text border border-border',
    saffron: 'bg-accent text-text border border-border',
    indigo: 'bg-sand text-brand-dark border-2 border-brand-dark',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
        variantStyles[variant] || variantStyles.neutral
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 mr-1 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

export { GlassBadge as Badge };
export default GlassBadge;
