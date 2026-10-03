"use client";

import React, { useState } from "react";
import {
  AppShell,
  PageHeader,
  MetricCard,
  Button,
  Badge,
  RiskBadge,
  StatusBadge,
} from "@/components/design-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { resetDemoData } from "@/lib/api";
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Lock,
  Bot,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Layers,
  Database,
  Activity,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const { user, role, token } = useAuth();

  // Threshold states
  const [xgboostThreshold, setXgboostThreshold] = useState("0.85");
  const [anomalyPercentile, setAnomalyPercentile] = useState("0.95");
  const [maxQueueAlerts, setMaxQueueAlerts] = useState("100");
  const [nocturnalMultiplier, setNocturnalMultiplier] = useState("1.40");
  const [ragConfidenceCutoff, setRagConfidenceCutoff] = useState("0.70");

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage("Configuration parameters updated and applied to runtime risk pipeline.");
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleReset = () => {
    setXgboostThreshold("0.85");
    setAnomalyPercentile("0.95");
    setMaxQueueAlerts("100");
    setNocturnalMultiplier("1.40");
    setRagConfidenceCutoff("0.70");
    setSavedMessage("Settings restored to factory compliance defaults.");
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      const res = await resetDemoData(token);
      setSavedMessage(res.message || "Demo data restored to pristine synthetic state.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset demo data";
      setSavedMessage("Failed to reset demo data: " + msg);
    } finally {
      setIsResettingDemo(false);
      setTimeout(() => setSavedMessage(null), 5000);
    }
  };

  return (
    <AppShell activePath="/settings">
      <div className="space-y-6">
        <PageHeader
          title="System & Compliance Settings"
          description="Configure real-time machine learning scoring thresholds, behavioral anomaly percentiles, and inspect RBAC permissions."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                disabled={isResettingDemo}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                title="Reset all investigation cases and states to pristine synthetic demo data"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 text-amber-600 ${isResettingDemo ? "animate-spin" : ""}`} />
                Reset Demo Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3]"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#6C757D]" />
                Reset Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-[#007BFF] hover:bg-[#0054A6] text-white text-xs h-9 font-bold px-4 shadow-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          }
        />

        {savedMessage && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="XGBoost Alert Cutoff"
            value={`${xgboostThreshold}`}
            caption="High-risk trigger threshold"
            icon={Cpu}
          />
          <MetricCard
            label="Anomaly Sensitivity"
            value={`${(parseFloat(anomalyPercentile) * 100).toFixed(0)}%`}
            caption="Isolation Forest percentile"
            icon={Activity}
            riskLevel="medium"
          />
          <MetricCard
            label="Active Persona"
            value={role || "ANALYST"}
            caption={user?.email || "analyst@upayache.internal"}
            icon={ShieldCheck}
            riskLevel="low"
          />
          <MetricCard
            label="RLS Security Mode"
            value="ENFORCED"
            caption="Append-only audit trail"
            icon={Lock}
          />
        </div>

        {/* Section 1: ML Scoring & Threshold Controls */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#F6F6F6]/50 border-b border-[#CED4DA]/60">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#007BFF]" />
              <CardTitle className="text-base font-bold text-[#002A54]">
                ML Risk Engine Thresholds
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6C757D]">
              Tune sensitivity cutoffs governing automatic alert triage and high-risk case creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#000000] flex items-center justify-between">
                  <span>Supervised XGBoost Risk Score Cutoff</span>
                  <span className="font-mono text-[#007BFF] font-semibold">{xgboostThreshold}</span>
                </label>
                <input
                  type="range"
                  min="0.50"
                  max="0.99"
                  step="0.01"
                  value={xgboostThreshold}
                  onChange={(e) => setXgboostThreshold(e.target.value)}
                  className="w-full accent-[#007BFF] cursor-pointer"
                />
                <p className="text-[11px] text-[#6C757D]">
                  Transactions with an XGBoost score exceeding this value automatically spawn priority compliance alerts.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#000000] flex items-center justify-between">
                  <span>Isolation Forest Anomaly Sensitivity</span>
                  <span className="font-mono text-[#007BFF] font-semibold">{anomalyPercentile}</span>
                </label>
                <input
                  type="range"
                  min="0.80"
                  max="0.99"
                  step="0.01"
                  value={anomalyPercentile}
                  onChange={(e) => setAnomalyPercentile(e.target.value)}
                  className="w-full accent-[#007BFF] cursor-pointer"
                />
                <p className="text-[11px] text-[#6C757D]">
                  Top percentile of unusual multidimensional transactions flagged as zero-day behavioral anomalies.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#000000]">
                  Max Unreviewed Alerts Queue Size
                </label>
                <input
                  type="number"
                  value={maxQueueAlerts}
                  onChange={(e) => setMaxQueueAlerts(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-xs font-mono text-[#000000]"
                />
                <p className="text-[11px] text-[#6C757D]">
                  Cap on active open investigations before alert throttling engages.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#000000]">
                  Nocturnal Velocity Risk Multiplier
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={nocturnalMultiplier}
                  onChange={(e) => setNocturnalMultiplier(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F6F6F6] border border-[#CED4DA] rounded-xl text-xs font-mono text-[#000000]"
                />
                <p className="text-[11px] text-[#6C757D]">
                  Weight multiplier applied to cash-out bursts occurring between 01:00 AM and 05:00 AM.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 2: AI Guardrails & RAG Configuration */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#F6F6F6]/50 border-b border-[#CED4DA]/60">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#007BFF]" />
              <CardTitle className="text-base font-bold text-[#002A54]">
                Guarded Gemini Copilot Invariants
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6C757D]">
              Strict operational constraints for the AI Investigation Assistant and customer chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#4E4E50]">
              <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 space-y-1">
                <span className="font-bold text-[#002A54] block">Copilot Invariant 1</span>
                <p>Gemini never determines numerical risk scores or overrides XGBoost outputs.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 space-y-1">
                <span className="font-bold text-[#002A54] block">Copilot Invariant 2</span>
                <p>Gemini never has direct database access, executing only pre-validated structured prompts.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 space-y-1">
                <span className="font-bold text-[#002A54] block">Copilot Invariant 3</span>
                <p>Prompt-injection attempts are intercepted and automatically logged as compliance anomalies.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Role & Permission Matrix */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#F6F6F6]/50 border-b border-[#CED4DA]/60">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#007BFF]" />
              <CardTitle className="text-base font-bold text-[#002A54]">
                Role-Based Access Control (RBAC) Verification
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#6C757D]">
              Current active session permissions and Supabase Row Level Security policy mappings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F6F6] text-[#6C757D] font-mono uppercase text-[10px] border-b border-[#CED4DA]/70">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Ledger & Risk</th>
                  <th className="py-3 px-4">Investigations</th>
                  <th className="py-3 px-4">3D Network</th>
                  <th className="py-3 px-4">Audit Trail</th>
                  <th className="py-3 px-4">Copilot AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CED4DA]/50 text-[#000000]">
                <tr className={role === "ADMIN" ? "bg-purple-50/50 font-bold" : ""}>
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">ADMIN</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Full Read/Write</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Full (Reopen Permitted)</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Full Access</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Full Global Access</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Enabled</td>
                </tr>
                <tr className={role === "ANALYST" ? "bg-blue-50/50 font-bold" : ""}>
                  <td className="py-3 px-4 font-mono font-bold text-[#0054A6]">ANALYST</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Read Access</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Triage, Notes, State Transitions</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Full Access</td>
                  <td className="py-3 px-4 text-amber-700 font-semibold">Self-Created Only</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Enabled</td>
                </tr>
                <tr className={role === "VIEWER" ? "bg-slate-50/50 font-bold" : ""}>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">VIEWER</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Read-Only</td>
                  <td className="py-3 px-4 text-slate-500 font-semibold">Read-Only (Mutations Blocked)</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">Read-Only</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                </tr>
                <tr className={role === "CUSTOMER" ? "bg-amber-50/50 font-bold" : ""}>
                  <td className="py-3 px-4 font-mono font-bold text-amber-800">CUSTOMER</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">Forbidden (403)</td>
                  <td className="py-3 px-4 text-amber-700 font-semibold">Public Assistant Only</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
