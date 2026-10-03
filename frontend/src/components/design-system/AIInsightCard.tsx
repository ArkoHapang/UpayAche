"use client";

import React from "react";
import { Sparkles, BrainCircuit, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

export interface ContributingFactor {
  feature: string;
  contribution: number;
  direction: "increased_risk" | "decreased_risk" | string;
  human_readable_explanation?: string;
}

interface AIInsightCardProps {
  modelVersion?: string;
  summary: string;
  topFactors?: ContributingFactor[];
  anomalyScore?: number;
  isAnomaly?: boolean;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  modelVersion = "XGBoost v1.0.0 • TreeExplainer",
  summary,
  topFactors = [],
  anomalyScore,
  isAnomaly,
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Explainable SHAP Intelligence
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              {modelVersion}
            </span>
          </div>
        </div>

        {anomalyScore !== undefined && (
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
              isAnomaly
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            Anomaly: {anomalyScore.toFixed(3)}
          </span>
        )}
      </div>

      {/* Narrative Summary */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
        {summary}
      </div>

      {/* Top Contributing Feature Factors */}
      {topFactors.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
            Top Attributed Risk Drivers
          </span>
          <div className="space-y-1.5">
            {topFactors.map((factor, idx) => {
              const isIncrease = factor.direction === "increased_risk";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        isIncrease
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-mono font-semibold text-slate-800 text-[11px] truncate">
                        {factor.feature}
                      </span>
                      {factor.human_readable_explanation && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {factor.human_readable_explanation}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      isIncrease ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isIncrease ? "+" : ""}
                    {factor.contribution.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
