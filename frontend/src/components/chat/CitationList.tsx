"use client";

import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, CheckCircle2, Bookmark } from "lucide-react";
import { ChatCitation } from "@/lib/api";

export interface CitationListProps {
  citations: ChatCitation[];
  defaultExpanded?: boolean;
}

export const CitationList: React.FC<CitationListProps> = ({
  citations,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#007BFF] dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] rounded-md px-1 py-0.5"
      >
        <span className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#007BFF]" />
          <span>Verified Sources & Citations ({citations.length})</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2" role="region" aria-label="Knowledge citations">
          {citations.map((cite, idx) => {
            const scorePercent = Math.round((cite.similarity_score || 0) * 100);
            const isHighConfidence = (cite.similarity_score || 0) >= 0.40;

            return (
              <div
                key={`${cite.document_id || idx}-${idx}`}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-xs transition-all hover:border-[#007BFF]/30"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">
                      {cite.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cite.category && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {cite.category}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isHighConfidence
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                      title="Cosine Semantic Match Score"
                    >
                      {scorePercent}% match
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans line-clamp-3">
                  {cite.snippet}
                </p>
                {cite.source && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <FileText className="w-3 h-3" />
                    <span className="truncate font-mono">{cite.source}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitationList;
