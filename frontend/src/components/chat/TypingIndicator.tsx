"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";

export interface TypingIndicatorProps {
  label?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  label = "UpayAche AI is reasoning with verified knowledge..."
}) => {
  return (
    <div
      role="status"
      aria-label="Assistant is thinking and retrieving knowledge"
      className="flex items-start gap-3 py-2 animate-in fade-in-50 duration-300"
    >
      <div className="relative shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0054A6] flex items-center justify-center text-white shadow-md shadow-[#007BFF]/20">
        <Bot className="w-4 h-4" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFD602] border-2 border-slate-900 rounded-full animate-ping" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFD602] border-2 border-slate-900 rounded-full" />
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#007BFF] animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            UpayAche AI Assistant
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 py-1">
            <span
              className="w-2 h-2 rounded-full bg-[#007BFF] animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "1s" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[#FFD602] animate-bounce"
              style={{ animationDelay: "200ms", animationDuration: "1s" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[#007BFF] animate-bounce"
              style={{ animationDelay: "400ms", animationDuration: "1s" }}
            />
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-sans italic">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
