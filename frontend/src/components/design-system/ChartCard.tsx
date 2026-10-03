"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: string;
  metric?: string;
  subtitle?: string;
  timeRanges?: string[];
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  metric,
  subtitle,
  timeRanges = ["1H", "24H", "7D", "30D"],
  defaultRange = "24H",
  onRangeChange,
  children,
  footer,
  className = "",
}) => {
  const [selectedRange, setSelectedRange] = useState(defaultRange);

  const handleRangeSelect = (r: string) => {
    setSelectedRange(r);
    onRangeChange?.(r);
  };

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-4",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CED4DA]/50">
        <div>
          <h2 className="text-sm font-bold text-[#000000] tracking-tight">
            {title}
          </h2>
          <div className="flex items-baseline gap-2 mt-0.5">
            {metric && (
              <span className="text-lg font-extrabold text-[#000000] font-mono tabular-nums">
                {metric}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-[#6C757D]">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Time Filter Tabs */}
        {timeRanges.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 self-start sm:self-auto">
            {timeRanges.map((range) => {
              const isActive = selectedRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleRangeSelect(range)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#007BFF]",
                    isActive
                      ? "bg-white text-[#007BFF] font-bold shadow-xs border border-[#BFDBFE]"
                      : "text-[#6C757D] hover:text-[#000000]"
                  )}
                >
                  {range}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart Body */}
      <div className="min-h-[200px] flex items-center justify-center relative">
        {children}
      </div>

      {/* Optional Footer / Insight */}
      {footer && (
        <div className="pt-3 border-t border-[#CED4DA]/50 text-xs text-[#6C757D]">
          {footer}
        </div>
      )}
    </div>
  );
};
