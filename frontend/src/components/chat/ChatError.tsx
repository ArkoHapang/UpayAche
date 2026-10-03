"use client";

import React from "react";
import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";

export interface ChatErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const ChatError: React.FC<ChatErrorProps> = ({
  message = "Failed to communicate with UpayAche Risk Intelligence backend.",
  onRetry
}) => {
  return (
    <div
      role="alert"
      className="p-3.5 my-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in-50 duration-200"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-red-700 dark:text-red-300">
            Assistant Connection Error
          </p>
          <p className="mt-1 text-xs text-red-600/90 dark:text-red-400/90 leading-relaxed font-sans">
            {message}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 shrink-0" />
            <span>Verify the backend service is running on <code>http://localhost:8000</code>.</span>
          </p>

          {onRetry && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Request</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatError;
