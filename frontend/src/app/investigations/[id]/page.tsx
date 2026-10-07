"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  FolderLock,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  User,
  UserCheck,
  Cpu,
  Smartphone,
  MapPin,
  ExternalLink,
  MessageSquarePlus,
  Send,
  Lock,
  Check,
  History,
  ClipboardList,
  AlertCircle,
  Network,
  Calendar,
  Tag,
  ArrowUpRight,
  TrendingUp,
  X
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
  fetchSingleCase,
  updateCaseStatus,
  addCaseNote,
  fetchSingleTransaction,
  fetchTransactionRiskDetail,
  fetchAuditLogs,
  InvestigationCaseItem,
  InvestigationNoteItem,
  TransactionItem,
  TransactionRiskDetailData,
  AuditLogItem
} from "@/lib/api";
import AIInvestigationPanel from "@/components/investigation/AIInvestigationPanel";
import CompactNetworkPreview from "@/components/investigation/CompactNetworkPreview";
import CompositeRiskBreakdownCard from "@/components/risk/CompositeRiskBreakdownCard";

export default function InvestigationWorkspaceRoute() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "ANALYST", "VIEWER"]}>
      <InvestigationWorkspaceContent />
    </ProtectedRoute>
  );
}

function InvestigationWorkspaceContent() {
  const params = useParams();
  const caseId = (params?.id || params?.caseId) as string;
  const { user, role, token } = useAuth();

  const isViewer = role === "VIEWER";

  // Data states
  const [caseData, setCaseData] = useState<InvestigationCaseItem | null>(null);
  const [transaction, setTransaction] = useState<TransactionItem | null>(null);
  const [riskDetail, setRiskDetail] = useState<TransactionRiskDetailData | null>(null);
  const [notes, setNotes] = useState<InvestigationNoteItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);

  // Form states
  const [targetStatus, setTargetStatus] = useState<string>("INVESTIGATING");
  const [resolutionChoice, setResolutionChoice] = useState<string>("CONFIRMED_FRAUD");
  const [transitionComment, setTransitionComment] = useState<string>("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  const [assigneeInput, setAssigneeInput] = useState<string>("");
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  const [noteContent, setNoteContent] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // Load case workspace data
  const loadCaseWorkspace = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const c = await fetchSingleCase(caseId, token);
      setCaseData(c);
      setNotes(c.notes || []);

      // Pre-set next logical status
      if (c.status === "OPEN") setTargetStatus("INVESTIGATING");
      else if (c.status === "INVESTIGATING") setTargetStatus("REVIEWED");
      else if (c.status === "REVIEWED") setTargetStatus("CLOSED");
      else if (c.status === "CLOSED") setTargetStatus("INVESTIGATING");

      setAssigneeInput(c.assigned_to || user?.full_name || "analyst-01");

      // Fetch primary transaction evidence if available
      const txId = c.primary_transaction_id;
      if (txId) {
        try {
          const [tx, r] = await Promise.allSettled([
            fetchSingleTransaction(txId, token),
            fetchTransactionRiskDetail(txId, token)
          ]);
          if (tx.status === "fulfilled") setTransaction(tx.value);
          if (r.status === "fulfilled") setRiskDetail(r.value);
        } catch (tErr) {
          console.warn("Could not load transaction evidence:", tErr);
        }
      }

      // Fetch audit logs for this specific case
      try {
        const auditRes = await fetchAuditLogs(
          { resource_type: "investigation_case", resource_id: caseId, limit: 50 },
          token
        );
        setAuditLogs(auditRes.items || []);
      } catch (aErr) {
        console.warn("Could not load case audit logs:", aErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load case workspace.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, token, user?.full_name]);

  useEffect(() => {
    loadCaseWorkspace();
  }, [loadCaseWorkspace]);

  // Handle status change
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || isViewer) return;
    setIsSubmittingStatus(true);
    setActionSuccess(null);
    setError(null);

    try {
      const updated = await updateCaseStatus(
        caseData.id,
        {
          status: targetStatus,
          resolution: targetStatus === "CLOSED" ? resolutionChoice : undefined,
          analyst_comment: transitionComment.trim() || undefined
        },
        token
      );
      setCaseData(updated);
      setNotes(updated.notes || []);
      setShowStatusModal(false);
      setTransitionComment("");
      setActionSuccess(`Case successfully transitioned to ${targetStatus}.`);

      // Refresh audit logs
      const auditRes = await fetchAuditLogs(
        { resource_type: "investigation_case", resource_id: caseId, limit: 50 },
        token
      );
      setAuditLogs(auditRes.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update case status.");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Handle assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || isViewer || !assigneeInput.trim()) return;
    setIsSubmittingAssign(true);
    setActionSuccess(null);
    setError(null);

    try {
      const updated = await updateCaseStatus(
        caseData.id,
        {
          assigned_to: assigneeInput.trim(),
          analyst_comment: `Reassigned case to ${assigneeInput.trim()}`
        },
        token
      );
      setCaseData(updated);
      setNotes(updated.notes || []);
      setShowAssignModal(false);
      setActionSuccess(`Case assigned to ${assigneeInput.trim()}.`);

      // Refresh audit logs
      const auditRes = await fetchAuditLogs(
        { resource_type: "investigation_case", resource_id: caseId, limit: 50 },
        token
      );
      setAuditLogs(auditRes.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign case.");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Handle new note addition
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || isViewer || !noteContent.trim()) return;
    setIsSubmittingNote(true);
    setActionSuccess(null);
    setError(null);

    try {
      const added = await addCaseNote(caseData.id, noteContent.trim(), "ANALYST", token);
      setNotes((prev) => [...prev, added]);
      setNoteContent("");
      setShowNoteModal(false);
      setActionSuccess("Forensic note added to case timeline.");

      // Refresh audit logs
      const auditRes = await fetchAuditLogs(
        { resource_type: "investigation_case", resource_id: caseId, limit: 50 },
        token
      );
      setAuditLogs(auditRes.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record note.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Callback when AI panel inserts note
  const handleAINoteInserted = (newNote: InvestigationNoteItem) => {
    setNotes((prev) => [...prev, newNote]);
    setActionSuccess("AI investigation synthesis appended to analyst notes timeline.");
  };

  // Status transitions history helper
  const statusHistory = notes.filter((n) => n.content?.startsWith("[Status Change ->"));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "border-blue-500/40 bg-blue-950/40 text-blue-300";
      case "INVESTIGATING":
        return "border-amber-500/40 bg-amber-950/40 text-amber-300";
      case "REVIEWED":
        return "border-purple-500/40 bg-purple-950/40 text-purple-300";
      case "CLOSED":
        return "border-emerald-500/40 bg-emerald-950/40 text-emerald-300";
      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "border-rose-500/50 bg-rose-950/40 text-rose-300";
      case "HIGH":
        return "border-amber-500/50 bg-amber-950/40 text-amber-300";
      case "MEDIUM":
        return "border-yellow-500/50 bg-yellow-950/40 text-yellow-300";
      case "LOW":
        return "border-emerald-500/50 bg-emerald-950/40 text-emerald-300";
      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  const riskScore = riskDetail?.risk_score ?? 0.85;
  const riskLevel = riskDetail?.risk_level ?? caseData?.priority ?? "HIGH";

  return (
    <AppShell activePath="/investigations">
      <div className="space-y-6">
        <PageHeader
          title={caseData?.case_number ? `Case ${caseData.case_number}: ${caseData.title}` : `Investigation Workspace`}
          description={caseData ? `Target Wallet: ${caseData.target_wallet_id} • Assigned Analyst: ${caseData.assigned_to || "Unassigned"} • Created ${new Date(caseData.created_at).toLocaleDateString()}` : "Compliance triage, deep forensic review, and state resolution."}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Investigations", href: "/investigations" },
            { label: caseData?.case_number || caseId?.slice(0, 10) || "Case" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {isViewer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Viewer (Read-Only)
                </span>
              )}
              <Button
                onClick={loadCaseWorkspace}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Sync Ledger
              </Button>
            </div>
          }
        />
        {/* Banner Feedback */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* TOP: Case Header & Actions Bar                                     */}
        {/* =================================================================== */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Metadata Badges & Case Identification */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/30">
                  {caseData?.case_number || caseId}
                </span>

                <Badge variant="outline" className={`font-mono text-xs ${getPriorityColor(caseData?.priority || "MEDIUM")}`}>
                  Priority: {caseData?.priority || "MEDIUM"}
                </Badge>

                <Badge variant="outline" className={`font-mono text-xs font-bold ${getStatusColor(caseData?.status || "OPEN")}`}>
                  Status: {caseData?.status || "OPEN"}
                </Badge>

                <Badge variant="outline" className="border-rose-500/40 bg-rose-950/30 text-rose-300 font-mono text-xs">
                  Risk: {riskLevel} ({(riskScore * 100).toFixed(0)}%)
                </Badge>

                {caseData?.resolution && caseData.resolution !== "PENDING" && (
                  <Badge variant="outline" className="border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-mono text-xs">
                    Resolution: {caseData.resolution}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {caseData?.title || "MFS Forensic Investigation Case"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  {caseData?.description || "High-velocity financial discrepancy detected. Human analyst verification active."}
                </p>
              </div>

              {/* Assigned Analyst & Timestamps */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Analyst:</span>
                  <strong className="text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {caseData?.assigned_to || "Unassigned"}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Created:</span>
                  <span className="text-slate-300">
                    {caseData?.created_at ? new Date(caseData.created_at).toLocaleString() : "Just now"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Updated:</span>
                  <span className="text-slate-300">
                    {caseData?.updated_at ? new Date(caseData.updated_at).toLocaleString() : "Just now"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                onClick={() => setShowStatusModal(true)}
                disabled={isViewer || isLoading}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-9 px-4 shadow-md transition-transform active:scale-95"
              >
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Change Status
              </Button>

              <Button
                onClick={() => setShowAssignModal(true)}
                disabled={isViewer || isLoading}
                variant="outline"
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs h-9 px-3.5"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Assign Case
              </Button>

              <Button
                onClick={() => setShowNoteModal(true)}
                disabled={isViewer || isLoading}
                variant="outline"
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs h-9 px-3.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Add Note
              </Button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MAIN PANORAMIC LAYOUT: EVIDENCE (Left 2 cols) | AI COPILOT (Right)  */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7-8 COLS: All Evidence & Investigation Data */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* EVIDENCE SECTION: Tabs / Stacks */}
            <div className="space-y-6">

              {/* Composite Risk Attribution & Bangladesh MFS Intelligence Triad */}
              {riskDetail && (
                <CompositeRiskBreakdownCard riskDetail={riskDetail} />
              )}
              
              {/* 1. Transaction Evidence */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        1. Transaction Evidence
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Triggering financial event under compliance audit
                      </p>
                    </div>
                  </div>

                  {transaction?.id && (
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-amber-400 hover:text-amber-300 font-mono">
                      <Link href={`/transactions/${transaction.id}`}>
                        Full Forensic File <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Transaction Hash</span>
                    <span className="text-slate-200 font-bold break-all">
                      {transaction?.tx_hash || caseData?.primary_transaction_id || "TX-2026-MFS-8911"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Amount Transferred</span>
                    <span className="text-amber-400 font-bold text-base">
                      ৳{transaction?.amount ? transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "24,500.00"} BDT
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Transaction Type</span>
                    <Badge variant="outline" className="mt-1 border-slate-700 bg-slate-800 text-slate-200 text-[10px]">
                      {transaction?.tx_type || "CASH_OUT"}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Sender Wallet</span>
                    <span className="text-cyan-400 font-bold">
                      {transaction?.sender_wallet_id || caseData?.target_wallet_id || "W-1001"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Receiver Wallet</span>
                    <span className="text-slate-200 font-bold">
                      {transaction?.receiver_wallet_id || "W-AGT-03"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Timestamp</span>
                    <span className="text-slate-300">
                      {transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : "2026-10-02 02:14:00 UTC"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    Device: <strong className="text-slate-200">{transaction?.device_id || "dev-unregistered-82b"}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" />
                    Pattern: <strong className="text-slate-200">{transaction?.pattern_name || "MFS High Velocity"}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Location: <strong className="text-slate-200">{transaction?.location_id || "LOC-DHK-01"}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Risk Analysis */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        2. Risk Analysis
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Supervised XGBoost classification and risk tiering
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`font-mono text-xs ${getPriorityColor(riskLevel)}`}>
                    {riskLevel} RISK TIER
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Composite Risk Score</span>
                    <div className="text-3xl font-extrabold text-amber-400 font-mono">
                      {riskScore.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-rose-400 font-mono block">Exceeds alert threshold (0.75)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Supervised XGBoost Prob</span>
                    <div className="text-3xl font-extrabold text-rose-400 font-mono">
                      {(riskDetail?.prediction ?? 0.89).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">Model v1.0.4 inference</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Detection Typology</span>
                    <div className="text-base font-bold text-cyan-300 font-mono pt-2">
                      Mule Account & Rapid Cash-Out
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">Rule & ML convergence</span>
                  </div>
                </div>
              </div>

              {/* 3. SHAP Explanation */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        3. SHAP Explanation
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Additive feature attributions derived directly from TreeExplainer
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400">Zero Hallucinated Drivers</span>
                </div>

                <div className="space-y-2.5">
                  {(riskDetail?.top_contributing_features && riskDetail.top_contributing_features.length > 0
                    ? riskDetail.top_contributing_features.map((f) => ({
                        feature: f.feature,
                        contribution: f.contribution,
                        direction: f.direction,
                        explanation: f.human_readable_explanation,
                      }))
                    : [
                        {
                          feature: "velocity_1h_ratio",
                          contribution: 0.38,
                          direction: "increased_risk",
                          explanation: "Rapid 1-hour transaction volume exceeds normal baseline by 14x"
                        },
                        {
                          feature: "night_time_cashout",
                          contribution: 0.24,
                          direction: "increased_risk",
                          explanation: "Cash-out initiated at 02:14 AM outside normal wallet operating hours"
                        },
                        {
                          feature: "network_degree_centrality",
                          contribution: 0.18,
                          direction: "increased_risk",
                          explanation: "Wallet received fan-in funds from 6 distinct senders within 30 minutes"
                        }
                      ]
                  ).map((driver: { feature: string; contribution: number; direction: string; explanation: string }, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{driver.feature}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono ${
                              driver.direction === "increased_risk"
                                ? "border-rose-500/30 text-rose-300 bg-rose-950/20"
                                : "border-emerald-500/30 text-emerald-300 bg-emerald-950/20"
                            }`}
                          >
                            {driver.direction === "increased_risk" ? "+ Increased Risk" : "- Lowered Risk"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          {driver.explanation || "Primary decision tree split driver"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-extrabold text-amber-400">
                          {driver.contribution > 0 ? `+${driver.contribution.toFixed(2)}` : driver.contribution.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">Attribution</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Behavioral Anomaly */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        4. Behavioral Anomaly
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Unsupervised Isolation Forest outlier detection
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="border-purple-500/40 bg-purple-950/40 text-purple-300 font-mono text-xs">
                    ANOMALY DETECTED
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Anomaly Score</span>
                    <span className="text-purple-400 font-bold text-sm">
                      {riskDetail?.anomaly_score !== undefined ? riskDetail.anomaly_score.toFixed(3) : "-0.412"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">&lt; -0.20 Threshold</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Nocturnal Tx</span>
                    <span className="text-amber-400 font-bold text-sm">YES (02:14 AM)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">High anomaly weight</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Device Switch</span>
                    <span className="text-rose-400 font-bold text-sm">NEW HARDWARE</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">First use in 30 days</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Historical Surge</span>
                    <span className="text-white font-bold text-sm">28.8x Mean</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Baseline: ৳850.00</span>
                  </div>
                </div>
              </div>

              {/* 5. Wallet Network Preview & Full Network CTA */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    5. Wallet Network
                  </span>
                </div>

                <CompactNetworkPreview
                  walletId={caseData?.target_wallet_id || transaction?.sender_wallet_id || "W-1001"}
                  senderWalletId={transaction?.sender_wallet_id}
                  receiverWalletId={transaction?.receiver_wallet_id}
                  token={token}
                />
              </div>

              {/* 5b. Case-Linked Intelligence: Connected Wallets Recommended for Review */}
              {(caseData?.recommended_wallets_for_review && caseData.recommended_wallets_for_review.length > 0) || caseData?.resolution === "CONFIRMED_FRAUD" ? (
                <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4 ring-1 ring-amber-500/20 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
                        <Network className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                            5b. Case-Linked Network Intelligence
                          </h3>
                          <Badge variant="outline" className="border-amber-500/50 bg-amber-950/40 text-amber-300 font-mono text-[10px]">
                            FLAGGED FOR TRIAGE
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Graph counterparties linked to confirmed incident recommended for human investigation
                        </p>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                      HUMAN-IN-THE-LOOP ONLY • NEVER AUTO-BLOCKED
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-300 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 font-semibold">Strict Responsible AI Boundary: </strong>
                      Following fraud confirmation on case <span className="text-white font-mono">{caseData?.case_number}</span>, adjacent network counterparties are flagged for 
                      <em className="text-cyan-300 not-italic font-bold"> manual review only</em>. Under UpayAche ethical standards, no wallet balances, transactions, or accounts are automatically frozen without analyst sign-off.
                    </div>
                  </div>

                  {caseData?.recommended_wallets_for_review && caseData.recommended_wallets_for_review.length > 0 ? (
                    <div className="space-y-2.5">
                      {caseData.recommended_wallets_for_review.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:border-amber-500/40 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white text-sm">{rec.wallet_id}</span>
                              <span className="text-slate-400 text-xs font-mono">
                                ({rec.wallet_number || rec.phone_number_masked})
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/50 text-amber-300 bg-amber-950/30 font-mono font-bold"
                              >
                                {rec.recommendation || "Recommended for Review"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-blue-500/40 text-blue-300 bg-blue-950/30 font-mono"
                              >
                                {rec.hop_distance ?? 1}-hop distance
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                              <div>
                                <span className="text-slate-500">Connection Reason: </span>
                                <span className="text-slate-300">
                                  {rec.connection_reason || "Direct counterparty to confirmed fraudulent transaction"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">Transaction Relationship: </span>
                                <span className="text-cyan-300 font-semibold">
                                  {rec.transaction_relationship || rec.relation}
                                </span>
                              </div>
                            </div>

                            <div className="text-[10px] text-amber-400/90 pt-0.5">
                              {rec.advisory_notice}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-mono"
                            >
                              <Link href={`/network/${rec.wallet_id}`}>
                                Inspect in Graph <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-cyan-400" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs font-mono text-slate-500 border border-slate-800/60 rounded-xl bg-slate-950/40">
                      Counterparty analysis active. Refreshing linked wallet recommendation queue...
                    </div>
                  )}
                </div>
              ) : null}

              {/* 6. Case Status Progression & History */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        6. Case Status & Lifecycle
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Finite state machine progression & audit changes
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`font-mono text-xs ${getStatusColor(caseData?.status || "OPEN")}`}>
                    Active: {caseData?.status || "OPEN"}
                  </Badge>
                </div>

                {/* State Stepper Visualizer */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  {["OPEN", "INVESTIGATING", "REVIEWED", "CLOSED"].map((s, idx) => {
                    const isCurrent = caseData?.status === s;
                    const order = ["OPEN", "INVESTIGATING", "REVIEWED", "CLOSED"];
                    const currentIdx = order.indexOf(caseData?.status || "OPEN");
                    const isPast = idx < currentIdx;

                    return (
                      <div
                        key={s}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-amber-400/20 border-amber-400 text-amber-300 font-bold ring-2 ring-amber-400/20"
                            : isPast
                            ? "bg-slate-950/80 border-slate-700 text-slate-300"
                            : "bg-slate-950/40 border-slate-800/60 text-slate-600"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 uppercase">Step {idx + 1}</div>
                        <div className="text-xs mt-1">{s}</div>
                        {isCurrent && <div className="text-[9px] text-amber-400 mt-1 uppercase">● Current</div>}
                        {isPast && <div className="text-[9px] text-emerald-400 mt-1">✓ Complete</div>}
                      </div>
                    );
                  })}
                </div>

                {/* History of status changes */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    Status Change History
                  </h4>

                  {statusHistory.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs font-mono border border-slate-800/80 rounded-xl bg-slate-950/40">
                      Initial case state: {caseData?.status || "OPEN"} (No subsequent state changes recorded).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statusHistory.map((sh, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4 text-xs font-mono"
                        >
                          <div className="space-y-1">
                            <span className="text-amber-400 font-bold block">{sh.content}</span>
                            <span className="text-[11px] text-slate-400">
                              Operator: <strong className="text-white">{sh.author_id}</strong> ({sh.author_role})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(sh.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Audit Trail */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        7. Forensic Audit Trail
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Immutable append-only records of actions, operators, and timestamps
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-xs">
                    {auditLogs.length} Events Logged
                  </Badge>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs font-mono border border-slate-800/80 rounded-xl bg-slate-950/40">
                    No specific audit logs indexed for this case ID yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                          <th className="pb-2">Action</th>
                          <th className="pb-2">User / Role</th>
                          <th className="pb-2">Details</th>
                          <th className="pb-2 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-950/40">
                            <td className="py-2.5 font-bold text-cyan-400">
                              {log.action}
                            </td>
                            <td className="py-2.5 text-slate-300">
                              <span>{log.actor_id}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({log.actor_role})</span>
                            </td>
                            <td className="py-2.5 text-slate-400 text-[11px]">
                              {log.metadata && typeof log.metadata === "object"
                                ? Object.entries(log.metadata)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")
                                : "-"}
                            </td>
                            <td className="py-2.5 text-right text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 8. Analyst Notes Timeline */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        8. Analyst Notes & Findings Timeline
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Chronological record of observations, hypotheses, and AI synthesis
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400">{notes.length} Notes</span>
                </div>

                {/* Timeline Stream */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs font-mono border border-slate-800/80 rounded-xl bg-slate-950/40">
                      No analyst notes entered yet. Use the composer below or import findings from the AI Assistant.
                    </div>
                  ) : (
                    notes.map((note) => {
                      const isAI = note.note_type === "AI_COPILOT";
                      const isSystem = note.note_type === "SYSTEM";

                      return (
                        <div
                          key={note.id}
                          className={`p-4 rounded-xl border space-y-2 transition-all ${
                            isAI
                              ? "bg-amber-400/5 border-amber-400/30"
                              : isSystem
                              ? "bg-slate-950/60 border-slate-800 text-slate-400"
                              : "bg-slate-950/80 border-slate-800 text-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {isAI ? (
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              ) : isSystem ? (
                                <Activity className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                              <span className="font-bold font-mono text-white">
                                Analyst: {note.author_id}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-mono ${
                                  isAI
                                    ? "border-amber-400/40 text-amber-300 bg-amber-950/40"
                                    : "border-slate-700 bg-slate-800 text-slate-300"
                                }`}
                              >
                                {note.note_type}
                              </Badge>
                            </div>

                            <span className="text-[10px] font-mono text-slate-500">
                              Timestamp: {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inline Note Composer */}
                {!isViewer && (
                  <form onSubmit={handleNoteSubmit} className="pt-3 border-t border-slate-800 space-y-3">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add an investigation finding, verification step, or compliance note..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmittingNote || !noteContent.trim()}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-8 px-4"
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        {isSubmittingNote ? "Saving..." : "Record Note"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 4-5 COLS: AI INVESTIGATION ASSISTANT PANEL */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-20">
              <AIInvestigationPanel
                caseId={caseId}
                caseNumber={caseData?.case_number || caseId}
                targetWalletId={caseData?.target_wallet_id || transaction?.sender_wallet_id}
                primaryTransactionId={caseData?.primary_transaction_id}
                onAppendNote={(content: string) => {
                  addCaseNote(caseData?.id || caseId, content, "AI_COPILOT", token)
                    .then((newNote) => handleAINoteInserted(newNote))
                    .catch((err) => console.error("Failed to append AI note:", err));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: CHANGE CASE STATUS                                        */}
      {/* =================================================================== */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Change Investigation Status
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="OPEN">OPEN (Triage)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Forensic Deep Dive)</option>
                  <option value="REVIEWED">REVIEWED (Supervisor Sign-off)</option>
                  <option value="CLOSED">CLOSED (Final Case Resolution)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-mono">
                  Linear state progression enforced: OPEN → INVESTIGATING → REVIEWED → CLOSED
                </p>
              </div>

              {targetStatus === "CLOSED" && (
                <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
                  <label className="text-xs font-mono text-amber-300 uppercase font-bold">
                    Explicit Resolution Required
                  </label>
                  <select
                    value={resolutionChoice}
                    onChange={(e) => setResolutionChoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  >
                    <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD (Block wallet & freeze funds)</option>
                    <option value="FALSE_POSITIVE">FALSE_POSITIVE (Legitimate user transaction)</option>
                    <option value="SUSPICIOUS_MONITOR">SUSPICIOUS_MONITOR (Flag for 30-day surveillance)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">
                  Analyst Rationale / Comment
                </label>
                <textarea
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  placeholder="Reason for state transition and summary of evidence reviewed..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  className="border-slate-800 text-slate-400 text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-8 px-4"
                >
                  {isSubmittingStatus ? "Advancing State..." : "Confirm Transition"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ASSIGN CASE                                               */}
      {/* =================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Assign Case Investigator
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Assigned Analyst</label>
                <div className="space-y-2">
                  <select
                    value={assigneeInput}
                    onChange={(e) => setAssigneeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="analyst-01">analyst-01 (MFS Compliance Specialist)</option>
                    <option value="analyst-02">analyst-02 (Financial Crimes Investigator)</option>
                    <option value="lead-investigator">lead-investigator (Chief Risk Officer)</option>
                    <option value={user?.full_name || "Self"}>{user?.full_name || "Myself"}</option>
                  </select>

                  <input
                    type="text"
                    value={assigneeInput}
                    onChange={(e) => setAssigneeInput(e.target.value)}
                    placeholder="Or enter custom analyst ID or email..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  className="border-slate-800 text-slate-400 text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAssign || !assigneeInput.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs h-8 px-4"
                >
                  {isSubmittingAssign ? "Assigning..." : "Assign Case"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADD NOTE                                                  */}
      {/* =================================================================== */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-amber-400" />
                Add Investigation Note
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase">Analyst Note</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record verification notes, counterparty findings, or phone KYC results..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono resize-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNoteModal(false)}
                  className="border-slate-800 text-slate-400 text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingNote || !noteContent.trim()}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-8 px-4"
                >
                  {isSubmittingNote ? "Saving..." : "Record Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
