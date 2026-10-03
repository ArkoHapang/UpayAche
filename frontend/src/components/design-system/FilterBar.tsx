"use client";

import React from "react";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  variant?: "default" | "risk-low" | "risk-medium" | "risk-high" | "risk-critical";
}

interface FilterBarProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  activeId,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar ${className}`}
      role="tablist"
      aria-label="Filter Options"
    >
      {options.map((opt) => {
        const isActive = activeId === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isActive
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? "bg-slate-800 text-amber-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
