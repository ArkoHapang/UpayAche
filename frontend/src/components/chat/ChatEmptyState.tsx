"use client";

import React from "react";
import { Bot, Shield, Network, AlertOctagon, HelpCircle, Activity, Sparkles, BrainCircuit } from "lucide-react";
import SuggestedQuestion, { SUGGESTED_QUESTIONS } from "./SuggestedQuestion";

export interface ChatEmptyStateProps {
  onSelectQuestion: (question: string) => void;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}

const QUESTION_ICONS: Record<string, React.ReactNode> = {
  "Why was this transaction flagged?": <AlertOctagon className="w-3.5 h-3.5 text-orange-500" />,
  "What does a high risk score mean?": <Activity className="w-3.5 h-3.5 text-rose-500" />,
  "What is a mule network?": <Network className="w-3.5 h-3.5 text-purple-500" />,
  "How does UpayAche detect anomalies?": <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />,
  "How does SHAP explain a risk score?": <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
  "How can I protect my account from scams?": <Shield className="w-3.5 h-3.5 text-emerald-500" />,
  "How does the 3D network analysis work?": <Network className="w-3.5 h-3.5 text-cyan-500" />
};

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  onSelectQuestion,
  selectedLanguage = "auto",
  onLanguageChange
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center max-w-lg mx-auto animate-in fade-in-50 duration-300">
      {/* Brand Icon with Pulse Indicator */}
      <div className="relative mb-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007BFF] via-[#0054A6] to-[#003875] flex items-center justify-center text-white shadow-xl shadow-[#007BFF]/25 ring-4 ring-[#007BFF]/10">
          <Bot className="w-7 h-7" />
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FFD602] border-2 border-slate-900 rounded-full shadow-sm animate-pulse" />
      </div>

      {/* Header Info */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
        UpayAche AI Assistant
      </h3>
      <p className="text-xs sm:text-sm font-semibold text-[#007BFF] dark:text-blue-400 mt-0.5">
        Risk &amp; Security Help
      </p>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
        Ask questions about transaction risk, fraud alerts, mule account networks, SHAP feature attributions, or scam protection.
      </p>

      {/* Language Selector Bar */}
      {onLanguageChange && (
        <div className="mt-3.5 inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Language:</span>
          {(["auto", "en", "bn", "banglish"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-[#007BFF] ${
                selectedLanguage === lang
                  ? "bg-white dark:bg-slate-900 text-[#007BFF] dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {lang === "auto" ? "Auto" : lang === "en" ? "English" : lang === "bn" ? "বাংলা" : "Banglish"}
            </button>
          ))}
        </div>
      )}

      {/* Suggested Questions Section */}
      <div className="w-full mt-5 text-left">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#FFD602]" />
            Suggested Questions
          </span>
          <span className="text-[11px] text-slate-400">Click to ask</span>
        </div>

        <div className="space-y-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <SuggestedQuestion
              key={idx}
              question={q}
              onClick={onSelectQuestion}
              icon={QUESTION_ICONS[q]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;
