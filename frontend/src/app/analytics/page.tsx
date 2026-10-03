"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  Cpu,
  Layers,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderLock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Sliders,
  ExternalLink,
  Target,
  FileCheck2,
  AlertTriangle,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppShell,
  PageHeader,
  MetricCard,
  RiskBadge,
  StatusBadge,
} from "@/components/design-system";
import {
  fetchSystemAnalytics,
  fetchModelsAnalytics,
  SystemAnalyticsData,
  ModelsAnalyticsData,
  ModelPerformanceData
} from "@/lib/api";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "ANALYST", "VIEWER"]}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

function AnalyticsContent() {
  const { role, token } = useAuth();

  const [systemData, setSystemData] = useState<SystemAnalyticsData | null>(null);
  const [modelsData, setModelsData] = useState<ModelsAnalyticsData | null>(null);
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sys, mod] = await Promise.all([
        fetchSystemAnalytics(token),
        fetchModelsAnalytics(token),
      ]);
      setSystemData(sys);
      setModelsData(mod);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load operational analytics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const activeModel: ModelPerformanceData | undefined = modelsData?.models?.[selectedModelIdx] || modelsData?.models?.[0];

  return (
    <AppShell activePath="/analytics">
      <div className="space-y-6">
        <PageHeader
          title="Intelligence & Performance Analytics"
          description="Dual-engine machine learning evaluation telemetry & real-time platform investigation statistics."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Analytics" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                onClick={loadAnalytics}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Sync Telemetry
              </Button>
              <Button asChild size="sm" className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs">
                <Link href="/models">
                  <Cpu className="w-3.5 h-3.5 mr-1.5" />
                  Deep Models
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          }
        />

        {/* Mandatory Regulatory / Prototype Notice */}
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 text-amber-200 text-xs font-mono flex items-center gap-3 shadow-lg">
          <Info className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="text-amber-300 uppercase tracking-wider block font-bold">Mandatory Prototype Notice:</strong>
            <span>Synthetic hackathon prototype — metrics do not represent real-world MFS performance.</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 1: MODEL PERFORMANCE                                        */}
        {/* =================================================================== */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight uppercase font-mono">
                    Model Performance
                  </h2>
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-mono text-[10px]">
                    Validated ML Telemetry
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Precision, Recall, ROC-AUC, Error Rates, and Confusion Matrix evaluated against holdout synthetic test data.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-slate-800 text-slate-300 hover:text-white text-xs h-8">
              <Link href="/models">
                Inspect All Models ({modelsData?.models?.length || 2}) <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Model Versions Selector Tabs */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Model Versions & Deployment Target:
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Active Production Baseline: {modelsData?.active_version || "v1.0.0"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {modelsData?.models?.map((m, idx) => {
                const isSelected = selectedModelIdx === idx;
                return (
                  <button
                    key={m.model_name}
                    onClick={() => setSelectedModelIdx(idx)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs transition-all border ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-md scale-100"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <Cpu className={`w-4 h-4 ${isSelected ? "text-slate-950" : "text-amber-400"}`} />
                    <span>{m.model_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        isSelected
                          ? "border-slate-950/30 bg-slate-950/15 text-slate-950 font-bold"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {m.model_version}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {activeModel && (
            <div className="space-y-6">
              {/* Active Model Meta Header */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">{activeModel.model_name}</h3>
                      <Badge variant="outline" className="border-amber-400/40 bg-amber-950/40 text-amber-300 font-mono text-xs">
                        {activeModel.model_version}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${
                          activeModel.model_type === "SUPERVISED_CLASSIFIER"
                            ? "border-emerald-500/40 text-emerald-300 bg-emerald-950/30"
                            : "border-purple-500/40 text-purple-300 bg-purple-950/30"
                        }`}
                      >
                        {activeModel.model_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Algorithm: <strong className="text-white">{activeModel.algorithm}</strong> • Trained: {new Date(activeModel.trained_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">Training Cohort</span>
                      <span className="text-white font-bold">{activeModel.train_samples.toLocaleString()} samples</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">Validation Cohort</span>
                      <span className="text-amber-400 font-bold">{activeModel.val_samples.toLocaleString()} samples</span>
                    </div>
                  </div>
                </div>

                {/* 6 Core ML Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                  {/* Precision */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Precision</span>
                    <div className="text-2xl font-extrabold text-amber-400">
                      {(activeModel.precision * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block">TP / (TP + FP)</span>
                  </div>

                  {/* Recall */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Recall</span>
                    <div className="text-2xl font-extrabold text-cyan-400">
                      {(activeModel.recall * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block">TP / (TP + FN)</span>
                  </div>

                  {/* F1 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">F1-Score</span>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {(activeModel.f1_score * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block">Harmonic Mean</span>
                  </div>

                  {/* ROC-AUC */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">ROC-AUC</span>
                    <div className="text-2xl font-extrabold text-purple-400">
                      {activeModel.roc_auc.toFixed(3)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">Area Under Curve</span>
                  </div>

                  {/* False Positive Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">False Positive Rate</span>
                    <div className="text-2xl font-extrabold text-rose-300">
                      {(activeModel.false_positive_rate * 100).toFixed(2)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block">FP / (FP + TN)</span>
                  </div>

                  {/* False Negative Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">False Negative Rate</span>
                    <div className="text-2xl font-extrabold text-rose-400">
                      {(activeModel.false_negative_rate * 100).toFixed(2)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block">FN / (FN + TP)</span>
                  </div>
                </div>

                {/* Confusion Matrix Visualizer */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      Confusion Matrix (Holdout Validation Set N = {activeModel.val_samples.toLocaleString()})
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Actual vs Predicted Distribution</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    {/* True Positive */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-600/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold">True Positive (TP)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {activeModel.confusion_matrix.true_positives.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Correctly detected threats</span>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        {((activeModel.confusion_matrix.true_positives / activeModel.val_samples) * 100).toFixed(1)}% of test cohort
                      </span>
                    </div>

                    {/* False Positive */}
                    <div className="p-4 rounded-xl bg-rose-950/20 border-2 border-rose-600/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-rose-400 uppercase font-bold">False Positive (FP)</span>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {activeModel.confusion_matrix.false_positives.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Legitimate falsely flagged</span>
                      <span className="text-[10px] text-rose-300 font-bold block">
                        FPR: {(activeModel.false_positive_rate * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* False Negative */}
                    <div className="p-4 rounded-xl bg-rose-950/20 border-2 border-rose-600/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-rose-400 uppercase font-bold">False Negative (FN)</span>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {activeModel.confusion_matrix.false_negatives.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Threats missed by engine</span>
                      <span className="text-[10px] text-rose-400 font-bold block">
                        FNR: {(activeModel.false_negative_rate * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* True Negative */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-600/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold">True Negative (TN)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {activeModel.confusion_matrix.true_negatives.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Legitimate cleared</span>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        {((activeModel.confusion_matrix.true_negatives / activeModel.val_samples) * 100).toFixed(1)}% of test cohort
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distributions Grid: Risk Distribution & Anomaly Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        Risk Distribution
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Score Tier Partitions</span>
                  </div>

                  <div className="space-y-3">
                    {modelsData?.risk_distribution?.map((item) => {
                      const color =
                        item.tier === "CRITICAL"
                          ? "bg-rose-500 text-rose-400"
                          : item.tier === "HIGH"
                          ? "bg-amber-500 text-amber-400"
                          : item.tier === "MEDIUM"
                          ? "bg-yellow-500 text-yellow-400"
                          : "bg-emerald-500 text-emerald-400";

                      return (
                        <div key={item.tier} className="space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${color.split(" ")[1]}`}>{item.tier} RISK</span>
                              <span className="text-[10px] text-slate-500">
                                ({item.min_score.toFixed(2)} - {item.max_score.toFixed(2)})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-bold">{item.count.toLocaleString()}</span>
                              <span className="text-slate-400 ml-1.5 font-normal">({item.percentage}%)</span>
                            </div>
                          </div>

                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                            <div
                              className={`h-full rounded-full ${color.split(" ")[0]} transition-all duration-500`}
                              style={{ width: `${Math.max(2, item.percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Anomaly Distribution */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        Anomaly Distribution
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Behavioral Outlier Partitions</span>
                  </div>

                  <div className="space-y-3">
                    {modelsData?.anomaly_distribution?.map((item) => {
                      const isOutlier = item.category.includes("Outlier");
                      const barColor = isOutlier ? "bg-purple-500" : "bg-cyan-500";
                      const textColor = isOutlier ? "text-purple-300" : "text-cyan-300";

                      return (
                        <div key={item.category} className="space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${textColor}`}>{item.category}</span>
                            <div className="text-right">
                              <span className="text-white font-bold">{item.count.toLocaleString()}</span>
                              <span className="text-slate-400 ml-1.5 font-normal">({item.percentage}%)</span>
                            </div>
                          </div>

                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-500`}
                              style={{ width: `${Math.max(2, item.percentage)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Mean Anomaly Rating</span>
                            <span className="text-slate-400 font-bold">{item.mean_score.toFixed(4)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: SYSTEM / INVESTIGATION ANALYTICS                         */}
        {/* =================================================================== */}
        <div className="space-y-6 pt-4 border-t-2 border-slate-800/90">
          
          {/* Explicit Separation Banner */}
          <div className="p-4 rounded-xl border border-cyan-800/50 bg-cyan-950/20 text-cyan-200 text-xs font-mono flex items-start gap-3">
            <Scale className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 uppercase tracking-wider block font-bold">
                Clear Architecture Segregation: System vs ML Metrics
              </strong>
              <span className="text-slate-300 leading-relaxed block mt-0.5">
                The operational statistics below represent live platform transaction ledger processing, trigger rates, and human analyst investigation resolution lifecycles. They are strictly decoupled from the mathematical ML accuracy scores presented above.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase font-mono">
                  System / Investigation Analytics
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Real-time operational workflow throughput, triage pipeline velocity, and case resolutions.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-mono text-[10px]">
              Live Ledger Telemetry
            </Badge>
          </div>

          {/* 5 Required System Analytics Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Transactions Analyzed */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Transactions Analyzed</span>
              <div className="text-2xl font-extrabold text-white font-mono">
                {systemData?.transactions_analyzed ? systemData.transactions_analyzed.toLocaleString() : "2,497"}
              </div>
              <span className="text-[10px] text-cyan-400 font-mono block">
                ৳{systemData?.total_volume_analyzed_bdt ? (systemData.total_volume_analyzed_bdt / 1_000_000).toFixed(2) : "18.42"}M BDT Total
              </span>
            </div>

            {/* 2. Alerts Generated */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Alerts Generated</span>
              <div className="text-2xl font-extrabold text-rose-400 font-mono">
                {systemData?.alerts_generated ?? 184}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {systemData?.alert_rate_pct ?? "7.37"}% Alert trigger rate
              </span>
            </div>

            {/* 3. Investigations Created */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Investigations Created</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {systemData?.investigations_created ?? 6}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {systemData?.investigations_open ?? 1} Open / {systemData?.investigations_in_progress ?? 2} In Progress
              </span>
            </div>

            {/* 4. Investigations Closed */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Investigations Closed</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {systemData?.investigations_closed ?? 2}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {systemData?.resolution_rate_pct ?? "33.3"}% Case resolution rate
              </span>
            </div>

            {/* 5. Average Investigation Time */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Average Investigation Time</span>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">
                {systemData?.average_investigation_time_minutes ?? 18.5} <span className="text-sm font-normal text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">Triage to closure delta</span>
            </div>
          </div>

          {/* Lifecycle Case Breakdown Progress */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase tracking-wider">Investigation Lifecycle Breakdown</span>
              <span className="text-slate-500">{systemData?.investigations_created ?? 6} Platform Cases Enrolled</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-blue-400 uppercase block font-bold">Open Triage</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{systemData?.investigations_open ?? 1}</span>
                <span className="text-[10px] text-slate-500">Unassigned Alerts</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase block font-bold">Investigating</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{systemData?.investigations_in_progress ?? 2}</span>
                <span className="text-[10px] text-slate-500">Forensic in progress</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-purple-400 uppercase block font-bold">Reviewed</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{systemData?.investigations_reviewed ?? 1}</span>
                <span className="text-[10px] text-slate-500">Supervisor sign-off</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Closed</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{systemData?.investigations_closed ?? 2}</span>
                <span className="text-[10px] text-slate-500">Resolution signed</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
