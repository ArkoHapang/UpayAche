"use client";

import React, { useState } from "react";
import {
  Activity,
  FileSearch,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Network,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  HelpCircle,
  Hash,
  Clock,
  Layers,
  Info
} from "lucide-react";
import { StructuredRiskEvidence, TieredInvestigationResponse } from "@/lib/api";

export interface TieredEvidenceViewProps {
  evidence?: StructuredRiskEvidence | null;
  tiered?: TieredInvestigationResponse | null;
  tieredResponse?: TieredInvestigationResponse | null;
  defaultTab?: "all" | "model" | "evidence" | "explanation";
}

export const TieredEvidenceView: React.FC<TieredEvidenceViewProps> = ({
  evidence,
  tiered,
  tieredResponse,
  defaultTab = "all"
}) => {
  const effectiveTiered = tiered || tieredResponse;
  const [activeTab, setActiveTab] = useState<"all" | "model" | "evidence" | "explanation">(defaultTab);

  if (!evidence && !effectiveTiered) return null;

  const riskScore = evidence?.risk_score ?? effectiveTiered?.model_result?.risk_score ?? null;
  const riskLevel = evidence?.risk_level ?? effectiveTiered?.model_result?.risk_level ?? "Unavailable";
  const anomalyScore = evidence?.anomaly_score ?? effectiveTiered?.model_result?.anomaly_score ?? null;
  const anomalyLevel = effectiveTiered?.model_result?.anomaly_level ?? ((anomalyScore || 0) >= 0.5 ? "ANOMALOUS" : "NORMAL");

  const riskScorePercent = riskScore !== null ? Math.round(riskScore * 100) : null;
  const anomalyPercent = anomalyScore !== null ? Math.round(anomalyScore * 100) : null;

  // Color mapping based on UpayAche semantic tokens
  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "MEDIUM":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    }
  };

  const txContext = evidence?.transaction_context || effectiveTiered?.evidence?.transaction_context || {};
  const topFeatures = evidence?.top_risk_features || effectiveTiered?.evidence?.top_risk_features || [];
  const shapList = evidence?.shap_contributions || effectiveTiered?.evidence?.shap_contributions || [];
  const networkSigs = evidence?.network_signals || effectiveTiered?.evidence?.network_signals || [];
  const explanation = effectiveTiered?.ai_explanation;

  return (
    <div className="my-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 overflow-hidden shadow-sm">
      {/* Navigation Filter Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 gap-1 overflow-x-auto text-xs font-semibold">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            All Tiers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("model")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "model"
                ? "bg-[#007BFF]/10 text-[#007BFF] dark:text-blue-400 font-bold border border-[#007BFF]/30"
                : "text-slate-500 hover:text-[#007BFF] dark:text-slate-400"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#007BFF]" />
            <span>Model Result</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "evidence"
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30"
                : "text-slate-500 hover:text-purple-500 dark:text-slate-400"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-purple-500" />
            <span>Evidence</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("explanation")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "explanation"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                : "text-slate-500 hover:text-emerald-500 dark:text-slate-400"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI Explanation</span>
          </button>
        </div>

        <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">
          ML / Copilot Separation
        </span>
      </div>

      <div className="p-3.5 space-y-3 text-xs">
        {/* ================= TIER 1: MODEL RESULT ================= */}
        {(activeTab === "all" || activeTab === "model") && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-blue-500/20 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Cpu className="w-4 h-4 text-[#007BFF]" />
                <span>Model Result</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007BFF]/10 text-[#007BFF] dark:text-blue-400 font-mono font-bold">
                XGBoost + Isolation Forest
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* XGBoost Risk Score Card */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Supervised Risk Score (XGBoost)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRiskColor(riskLevel)}`}>
                    {riskLevel}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {riskScore !== null ? riskScore.toFixed(4) : "Unavailable"}
                  </span>
                  {riskScorePercent !== null && (
                    <span className="text-xs font-semibold text-slate-500">
                      ({riskScorePercent}% probability)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 italic">
                  Deterministic prediction • Never generated by Gemini
                </p>
              </div>

              {/* Isolation Forest Anomaly Score Card */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Behavioral Anomaly (Isolation Forest)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    (anomalyScore || 0) >= 0.50
                      ? "text-rose-500 bg-rose-500/10 border-rose-500/30"
                      : "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                    {anomalyLevel}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {anomalyScore !== null ? anomalyScore.toFixed(4) : "Unavailable"}
                  </span>
                  {anomalyPercent !== null && (
                    <span className="text-xs font-semibold text-slate-500">
                      ({anomalyPercent}% divergence)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 italic">
                  Unsupervised temporal &amp; spending deviation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TIER 2: EVIDENCE ================= */}
        {(activeTab === "all" || activeTab === "evidence") && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-purple-500/20 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <FileSearch className="w-4 h-4 text-purple-500" />
                <span>Evidence</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold">
                Ledger + SHAP + NetworkX
              </span>
            </div>

            {/* Transaction Ledger Context */}
            {txContext && Object.keys(txContext).length > 0 && (
              <div className="mb-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Hash</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {txContext.tx_hash || "TX-RECORD"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Amount</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    BDT {Number(txContext.amount_bdt || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Type</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {txContext.tx_type || "P2P"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sender (Masked)</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {txContext.sender_masked || "Unavailable"}
                  </span>
                </div>
              </div>
            )}

            {/* Top Risk Features & SHAP */}
            <div className="space-y-2">
              {shapList && shapList.length > 0 ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    SHAP TreeExplainer Feature Attributions:
                  </span>
                  <div className="space-y-1.5">
                    {shapList.slice(0, 4).map((c: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {c.direction === "increased_risk" ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {c.feature}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                            — {c.human_readable_explanation || c.feature}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            c.direction === "increased_risk"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {c.contribution > 0 ? `+${c.contribution.toFixed(2)}` : c.contribution.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : topFeatures.length > 0 ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Top Contributing Features:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {topFeatures.map((f: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Network Signals */}
              {networkSigs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    NetworkX Graph Signals:
                  </span>
                  <ul className="space-y-1">
                    {networkSigs.map((sig: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Network className="w-3 h-3 text-[#007BFF] shrink-0" />
                        <span className="truncate">{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TIER 3: AI EXPLANATION ================= */}
        {(activeTab === "all" || activeTab === "explanation") && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/20 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>AI Explanation</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                Gemini Copilot
              </span>
            </div>

            <div className="space-y-2 text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
              {explanation ? (
                <>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {explanation.executive_summary}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {explanation.risk_breakdown}
                  </p>

                  {explanation.investigation_guidance && explanation.investigation_guidance.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Recommended Human Investigator Steps:
                      </span>
                      <ul className="space-y-1">
                        {explanation.investigation_guidance.map((step, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  AI explanation synthesized strictly from verified evidence.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TieredEvidenceView;
