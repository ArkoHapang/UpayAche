"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  variant?: "card" | "table" | "metric" | "list" | "spinner";
  count?: number;
  text?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = "card",
  count = 3,
  text = "Loading data...",
  className = "",
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "py-12 flex flex-col items-center justify-center space-y-3",
          className
        )}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#007BFF]" />
        <span className="text-xs font-medium text-[#6C757D] font-mono">
          {text}
        </span>
      </div>
    );
  }

  if (variant === "metric") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          className
        )}
      >
        {items.map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-3 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-[#EDF0F3] rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-[#F6F6F6]" />
            </div>
            <div className="h-7 w-32 bg-[#EDF0F3] rounded-lg" />
            <div className="h-2.5 w-20 bg-[#F6F6F6] rounded-md pt-2 border-t border-[#CED4DA]/40" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[#CED4DA]/70 bg-white p-4 space-y-3 shadow-xs animate-pulse",
          className
        )}
      >
        <div className="h-4 w-48 bg-[#EDF0F3] rounded-md mb-4" />
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-[#EDF0F3] last:border-0"
          >
            <div className="h-3.5 w-32 bg-[#EDF0F3] rounded-md" />
            <div className="h-3.5 w-40 bg-[#F6F6F6] rounded-md" />
            <div className="h-3.5 w-24 bg-[#EDF0F3] rounded-md" />
            <div className="h-3.5 w-16 bg-[#F6F6F6] rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {items.map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-2 animate-pulse"
          >
            <div className="flex justify-between">
              <div className="h-3.5 w-28 bg-[#EDF0F3] rounded-md" />
              <div className="h-3.5 w-14 bg-[#F6F6F6] rounded-full" />
            </div>
            <div className="h-3 w-48 bg-[#EDF0F3] rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {items.map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white border border-[#CED4DA]/70 shadow-xs space-y-3 animate-pulse"
        >
          <div className="h-4 w-28 bg-[#EDF0F3] rounded-md" />
          <div className="h-10 w-full bg-[#F6F6F6] rounded-xl" />
          <div className="h-3 w-3/4 bg-[#EDF0F3] rounded-md" />
        </div>
      ))}
    </div>
  );
};
