"use client";

import React from "react";
import { AlertOctagon, RotateCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryLoading?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Error Encountered",
  message,
  onRetry,
  retryLabel = "Retry Request",
  retryLoading = false,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "p-8 rounded-2xl bg-white border border-[#FECACA] shadow-xs text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto",
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center shrink-0">
        <AlertOctagon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[#000000] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#DC2626] leading-relaxed font-mono bg-[#FEF2F2] p-2.5 rounded-xl border border-[#FECACA] max-w-sm">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retryLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-semibold text-xs shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCw className="w-3.5 h-3.5" />
          )}
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};
