"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  FolderLock,
  ArrowRight,
  Clock,
  PlusCircle,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Lock,
  User,
  Activity,
  Calendar,
  X,
} from "lucide-react";
import {
  AppShell,
  PageHeader,
  MetricCard,
  RiskBadge,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
  Button,
  Badge,
} from "@/components/design-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  fetchInvestigations,
  createInvestigationCase,
  InvestigationCaseItem,
  CreateCaseParams,
} from "@/lib/api";

export default function InvestigationsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "ANALYST", "VIEWER"]}>
      <InvestigationsContent />
    </ProtectedRoute>
  );
}

function InvestigationsContent() {
  const { user, role, token } = useAuth();
  const isViewer = role === "VIEWER";

  const [cases, setCases] = useState<InvestigationCaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modal State for Case Creation
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newTargetWallet, setNewTargetWallet] = useState<string>("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [newTxId, setNewTxId] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvestigations({}, token);
      setCases(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load investigations docket");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTargetWallet.trim() || !newDescription.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const payload: CreateCaseParams = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        target_wallet_id: newTargetWallet.trim(),
        priority: newPriority,
        primary_transaction_id: newTxId.trim() || undefined,
      };

      const created = await createInvestigationCase(payload, token);
      setShowCreateModal(false);
      setSuccessMsg(`Case ${created.case_number} instantiated successfully.`);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewTargetWallet("");
      setNewPriority("HIGH");
      setNewTxId("");
      // Reload
      await loadCases();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create case.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        c.case_number.toLowerCase().includes(term) ||
        c.title.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term)) ||
        (c.target_wallet_id && c.target_wallet_id.toLowerCase().includes(term)) ||
        (c.assigned_to && c.assigned_to.toLowerCase().includes(term));
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [cases, statusFilter, priorityFilter, searchTerm]);

  // Metric counts
  const totalCount = cases.length;
  const openCount = cases.filter((c) => c.status === "OPEN").length;
  const investigatingCount = cases.filter((c) => c.status === "INVESTIGATING").length;
  const reviewedCount = cases.filter((c) => c.status === "REVIEWED").length;
  const closedCount = cases.filter((c) => c.status === "CLOSED").length;

  return (
    <AppShell activePath="/investigations">
      <div className="space-y-6">
        <PageHeader
          title="Investigation Cases Console"
          description="Central compliance docket for triage, deep forensic review, and state machine resolution (OPEN → INVESTIGATING → REVIEWED → CLOSED)."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Investigations" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                onClick={loadCases}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-xs h-9 border-[#CED4DA] bg-white hover:bg-[#EDF0F3] text-[#000000]"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Refresh Docket
              </Button>

              {!isViewer && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Open New Case
                </Button>
              )}
            </div>
          }
        />

        {/* Feedback banners */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-[#6C757D] hover:text-[#000000]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-[#6C757D] hover:text-[#000000]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Case Lifecycle Summary Cards (MetricCards) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setStatusFilter("ALL")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === "ALL"
                ? "bg-blue-50/70 border-[#007BFF] shadow-xs ring-2 ring-[#007BFF]/20"
                : "bg-white border-[#CED4DA] hover:border-[#007BFF]/50"
            }`}
          >
            <span className="text-[10px] text-[#6C757D] uppercase font-mono font-bold block">All Cases</span>
            <span className="text-2xl font-black text-[#002A54] font-mono mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-[#6C757D]">Master docket count</span>
          </div>

          <div
            onClick={() => setStatusFilter("OPEN")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === "OPEN"
                ? "bg-blue-50/70 border-[#007BFF] shadow-xs ring-2 ring-[#007BFF]/20"
                : "bg-white border-[#CED4DA] hover:border-[#007BFF]/50"
            }`}
          >
            <span className="text-[10px] text-[#0054A6] uppercase font-mono font-bold block">1. Open</span>
            <span className="text-2xl font-black text-[#0054A6] font-mono mt-1 block">{openCount}</span>
            <span className="text-[10px] text-[#6C757D]">Awaiting triage</span>
          </div>

          <div
            onClick={() => setStatusFilter("INVESTIGATING")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === "INVESTIGATING"
                ? "bg-purple-50/70 border-purple-500 shadow-xs ring-2 ring-purple-500/20"
                : "bg-white border-[#CED4DA] hover:border-purple-400"
            }`}
          >
            <span className="text-[10px] text-purple-700 uppercase font-mono font-bold block">2. Investigating</span>
            <span className="text-2xl font-black text-purple-700 font-mono mt-1 block">{investigatingCount}</span>
            <span className="text-[10px] text-[#6C757D]">Forensic review active</span>
          </div>

          <div
            onClick={() => setStatusFilter("REVIEWED")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === "REVIEWED"
                ? "bg-teal-50/70 border-teal-500 shadow-xs ring-2 ring-teal-500/20"
                : "bg-white border-[#CED4DA] hover:border-teal-400"
            }`}
          >
            <span className="text-[10px] text-teal-700 uppercase font-mono font-bold block">3. Reviewed</span>
            <span className="text-2xl font-black text-teal-700 font-mono mt-1 block">{reviewedCount}</span>
            <span className="text-[10px] text-[#6C757D]">Pending close</span>
          </div>

          <div
            onClick={() => setStatusFilter("CLOSED")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === "CLOSED"
                ? "bg-emerald-50/70 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20"
                : "bg-white border-[#CED4DA] hover:border-emerald-400"
            }`}
          >
            <span className="text-[10px] text-emerald-700 uppercase font-mono font-bold block">4. Closed</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">{closedCount}</span>
            <span className="text-[10px] text-[#6C757D]">Resolution logged</span>
          </div>
        </div>

        {/* Filter & Search Bar Card */}
        <Card className="border-[#CED4DA] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#6C757D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by case #, title, or target wallet..."
                className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl pl-9 pr-4 py-2 text-xs text-[#000000] focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-mono text-[#4E4E50]">
                <Filter className="w-3.5 h-3.5 text-[#6C757D]" />
                <span>Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-[#F6F6F6] border border-[#CED4DA] rounded-xl px-2.5 py-1.5 text-xs text-[#000000] focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#002A54] tracking-tight flex items-center gap-2">
              Active Investigation Docket
              <span className="text-xs font-mono text-[#6C757D]">({filteredCases.length} displayed)</span>
            </h2>
          </div>

          {loading ? (
            <LoadingState text="Querying compliance case ledger..." />
          ) : filteredCases.length === 0 ? (
            <EmptyState
              title="No Investigation Cases Found"
              description="No investigation cases match your filter criteria."
              actionLabel={!isViewer ? "Open New Case" : undefined}
              onAction={!isViewer ? () => setShowCreateModal(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((c) => (
                <Card
                  key={c.id}
                  className="border-[#CED4DA] bg-white hover:border-[#007BFF]/60 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl shadow-xs"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#0054A6] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        {c.case_number}
                      </span>
                      <RiskBadge level={c.priority} size="sm" />
                    </div>

                    <CardTitle className="text-base text-[#002A54] font-bold pt-2 line-clamp-1">{c.title}</CardTitle>
                    <CardDescription className="text-xs text-[#6C757D] line-clamp-2">
                      {c.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div className="p-3 rounded-xl bg-[#F6F6F6] border border-[#CED4DA]/70 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6C757D] text-[10px] uppercase">Target Wallet:</span>
                        <span className="text-[#0054A6] font-bold">{c.target_wallet_id || "W-1001"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6C757D] text-[10px] uppercase">Assigned Analyst:</span>
                        <span className="text-[#000000]">{c.assigned_to || "Unassigned"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6C757D] border-t border-[#CED4DA]/60 pt-3">
                      <div className="flex items-center gap-1.5 font-mono">
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <Button asChild size="sm" className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs">
                        <Link href={`/investigations/${c.id}`}>
                          Workspace <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Investigation Case */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED4DA] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#CED4DA]/70 pb-3">
              <h3 className="text-base font-bold text-[#002A54] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#007BFF]" />
                Open New Investigation Case
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6C757D] hover:text-[#000000]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[#4E4E50] uppercase text-[10px] font-bold">Case Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Velocity Smurfing Surge on Agent W-AGT-03"
                  className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl p-2.5 text-[#000000] focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#4E4E50] uppercase text-[10px] font-bold">Target Wallet ID *</label>
                <input
                  type="text"
                  required
                  value={newTargetWallet}
                  onChange={(e) => setNewTargetWallet(e.target.value)}
                  placeholder="e.g. W-1001"
                  className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl p-2.5 text-[#000000] focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4E4E50] uppercase text-[10px] font-bold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                    className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl p-2.5 text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#4E4E50] uppercase text-[10px] font-bold">Primary Tx ID (Optional)</label>
                  <input
                    type="text"
                    value={newTxId}
                    onChange={(e) => setNewTxId(e.target.value)}
                    placeholder="e.g. TX-2026-MFS-8911"
                    className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl p-2.5 text-[#000000] focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#4E4E50] uppercase text-[10px] font-bold">Rationale & Alert Description *</label>
                <textarea
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe suspicious behavior, SHAP drivers, or reason for initiating forensic review..."
                  rows={4}
                  className="w-full bg-[#F6F6F6] border border-[#CED4DA] rounded-xl p-2.5 text-[#000000] focus:outline-none focus:border-[#007BFF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-[#CED4DA] text-[#4E4E50] text-xs h-8 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-[#007BFF] hover:bg-[#0054A6] text-white font-bold text-xs h-8 px-4 rounded-xl shadow-xs"
                >
                  {isCreating ? "Creating..." : "Initialize Case"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
