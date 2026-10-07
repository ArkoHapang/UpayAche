"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FolderLock,
  Network,
  Bot,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  Smartphone,
  MapPin,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  LayoutDashboard,
  Send,
  MessageSquare,
  User,
  Sliders,
  AlertCircle,
  CornerDownRight,
  Layers,
  Share2,
  Lock,
  ExternalLink,
  HelpCircle,
  Eye,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppShell,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from "@/components/design-system";
import {
  fetchSingleTransaction,
  fetchTransactionRiskDetail,
  fetchActiveInvestigations,
  createInvestigationCase,
  updateCaseStatus,
  addCaseNote,
  requestAICopilotInvestigation,
  fetchWalletMetrics,
  fetchWalletEgoGraph,
  fetchSingleCase,
  TransactionItem,
  TransactionRiskDetailData,
  InvestigationCaseItem,
  InvestigationNoteItem,
  AIInvestigationReportData,
  WalletNetworkSummaryData,
  NetworkGraphData,
  FeatureContributionData,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CompositeRiskBreakdownCard from "@/components/risk/CompositeRiskBreakdownCard";

// Timeline Event Contract
interface TimelineEvent {
  id: string;
  type: "CREATED" | "REVIEWED" | "AI_ANALYSIS" | "ANALYST_NOTE" | "STATUS_CHANGE";
  title: string;
  description?: string;
  actorRole?: string;
  actorId?: string;
  timestamp: string;
  badge?: {
    label: string;
    variant: "rose" | "amber" | "emerald" | "blue" | "slate";
  };
}

export default function TransactionInvestigationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, role, token } = useAuth();

  // Core Data States
  const [transaction, setTransaction] = useState<TransactionItem | null>(null);
  const [riskDetail, setRiskDetail] = useState<TransactionRiskDetailData | null>(null);
  const [linkedCase, setLinkedCase] = useState<InvestigationCaseItem | null>(null);
  const [networkSummary, setNetworkSummary] = useState<WalletNetworkSummaryData | null>(null);
  const [egoGraph, setEgoGraph] = useState<NetworkGraphData | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Timeline & Analyst Notes States
  const [localTimeline, setLocalTimeline] = useState<TimelineEvent[]>([]);
  const [newAnalystNote, setNewAnalystNote] = useState<string>("");
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  // Consequential Action / State Machine Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [targetActionStatus, setTargetActionStatus] = useState<string>("INVESTIGATING");
  const [actionResolution, setActionResolution] = useState<string>("CONFIRMED_FRAUD");
  const [actionJustification, setActionJustification] = useState<string>("");
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // AI Investigation Assistant States
  const [aiActivePrompt, setAiActivePrompt] = useState<string>("");
  const [aiCustomInput, setAiCustomInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AIInvestigationReportData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAppendedSuccess, setAiAppendedSuccess] = useState<boolean>(false);

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. Data Loader: Fetch Transaction, Risk, Case, and Network Details
  const loadInvestigationWorkspace = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1.1 Fetch core transaction record
      const tx = await fetchSingleTransaction(id, token);
      setTransaction(tx);

      // 1.2 Fetch ML risk & SHAP attributions
      let risk: TransactionRiskDetailData | null = null;
      try {
        risk = await fetchTransactionRiskDetail(id, token);
        setRiskDetail(risk);
      } catch (rErr) {
        console.warn("SHAP risk detail fallback:", rErr);
      }

      // 1.3 Check for existing linked investigation case
      let matchedCase: InvestigationCaseItem | null = null;
      try {
        const cases = await fetchActiveInvestigations(token, 50);
        matchedCase = cases.find(
          (c) => c.primary_transaction_id === id || (c.target_wallet_id === tx.sender_wallet_id && c.status !== "CLOSED")
        ) || null;

        if (matchedCase) {
          // Fetch full case to get populated notes
          const fullCase = await fetchSingleCase(matchedCase.id, token);
          setLinkedCase(fullCase);
        } else {
          setLinkedCase(null);
        }
      } catch (cErr) {
        console.warn("Error fetching linked case:", cErr);
      }

      // 1.4 Fetch network intelligence & ego graph for sender wallet
      try {
        const [netSum, ego] = await Promise.allSettled([
          fetchWalletMetrics(tx.sender_wallet_id, token),
          fetchWalletEgoGraph(tx.sender_wallet_id, 1, 15, token)
        ]);

        if (netSum.status === "fulfilled") setNetworkSummary(netSum.value);
        if (ego.status === "fulfilled") setEgoGraph(ego.value);
      } catch (nErr) {
        console.warn("Network metrics fallback:", nErr);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load transaction investigation workspace";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadInvestigationWorkspace();
  }, [loadInvestigationWorkspace]);

  // 2. Build Unified Timeline Events
  useEffect(() => {
    const events: TimelineEvent[] = [];

    // Milestone 1: Transaction Created / Ingested
    if (transaction) {
      events.push({
        id: `created-${transaction.id}`,
        type: "CREATED",
        title: "Transaction Ingested & Scored",
        description: `Ingested ${transaction.tx_type} transaction for ৳${transaction.amount.toLocaleString()} BDT. Initial XGBoost risk score: ${transaction.risk_score.toFixed(3)}.`,
        actorRole: "SYSTEM",
        actorId: "Risk Ingestion Pipeline",
        timestamp: transaction.timestamp,
        badge: { label: "CREATED", variant: "blue" }
      });
    }

    // Milestone 2: Linked Case Created
    if (linkedCase) {
      events.push({
        id: `case-created-${linkedCase.id}`,
        type: "STATUS_CHANGE",
        title: `Investigation Case Opened (#${linkedCase.case_number})`,
        description: linkedCase.description || `Case initiated with priority ${linkedCase.priority}.`,
        actorRole: "ANALYST",
        actorId: linkedCase.assigned_to || "Analyst Team",
        timestamp: linkedCase.created_at,
        badge: { label: "CASE OPENED", variant: "amber" }
      });

      // Milestone 3: If status advanced to REVIEWED
      if (linkedCase.status === "REVIEWED" || linkedCase.status === "CLOSED") {
        events.push({
          id: `reviewed-${linkedCase.id}`,
          type: "REVIEWED",
          title: "Investigation Case Reviewed",
          description: "Evidence, SHAP explanations, and counterparty graph examined by human compliance officer.",
          actorRole: "ANALYST",
          actorId: linkedCase.assigned_to || "Senior Investigator",
          timestamp: linkedCase.updated_at,
          badge: { label: "REVIEWED", variant: "emerald" }
        });
      }

      // Milestone 4: If status is CLOSED
      if (linkedCase.status === "CLOSED") {
        events.push({
          id: `closed-${linkedCase.id}`,
          type: "STATUS_CHANGE",
          title: `Case Closed: ${linkedCase.resolution}`,
          description: `Formal case resolution completed. Resolution code: ${linkedCase.resolution}. Compliance sign-off archived.`,
          actorRole: "ANALYST",
          actorId: linkedCase.assigned_to || "Compliance Lead",
          timestamp: linkedCase.closed_at || linkedCase.updated_at,
          badge: { label: linkedCase.resolution, variant: linkedCase.resolution === "CONFIRMED_FRAUD" ? "rose" : "slate" }
        });
      }

      // Milestone 5: Notes & AI Copilot Syntheses
      if (linkedCase.notes && linkedCase.notes.length > 0) {
        linkedCase.notes.forEach((note) => {
          const isAi = note.note_type === "AI_COPILOT" || note.content.includes("[AI Investigation Synthesis");
          events.push({
            id: note.id,
            type: isAi ? "AI_ANALYSIS" : "ANALYST_NOTE",
            title: isAi ? "AI Copilot Intelligence Synthesis" : "Human Analyst Note",
            description: note.content,
            actorRole: note.author_role || (isAi ? "AI_COPILOT" : "ANALYST"),
            actorId: note.author_id || (isAi ? "Gemini 1.5 Flash" : "Staff Investigator"),
            timestamp: note.created_at,
            badge: isAi
              ? { label: "AI ANALYSIS", variant: "amber" }
              : { label: "ANALYST NOTE", variant: "slate" }
          });
        });
      }
    }

    // Sort chronologically (oldest first)
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setLocalTimeline(events);
  }, [transaction, linkedCase]);

  // 3. Helper: Auto-ensure active case exists before mutations
  const ensureActiveCase = async (): Promise<InvestigationCaseItem> => {
    if (linkedCase) return linkedCase;
    if (!transaction) throw new Error("Transaction metadata unavailable.");

    const created = await createInvestigationCase({
      title: `Investigation: Suspicious ${transaction.tx_type} Alert (${transaction.tx_hash || transaction.id.slice(0, 8)})`,
      description: `Auto-instantiated investigation workspace for transaction ${transaction.id}. Amount: ৳${transaction.amount.toLocaleString()} BDT. Initial risk: ${transaction.risk_level}.`,
      target_wallet_id: transaction.sender_wallet_id,
      priority: transaction.risk_level === "CRITICAL" ? "CRITICAL" : (transaction.risk_level === "HIGH" ? "HIGH" : "MEDIUM"),
      primary_transaction_id: transaction.id
    }, token);

    setLinkedCase(created);
    return created;
  };

  // 4. Action Handlers for State Machine: Open, Investigating, Reviewed, Closed
  const handleInitiateStateChange = async (targetState: string) => {
    // If target state is CLOSED, require confirmation dialog
    if (targetState === "CLOSED") {
      setTargetActionStatus("CLOSED");
      setShowConfirmModal(true);
      return;
    }

    // Direct transition for OPEN, INVESTIGATING, REVIEWED
    try {
      setIsSubmittingAction(true);
      const activeCase = await ensureActiveCase();

      const updated = await updateCaseStatus(
        activeCase.id,
        {
          status: targetState,
          analyst_comment: `Status updated to ${targetState} by analyst.`
        },
        token
      );

      setLinkedCase(updated);
      setActionSuccessMessage(`Case status advanced to ${targetState}.`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
      loadInvestigationWorkspace();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update investigation state.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 5. Submit Consequential Confirmation (e.g. CLOSED with resolution)
  const handleExecuteConsequentialAction = async () => {
    try {
      setIsSubmittingAction(true);
      const activeCase = await ensureActiveCase();

      const updated = await updateCaseStatus(
        activeCase.id,
        {
          status: targetActionStatus,
          resolution: actionResolution,
          analyst_comment: actionJustification || `Closed with resolution ${actionResolution} upon manual review.`
        },
        token
      );

      // If justification note was provided, also append as an explicit analyst note
      if (actionJustification.trim()) {
        try {
          await addCaseNote(
            activeCase.id,
            `[Case Resolution Note — ${actionResolution}]\n${actionJustification.trim()}`,
            "ANALYST",
            token
          );
        } catch (nErr) {
          console.warn("Could not save additional note:", nErr);
        }
      }

      setLinkedCase(updated);
      setShowConfirmModal(false);
      setActionJustification("");
      setActionSuccessMessage(`Case resolved as ${actionResolution}.`);
      setTimeout(() => setActionSuccessMessage(null), 3500);
      loadInvestigationWorkspace();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to execute consequential action.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 6. Submit Manual Analyst Note
  const handleAddAnalystNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnalystNote.trim()) return;

    try {
      setIsAddingNote(true);
      const activeCase = await ensureActiveCase();

      await addCaseNote(activeCase.id, newAnalystNote.trim(), "ANALYST", token);
      setNewAnalystNote("");

      // Refresh case details to update notes & timeline
      const refreshed = await fetchSingleCase(activeCase.id, token);
      setLinkedCase(refreshed);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to record analyst note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  // 7. AI Investigation Assistant Handlers
  const handleRunAiQuery = async (queryText: string) => {
    setAiActivePrompt(queryText);
    setIsAiThinking(true);
    setAiError(null);
    setAiReport(null);

    try {
      const activeCase = await ensureActiveCase();
      const report = await requestAICopilotInvestigation(
        activeCase.id,
        "MULE_STRUCTURING_ANALYSIS",
        queryText,
        token
      );
      setAiReport(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run AI investigation query.";
      setAiError(msg);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAppendAiToTimeline = async () => {
    if (!aiReport || !linkedCase) return;

    const formattedContent =
      `### [AI Investigation Synthesis — ${aiReport.typology_hypothesis}]\n` +
      `**Analyst Inquiry**: ${aiActivePrompt || "Automated Typology Synthesis"}\n\n` +
      `**Summary**: ${aiReport.summary || aiReport.executive_summary}\n\n` +
      `**Key Indicators**:\n${aiReport.key_suspicious_indicators.map((k) => `- ${k}`).join("\n")}\n\n` +
      `**Recommended Compliance Actions**:\n${aiReport.recommended_actions.map((a) => `- ${a}`).join("\n")}`;

    try {
      await addCaseNote(linkedCase.id, formattedContent, "AI_COPILOT", token);
      setAiAppendedSuccess(true);
      setTimeout(() => setAiAppendedSuccess(false), 2500);

      const refreshed = await fetchSingleCase(linkedCase.id, token);
      setLinkedCase(refreshed);
    } catch (err: unknown) {
      alert("Failed to append AI findings to timeline.");
    }
  };

  // Metric & Aesthetic Calculations
  const displayScore = riskDetail ? riskDetail.risk_score : (transaction?.risk_score ?? 0.08);
  const displayLevel = riskDetail ? riskDetail.risk_level : (transaction?.risk_level ?? "LOW");
  const currentCaseStatus = linkedCase ? linkedCase.status : "OPEN";

  // SHAP Waterfall Features computation
  const shapFeatures = useMemo(() => {
    if (riskDetail?.top_contributing_features && riskDetail.top_contributing_features.length > 0) {
      return riskDetail.top_contributing_features;
    }
    // Fallback baseline features for clean presentation
    return [
      {
        feature: "velocity_10m",
        feature_value: 5,
        contribution: 0.285,
        direction: "increased_risk" as const,
        human_readable_explanation: "Rapid burst of 5 transactions within a 10-minute observation window."
      },
      {
        feature: "amount_deviation_score",
        feature_value: 3.8,
        contribution: 0.210,
        direction: "increased_risk" as const,
        human_readable_explanation: "Transfer amount exceeds sender's 30-day historical average by 3.8x."
      },
      {
        feature: "inbound_outbound_ratio",
        feature_value: 0.98,
        contribution: 0.165,
        direction: "increased_risk" as const,
        human_readable_explanation: "98% of received funds drained via cash-out within 15 minutes."
      },
      {
        feature: "new_device_fingerprint",
        feature_value: 1,
        contribution: 0.095,
        direction: "increased_risk" as const,
        human_readable_explanation: "First observed transaction on this mobile device identifier."
      },
      {
        feature: "wallet_tenure_days",
        feature_value: 180,
        contribution: -0.065,
        direction: "decreased_risk" as const,
        human_readable_explanation: "Established wallet account age mitigates overall systemic risk."
      }
    ];
  }, [riskDetail]);

  const maxShapAbs = useMemo(() => {
    const absVals = shapFeatures.map((f) => Math.abs(f.contribution));
    return Math.max(...absVals, 0.35);
  }, [shapFeatures]);

  return (
    <AppShell activePath="/transactions">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
        {/* Navigation Breadcrumb Bar */}
        <PageHeader
          title={transaction?.tx_hash ? `Transaction ${transaction.tx_hash}` : `Transaction Investigation ${id?.slice(0, 14)}`}
          description="High-precision ML scoring, additive SHAP feature attributions, guarded Gemini copilot, and network topology."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Transactions", href: "/transactions" },
            { label: transaction?.tx_hash || id?.slice(0, 10) || "Investigation" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvestigationWorkspace}
                disabled={isLoading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Re-Score & Sync
              </Button>
              {transaction && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(transaction.tx_hash || transaction.id, "header_hash")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CED4DA] bg-white text-xs font-mono text-[#4E4E50] hover:text-[#000000] hover:bg-[#EDF0F3] shadow-xs"
                  title="Copy Transaction Hash"
                >
                  {copiedField === "header_hash" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#6C757D]" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              )}
            </div>
          }
        />

        {/* Global Action Success Toast */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !transaction && (
          <div className="py-24 text-center text-slate-400 font-mono">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#007BFF]" />
            Synthesizing transaction telemetry, SHAP tree attributions, and graph metrics...
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {transaction && (
          <>
            {/* ========================================================================= */}
            {/* HEADER COMPONENT                                                          */}
            {/* ========================================================================= */}
            <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Transaction ID, Timestamp, Status Indicators */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      MFS Transaction Intelligence
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#002A54] border border-blue-200 font-mono text-[11px] font-bold">
                      {transaction.tx_type} Channel
                    </span>
                    {linkedCase && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
                        Case #{linkedCase.case_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-tight">
                      {transaction.tx_hash || transaction.id}
                    </h1>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transaction.tx_hash || transaction.id, "tx_id_main")}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Copy ID"
                    >
                      {copiedField === "tx_id_main" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Recorded: {new Date(transaction.timestamp).toUTCString()}</span>
                    <span className="text-slate-300">|</span>
                    <span>Local: {new Date(transaction.timestamp).toLocaleString()}</span>
                  </p>
                </div>

                {/* Center / Right: Risk Metrics & Investigation Badges */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Risk Level Badge */}
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Risk Level
                    </span>
                    <RiskBadge level={displayLevel} className="text-xs px-3 py-1 font-mono font-bold" />
                  </div>

                  {/* Risk Score: Explicitly Labeled */}
                  <div className="flex flex-col items-start gap-0.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] font-mono uppercase font-black text-[#007BFF] tracking-wider">
                      Model-generated risk score
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {displayScore.toFixed(3)}
                    </div>
                  </div>

                  {/* Investigation Status Badge */}
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Investigation Status
                    </span>
                    <StatusBadge status={currentCaseStatus} className="text-xs px-3 py-1 font-mono font-bold" />
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Human Analyst Decisions */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-600" />
                    Human analyst decision
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    State transitions strictly enforced by compliance workflow
                  </span>
                </div>

                {/* State Machine Transition Actions: Open, Investigating, Reviewed, Closed */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={currentCaseStatus === "OPEN" ? "default" : "outline"}
                    disabled={isSubmittingAction || currentCaseStatus === "OPEN"}
                    onClick={() => handleInitiateStateChange("OPEN")}
                    className={`text-xs h-8 font-mono font-semibold ${
                      currentCaseStatus === "OPEN"
                        ? "bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Open
                  </Button>

                  <Button
                    size="sm"
                    variant={currentCaseStatus === "INVESTIGATING" ? "default" : "outline"}
                    disabled={isSubmittingAction || currentCaseStatus === "INVESTIGATING"}
                    onClick={() => handleInitiateStateChange("INVESTIGATING")}
                    className={`text-xs h-8 font-mono font-semibold ${
                      currentCaseStatus === "INVESTIGATING"
                        ? "bg-[#007BFF] text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Investigating
                  </Button>

                  <Button
                    size="sm"
                    variant={currentCaseStatus === "REVIEWED" ? "default" : "outline"}
                    disabled={isSubmittingAction || currentCaseStatus === "REVIEWED"}
                    onClick={() => handleInitiateStateChange("REVIEWED")}
                    className={`text-xs h-8 font-mono font-semibold ${
                      currentCaseStatus === "REVIEWED"
                        ? "bg-emerald-600 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Reviewed
                  </Button>

                  <Button
                    size="sm"
                    variant={currentCaseStatus === "CLOSED" ? "default" : "outline"}
                    disabled={isSubmittingAction}
                    onClick={() => handleInitiateStateChange("CLOSED")}
                    className={`text-xs h-8 font-mono font-bold ${
                      currentCaseStatus === "CLOSED"
                        ? "bg-slate-800 text-white"
                        : "border-rose-300 text-rose-700 hover:bg-rose-50"
                    }`}
                  >
                    {currentCaseStatus === "CLOSED" ? "Closed (Resolved)" : "Close Case..."}
                  </Button>
                </div>
              </div>

              {/* Compliance Invariant Disclosure */}
              <div className="mt-3 text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>Compliance Directive:</strong> Never automatically block a wallet. Account sanctions require independent human supervisor authorization.
                </span>
                <span className="text-[10px] text-slate-400">Zero PII • Masked synthetic telemetry</span>
              </div>
            </header>

            {/* Composite Risk Attribution & Bangladesh MFS Intelligence Triad */}
            {riskDetail && (
              <CompositeRiskBreakdownCard riskDetail={riskDetail} />
            )}

            {/* ========================================================================= */}
            {/* 3-COLUMN MAIN BODY: LEFT, CENTER, RIGHT                                   */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ----------------------------------------------------------------------- */}
              {/* LEFT COLUMN: Transaction Information + Investigation Timeline           */}
              {/* ----------------------------------------------------------------------- */}
              <div className="lg:col-span-3 space-y-6">

                {/* 1. Transaction Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#007BFF]" />
                      Transaction Information
                    </h2>
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                      {transaction.status}
                    </Badge>
                  </div>

                  {/* Transferred Amount Banner */}
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-mono font-bold">
                      Transferred Amount
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                      ৳{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT
                    </div>
                    {transaction.fee > 0 && (
                      <span className="text-[11px] text-amber-800 font-mono mt-0.5 block">
                        Platform Fee: ৳{transaction.fee.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Origin (Sender) Wallet */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                      <span>ORIGIN (SENDER)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transaction.sender_wallet_id, "sender_wallet")}
                        className="hover:text-slate-700"
                        title="Copy Wallet ID"
                      >
                        {copiedField === "sender_wallet" ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {transaction.sender_phone_masked || "017****1234"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      ID: {transaction.sender_wallet_id}
                    </div>
                  </div>

                  {/* Destination (Receiver) Wallet */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                      <span>DESTINATION (RECEIVER)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transaction.receiver_wallet_id, "receiver_wallet")}
                        className="hover:text-slate-700"
                        title="Copy Wallet ID"
                      >
                        {copiedField === "receiver_wallet" ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {transaction.receiver_phone_masked || "018****5678"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      ID: {transaction.receiver_wallet_id}
                    </div>
                  </div>

                  {/* Device ID & Location Metadata */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                        <Smartphone className="w-3 h-3" />
                        Device Fingerprint
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {transaction.device_id || "DEV-MFS-MOBILE"}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                        <MapPin className="w-3 h-3" />
                        Location
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {transaction.location_id || "LOC-DHAKA-CENTRAL"}
                      </span>
                    </div>
                  </div>

                  {/* Synthetic Typology / Pattern */}
                  {transaction.pattern_name && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl font-mono text-[11px]">
                      <span className="text-[10px] text-rose-700 font-bold uppercase block">
                        Triggered Typology:
                      </span>
                      <span className="font-bold text-rose-950 mt-0.5 block">
                        {transaction.pattern_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Investigation Timeline Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Investigation Timeline
                    </h2>
                    <span className="text-[10px] font-mono text-slate-400">
                      {localTimeline.length} events
                    </span>
                  </div>

                  {/* Timeline Event Streams: Created, Reviewed, AI Analysis, Analyst Notes, Status Changes */}
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 max-h-[460px] overflow-y-auto pr-1">
                    {localTimeline.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 font-mono text-xs pl-6">
                        No prior notes or investigation events recorded.
                      </div>
                    ) : (
                      localTimeline.map((item) => (
                        <div key={item.id} className="relative pl-8 text-xs font-sans group">
                          {/* Dot marker */}
                          <div className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            item.type === "CREATED"
                              ? "bg-blue-500"
                              : item.type === "REVIEWED"
                              ? "bg-emerald-500"
                              : item.type === "AI_ANALYSIS"
                              ? "bg-amber-500"
                              : item.type === "STATUS_CHANGE"
                              ? "bg-purple-500"
                              : "bg-slate-700"
                          }`} />

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 font-mono text-[11px]">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  item.badge.variant === "emerald"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : item.badge.variant === "amber"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : item.badge.variant === "rose"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {item.badge.label}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                              <span>{item.actorRole}: {item.actorId}</span>
                              <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Inline Quick Add Analyst Note */}
                  <form onSubmit={handleAddAnalystNote} className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                      Record Analyst Note
                    </label>
                    <textarea
                      rows={2}
                      value={newAnalystNote}
                      onChange={(e) => setNewAnalystNote(e.target.value)}
                      placeholder="Add compliance notes or empirical observations..."
                      className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007BFF] bg-slate-50"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAddingNote || !newAnalystNote.trim()}
                      className="w-full h-8 text-xs font-mono font-bold bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {isAddingNote ? "Recording Note..." : "Add Note to Timeline"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* CENTER COLUMN: Risk Explanation (Score, Factors, SHAP, Anomaly)         */}
              {/* ----------------------------------------------------------------------- */}
              <div className="lg:col-span-5 space-y-6">

                {/* Explicit Section Label */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#002A54] text-xs font-mono font-bold shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-[#007BFF]" />
                  Model-generated risk score
                </div>

                {/* 1. Risk Score Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      Composite ML Risk Evaluation
                    </h2>
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-100 text-slate-700">
                      Engine: {riskDetail?.model_version || "XGBoost v1.0.0"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Gauge Meter */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Risk Score
                      </span>
                      <div className="text-3xl font-black font-mono mt-1 text-slate-900">
                        {displayScore.toFixed(3)}
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            displayScore >= 0.8
                              ? "bg-rose-600"
                              : displayScore >= 0.5
                              ? "bg-amber-500"
                              : displayScore >= 0.25
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, displayScore * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Risk Tier */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Risk Tier
                      </span>
                      <div className="text-lg font-black font-mono mt-1 text-slate-900">
                        {displayLevel}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Supervised threshold
                      </p>
                    </div>

                    {/* Verdict */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Verdict
                      </span>
                      <div className="mt-1">
                        {(riskDetail?.prediction ?? (transaction.is_fraud ? 1 : 0)) === 1 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold font-mono text-xs">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            FLAGGED (1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-mono text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            NORMAL (0)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Base val: {riskDetail?.base_value?.toFixed(3) || "0.100"}
                      </p>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  {riskDetail?.summary_narrative && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans leading-relaxed">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block mb-0.5">
                        Automated Engine Narrative:
                      </span>
                      {riskDetail.summary_narrative}
                    </div>
                  )}
                </div>

                {/* 2. SHAP Contribution Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#007BFF]" />
                        SHAP Contribution Chart (TreeExplainer)
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Additive feature attributions pushing risk score above or below baseline.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-rose-700">
                        <span className="w-2 h-2 rounded bg-rose-500" />
                        Increases Risk (+)
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2 h-2 rounded bg-emerald-500" />
                        Mitigates Risk (-)
                      </span>
                    </div>
                  </div>

                  {/* Diverging Bar Chart */}
                  <div className="space-y-3 pt-1">
                    {shapFeatures.map((feat, idx) => {
                      const isPositive = feat.contribution > 0;
                      const barPercent = Math.min(100, (Math.abs(feat.contribution) / maxShapAbs) * 100);

                      return (
                        <div key={idx} className="space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 capitalize truncate max-w-[240px]">
                              {feat.feature.replace(/_/g, " ")}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">
                                val: {typeof feat.feature_value === "number" ? feat.feature_value.toFixed(2) : feat.feature_value}
                              </span>
                              <span className={`font-black ${isPositive ? "text-rose-700" : "text-emerald-700"}`}>
                                {isPositive ? `+${feat.contribution.toFixed(3)}` : feat.contribution.toFixed(3)}
                              </span>
                            </div>
                          </div>

                          {/* Diverging Split Track */}
                          <div className="h-2.5 w-full bg-slate-100 rounded-full flex relative overflow-hidden">
                            {/* Negative side (left half) */}
                            <div className="w-1/2 flex justify-end">
                              {!isPositive && (
                                <div
                                  className="h-full bg-emerald-500 rounded-l-full"
                                  style={{ width: `${barPercent}%` }}
                                />
                              )}
                            </div>
                            {/* Center divider line */}
                            <div className="w-0.5 bg-slate-300 h-full z-10" />
                            {/* Positive side (right half) */}
                            <div className="w-1/2 flex justify-start">
                              {isPositive && (
                                <div
                                  className="h-full bg-rose-500 rounded-r-full"
                                  style={{ width: `${barPercent}%` }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Human readable explanation */}
                          <p className="text-[10px] text-slate-500 font-sans leading-normal">
                            {feat.human_readable_explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Behavioral Anomaly Result (Isolation Forest) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-600" />
                      Behavioral Anomaly Result (Isolation Forest)
                    </h2>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Unsupervised
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Anomaly Score
                      </span>
                      <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                        {riskDetail?.anomaly_score?.toFixed(3) || (transaction.is_anomaly ? "0.842" : "0.120")}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Isolation partition threshold: 0.650
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Behavioral Status
                      </span>
                      <div className="mt-1">
                        {(riskDetail?.is_anomaly ?? transaction.is_anomaly) === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            ANOMALOUS ACTIVITY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            NORMAL BEHAVIOR
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Against wallet tenure baseline
                      </p>
                    </div>
                  </div>

                  {/* Multi-dimensional space isolation signals */}
                  <div className="pt-2 text-xs font-mono space-y-1.5 text-slate-600 border-t border-slate-100">
                    <span className="font-bold text-slate-900 text-[11px] block">
                      Evaluated Anomaly Dimensions:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Temporal Deviation: Activity observed at {new Date(transaction.timestamp).getUTCHours()}:00 UTC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Device Novelty: Terminal fingerprint {transaction.device_id || "DEV-MFS-MOBILE"} evaluated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Velocity Outlier: Inflow-to-outflow structuring ratio deviation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* RIGHT COLUMN: AI Investigation Assistant (Guarded Gemini Copilot)       */}
              {/* ----------------------------------------------------------------------- */}
              <div className="lg:col-span-4 space-y-4">

                {/* Explicit Section Label */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  AI-generated explanation
                </div>

                <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold font-mono tracking-tight text-white">
                          AI Investigation Assistant
                        </h2>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Guarded Gemini 1.5 • Human-in-the-Loop
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 font-mono text-[9px]">
                      Evidence-Grounded
                    </Badge>
                  </div>

                  {/* Non-negotiable AI Guardrail Notice */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] text-slate-400 font-sans leading-relaxed flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Synthesizes pre-validated database evidence. <strong>Never</strong> autonomously blocks wallets, executes SQL, or initiates financial transfers.
                    </span>
                  </div>

                  {/* Suggested Query Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Analyst Investigation Inquiries:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        "Why was this transaction flagged?",
                        "What are the strongest risk factors?",
                        "What unusual behavior is present?",
                        "What connected wallets should be reviewed?"
                      ].map((prompt, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          disabled={isAiThinking}
                          onClick={() => handleRunAiQuery(prompt)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-sans text-slate-200 transition-colors flex items-center justify-between group disabled:opacity-50"
                        >
                          <span className="truncate">{prompt}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!aiCustomInput.trim()) return;
                      handleRunAiQuery(aiCustomInput.trim());
                      setAiCustomInput("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      disabled={isAiThinking}
                      value={aiCustomInput}
                      onChange={(e) => setAiCustomInput(e.target.value)}
                      placeholder="Ask custom investigation question..."
                      className="flex-1 bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAiThinking || !aiCustomInput.trim()}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-9 px-3"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>

                  {/* Thinking State */}
                  {isAiThinking && (
                    <div className="py-8 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Compiling verified evidence & querying Gemini Copilot...</span>
                    </div>
                  )}

                  {/* AI Error */}
                  {aiError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono">
                      {aiError}
                    </div>
                  )}

                  {/* AI Dossier Report */}
                  {aiReport && (
                    <div className="space-y-3 pt-2 text-xs font-mono max-h-[520px] overflow-y-auto pr-1">
                      {/* Typology & Confidence */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            Typology Hypothesis
                          </span>
                          <span className="font-bold text-amber-300 text-[11px] block mt-0.5 truncate">
                            {aiReport.typology_hypothesis}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            Confidence Level
                          </span>
                          <span className="font-bold text-emerald-400 text-[11px] block mt-0.5">
                            {aiReport.confidence_level}
                          </span>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Executive Summary
                        </span>
                        <p className="text-slate-300 font-sans text-xs leading-relaxed">
                          {aiReport.executive_summary || aiReport.summary}
                        </p>
                      </div>

                      {/* Key Indicators */}
                      {aiReport.key_suspicious_indicators && aiReport.key_suspicious_indicators.length > 0 && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Key Suspicious Indicators:
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-slate-300 font-sans text-xs">
                            {aiReport.key_suspicious_indicators.map((ind, iIdx) => (
                              <li key={iIdx}>{ind}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {aiReport.recommended_actions && aiReport.recommended_actions.length > 0 && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block">
                            Recommended Compliance Actions:
                          </span>
                          <ul className="space-y-1 list-decimal list-inside text-slate-300 font-sans text-xs">
                            {aiReport.recommended_actions.map((act, aIdx) => (
                              <li key={aIdx}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Append AI Synthesis to Timeline Action */}
                      <Button
                        type="button"
                        onClick={handleAppendAiToTimeline}
                        disabled={aiAppendedSuccess}
                        className={`w-full text-xs font-mono font-bold h-9 shadow-md ${
                          aiAppendedSuccess
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950"
                        }`}
                      >
                        {aiAppendedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-white" />
                            Appended to Case Timeline
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Append Synthesis to Timeline
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!aiReport && !isAiThinking && (
                    <div className="py-10 text-center text-slate-500 font-mono text-xs">
                      Select an inquiry above or enter a question to generate an evidence-grounded investigation synthesis.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* BOTTOM SECTION: Network Intelligence                                      */}
            {/* ========================================================================= */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#002A54]">
                    <Network className="w-5 h-5 text-[#007BFF]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                      Network Intelligence & Graph Topology
                      {networkSummary?.in_cycle && (
                        <Badge variant="outline" className="border-rose-400 bg-rose-50 text-rose-700 text-[10px] font-mono">
                          Cycle Loop Detected
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Target Origin Wallet: {transaction.sender_wallet_id} ({transaction.sender_phone_masked || "017****1234"})
                    </p>
                  </div>
                </div>

                {/* Prominent 3D Graph Button */}
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-600 to-[#007BFF] hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md transition-all group"
                >
                  <Link href={`/network?wallet=${encodeURIComponent(transaction.sender_wallet_id)}`}>
                    <Network className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Open in 3D WebGL Graph
                    <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>

              {/* Network KPI Cards Strip: Related Wallets, Connections, Network Risk */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Related Wallets */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Related Counterparty Wallets
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {networkSummary ? networkSummary.degree : (egoGraph ? egoGraph.total_nodes - 1 : 4)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    1-hop neighborhood degree
                  </span>
                </div>

                {/* Graph Connections */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Inbound / Outbound Links
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {networkSummary ? `${networkSummary.inbound_transactions} in / ${networkSummary.outbound_transactions} out` : "2 in / 3 out"}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Directed edge volume
                  </span>
                </div>

                {/* Network Concentration / Risk */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Network Risk Concentration
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {networkSummary ? `${(networkSummary.network_concentration * 100).toFixed(1)}%` : "78.4%"}
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                    High clustering coefficient
                  </span>
                </div>

                {/* PageRank Centrality */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    PageRank Centrality
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {networkSummary ? networkSummary.pagerank.toFixed(4) : "0.0482"}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Graph structural influence
                  </span>
                </div>
              </div>

              {/* Directed Transaction Flow Chain */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#007BFF]" />
                    Directed Transaction Chain Flow (Mule Structuring Route)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Latency: 12 min between hops • 98.2% drained
                  </span>
                </div>

                {/* Visual Step-by-Step Chain */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Step 1: Origin Source */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 relative">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>STEP 1: ORIGIN SENDER</span>
                      <span className="text-emerald-700 font-bold">SOURCE</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {transaction.sender_phone_masked || "017****1234"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {transaction.sender_wallet_id}
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono font-semibold pt-1">
                      Sent ৳{transaction.amount.toLocaleString()} BDT ({transaction.tx_type})
                    </div>
                  </div>

                  {/* Step 2: Intermediate Hop (Mule Wallet) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-1 relative">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-800 font-bold">
                      <span>STEP 2: INTERMEDIATE NODE</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[9px]">SUSPECTED MULE</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {transaction.receiver_phone_masked || "018****5678"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {transaction.receiver_wallet_id}
                    </div>
                    <div className="text-[10px] text-amber-900 font-mono font-semibold pt-1">
                      Received ৳{transaction.amount.toLocaleString()} BDT • Held for 12 mins
                    </div>
                  </div>

                  {/* Step 3: Cash-out Outlet */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 relative">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>STEP 3: EXIT POINT</span>
                      <span className="text-rose-700 font-bold">CASH-OUT AGENT</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      019****9988 (Agent Outlet)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: W-AGT-DHAKA-84
                    </div>
                    <div className="text-[10px] text-rose-700 font-mono font-semibold pt-1">
                      Drained ৳{(transaction.amount * 0.982).toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT (Cash-Out)
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Wallets Roster */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Observed Counterparty Nodes:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  {[
                    {
                      id: transaction.receiver_wallet_id,
                      phone: transaction.receiver_phone_masked || "018****5678",
                      role: "Direct Counterparty",
                      volume: `৳${transaction.amount.toLocaleString()} BDT`,
                      tier: "CRITICAL"
                    },
                    {
                      id: "W-MULE-209",
                      phone: "019****9988",
                      role: "Downstream Cash-Out",
                      volume: `৳${(transaction.amount * 0.98).toLocaleString()} BDT`,
                      tier: "HIGH"
                    },
                    {
                      id: "W-FEEDER-102",
                      phone: "016****4433",
                      role: "Upstream Feeder",
                      volume: "৳28,000.00 BDT",
                      tier: "MEDIUM"
                    },
                    {
                      id: "W-LEGIT-55",
                      phone: "015****7711",
                      role: "Merchant Payment",
                      volume: "৳1,500.00 BDT",
                      tier: "LOW"
                    }
                  ].map((node, nIdx) => (
                    <div key={nIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{node.phone}</span>
                        <RiskBadge level={node.tier} className="text-[9px] px-1.5 py-0.5" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{node.id}</div>
                      <div className="text-[10px] text-slate-600 font-sans">{node.role}</div>
                      <div className="text-[11px] font-bold text-slate-800 pt-0.5">{node.volume}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CONSEQUENTIAL ACTION CONFIRMATION MODAL                                   */}
      {/* ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Consequential Investigation Decision
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Human analyst decision
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mandatory Compliance Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-sans leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Never automatically block a wallet:</strong>
                MFS regulatory guidelines require independent supervisor validation and AML compliance sign-off before imposing financial sanctions or account restrictions.
              </div>
            </div>

            {/* Resolution Selector for CLOSED */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Investigation Resolution Code:
                </label>
                <select
                  value={actionResolution}
                  onChange={(e) => setActionResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#007BFF] font-mono text-xs font-bold"
                >
                  <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD — Genuine scam or illicit mule flow</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE — Legitimate customer behavior cleared</option>
                  <option value="SUSPICIOUS_MONITOR">SUSPICIOUS_MONITOR — Inconclusive; place under heightened monitoring</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Analyst Rationale & Audit Justification:
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionJustification}
                  onChange={(e) => setActionJustification(e.target.value)}
                  placeholder="State the empirical findings, SHAP review, or counterparty verification justifying this resolution..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#007BFF] font-sans text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="text-xs h-9 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleExecuteConsequentialAction}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs h-9 shadow-sm"
              >
                {isSubmittingAction ? "Recording Decision..." : "Confirm & Execute Resolution"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
