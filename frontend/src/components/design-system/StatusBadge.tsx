"use client";

import React from "react";
import { CaseStatusToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: CaseStatusToken | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const normStatus = (status || "OPEN").toUpperCase() as CaseStatusToken;

  const styleMap: Record<
    CaseStatusToken,
    { bg: string; border: string; text: string; label: string }
  > = {
    OPEN: {
      bg: "bg-[#EFF6FF]",
      border: "border-[#BFDBFE]",
      text: "text-[#0054A6]",
      label: "OPEN",
    },
    INVESTIGATING: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      label: "INVESTIGATING",
    },
    REVIEWED: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-700",
      label: "REVIEWED",
    },
    CLOSED: {
      bg: "bg-[#F1F5F9]",
      border: "border-[#CED4DA]",
      text: "text-[#4E4E50]",
      label: "CLOSED",
    },
  };

  const current = styleMap[normStatus] || styleMap.OPEN;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono font-semibold tracking-wide uppercase transition-colors select-none",
        current.bg,
        current.border,
        current.text,
        sizeClasses[size],
        className
      )}
      aria-label={`Investigation Status ${current.label}`}
    >
      {current.label}
    </span>
  );
};
