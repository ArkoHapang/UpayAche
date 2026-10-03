"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIAssistantButtonProps {
  variant?: "inline" | "floating" | "compact";
  label?: string;
  onClick?: () => void;
  href?: string;
  badge?: string;
  pulse?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  variant = "inline",
  label = "Ask UpayAche AI",
  onClick,
  href,
  badge = "Copilot",
  pulse = true,
  disabled = false,
  className = "",
}) => {
  const content = (
    <>
      <div className="relative flex items-center justify-center shrink-0">
        <Bot className={cn(variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        {pulse && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FFD602] animate-pulse ring-2 ring-white"
            aria-hidden="true"
          />
        )}
      </div>

      <span className="font-semibold truncate">{label}</span>

      {badge && variant !== "compact" && (
        <span
          className={cn(
            "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full",
            variant === "floating"
              ? "bg-[#000000] text-[#FFD602]"
              : "bg-[#FFD602] text-[#000000]"
          )}
        >
          {badge}
        </span>
      )}

      {variant === "inline" && (
        <Sparkles className="w-3.5 h-3.5 text-[#FFD602] shrink-0" aria-hidden="true" />
      )}
    </>
  );

  const baseClasses = cn(
    "inline-flex items-center gap-2 select-none transition-all duration-150 font-sans",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "floating" && [
      "fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full text-xs font-bold",
      "bg-[#007BFF] text-white hover:bg-[#0054A6] active:bg-[#003D7A]",
      "shadow-lg shadow-[#007BFF]/25 border border-white/20",
    ],
    variant === "inline" && [
      "px-3.5 py-2 rounded-xl text-xs font-semibold",
      "bg-[#002A54] text-white hover:bg-[#003D7A] active:bg-[#001B36]",
      "border border-[#003D7A] shadow-xs",
    ],
    variant === "compact" && [
      "px-2.5 py-1.5 rounded-lg text-xs font-medium",
      "bg-[#EFF6FF] text-[#0054A6] hover:bg-[#DBEAFE] border border-[#BFDBFE]",
    ],
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      aria-label={label}
    >
      {content}
    </button>
  );
};
