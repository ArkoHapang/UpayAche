"use client";

import React from "react";
import { RiskLevelToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface RiskBadgeProps {
  level: RiskLevelToken | string;
  score?: number;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = "md",
  showDot = true,
  className = "",
}) => {
  const normLevel = (level || "LOW").toUpperCase() as RiskLevelToken;

  const styleMap: Record<
    RiskLevelToken,
    { bg: string; border: string; text: string; dot: string; label: string }
  > = {
    LOW: {
      bg: "bg-[#ECFDF5]",
      border: "border-[#A7F3D0]",
      text: "text-[#065F46]",
      dot: "bg-[#10B981]",
      label: "LOW",
    },
    MEDIUM: {
      bg: "bg-[#FFFBEB]",
      border: "border-[#FDE68A]",
      text: "text-[#92400E]",
      dot: "bg-[#F59E0B]",
      label: "MEDIUM",
    },
    HIGH: {
      bg: "bg-[#FFF7ED]",
      border: "border-[#FED7AA]",
      text: "text-[#9A3412]",
      dot: "bg-[#EA580C]",
      label: "HIGH",
    },
    CRITICAL: {
      bg: "bg-[#FEF2F2]",
      border: "border-[#FECACA]",
      text: "text-[#7F1D1D]",
      dot: "bg-[#DC2626]",
      label: "CRITICAL",
    },
  };

  const current = styleMap[normLevel] || styleMap.LOW;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2 font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono font-semibold tracking-wider uppercase transition-colors select-none",
        current.bg,
        current.border,
        current.text,
        sizeClasses[size],
        className
      )}
      aria-label={`Risk Level ${current.label}${
        score !== undefined ? ` Score ${score.toFixed(3)}` : ""
      }`}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            current.dot,
            normLevel === "CRITICAL" && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-normal opacity-85 ml-0.5">
          ({score.toFixed(2)})
        </span>
      )}
    </span>
  );
};
