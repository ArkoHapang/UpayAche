"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: number; // e.g. +12.5 or -4.2
  changeLabel?: string; // "vs last hour"
  icon?: React.ComponentType<{ className?: string }>;
  riskLevel?: "low" | "medium" | "high" | "critical";
  caption?: string;
  loading?: boolean;
  empty?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  prefix,
  suffix,
  change,
  changeLabel = "vs prior period",
  icon: Icon,
  riskLevel,
  caption,
  loading = false,
  empty = false,
  className = "",
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          "p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-3 animate-pulse",
          className
        )}
      >
        <div className="flex justify-between items-center">
          <div className="h-3 w-28 bg-[#EDF0F3] rounded-md" />
          <div className="w-8 h-8 rounded-xl bg-[#F6F6F6]" />
        </div>
        <div className="h-8 w-36 bg-[#EDF0F3] rounded-lg" />
        <div className="h-3 w-24 bg-[#F6F6F6] rounded-md pt-2 border-t border-[#CED4DA]/40" />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs transition-all duration-200 relative overflow-hidden group select-none",
        "hover:border-[#007BFF]/50 hover:shadow-md",
        className
      )}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#6C757D] tracking-tight truncate">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/60 text-[#0054A6] flex items-center justify-center shrink-0 group-hover:bg-[#FFD602] group-hover:text-[#000000] group-hover:border-[#FFD602] transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        {empty ? (
          <span className="text-xl font-bold text-[#6C757D]">--</span>
        ) : (
          <>
            {prefix && (
              <span className="text-lg font-semibold text-[#6C757D] font-mono">
                {prefix}
              </span>
            )}
            <span className="text-2xl sm:text-3xl font-extrabold text-[#000000] tracking-tight font-mono tabular-nums">
              {value}
            </span>
            {suffix && (
              <span className="text-xs font-medium text-[#6C757D] font-mono ml-0.5">
                {suffix}
              </span>
            )}
          </>
        )}
      </div>

      {/* Bottom context: Delta & Caption */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#CED4DA]/40 text-xs">
        {empty ? (
          <span className="text-[#6C757D] text-[11px]">No data recorded</span>
        ) : change !== undefined ? (
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span
              className={cn(
                "inline-flex items-center font-bold",
                isPositive
                  ? "text-[#DC2626]"
                  : isNegative
                  ? "text-[#10B981]"
                  : "text-[#6C757D]"
              )}
            >
              {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
              {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
              {isNeutral && <Minus className="w-3.5 h-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-[#6C757D] truncate">{changeLabel}</span>
          </div>
        ) : caption ? (
          <span className="text-[#6C757D] text-[11px] truncate">{caption}</span>
        ) : null}

        {riskLevel && (
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0 shadow-xs",
              riskLevel === "low"
                ? "bg-[#10B981]"
                : riskLevel === "medium"
                ? "bg-[#F59E0B]"
                : riskLevel === "high"
                ? "bg-[#EA580C]"
                : "bg-[#DC2626] animate-pulse"
            )}
            title={`Risk tier: ${riskLevel}`}
          />
        )}
      </div>
    </div>
  );
};
