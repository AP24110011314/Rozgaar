/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassSkeleton({ className = '', lines = 1 }) {
  if (lines > 1) {
    return (
      <div className="space-y-2.5" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 rounded-sm bg-divider animate-pulse ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            } ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`rounded-sm bg-divider animate-pulse ${className}`}
    />
  );
}

export { GlassSkeleton as Skeleton };
export default GlassSkeleton;
