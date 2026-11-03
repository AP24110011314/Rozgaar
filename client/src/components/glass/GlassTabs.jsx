/** Name kept for compatibility; style is flat government portal style. */
import React from 'react';

export function GlassTabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex p-1 rounded-md bg-sand border border-border ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-all min-h-[44px] cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
              isActive
                ? 'bg-brand-dark text-white shadow-flat'
                : 'text-text hover:underline'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        );
      })}
    </div>
  );
}

export { GlassTabs as Tabs };
export default GlassTabs;
