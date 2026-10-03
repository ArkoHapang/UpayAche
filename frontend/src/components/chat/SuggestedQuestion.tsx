"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export interface SuggestedQuestionProps {
  question: string;
  onClick: (question: string) => void;
  icon?: React.ReactNode;
  category?: string;
  disabled?: boolean;
}

export const SUGGESTED_QUESTIONS: string[] = [
  "Why was this transaction flagged?",
  "What does a high risk score mean?",
  "What is a mule network?",
  "How does UpayAche detect anomalies?",
  "How does SHAP explain a risk score?",
  "How can I protect my account from scams?",
  "How does the 3D network analysis work?"
];

export const SuggestedQuestion: React.FC<SuggestedQuestionProps> = ({
  question,
  onClick,
  icon,
  category,
  disabled = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) onClick(question);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(question)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`Ask question: ${question}`}
      className="group relative flex items-center justify-between gap-3 text-left w-full px-3.5 py-2.5 rounded-xl border border-[#CED4DA]/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 hover:bg-[#007BFF]/5 dark:hover:bg-[#007BFF]/10 hover:border-[#007BFF]/40 dark:hover:border-[#007BFF]/50 transition-all duration-200 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="shrink-0 p-1.5 rounded-lg bg-[#007BFF]/10 text-[#007BFF] group-hover:bg-[#007BFF] group-hover:text-white transition-colors">
          {icon || <Sparkles className="w-3.5 h-3.5" />}
        </span>
        <div className="flex flex-col min-w-0">
          {category && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 truncate">
              {category}
            </span>
          )}
          <span className="truncate group-hover:text-[#007BFF] dark:group-hover:text-blue-400 transition-colors">
            {question}
          </span>
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#007BFF]" />
    </button>
  );
};

export default SuggestedQuestion;
