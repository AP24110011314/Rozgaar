/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const sizeStyles = {
    sm: 'text-sm px-3.5 py-1.5 min-h-[44px] rounded-md',
    md: 'text-base px-4 py-2 min-h-[44px] rounded-md',
    lg: 'text-base px-6 py-2.5 min-h-[48px] rounded-md',
  };

  const variantStyles = {
    primary:
      'bg-brand-dark text-white hover:bg-brand-darker border border-brand-dark',
    secondary:
      'bg-accent text-text hover:bg-accent-hover border border-accent',
    outline:
      'bg-surface text-brand-dark hover:bg-sand hover:text-text border-2 border-brand-dark',
    danger:
      'bg-error-bg text-error hover:bg-error-bg/80 border-2 border-error',
    ghost:
      'bg-transparent text-text hover:bg-sand border border-transparent',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-bold select-none cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-disabled-bg disabled:text-text-muted disabled:border-border disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}

export { GlassButton as Button };
export default GlassButton;
