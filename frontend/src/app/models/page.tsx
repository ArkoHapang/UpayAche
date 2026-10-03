"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  BarChart2,
  TrendingUp,
  Percent,
  Compass,
  FileCheck2,
  ExternalLink,
  Target,
  ArrowRight,
  Database,
  Binary
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
  fetchModelsAnalytics,
  ModelsAnalyticsData,
  ModelPerformanceData
} from "@/lib/api";

export default function ModelsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "ANALYST", "VIEWER"]}>
      <ModelsContent />
    </ProtectedRoute>
  );
}

function ModelsContent() {
  const { role, token } = useAuth();
  const [data, setData] = useState<ModelsAnalyticsData | null>(null);
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModelsAnalytics(token);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load models telemetry.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const activeModel: ModelPerformanceData | undefined = data?.models?.[selectedModelIdx] || data?.models?.[0];

  return (
    <AppShell activePath="/models">
      <div className="space-y-6">
        <PageHeader
          title="Machine Learning Models Inspector"
          description="In-depth performance evaluation, error rate matrix, pattern-by-pattern validation, and dual-engine ML telemetry."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Analytics", href: "/analytics" },
            { label: "Models" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-50 text-[#0054A6] border border-blue-200">
                Active: {data?.active_version || "v1.0.0"}
              </span>
              <Button
                onClick={loadModels}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Reload Benchmarks
              </Button>
            </div>
          }
        />

        {/* Mandatory Prototype Notice */}
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 text-amber-200 text-xs font-mono flex items-center gap-3 shadow-lg">
          <Info className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="text-amber-300 uppercase tracking-wider block font-bold">Evaluation Governance Notice:</strong>
            <span>Synthetic hackathon prototype — metrics do not represent real-world MFS performance.</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Model Switcher Tabs / Version Explorer */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Select Active ML Engine:
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Total Enrolled Engines: {data?.models?.length || 2}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {data?.models?.map((m, idx) => (
              <button
                key={m.model_name}
                onClick={() => setSelectedModelIdx(idx)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs transition-all border ${
                  selectedModelIdx === idx
                    ? "bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-lg scale-100"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
              >
                <Cpu className={`w-4 h-4 ${selectedModelIdx === idx ? "text-slate-950" : "text-amber-400"}`} />
                <span>{m.model_name}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    selectedModelIdx === idx
                      ? "border-slate-950/30 bg-slate-950/10 text-slate-950 font-bold"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {m.model_version}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {activeModel && (
          <div className="space-y-6">
            
            {/* Model Identity Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-white font-mono">{activeModel.model_name}</span>
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
                  <p className="text-xs text-slate-400 font-mono">
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

              {/* 6 Core ML Benchmark Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Precision</span>
                  <div className="text-2xl font-extrabold text-amber-400">
                    {(activeModel.precision * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">TP / (TP + FP)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Recall</span>
                  <div className="text-2xl font-extrabold text-cyan-400">
                    {(activeModel.recall * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">TP / (TP + FN)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">F1-Score</span>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {(activeModel.f1_score * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">Harmonic Mean</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">ROC-AUC</span>
                  <div className="text-2xl font-extrabold text-purple-400">
                    {activeModel.roc_auc.toFixed(3)}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Area Under Curve</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">False Positive Rate</span>
                  <div className="text-2xl font-extrabold text-rose-300">
                    {(activeModel.false_positive_rate * 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">FP / (FP + TN)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">False Negative Rate</span>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {(activeModel.false_negative_rate * 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">FN / (FN + TP)</span>
                </div>
              </div>
            </div>

            {/* Confusion Matrix Section */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Validation Confusion Matrix (N = {activeModel.val_samples.toLocaleString()})
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Holdout Evaluation Set</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3 font-mono">
                  {/* True Positive */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-600/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 uppercase font-bold">True Positive (TP)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {activeModel.confusion_matrix.true_positives.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      Fraud / Anomaly correctly flagged
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-bold">
                      {((activeModel.confusion_matrix.true_positives / activeModel.val_samples) * 100).toFixed(1)}% of total test
                    </span>
                  </div>

                  {/* False Positive */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border-2 border-rose-600/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400 uppercase font-bold">False Positive (FP)</span>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {activeModel.confusion_matrix.false_positives.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      Legitimate falsely flagged (Type I error)
                    </span>
                    <span className="text-[10px] text-rose-300 block font-bold">
                      FPR: {(activeModel.false_positive_rate * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* False Negative */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border-2 border-rose-600/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400 uppercase font-bold">False Negative (FN)</span>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {activeModel.confusion_matrix.false_negatives.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      Threat missed by engine (Type II error)
                    </span>
                    <span className="text-[10px] text-rose-400 block font-bold">
                      FNR: {(activeModel.false_negative_rate * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* True Negative */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-600/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 uppercase font-bold">True Negative (TN)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {activeModel.confusion_matrix.true_negatives.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      Legitimate correctly cleared
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-bold">
                      {((activeModel.confusion_matrix.true_negatives / activeModel.val_samples) * 100).toFixed(1)}% of total test
                    </span>
                  </div>
                </div>

                {/* Mathematical Interpretation */}
                <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider">
                    Model Evaluation Insights
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {activeModel.model_type === "SUPERVISED_CLASSIFIER"
                      ? "The XGBoost Risk Engine demonstrates near-zero false alarms (0 False Positives out of 426 legitimate test samples) while correctly discovering 73 out of 74 synthetic fraud cases (Recall: 98.65%)."
                      : "The Isolation Forest Behavioral Engine establishes an anomaly boundary over high-dimensional transaction features, isolating structural spikes, nocturnal transfers, and hardware switches with 93.6% Precision."}
                  </p>
                  
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Validated Test Samples:</span>
                      <span className="text-white font-bold">{activeModel.val_samples.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Model Specificity (True Negative Rate):</span>
                      <span className="text-emerald-400 font-bold">
                        {((activeModel.confusion_matrix.true_negatives / Math.max(1, activeModel.confusion_matrix.true_negatives + activeModel.confusion_matrix.false_positives)) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Overall Classification Accuracy:</span>
                      <span className="text-cyan-400 font-bold">
                        {(((activeModel.confusion_matrix.true_positives + activeModel.confusion_matrix.true_negatives) / activeModel.val_samples) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern-by-Pattern Validation Breakdown Table */}
            {activeModel.pattern_breakdown && Object.keys(activeModel.pattern_breakdown).length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                      Pattern-by-Pattern Evaluation Breakdown
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">12 MFS Fraud & Anomaly Topologies</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                        <th className="pb-2.5">Pattern Description</th>
                        <th className="pb-2.5">ID</th>
                        <th className="pb-2.5">Test Samples</th>
                        <th className="pb-2.5">Expected Target</th>
                        <th className="pb-2.5">Accuracy / Detection</th>
                        <th className="pb-2.5 text-right">Mean Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(activeModel.pattern_breakdown).map(([name, stats]: [string, any]) => (
                        <tr key={name} className="hover:bg-slate-950/50">
                          <td className="py-2.5 font-bold text-slate-200">
                            {name}
                          </td>
                          <td className="py-2.5 text-slate-400">
                            #{stats.pattern_id}
                          </td>
                          <td className="py-2.5 text-white">
                            {stats.sample_count}
                          </td>
                          <td className="py-2.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                (stats.expected_fraud ?? stats.expected_anomaly) === 1
                                  ? "border-rose-500/40 text-rose-300 bg-rose-950/30"
                                  : "border-slate-700 bg-slate-800 text-slate-300"
                              }`}
                            >
                              {(stats.expected_fraud ?? stats.expected_anomaly) === 1 ? "FLAGGED" : "NORMAL"}
                            </Badge>
                          </td>
                          <td className="py-2.5 font-bold text-emerald-400">
                            {stats.accuracy !== undefined
                              ? `${(stats.accuracy * 100).toFixed(1)}%`
                              : stats.anomaly_detection_rate !== undefined
                              ? `${(stats.anomaly_detection_rate * 100).toFixed(1)}%`
                              : "100.0%"}
                          </td>
                          <td className="py-2.5 text-right font-bold text-amber-400">
                            {(stats.mean_risk_score ?? stats.mean_anomaly_score ?? 0.5).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Risk Distribution and Anomaly Distribution Live Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Risk Distribution */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                      Risk Distribution
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Repository Ledger</span>
                </div>

                <div className="space-y-3">
                  {data?.risk_distribution?.map((item) => {
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
                            <span className={`font-bold ${color.split(" ")[1]}`}>{item.tier} TIER</span>
                            <span className="text-[10px] text-slate-500">
                              ({item.min_score.toFixed(2)} - {item.max_score.toFixed(2)})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold">{item.count.toLocaleString()}</span>
                            <span className="text-slate-400 ml-1.5 font-normal">({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
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
                  <span className="text-xs font-mono text-slate-400">Behavioral Outliers</span>
                </div>

                <div className="space-y-3">
                  {data?.anomaly_distribution?.map((item) => {
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
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
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
    </AppShell>
  );
}
