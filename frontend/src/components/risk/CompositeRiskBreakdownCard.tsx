"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Cpu,
  Activity,
  Network,
  Globe2,
  ChevronRight,
  TrendingUp,
  FileSearch,
  ListChecks,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TransactionRiskDetailData,
  CompositeRiskContributionData,
  BangladeshMFSIntelligenceData
} from "@/lib/api";

interface CompositeRiskBreakdownCardProps {
  riskDetail: TransactionRiskDetailData;
  className?: string;
}

export default function CompositeRiskBreakdownCard({
  riskDetail,
  className = "",
}: CompositeRiskBreakdownCardProps) {
  const [showBangla, setShowBangla] = useState(false);
  const composite = riskDetail.composite_breakdown;
  const mfs = riskDetail.mfs_intelligence;

  const supScore = composite?.supervised_score ?? riskDetail.risk_score;
  const anomScore = composite?.anomaly_score ?? riskDetail.anomaly_score;
  const graphScore = composite?.graph_score ?? 0.15;
  const compScore = composite?.composite_score ?? (0.50 * supScore + 0.25 * anomScore + 0.25 * graphScore);
  const crossed = composite?.threshold_crossed ?? (compScore >= 0.65);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. RESPONSIBLE AI HERO BANNER (RISK SIGNAL != CONFIRMED FRAUD) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border border-amber-500/30 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-300 tracking-wider uppercase">
                  RISK SIGNAL != CONFIRMED FRAUD
                </span>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] py-0 px-2">
                  Advisory Triage Hypothesis
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Risk score is a probabilistic triage indicator, <strong>not a verdict of guilt</strong>. False positives can occur. Final resolution strictly requires human compliance review.
              </p>
            </div>
          </div>
          {mfs && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBangla(!showBangla)}
              className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs shrink-0 flex items-center gap-1.5"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{showBangla ? "English View" : "বাংলা সারসংক্ষেপ"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. COMPOSITE RISK CONTRIBUTION BREAKDOWN */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                Composite Risk Attribution Engine
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-model ensemble combining Supervised XGBoost, Unsupervised Isolation Forest, and Topological Graph signals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ensemble Score:</span>
            <span
              className={`font-mono text-base font-bold px-2.5 py-0.5 rounded-md ${
                crossed
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {(compScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Contribution Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Supervised XGBoost */}
          <div className="bg-[#1E293B]/60 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Supervised XGBoost</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">50% wt</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-blue-400">
                {(supScore * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                contrib: +{(supScore * 0.50 * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, supScore * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Trained on ground-truth financial crime vectors & velocity patterns.
            </p>
          </div>

          {/* Isolation Forest Anomaly */}
          <div className="bg-[#1E293B]/60 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Behavioral Anomaly</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">25% wt</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-purple-400">
                {(anomScore * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                contrib: +{(anomScore * 0.25 * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, anomScore * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Unsupervised Isolation Forest measuring distance from user baseline.
            </p>
          </div>

          {/* Graph Intelligence */}
          <div className="bg-[#1E293B]/60 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Network className="w-3.5 h-3.5 text-amber-400" />
                <span>Graph Intelligence</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">25% wt</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-amber-400">
                {(graphScore * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                contrib: +{(graphScore * 0.25 * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, graphScore * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              NetworkX topological cycle detection, mule neighbor count & concentration.
            </p>
          </div>
        </div>

        {/* Alert Threshold Explanation & SHAP Clarity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-slate-200">
                <strong>Threshold Status: </strong>
                {composite?.threshold_reason ||
                  (crossed
                    ? `Transaction crossed alert threshold (65.0%) with composite score of ${(compScore * 100).toFixed(1)}%.`
                    : `Transaction remains below alert threshold (65.0%).`)}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {composite?.shap_scope_notice ||
                  "Notice: SHAP feature attributions explain the supervised XGBoost model specifically. The composite risk integrates XGBoost, Isolation Forest anomaly, and NetworkX topological signals."}
              </p>
            </div>
          </div>
        </div>

        {/* Why Did Risk Change? Baseline Comparison */}
        {riskDetail.risk_change_reason && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-blue-300">Why Did Risk Change?</span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {riskDetail.risk_change_reason}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. BANGLA-FRIENDLY ANALYST SUMMARY CARD (TOGGLEABLE) */}
      {showBangla && mfs && (
        <div className="bg-gradient-to-br from-slate-900 to-[#101b2b] border border-blue-500/30 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-300">
                বাংলা বিশ্লেষণ ও তদন্ত সারসংক্ষেপ (Analyst Briefing in Bangla)
              </h4>
            </div>
            <Badge variant="outline" className="border-blue-500/40 text-blue-300 text-xs">
              {mfs.typology_name_bn}
            </Badge>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-[#131f33] p-3 rounded-lg border border-slate-800">
            {mfs.bangla_summary}
          </p>
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-300">পরবর্তী তদন্ত পদক্ষেপ (Next Steps):</span>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              {mfs.what_to_investigate_next.map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ul>
          </div>
          <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
            {mfs.responsible_ai_disclaimer}
          </div>
        </div>
      )}

      {/* 4. "WHAT HAPPENED / WHY RISKY / WHAT TO INVESTIGATE NEXT" TRIAD CARD */}
      {mfs && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                Investigation Triage Triad
              </h3>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">
              {mfs.typology_name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What Happened */}
            <div className="bg-[#1E293B]/50 border border-slate-800/90 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>What Happened</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {mfs.what_happened}
              </p>
            </div>

            {/* Why Risky */}
            <div className="bg-[#1E293B]/50 border border-slate-800/90 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Why Risky</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {mfs.why_risky}
              </p>
            </div>

            {/* What to Investigate Next */}
            <div className="bg-[#1E293B]/50 border border-slate-800/90 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>What to Investigate Next</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {mfs.what_to_investigate_next.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Evidence Feature Badges */}
          {mfs.evidence_features && mfs.evidence_features.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                Evidence Signals:
              </span>
              {mfs.evidence_features.map((feat) => (
                <Badge
                  key={feat}
                  variant="outline"
                  className="bg-red-500/10 border-red-500/30 text-red-300 font-mono text-[10px] uppercase tracking-wider py-0.5 px-2"
                >
                  {feat.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
