"use client";

import React, { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Activity,
  FileSearch
} from "lucide-react";
import { ChatCitation, StructuredRiskEvidence, TieredInvestigationResponse } from "@/lib/api";
import CitationList from "./CitationList";
import TieredEvidenceView from "./TieredEvidenceView";

export interface ChatMessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: ChatCitation[];
  confidenceTier?: "HIGH" | "MEDIUM" | "LOW" | string;
  suggestedActions?: string[];
  feedback?: number | null;
  createdAt?: string;
  structuredEvidence?: StructuredRiskEvidence | null;
  tieredResponse?: TieredInvestigationResponse | null;
  onFeedback?: (messageId: string, rating: 1 | -1) => void;
  onSuggestedClick?: (question: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  citations = [],
  confidenceTier,
  suggestedActions = [],
  feedback,
  createdAt,
  structuredEvidence,
  tieredResponse,
  onFeedback,
  onSuggestedClick
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 py-1.5 animate-in fade-in-50 duration-200">
        <div className="max-w-[85%] sm:max-w-[78%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#007BFF] to-[#0054A6] text-white text-xs sm:text-sm shadow-sm leading-relaxed font-sans select-text">
            {content}
          </div>
          {createdAt && (
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right pr-1">
              {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
        <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // Assistant message rendering
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-start gap-3 py-2 animate-in fade-in-50 duration-200">
      <div className="relative shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0054A6] flex items-center justify-center text-white shadow-md shadow-[#007BFF]/20 mt-0.5">
        <Bot className="w-4 h-4" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#FFD602] border-2 border-slate-900 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 max-w-[92%] sm:max-w-[85%]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          {/* Header row with Title & Confidence Tier */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                UpayAche AI Assistant
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#007BFF]/10 text-[#007BFF] dark:text-blue-400 font-bold tracking-wider uppercase">
                Prototype
              </span>
            </div>

            {confidenceTier && (
              <div className="flex items-center gap-1">
                {confidenceTier === "HIGH" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    High Grounding
                  </span>
                )}
                {confidenceTier === "MEDIUM" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <HelpCircle className="w-3 h-3" />
                    Moderate Match
                  </span>
                )}
                {confidenceTier === "LOW" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                    <ShieldAlert className="w-3 h-3" />
                    Limited Context
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Tiered Evidence Cards (Model Result / Evidence / AI Explanation) */}
          {(structuredEvidence || tieredResponse) && (
            <TieredEvidenceView evidence={structuredEvidence} tiered={tieredResponse} />
          )}

          {/* Body Content */}
          <div className="space-y-2 leading-relaxed font-sans whitespace-pre-line select-text">
            {content}
          </div>

          {/* Citations List if provided */}
          {citations && citations.length > 0 && (
            <CitationList citations={citations} />
          )}

          {/* Action Toolbar: Copy, Feedback, Time */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-slate-400">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Copied response" : "Copy response"}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
                title="Copy response"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </span>
                )}
              </button>

              {onFeedback && (
                <div className="flex items-center gap-0.5 ml-2 border-l border-slate-200 dark:border-slate-800 pl-2">
                  <button
                    type="button"
                    onClick={() => onFeedback(id, 1)}
                    aria-label="Helpful response"
                    aria-pressed={feedback === 1}
                    className={`p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF] ${
                      feedback === 1
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(id, -1)}
                    aria-label="Not helpful response"
                    aria-pressed={feedback === -1}
                    className={`p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#007BFF] ${
                      feedback === -1
                        ? "text-rose-500 bg-rose-500/10"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {formattedTime && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {formattedTime}
              </span>
            )}
          </div>
        </div>

        {/* Suggested Follow-up Actions */}
        {suggestedActions && suggestedActions.length > 0 && onSuggestedClick && (
          <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
            {suggestedActions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestedClick(sug)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-[#007BFF]/10 hover:text-[#007BFF] dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#007BFF]"
              >
                <Sparkles className="w-3 h-3 text-[#FFD602]" />
                <span className="truncate max-w-[240px]">{sug}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
